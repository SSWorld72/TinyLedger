/**
 * lunarCalendar.js — 臺灣農民曆模組（萬年曆）
 * 
 * 提供陽曆 ↔ 陰曆轉換、天干地支、24 節氣、八字排盤、節日查詢與國定假日整合。
 * 查表範圍：西元 1900-01-31 至 2100-12-31。
 * 
 * @author  SSWorld (整合、重構、八字排盤、節日擴充、BUG 修復)
 * @see     原始演算法參考 Sean Lin (林洵賢) 臺灣月曆 VBScript/JavaScript 版
 *          — 農曆資料表 (lunarInfo) 與節氣天文常數 (sTermInfo) 均源自原版
 * @see     isee15/Lunar-Solar-Calendar-Converter — 位元壓縮 (Bitwise Encoding) 設計參考
 * @see     ruyut/TaiwanCalendar (GitHub CDN) — 政府行事曆國定假日 JSON 資料來源
 * @license MIT
 * 
 * ── 模組依賴 ──
 *   本檔案依賴同目錄下的 taiwanHolidays.js（國定假日模組）。
 *   移植至其他專案時，需同時複製這兩個檔案才能正常運作。
 *   除此之外無任何外部依賴，純粹作為被呼叫的共用工具模組。
 * 
 * @example
 * import { gregorianToLunar, getBazi } from '../../utils/js/lunarCalendar.js';
 * 
 * // 查詢 2026年4月5日的農曆與節氣
 * const lunarInfo = gregorianToLunar(2026, 4, 5);
 * console.log(lunarInfo.festival); // '清明節 復活節'
 * 
 * // 查詢八字排盤
 * const bazi = getBazi(2026, 4, 5, 14); // 14:00 (未時)
 * console.log(bazi.yearPillar, bazi.monthPillar); // 丙午 壬辰
 * 
 * ══════════════════════════════════════════════════════════════
 *  ⚠️ 精度限制聲明
 * ──────────────────────────────────────────────────────────────
 *  本模組定位為「輕量級農民曆參考」，未內建精密星曆演算法。
 *  1. 節氣精度：節氣交接僅精確至「日」，無交節氣具體「時：分」。
 *     若查詢日恰逢交節氣，系統預設 00:00 起即切換干支。
 *  2. 八字排盤：年柱以立春為界、月柱以節氣為界，均為日級精度。
 *  3. 早夜子時：23:00 起自動推進日柱，採「早夜子時同天干」規則。
 * ══════════════════════════════════════════════════════════════
 * 
 * ── 公開 API 摘要 ──
 * 
 * 【核心轉換】
 *   gregorianToLunar(y, m, d, skipFestivals?)
 *     → 陽曆轉陰曆，回傳完整農曆資訊物件（含干支、節氣、節日、國定假日、八字）
 *     → 範例：gregorianToLunar(2026, 8, 18)
 *       回傳：{ year, month, day, isLeap, yearGanZhi, monthGanZhi, dayGanZhi,
 *              monthName, dayName, animal, solarTerm, festival, nationalHoliday, bazi }
 * 
 * 【八字排盤】
 *   getBazi(y, m, d, hour?)
 *     → 回傳四柱（年月日時）排盤，含十神、地支藏干、六十甲子納音
 *     → hour 為 0~23 整數，不傳則時柱為 undefined
 *     → 若 hour=23，額外提供 earlyZiBazi（早子時排盤）
 * 
 * 【節日查詢】
 *   getLunarFestival(lunarMonth, lunarDay, isLeap)  → 農曆節日名稱
 *   getSolarFestival(m, d)                          → 國曆節日名稱
 *   getWeekFestival(y, m, d)                        → 星期節日（如母親節、感恩節）
 *   getEaster(y)                                    → 復活節日期 { month, day }
 * 
 * 【國定假日】（委託 taiwanHolidays.js 處理）
 *   ensureGovtHolidays(year)           → 非同步載入指定年份國定假日（CDN）
 *   fetchAndPersistHolidays(years[])   → 批次下載並持久化到 localStorage
 *   loadPersistedHolidays()            → 從 localStorage 還原國定假日快取
 *   loadGovtHolidaysFromData(data, replace?)  → 從 JSON 物件載入國定假日
 *   getNationalHoliday(dateStr)        → 查詢某日國定假日名稱（需先載入）
 *   getHolidayLastUpdated()            → 取得上次更新時間字串
 *   clearGovtHolidayCache()            → 清除國定假日快取
 */

import {
    clearGovtHolidayCache,
    loadGovtHolidaysFromData,
    loadPersistedHolidays,
    getHolidayLastUpdated,
    ensureGovtHolidays,
    fetchAndPersistHolidays,
    getNationalHoliday
} from './taiwanHolidays.js';

