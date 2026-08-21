/**
 * taiwanHolidays.js — 臺灣國定假日模組
 * 
 * 負責從 CDN 下載政府行事曆 JSON，並提供快取管理與 localStorage 持久化。
 * 
 * @author  SSWorld
 * @see     ruyut/TaiwanCalendar (GitHub CDN) — 政府行事曆 JSON 資料來源
 *          https://cdn.jsdelivr.net/gh/ruyut/TaiwanCalendar/data/{year}.json
 * @license MIT
 * 
 * ── 模組依賴 ──
 *   本檔案無任何外部依賴，可獨立運作。
 *   通常由 lunarCalendar.js 匯入使用，但也可單獨引用。
 * 
 * @example
 * import { fetchHolidays } from '../../utils/js/taiwanHolidays.js';
 * 
 * // 抓取 2026 年度的行政機關行事曆 (回傳 Map)
 * fetchHolidays(2026).then(holidaysMap => {
 *     console.log(holidaysMap.get('2026-01-01')); // 顯示元旦資訊
 * });
 * 
 * ── 資料流 ──
 *   CDN JSON → fetch → govtHolidayCache (Map) → localStorage 持久化
 *                                              ↑
 *                       localStorage ──還原──→ loadPersistedHolidays()
 * 
 * ── 公開 API ──
 *   ensureGovtHolidays(year)           → 非同步確保指定年份已載入（自動跳過已載入年份）
 *   fetchAndPersistHolidays(years[])   → 批次下載多年資料並持久化到 localStorage
 *   loadPersistedHolidays()            → 從 localStorage 還原快取（應用啟動時呼叫）
 *   loadGovtHolidaysFromData(data, replace?)  → 從 JSON 物件直接載入（replace=true 會清空舊快取）
 *   getNationalHoliday(dateStr)        → 查詢 'YYYY-MM-DD' 格式的國定假日名稱
 *   getHolidayLastUpdated()            → 取得上次更新時間字串（供 UI 顯示）
 *   clearGovtHolidayCache()            → 清除記憶體快取與已載入年份標籤
 * 
 * ── localStorage Keys ──
 *   'global_taiwan_holidays'           → 所有年份國定假日 JSON（{ 'YYYY-MM-DD': '說明' }）
 *   'global_taiwan_holidays_updated'   → 最後更新時間字串
 */
let govtHolidayCache = null; // dateStr -> description
let govtHolidayLoadedYears = new Set();
const govtHolidayPending = new Map(); // year -> Promise (防止同一瞬間重複發起請求)
const HOLIDAY_STORAGE_KEY = 'global_taiwan_holidays';
const HOLIDAY_UPDATED_KEY = 'global_taiwan_holidays_updated';
const HOLIDAY_YEARS_KEY = 'global_taiwan_holidays_years';

let govtHolidayRequestVersion = 0;

/** 清除國定假日快取（手動更新時呼叫） */
export function clearGovtHolidayCache() {
    govtHolidayRequestVersion++;
    govtHolidayCache = null;
    govtHolidayLoadedYears.clear();
    govtHolidayPending.clear();
}

export function loadGovtHolidaysFromData(data) {
    if (!data) return;
    
    if (!govtHolidayCache) {
        govtHolidayCache = new Map();
    }
    
    if (Array.isArray(data)) {
        loadHolidayArray(data);
        return;
    }
    
    if (typeof data === 'object') {
        loadHolidayObject(data);
    }
}

function loadHolidayObject(data) {
    for (const [dateStr, desc] of Object.entries(data)) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) continue;
        
        // 嚴格驗證日期合法性（防止 2026-02-31 自動進位為 3/3）
        const [y, m, d] = dateStr.split('-').map(Number);
        if (y < 1900 || y > 2100) {
            continue;
        }
        
        const dateObj = new Date(Date.UTC(y, m - 1, d));
        if (dateObj.getUTCFullYear() !== y || dateObj.getUTCMonth() !== m - 1 || dateObj.getUTCDate() !== d) {
            continue;
        }
        
        const description = (typeof desc === 'string' && desc.trim()) ? desc.trim() : '';
        govtHolidayCache.set(dateStr, description);
    }
}

