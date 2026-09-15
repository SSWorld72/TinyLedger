/**
 * taiwanHolidays.js — Taiwan National Holidays Module
 * 
 * Responsible for downloading government calendar JSON from CDN, managing cache, and localStorage persistence.
 * 
 * @author  SSWorld
 * @see     ruyut/TaiwanCalendar (GitHub CDN) — Government calendar JSON data source
 *          https://cdn.jsdelivr.net/gh/ruyut/TaiwanCalendar/data/{year}.json
 * @license MIT
 * 
 * -- Module Dependencies --
 *   This file has no external dependencies and can run independently.
 *   Usually imported and used by lunarCalendar.js, but can also be imported standalone.
 * 
 * @example
 * import { fetchHolidays } from '../../utils/js/taiwanHolidays.js';
 * 
 * // Fetch the 2026 administrative calendar (returns a Map)
 * fetchHolidays(2026).then(holidaysMap => {
 *     // Show New Year's Day info
 *     console.log(holidaysMap.get('2026-01-01'));
 * });
 * 
 * -- Data Flow --
 *   CDN JSON → fetch → govtHolidayCache (Map) → localStorage persistence
 *                                              ↑
 *                       localStorage ──Restore──→ loadPersistedHolidays()
 * 
 * -- Public API --
 *   ensureGovtHolidays(year)           → Asynchronously ensure specified year is loaded (skips already loaded years)
 *   fetchAndPersistHolidays(years[])   → Batch download multi-year data and persist to localStorage
 *   loadPersistedHolidays()            → Restore cache from localStorage (called on app startup)
 *   loadGovtHolidaysFromData(data, replace?)  → Load directly from JSON object (replace=true clears old cache)
 *   getNationalHoliday(dateStr)        → Query national holiday name by 'YYYY-MM-DD' format
 *   getHolidayLastUpdated()            → Get last updated time string (for UI display)
 *   clearGovtHolidayCache()            → Clear memory cache and loaded year flags
 * 
 * -- localStorage Keys --
 *   'global_taiwan_holidays'           → All years national holidays JSON ({ 'YYYY-MM-DD': 'description' })
 *   'global_taiwan_holidays_updated'   → Last updated time string
 */
let govtHolidayCache = null; // dateStr -> description
let govtHolidayLoadedYears = new Set();
// year -> Promise (prevents duplicate requests in the same instant)
const govtHolidayPending = new Map(); // year -> Promise (防止同一瞬間重複發起請求)
const HOLIDAY_STORAGE_KEY = 'global_taiwan_holidays';
const HOLIDAY_UPDATED_KEY = 'global_taiwan_holidays_updated';
const HOLIDAY_YEARS_KEY = 'global_taiwan_holidays_years';

let govtHolidayRequestVersion = 0;

// Local i18n helper
function t(key, params = {}) {
    if (typeof window !== 'undefined' && typeof window.t === 'function') {
        let msg = window.t(key, params);
        if (msg !== key) return msg;
    }
    // Fallback message with variables replaced
    let fallback = key;
    for (let k in params) {
        fallback = fallback.replace(`{${k}}`, params[k]);
    }
    return fallback;
}

/** Clear government holiday cache (called upon manual update) */
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
        
        // Strictly validate date legality (prevent 2026-02-31 from auto-rolling over to 3/3)
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
        
        // Strictly validate date legality to prevent something like 20261399 from being accepted
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
                // When there is no description, save as empty string meaning "it is a holiday but has no specific name (e.g. normal weekend)"
                govtHolidayCache.set(ds, '');
            }
        }
    }
}