// ===== 陰曆年資訊 compact 編碼 (1900–2100) =====
// 16-bit 編碼，跟經典 lunisolar 演算法一致
const lunarInfo = [
    0x4bd8, 0x4ae0, 0xa570, 0x54d5, 0xd260, 0xd950, 0x5554, 0x56af, 0x9ad0, 0x55d2,
    0x4ae0, 0xa5b6, 0xa4d0, 0xd250, 0xd295, 0xb54f, 0xd6a0, 0xada2, 0x95b0, 0x4977,
    0x497f, 0xa4b0, 0xb4b5, 0x6a50, 0x6d40, 0xab54, 0x2b6f, 0x9570, 0x52f2, 0x4970,
    0x6566, 0xd4a0, 0xea50, 0x6a95, 0x5adf, 0x2b60, 0x86e3, 0x92ef, 0xc8d7, 0xc95f,
    0xd4a0, 0xd8a6, 0xb55f, 0x56a0, 0xa5b4, 0x25df, 0x92d0, 0xd2b2, 0xa950, 0xb557,
    0x6ca0, 0xb550, 0x5355, 0x4daf, 0xa5b0, 0x4573, 0x52bf, 0xa9a8, 0xe950, 0x6aa0,
    0xaea6, 0xab50, 0x4b60, 0xaae4, 0xa570, 0x5260, 0xf263, 0xd950, 0x5b57, 0x56a0,
    0x96d0, 0x4dd5, 0x4ad0, 0xa4d0, 0xd4d4, 0xd250, 0xd558, 0xb540, 0xb6a0, 0x95a6,
    0x95bf, 0x49b0, 0xa974, 0xa4b0, 0xb27a, 0x6a50, 0x6d40, 0xaf46, 0xab60, 0x9570,
    0x4af5, 0x4970, 0x64b0, 0x74a3, 0xea50, 0x6b58, 0x5ac0, 0xab60, 0x96d5, 0x92e0,
    0xc960, 0xd954, 0xd4a0, 0xda50, 0x7552, 0x56a0, 0xabb7, 0x25d0, 0x92d0, 0xcab5,
    0xa950, 0xb4a0, 0xbaa4, 0xad50, 0x55d9, 0x4ba0, 0xa5b0, 0x5176, 0x52bf, 0xa930,
    0x7954, 0x6aa0, 0xad50, 0x5b52, 0x4b60, 0xa6e6, 0xa4e0, 0xd260, 0xea65, 0xd530,
    0x5aa0, 0x76a3, 0x96d0, 0x4afb, 0x4ad0, 0xa4d0, 0xd0b6, 0xd25f, 0xd520, 0xdd45,
    0xb5a0, 0x56d0, 0x55b2, 0x49b0, 0xa577, 0xa4b0, 0xaa50, 0xb255, 0x6d2f, 0xada0,
    0x4b63, 0x937f, 0x49f8, 0x4970, 0x64b0, 0x68a6, 0xea5f, 0x6b20, 0xa6c4, 0xaaef,
    0x92e0, 0xd2e3, 0xc960, 0xd557, 0xd4a0, 0xda50, 0x5d55, 0x56a0, 0xa6d0, 0x55d4,
    0x52d0, 0xa9b8, 0xa950, 0xb4a0, 0xb6a6, 0xad50, 0x55a0, 0xaba4, 0xa5b0, 0x52b0,
    0xb273, 0x6930, 0x7337, 0x6aa0, 0xad50, 0x4b55, 0x4b6f, 0xa570, 0x54e4, 0xd260,
    0xe968, 0xd520, 0xdaa0, 0x6aa6, 0x56df, 0x4ae0, 0xa9d4, 0xa4d0, 0xd150, 0xf252,
    0xd520
];
// 天干地支
const Gan = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const Zhi = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
const Animals = ['鼠', '牛', '虎', '兔', '龍', '蛇', '馬', '羊', '猴', '雞', '狗', '豬'];
// 農曆月名／日名
const lunarMonths = ['正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '冬', '臘'];
const lunarDays = ['', '初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十',
    '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
    '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十'];
// 24 節氣名稱
const solarTermNames = [
    '小寒', '大寒', '立春', '雨水', '驚蟄', '春分', '清明', '穀雨',
    '立夏', '小滿', '芒種', '夏至', '小暑', '大暑', '立秋', '處暑',
    '白露', '秋分', '寒露', '霜降', '立冬', '小雪', '大雪', '冬至'
];
// 國曆月天數
const solarMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

// 邊界防護檢查 (1900 - 2100)
function assertLunarYear(y) {
    if (!Number.isInteger(y) || y < 1900 || y > 2100) {
        throw new Error(`農曆年份超出支援範圍 (1900-2100): ${y}`);
    }
    if (lunarInfo[y - 1900] === undefined) {
        throw new Error(`缺少農曆資料: ${y}`);
    }
}

// ===== 陰曆計算函式 =====
function lYearDays(y) {
    assertLunarYear(y);
    let sum = 348;
    for (let i = 0x8000; i > 0x8; i >>= 1) {
        sum += (lunarInfo[y - 1900] & i) ? 1 : 0;
    }
    return sum + leapDays(y);
}
function leapDays(y) {
    assertLunarYear(y);
    const leap = leapMonth(y);
    if (!leap) return 0;
    
    const nextYearIndex = y - 1899;
    if (nextYearIndex >= lunarInfo.length) {
        // [邊界防護]: 若未來支援範圍擴充，避免存取越界。2100 年無閏月 (leap = 0) 不會進此邏輯
        throw new Error(`缺少 ${y} 年閏月大小資料`);
    }

    // [修正紀錄]: lunarInfo 為 16-bit 壓縮，無 0x10000 位元，必須使用原版 Sean Lin 演算法
    // 若下一年 leapMonth 原始值為 0xf（即無閏月），代表本年閏月 = 30 天；否則 29 天
    return ((lunarInfo[nextYearIndex] & 0xf) === 0xf) ? 30 : 29;
}
function leapMonth(y) {
    assertLunarYear(y);
    // 經典 16-bit 表格中，低 4 位元代表閏月月份。
    // 若值為 0 代表無閏月；若值為 0xf，不僅代表無閏月，同時暗示上一年閏月為大月 (30天)。
    // 因此對外回傳時，0xf 應視為 0（無閏月）。
    const lm = lunarInfo[y - 1900] & 0xf;
    return lm === 0xf ? 0 : lm;
}
function monthDays(y, m) {
    assertLunarYear(y);
    if (!Number.isInteger(m) || m < 1 || m > 12) {
        throw new Error(`農曆月份無效: ${m}`);
    }
    return (lunarInfo[y - 1900] & (0x10000 >> m)) ? 30 : 29;
}
function solarDays(y, m) {
    if (!Number.isInteger(m) || m < 1 || m > 12) {
        throw new Error(`國曆月份無效: ${m}`);
    }
    if (m === 2) {
        return (((y % 4 === 0) && (y % 100 !== 0)) || (y % 400 === 0)) ? 29 : 28;
    }
    return solarMonth[m - 1];
}
function cyclical(num) {
    const index = ((num % 60) + 60) % 60;
    return Gan[index % 10] + Zhi[index % 12];
}
// ===== 節氣自動計算（天文常數標準算法） =====
const sTermInfo = [
    0, 21208, 42467, 63836, 85337, 107014,
    128867, 150921, 173149, 195551, 218072, 240693,
    263343, 285989, 308563, 331033, 353350, 375494,
    397447, 419210, 440795, 462224, 483532, 504758
];

function sTerm(y, n) {
    const timestamp = (31556925974.7 * (y - 1900)) + sTermInfo[n] * 60000 + Date.UTC(1900, 0, 6, 2, 5, 0);
    const taiwanDate = new Date(timestamp + 8 * 60 * 60 * 1000);
    return taiwanDate.getUTCDate();
}
function getSolarTermName(y, m, d) {
    if (!Number.isInteger(y) || y < 1900 || y > 2100) return null;
    if (!Number.isInteger(m) || m < 1 || m > 12) return null;
    if (!Number.isInteger(d) || d < 1) return null;
    
    const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
    if (d > daysInMonth) return null;

    const term1Day = sTerm(y, (m - 1) * 2);
    const term2Day = sTerm(y, (m - 1) * 2 + 1);
    
    if (d === term1Day) return solarTermNames[(m - 1) * 2];
    if (d === term2Day) return solarTermNames[(m - 1) * 2 + 1];
    
    return null;
}
export function gregorianToLunar(y, m, d, skipFestivals = false) {
    if (!Number.isInteger(y) || y < 1900 || y > 2100) throw new Error('年份必須介於 1900 至 2100 之間且為整數');
    if (!Number.isInteger(m) || m < 1 || m > 12) throw new Error('月份必須介於 1 至 12 之間且為整數');
    if (!Number.isInteger(d)) throw new Error('日期必須為整數');
    const _daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
    if (d < 1 || d > _daysInMonth) throw new Error('無效的日期');

    const minDate = Date.UTC(1900, 0, 31);
    const maxDate = Date.UTC(2100, 11, 31);
    const inputDate = Date.UTC(y, m - 1, d);
    if (inputDate < minDate || inputDate > maxDate) throw new Error('日期必須介於 1900-01-31 至 2100-12-31 之間');

    let offset = (inputDate - minDate) / 86400000;
    let i, temp = 0;
    for (i = 1900; i <= 2100 && offset > 0; i++) {
        temp = lYearDays(i);
        offset -= temp;
    }
    
    if (offset > 0) {
        throw new Error('農曆資料不足，無法轉換此日期（超過 2100 年邊界）');
    }
    
    if (offset < 0) {
        offset += temp;
        i--;
    }
    const lunarYear = i;
    const leap = leapMonth(lunarYear);
    let isLeap = false;
    for (i = 1; i < 13 && offset > 0; i++) {
        if (leap > 0 && i === (leap + 1) && isLeap === false) {
            --i;
            isLeap = true;
            temp = leapDays(lunarYear);
        }
        else {
            temp = monthDays(lunarYear, i);
        }
        if (isLeap === true && i === (leap + 1))
            isLeap = false;
        offset -= temp;
    }
    if (offset === 0 && leap > 0 && i === leap + 1) {
        if (isLeap) {
            isLeap = false;
        }
        else {
            isLeap = true;
            --i;
        }
    }
    if (offset < 0) {
        offset += temp;
        --i;
    }
    const lunarMonth = i;
    const lunarDay = offset + 1;
    const displayMonth = lunarMonth;
    const yearGzIdx = (y - 1900 + 36 - (m < 2 || (m === 2 && d < sTerm(y, 2)) ? 1 : 0)) % 60;
    const yearGz = cyclical(yearGzIdx < 0 ? yearGzIdx + 60 : yearGzIdx);
    const dayOffset = Math.floor((Date.UTC(y, m - 1, d) - Date.UTC(1900, 0, 1)) / 86400000);
    const dayGzIdx = ((dayOffset % 60) + 10) % 60;
    const dayGz = cyclical(dayGzIdx < 0 ? dayGzIdx + 60 : dayGzIdx);
    const yearGanIdx = yearGzIdx % 10;
    const monthGanBase = ((yearGanIdx % 5) * 2 + 2) % 10; 
    let jieIdx = (m - 1) * 2;
    if (d < sTerm(y, jieIdx)) {
        jieIdx -= 2;
    }
    let monthOffset = Math.floor(jieIdx / 2) - 1; 
    if (monthOffset < 0) {
        monthOffset += 12;
    }
    const monthGanIdx = (monthGanBase + monthOffset) % 10;
    const monthZhiIdx = (2 + monthOffset) % 12;
    const monthGz = Gan[monthGanIdx] + Zhi[monthZhiIdx];
    const monthGzIdx = (monthGanIdx * 6 - monthZhiIdx * 5 + 60) % 60;
    const termName = getSolarTermName(y, m, d);
    let allFestivals = [];
    let combinedFestival = null;
    
    if (!skipFestivals) {
        const lunarFest = getLunarFestival(displayMonth, lunarDay, isLeap);
        if (lunarFest) allFestivals.push(lunarFest);
        
        const currentMonthDays = isLeap ? leapDays(lunarYear) : monthDays(lunarYear, displayMonth);
        const isLastMonthOfYear = (leap === 12) ? (displayMonth === 12 && isLeap) : (displayMonth === 12 && !isLeap);
        if (isLastMonthOfYear && lunarDay === currentMonthDays) {
            allFestivals.push('除夕');
        }
        
        const isLastMonthOf7 = (leap === 7) ? (displayMonth === 7 && isLeap) : (displayMonth === 7 && !isLeap);
        if (isLastMonthOf7 && lunarDay === currentMonthDays) {
            allFestivals.push('地藏王菩薩聖誕 關鬼門');
        }
        
        const solarFest = getSolarFestival(m, d);
        if (solarFest) allFestivals.push(solarFest);
        
        const weekFest = getWeekFestival(y, m, d);
        if (weekFest) allFestivals.push(weekFest);
        
        if (termName === '清明') allFestivals.push('清明節');
        
        if (m === 3 || m === 4) {
            const easter = getEaster(y);
            if (easter.month === m && easter.day === d) {
                allFestivals.push('復活節');
            }
        }
        
        combinedFestival = allFestivals.length > 0 ? [...new Set(allFestivals)].join(' ') : null;
    }

    const nationalHoliday = getNationalHoliday(`${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
    const bazi = buildBaziFromGanZhi(yearGz, monthGz, dayGz, yearGzIdx, monthGzIdx, dayGzIdx);
    return {
        year: lunarYear,
        month: displayMonth,
        day: lunarDay,
        isLeap,
        yearGanZhi: yearGz,
        monthGanZhi: monthGz,
        dayGanZhi: dayGz,
        monthName: (isLeap ? '閏' : '') + lunarMonths[displayMonth - 1] + '月',
        dayName: lunarDays[lunarDay] || '',
        animal: Animals[((lunarYear - 4) % 12 + 12) % 12],
        solarTerm: termName,
        festival: combinedFestival,
        isNationalHoliday: nationalHoliday !== null,
        nationalHoliday: nationalHoliday || null,
        bazi: bazi || null,
    };
}
const lunarFestivals = [
    { month: 1, day: 1, name: '春節' },
    { month: 1, day: 2, name: '回娘家' },
    { month: 1, day: 3, name: '赤狗日' },
    { month: 1, day: 4, name: '接神日' },
    { month: 1, day: 5, name: '開市' },
    { month: 1, day: 6, name: '清水祖師誕辰' },
    { month: 1, day: 7, name: '人日' },
    { month: 1, day: 9, name: '天公生' },
    { month: 1, day: 15, name: '元宵節' },
    { month: 2, day: 2, name: '土地公生' },
    { month: 2, day: 3, name: '文昌帝君聖誕' },
    { month: 2, day: 15, name: '九天玄女聖誕' },
    { month: 2, day: 19, name: '觀音菩薩聖誕 普賢菩薩誕辰' },
    { month: 3, day: 3, name: '上巳節 玄天上帝誕辰' },
    { month: 3, day: 15, name: '保生大帝聖誕' },
    { month: 3, day: 23, name: '媽祖生' },
    { month: 4, day: 4, name: '文殊菩薩誕辰' },
    { month: 4, day: 8, name: '浴佛節' },
    { month: 4, day: 26, name: '神農大帝聖誕' },
    { month: 5, day: 5, name: '端午節' },
    { month: 5, day: 13, name: '關公生' },
    { month: 6, day: 6, name: '天貺節' },
    { month: 6, day: 15, name: '半年節' },
    { month: 6, day: 18, name: '池府王爺千秋' },
    { month: 6, day: 19, name: '觀世音菩薩得道' },
    { month: 6, day: 24, name: '關公聖誕' },
    { month: 7, day: 1, name: '開鬼門' },
    { month: 7, day: 7, name: '七夕 七娘媽生' },
    { month: 7, day: 15, name: '中元節' },
    { month: 7, day: 18, name: '瑤池金母誕辰' },
    { month: 8, day: 3, name: '灶君生' },
    { month: 8, day: 15, name: '中秋節' },
    { month: 9, day: 9, name: '重陽節' },
    { month: 10, day: 5, name: '達摩祖師誕辰' },
    { month: 10, day: 15, name: '下元節' },
    { month: 10, day: 22, name: '青山靈安尊王千秋' },
    { month: 12, day: 16, name: '尾牙' },
    { month: 12, day: 24, name: '送神' },
];

const solarFestivals = [
    { month: 1, day: 1, name: '元旦 中華民國開國紀念日', isHoliday: true },
    { month: 1, day: 11, name: '司法節' },
    { month: 1, day: 15, name: '藥師節' },
    { month: 1, day: 23, name: '自由日' },
    { month: 2, day: 4, name: '農民節' },
    { month: 2, day: 14, name: '情人節' },
    { month: 2, day: 15, name: '戲劇節' },
    { month: 2, day: 19, name: '新生活運動紀念日' },
    { month: 2, day: 28, name: '和平紀念日', isHoliday: true },
    { month: 3, day: 1, name: '兵役節' },
    { month: 3, day: 5, name: '童子軍節' },
    { month: 3, day: 8, name: '婦女節' },
    { month: 3, day: 12, name: '植樹節 國父逝世紀念日' },
    { month: 3, day: 17, name: '國醫節' },
    { month: 3, day: 20, name: '郵政節' },
    { month: 3, day: 21, name: '氣象節' },
    { month: 3, day: 25, name: '美術節' },
    { month: 3, day: 26, name: '廣播節' },
    { month: 3, day: 29, name: '青年節 革命先烈紀念日' },
    { month: 3, day: 30, name: '出版節' },
    { month: 4, day: 1, name: '愚人節 主計節' },
    { month: 4, day: 4, name: '婦幼節' },
    { month: 4, day: 5, name: '音樂節' },
    { month: 4, day: 7, name: '衛生節' },
    { month: 4, day: 22, name: '世界地球日' },
    { month: 5, day: 1, name: '勞動節', isHoliday: true },
    { month: 5, day: 4, name: '文藝節' },
    { month: 5, day: 5, name: '舞蹈節' },
    { month: 5, day: 10, name: '珠算節' },
    { month: 5, day: 12, name: '護士節' },
    { month: 6, day: 3, name: '禁煙節' },
    { month: 6, day: 6, name: '工程師節 水利節' },
    { month: 6, day: 9, name: '鐵路節' },
    { month: 6, day: 15, name: '警察節' },
    { month: 6, day: 30, name: '會計師節' },
    { month: 7, day: 1, name: '漁民節 公路節 稅務節' },
    { month: 7, day: 11, name: '航海節' },
    { month: 7, day: 12, name: '聾啞節' },
    { month: 8, day: 8, name: '父親節' },
    { month: 8, day: 14, name: '空軍節' },
    { month: 8, day: 27, name: '鄭成功誕辰' },
    { month: 9, day: 1, name: '記者節' },
    { month: 9, day: 3, name: '軍人節 抗戰紀念' },
    { month: 9, day: 9, name: '體育節 律師節' },
    { month: 9, day: 13, name: '法律日' },
    { month: 9, day: 28, name: '教師節 孔子誕辰' },
    { month: 10, day: 6, name: '老人節' },
    { month: 10, day: 10, name: '國慶紀念日', isHoliday: true },
    { month: 10, day: 21, name: '華僑節' },
    { month: 10, day: 25, name: '臺灣光復節' },
    { month: 10, day: 31, name: '萬聖節 蔣公誕辰紀念日 榮民節' },
    { month: 11, day: 1, name: '商人節' },
    { month: 11, day: 11, name: '工業節 地政節' },
    { month: 11, day: 12, name: '國父誕辰紀念日 醫師節 中華文化復興節' },
    { month: 11, day: 17, name: '自來水節' },
    { month: 11, day: 21, name: '防空節' },
    { month: 12, day: 5, name: '海員節 盲人節' },
    { month: 12, day: 10, name: '人權節' },
    { month: 12, day: 12, name: '憲兵節' },
    { month: 12, day: 25, name: '行憲紀念日 民族復興節 聖誕節' },
    { month: 12, day: 27, name: '建築師節' },
    { month: 12, day: 28, name: '電信節' },
    { month: 12, day: 31, name: '受信節' },
];

const weekFestivals = [
    { month: 5, week: 2, dow: 0, name: '母親節' },
    { month: 7, week: 1, dow: 6, name: '國際合作節' },
    { month: 7, week: 3, dow: 0, name: '被奴役國家週' },
    { month: 11, week: 4, dow: 4, name: '感恩節' },
];
export function getLunarFestival(lunarMonth, lunarDay, isLeap) {
    if (isLeap) return null;
    let names = [];
    for (const f of lunarFestivals) {
        if (f.month === lunarMonth && f.day === lunarDay) {
            names.push(f.name);
        }
    }
    return names.length > 0 ? names.join(' ') : null;
}

export function getSolarFestival(m, d) {
    if (!Number.isInteger(m) || m < 1 || m > 12) return null;
    if (!Number.isInteger(d) || d < 1 || d > 31) return null;
    
    let names = [];
    for (const f of solarFestivals) {
        if (f.month === m && f.day === d) {
            names.push(f.name);
        }
    }
    return names.length > 0 ? names.join(' ') : null;
}

const VALENTINE_DAYS = {
    1: '日記情人節',
    2: '西洋情人節',
    3: '白色情人節',
    4: '黑色情人節',
    5: '玫瑰情人節',
    6: '親吻情人節',
    7: '銀色情人節',
    8: '綠色情人節',
    9: '相片情人節',
    10: '葡萄酒情人節',
    11: '電影情人節',
    12: '擁抱情人節'
};

export function getValentineFestival(m, d) {
    if (d === 14 && VALENTINE_DAYS[m]) {
        // 2/14 在 getSolarFestival 已經標註「情人節」，我們可用「西洋情人節」取代或直接回傳以利後續合併
        return VALENTINE_DAYS[m];
    }
    return null;
}

export function getWeekFestival(y, m, d) {
    if (!Number.isInteger(y) || y < 1900 || y > 2100) return null;
    if (!Number.isInteger(m) || m < 1 || m > 12) return null;
    if (!Number.isInteger(d) || d < 1) return null;
    
    const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
    if (d > daysInMonth) return null;

    const date = new Date(Date.UTC(y, m - 1, d));
    const dow = date.getUTCDay();
    const week = Math.floor((d - 1) / 7) + 1;
    let names = [];
    for (const f of weekFestivals) {
        if (f.month === m && f.week === week && f.dow === dow) {
            names.push(f.name);
        }
    }
    return names.length > 0 ? names.join(' ') : null;
}

export function getEaster(y) {
    if (!Number.isInteger(y) || y < 1900 || y > 2100) {
        throw new Error('年份必須介於 1900 至 2100 之間且為整數');
    }
    const a = y % 19;
    const b = Math.floor(y / 100);
    const c = y % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const mn = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * mn + 114) / 31);
    const day = ((h + l - 7 * mn + 114) % 31) + 1;
    return { month, day };
}
export {
    clearGovtHolidayCache,
    loadGovtHolidaysFromData,
    loadPersistedHolidays,
    getHolidayLastUpdated,
    ensureGovtHolidays,
    fetchAndPersistHolidays,
    getNationalHoliday
};
const tenGodNames = [
    ['比肩', '劫財', '食神', '傷官', '偏財', '正財', '七殺', '正官', '偏印', '正印'],
    ['劫財', '比肩', '傷官', '食神', '正財', '偏財', '正官', '七殺', '正印', '偏印'],
    ['偏印', '正印', '比肩', '劫財', '食神', '傷官', '偏財', '正財', '七殺', '正官'],
    ['正印', '偏印', '劫財', '比肩', '傷官', '食神', '正財', '偏財', '正官', '七殺'],
    ['七殺', '正官', '偏印', '正印', '比肩', '劫財', '食神', '傷官', '偏財', '正財'],
    ['正官', '七殺', '正印', '偏印', '劫財', '比肩', '傷官', '食神', '正財', '偏財'],
    ['偏財', '正財', '七殺', '正官', '偏印', '正印', '比肩', '劫財', '食神', '傷官'],
    ['正財', '偏財', '正官', '七殺', '正印', '偏印', '劫財', '比肩', '傷官', '食神'],
    ['食神', '傷官', '偏財', '正財', '七殺', '正官', '偏印', '正印', '比肩', '劫財'],
    ['傷官', '食神', '正財', '偏財', '正官', '七殺', '正印', '偏印', '劫財', '比肩'],
];
const hiddenStems = {
    '子': ['癸'],
    '丑': ['己', '癸', '辛'],
    '寅': ['甲', '丙', '戊'],
    '卯': ['乙'],
    '辰': ['戊', '乙', '癸'],
    '巳': ['丙', '庚', '戊'],
    '午': ['丁', '己'],
    '未': ['己', '丁', '乙'],
    '申': ['庚', '壬', '戊'],
    '酉': ['辛'],
    '戌': ['戊', '辛', '丁'],
    '亥': ['壬', '甲'],
};
const nayinTable = {
    '甲子': '海中金', '乙丑': '海中金', '丙寅': '爐中火', '丁卯': '爐中火', '戊辰': '大林木', '己巳': '大林木',
    '庚午': '路旁土', '辛未': '路旁土', '壬申': '劍鋒金', '癸酉': '劍鋒金', '甲戌': '山頭火', '乙亥': '山頭火',
    '丙子': '澗下水', '丁丑': '澗下水', '戊寅': '城頭土', '己卯': '城頭土', '庚辰': '白蠟金', '辛巳': '白蠟金',
    '壬午': '楊柳木', '癸未': '楊柳木', '甲申': '泉中水', '乙酉': '泉中水', '丙戌': '屋上土', '丁亥': '屋上土',
    '戊子': '霹靂火', '己丑': '霹靂火', '庚寅': '松柏木', '辛卯': '松柏木', '壬辰': '長流水', '癸巳': '長流水',
    '甲午': '沙中金', '乙未': '沙中金', '丙申': '山下火', '丁酉': '山下火', '戊戌': '平地木', '己亥': '平地木',
    '庚子': '壁上土', '辛丑': '壁上土', '壬寅': '金箔金', '癸卯': '金箔金', '甲辰': '覆燈火', '乙巳': '覆燈火',
    '丙午': '天河水', '丁未': '天河水', '戊申': '大驛土', '己酉': '大驛土', '庚戌': '釵釧金', '辛亥': '釵釧金',
    '壬子': '桑柘木', '癸丑': '桑柘木', '甲寅': '大溪水', '乙卯': '大溪水', '丙辰': '沙中土', '丁巳': '沙中土',
    '戊午': '天上火', '己未': '天上火', '庚申': '石榴木', '辛酉': '石榴木', '壬戌': '大海水', '癸亥': '大海水',
};
function buildBaziFromGanZhi(yearGz, monthGz, dayGz, _yearGzIdx, _monthGzIdx, dayGzIdx, hour, advanceDayGanForHour = false) {
    const yearG = Gan.indexOf(yearGz[0]);
    const monthG = Gan.indexOf(monthGz[0]);
    const dayG = Gan.indexOf(dayGz[0]);
    
    if (yearG < 0 || monthG < 0 || dayG < 0) {
        throw new Error('無效的干支字串');
    }
    const yearZ = yearGz[1];
    const monthZ = monthGz[1];
    const dayZ = dayGz[1];
    const yNayin = nayinTable[yearGz] || '';
    const mNayin = nayinTable[monthGz] || '';
    const dNayin = nayinTable[dayGz] || '';
    const yTenGod = tenGodNames[dayG][yearG];
    const mTenGod = tenGodNames[dayG][monthG];
    const yHidden = hiddenStems[yearZ] || [];
    const mHidden = hiddenStems[monthZ] || [];
    const dHidden = hiddenStems[dayZ] || [];
    let hourGz;
    let hTenGod;
    let hHidden;
    let hNayin;
    if (hour !== undefined) {
        if (!Number.isInteger(hour) || hour < 0 || hour > 23) {
            throw new Error('hour 必須是 0 至 23 的整數');
        }
        const hourZhiIdx = Math.floor((hour + 1) / 2) % 12;
        const hourZhi = Zhi[hourZhiIdx];
        const dayGanForHour = advanceDayGanForHour ? ((dayG + 1) % 10) : dayG;
        const hourGIdx = (dayGanForHour * 2 + hourZhiIdx) % 10;
        
        hourGz = Gan[hourGIdx] + hourZhi;
        hTenGod = tenGodNames[dayG][hourGIdx];
        hHidden = hiddenStems[hourZhi] || [];
        hNayin = nayinTable[hourGz] || '';
    }
    return {
        yearPillar: yearGz,
        monthPillar: monthGz,
        dayPillar: dayGz,
        hourPillar: hourGz,
        yearTenGod: yTenGod,
        monthTenGod: mTenGod,
        dayTenGod: '日主',
        hourTenGod: hTenGod,
        yearHidden: yHidden,
        monthHidden: mHidden,
        dayHidden: dHidden,
        hourHidden: hHidden,
        yearNayin: yNayin,
        monthNayin: mNayin,
        dayNayin: dNayin,
        hourNayin: hNayin,
    };
}
/**
 * 取得完整八字排盤資訊（公開工具函式）
 * 包含四柱（年、月、日、時）、十神、地支藏干、六十甲子納音
 * 
 * ⚠️ 排盤精度限制說明：
 * 本模組定位為輕量級農民曆參考，未內建精密星曆演算法。
 * 1. 節氣精度：節氣交接（如立春切換年柱、白露切換月柱）僅精確至「日」。
 *    無比對具體的交節氣「時：分」。若出生當日恰逢交節氣，系統預設 00:00 起即切換干支。
 * 2. 早夜子時：出生時間為 23:00 時，依傳統慣例自動推進日柱，採「早夜子時同天干」規則。
 * 
 * @param {number} y - 國曆年份
 * @param {number} m - 國曆月份
 * @param {number} d - 國曆日期
 * @param {number} [hour] - 出生時間 (0-23)，若不提供則時柱相關資訊為 undefined
 * @returns {Object} 八字排盤詳細資訊物件
 */
export function getBazi(y, m, d, hour) {
    if (!Number.isInteger(y) || y < 1900 || y > 2100) throw new Error('年份必須介於 1900 至 2100 之間且為整數');
    if (!Number.isInteger(m) || m < 1 || m > 12) throw new Error('月份必須介於 1 至 12 之間且為整數');
    if (!Number.isInteger(d)) throw new Error('日期必須為整數');
    const _daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
    if (d < 1 || d > _daysInMonth) throw new Error('無效的日期');

    const minDate = Date.UTC(1900, 0, 31);
    const inputDate = Date.UTC(y, m - 1, d);
    if (inputDate < minDate) throw new Error('日期必須介於 1900-01-31 至 2100-12-31 之間');

    if (hour !== undefined && (!Number.isInteger(hour) || hour < 0 || hour > 23)) {
        throw new Error('出生時間必須是 0 至 23 的整數');
    }

    const lunar = gregorianToLunar(y, m, d);
    const ganIdx = Gan.indexOf(lunar.dayGanZhi[0]);
    const zhiIdx = Zhi.indexOf(lunar.dayGanZhi[1]);
    // 正確的六十甲子序號反推公式（與 monthGzIdx 相同算法）
    const dayGzIdx = (ganIdx * 6 - zhiIdx * 5 + 60) % 60;
    const advanceDayGan = (hour === 23);
    const bazi = buildBaziFromGanZhi(lunar.yearGanZhi, lunar.monthGanZhi, lunar.dayGanZhi, 0, 0, dayGzIdx, hour, advanceDayGan);
    
    // 早夜子時雙輸出邏輯：若為 23:00，額外產生「早子時 (日柱進位到明天)」的排盤結果
    if (hour === 23) {
        // 利用 Date.UTC 取得明天日期（自動處理跨月跨年）
        const nextDate = new Date(Date.UTC(y, m - 1, d + 1));
        const nextY = nextDate.getUTCFullYear();
        const nextM = nextDate.getUTCMonth() + 1;
        const nextD = nextDate.getUTCDate();
        
        if (nextY <= 2100) {
            const lunarNext = gregorianToLunar(nextY, nextM, nextD);
            const nGanIdx = Gan.indexOf(lunarNext.dayGanZhi[0]);
            const nZhiIdx = Zhi.indexOf(lunarNext.dayGanZhi[1]);
            const nDayGzIdx = (nGanIdx * 6 - nZhiIdx * 5 + 60) % 60;
            
            // 傳入 hour = 0 且 advanceDayGanForHour = false，因為對於早子時（明天）來說，就是明天的子時(00:00)
            bazi.earlyZiBazi = buildBaziFromGanZhi(lunarNext.yearGanZhi, lunarNext.monthGanZhi, lunarNext.dayGanZhi, 0, 0, nDayGzIdx, 0, false);
        } else {
            // 若 2100-12-31 23:00 會推算到 2101-01-01 導致超出範圍，則忽略早子時的日柱排盤
            bazi.earlyZiBazi = null;
        }
    }
    
    return bazi;
}