function loadHolidayArray(data) {
    if (!data || data.length === 0) return;
    
    for (const entry of data) {
        if (typeof entry.date !== 'string' || !/^\d{8}$/.test(entry.date)) {
            continue;
        }
        
        const yearStr = entry.date.slice(0, 4);
        const monthStr = entry.date.slice(4, 6);
        const dayStr = entry.date.slice(6, 8);
        const year = parseInt(yearStr, 10);
        const month = parseInt(monthStr, 10);
        const day = parseInt(dayStr, 10);
        
        // 嚴格驗證日期是否合法，防止類似 20261399 被誤認
        const dObj = new Date(Date.UTC(year, month - 1, day));
        if (dObj.getUTCFullYear() !== year || dObj.getUTCMonth() !== month - 1 || dObj.getUTCDate() !== day) {
            continue;
        }

        if (entry.isHoliday === true) {
            let desc = '';
            if (typeof entry.description === 'string' && entry.description.trim() !== '') {
                desc = entry.description.trim();
            }
            const ds = `${yearStr}-${monthStr}-${dayStr}`;
            const existing = govtHolidayCache.get(ds);
            
            if (existing && desc) {
                govtHolidayCache.set(ds, `${existing} / ${desc}`);
            } else if (desc) {
                govtHolidayCache.set(ds, desc);
            } else if (!existing) {
                // 沒有 description 時，存入空字串代表「是假日但無特定名稱 (例如一般週末)」
                govtHolidayCache.set(ds, '');
            }
        }
    }
}

/** 從 localStorage 載入已持久化的國定假日資料 */
export function loadPersistedHolidays() {
    try {
        if (typeof localStorage === 'undefined') return;
        const raw = localStorage.getItem(HOLIDAY_STORAGE_KEY);
        if (raw) {
            const data = JSON.parse(raw);
            if (!data || typeof data !== 'object') {
                console.warn('[國定假日] localStorage 資料格式異常（loadPersistedHolidays），已忽略');
                return;
            }
            loadGovtHolidaysFromData(data);
            
            // 從另外的年份設定中讀取
            if (typeof localStorage !== 'undefined') {
                const rawYears = localStorage.getItem(HOLIDAY_YEARS_KEY);
                if (rawYears) {
                    try {
                        const parsed = JSON.parse(rawYears);
                        if (Array.isArray(parsed)) parsed.forEach(y => govtHolidayLoadedYears.add(y));
                    } catch(e) {}
                }
            }
        }
    } catch(e) {
        console.warn('[國定假日] 載入持久化國定假日資料（loadPersistedHolidays）失敗:', e);
    }
}

/** 取得上次更新時間字串（供 UI 顯示） */
export function getHolidayLastUpdated() {
    try {
        if (typeof localStorage === 'undefined') return null;
        return localStorage.getItem(HOLIDAY_UPDATED_KEY) || null;
    } catch (e) {
        return null;
    }
}

export async function ensureGovtHolidays(year) {
    if (!Number.isInteger(year) || year < 1900 || year > 2100) return;
    if (govtHolidayCache && govtHolidayLoadedYears.has(year))
        return;
        
    // 防止非同步競態條件：若已經有同一個年份正在下載中，直接等待該 Promise
    if (govtHolidayPending.has(year)) {
        return govtHolidayPending.get(year);
    }

    const version = govtHolidayRequestVersion;
    const fetchTask = (async () => {
        try {
            const url = `https://cdn.jsdelivr.net/gh/ruyut/TaiwanCalendar/data/${year}.json`;
            const res = await fetch(url);
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            const data = await res.json();
            
            if (version !== govtHolidayRequestVersion) {
                return; // 快取已被清除或重置，放棄套用過期的請求結果
            }
            
            if (!Array.isArray(data)) throw new Error(`政府行事曆資料格式錯誤: ${year}`);
            loadGovtHolidaysFromData(data);
            govtHolidayLoadedYears.add(year); // 顯式標記該年已載入
        } catch (e) {
            console.warn(`[API] 載入政府行事曆失敗 (ensureGovtHolidays - ${year}):`, e);
            throw e; // 重新拋出例外，讓外層呼叫端（如 UI 介面）能夠捕獲並處理錯誤
        } finally {
            // 若 pending 中的任務仍是自己，才予以刪除
            if (govtHolidayPending.get(year) === fetchTask) {
                govtHolidayPending.delete(year);
            }
        }
    })();
    
    govtHolidayPending.set(year, fetchTask);
    return fetchTask;
}

/**
 * 手動更新國定假日（從 CDN 下載指定年份範圍並持久化到 localStorage）
 * @param {number[]} years - 要下載的年份列表
 * @returns {Promise<{success: boolean, count: number, error?: string}>}
 */