/** Load persisted government holiday data from localStorage */
export function loadPersistedHolidays() {
    try {
        if (typeof localStorage === 'undefined') return;
        const raw = localStorage.getItem(HOLIDAY_STORAGE_KEY);
        if (raw) {
            const data = JSON.parse(raw);
            if (!data || typeof data !== 'object') {
                console.warn(t('systemLogs.taiwanHolidays.localStorageFormatError', { func: 'loadPersistedHolidays' }));
                return;
            }
            loadGovtHolidaysFromData(data);
            
            // Read from additional loaded years
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
        console.warn(t('systemLogs.taiwanHolidays.loadPersistedError', { func: 'loadPersistedHolidays' }), e);
    }
}

/** Get last updated time string (for UI display) */
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
        
    // Prevent async race conditions: if the same year is already downloading, await that Promise
    if (govtHolidayPending.has(year)) {
        return govtHolidayPending.get(year);
    }

    const version = govtHolidayRequestVersion;
    const fetchTask = (async () => {
        try {
            const url = `https://cdn.jsdelivr.net/gh/ruyut/TaiwanCalendar/data/${year}.json`;
            const res = await fetch(url);
            
            if (!res.ok) {
                if (res.status === 404) {
                    // If the server doesn't have data for this year yet, mark it as empty and ignore (do not throw error)
                    console.info(t('systemLogs.taiwanHolidays.noDataYet', { year }));
                    govtHolidayLoadedYears.add(year);
                    return;
                }
                throw new Error(`HTTP error! status: ${res.status}`);
            }
            
            const data = await res.json();
            
            if (version !== govtHolidayRequestVersion) {
                // Cache has been cleared or reset, discard expired request results
                return; 
            }
            
            if (!Array.isArray(data)) throw new Error(`Government holidays data format error: ${year}`);
            loadGovtHolidaysFromData(data);
            govtHolidayLoadedYears.add(year); // Explicitly mark this year as loaded
        } catch (e) {
            console.warn(t('systemLogs.taiwanHolidays.fetchError', { func: 'ensureGovtHolidays', year }), e);
            throw e; // Rethrow exception so caller (e.g. UI) can catch and handle it
        } finally {
            // Remove from pending only if the task is still itself
            if (govtHolidayPending.get(year) === fetchTask) {
                govtHolidayPending.delete(year);
            }
        }
    })();
    
    govtHolidayPending.set(year, fetchTask);
    return fetchTask;
}

/**
 * Manually update national holidays (download specified years from CDN and persist to localStorage)
 * @returns {Promise<{success: boolean, count: number, error?: string}>}
 */
export async function fetchAndPersistHolidays(years) {
    if (!Array.isArray(years)) {
        return { success: false, count: 0, error: 'years must be an array' };
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
        
        // Strict localStorage data validation
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
                    throw new Error(`Year ${year} data format error`);
                }
                
                // Download successful, clear old data for this year first
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
                console.warn(t('systemLogs.taiwanHolidays.downloadError', { year }), e);
                failedYears.push(year);
            }
        }
        
        // Only update cache and localStorage if there were successful downloads
        if (successCount > 0) {
            clearGovtHolidayCache();
            loadGovtHolidaysFromData(allData);
            existingYears.forEach(y => govtHolidayLoadedYears.add(y));
            
            // Persist to localStorage
            try {
                if (typeof localStorage !== 'undefined') {
                    localStorage.setItem(HOLIDAY_STORAGE_KEY, JSON.stringify(allData));
                    localStorage.setItem(HOLIDAY_YEARS_KEY, JSON.stringify([...existingYears]));
                    localStorage.setItem(HOLIDAY_UPDATED_KEY, new Date().toLocaleString('zh-TW', { hour12: false }));
                }
            } catch (e) {
                console.warn(t('systemLogs.taiwanHolidays.saveLocalStorageError'), e);
            }
        }
        
        return {
            success: successCount > 0 && failedYears.length === 0,
            count: totalCount,
            error: failedYears.length > 0 ? `Following years failed to download: ${failedYears.join(', ')}` : undefined
        };
    } catch (e) {
        console.error(t('systemLogs.taiwanHolidays.updateUnexpectedError'), e);
        return { success: false, count: 0, error: e.message };
    }
}

/** Get national holiday name (ensureGovtHolidays must be called first) */
export function getNationalHoliday(dateStr) {
    if (!govtHolidayCache) return null;
    if (govtHolidayCache.has(dateStr)) {
        return govtHolidayCache.get(dateStr);
    }
    return null;
}