export async function fetchAndPersistHolidays(years) {
    if (!Array.isArray(years)) {
        return { success: false, count: 0, error: 'years 必須是陣列' };
    }
    const uniqueYears = [
        ...new Set(
            years.map(Number).filter(y => Number.isInteger(y) && y >= 1900 && y <= 2100)
        )
    ];
    
    if (uniqueYears.length === 0) {
        return { success: true, count: 0 };
    }
    
    try {
        let allData = {};
        let existingYears = new Set();
        
        // 嚴謹的 localStorage 資料驗證
        try {
            if (typeof localStorage !== 'undefined') {
                const raw = localStorage.getItem(HOLIDAY_STORAGE_KEY);
                const parsed = raw ? JSON.parse(raw) : null;
                if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                    allData = parsed;
                }
                
                const rawYears = localStorage.getItem(HOLIDAY_YEARS_KEY);
                const parsedYears = rawYears ? JSON.parse(rawYears) : null;
                if (Array.isArray(parsedYears)) {
                    parsedYears.forEach(y => existingYears.add(y));
                }
            }
        } catch (e) {
            allData = {};
            existingYears = new Set();
        }
        
        let totalCount = 0;
        let successCount = 0;
        let failedYears = [];

        for (const year of uniqueYears) {
            const url = `https://cdn.jsdelivr.net/gh/ruyut/TaiwanCalendar/data/${year}.json`;
            try {
                const res = await fetch(url);
                if (!res.ok) {
                    failedYears.push(year);
                    continue;
                }
                const data = await res.json();
                
                if (!Array.isArray(data)) {
                    throw new Error(`年份 ${year} 的資料格式錯誤`);
                }
                
                // 下載成功，先清除該年份的舊資料
                const prefix = `${year}-`;
                for (const key of Object.keys(allData)) {
                    if (key.startsWith(prefix)) {
                        delete allData[key];
                    }
                }
                
                let yearCount = 0;
                for (const entry of data) {
                    if (
                        typeof entry.date !== 'string' ||
                        !/^\d{8}$/.test(entry.date)
                    ) {
                        continue;
                    }
                    const yearStr = entry.date.slice(0, 4);
                    const monthStr = entry.date.slice(4, 6);
                    const dayStr = entry.date.slice(6, 8);
                    const y = parseInt(yearStr, 10);
                    const m = parseInt(monthStr, 10);
                    const d = parseInt(dayStr, 10);
                    
                    const dObj = new Date(Date.UTC(y, m - 1, d));
                    if (dObj.getUTCFullYear() !== y || dObj.getUTCMonth() !== m - 1 || dObj.getUTCDate() !== d) {
                        continue;
                    }
                    
                    if (entry.isHoliday === true) {
                        let desc = '';
                        if (typeof entry.description === 'string' && entry.description.trim() !== '') {
                            desc = entry.description.trim();
                        }
                        const ds = `${yearStr}-${monthStr}-${dayStr}`;
                        if (!allData[ds]) {
                            yearCount++;
                        }
                        
                        if (allData[ds] && desc) {
                            allData[ds] = `${allData[ds]} / ${desc}`;
                        } else if (desc) {
                            allData[ds] = desc;
                        } else if (!allData[ds]) {
                            allData[ds] = '';
                        }
                    }
                }
                totalCount += yearCount;
                successCount++;
                existingYears.add(year);
            } catch (e) {
                console.warn(`[API] 下載政府行事曆失敗 (${year}):`, e);
                failedYears.push(year);
            }
        }
        
        // 若有成功的下載，才更新快取與 localStorage
        if (successCount > 0) {
            clearGovtHolidayCache();
            loadGovtHolidaysFromData(allData);
            existingYears.forEach(y => govtHolidayLoadedYears.add(y));
            
            // 持久化到 localStorage
            try {
                if (typeof localStorage !== 'undefined') {
                    localStorage.setItem(HOLIDAY_STORAGE_KEY, JSON.stringify(allData));
                    localStorage.setItem(HOLIDAY_YEARS_KEY, JSON.stringify([...existingYears]));
                    localStorage.setItem(HOLIDAY_UPDATED_KEY, new Date().toLocaleString('zh-TW'));
                }
            } catch (e) {
                console.warn('[國定假日] 儲存 localStorage 失敗:', e);
            }
        }
        
        return {
            success: successCount > 0 && failedYears.length === 0,
            count: totalCount,
            error: failedYears.length > 0 ? `下列年份下載失敗: ${failedYears.join(', ')}` : undefined
        };
    } catch (e) {
        console.error('[API] 手動更新政府行事曆發生未預期錯誤:', e);
        return { success: false, count: 0, error: e.message };
    }
}

/** 取得國定假日名稱（需先呼叫 ensureGovtHolidays） */
export function getNationalHoliday(dateStr) {
    if (!govtHolidayCache) return null;
    if (govtHolidayCache.has(dateStr)) {
        return govtHolidayCache.get(dateStr);
    }
    return null;
}
