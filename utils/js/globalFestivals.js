/**
 * globalFestivals.js — Global and Western Festivals Module
 * 
 * Handles Western and international festivals independent of the lunar calendar
 * (e.g., Easter, Mother's Day, Christmas) with i18n support.
 */

const weekFestivals = [
    { month: 5, week: 2, dow: 0, i18nKey: 'ui.globalFestivals.mothersDay', defaultName: 'Mother\'s Day' },
    { month: 7, week: 1, dow: 6, i18nKey: 'ui.globalFestivals.internationalCoopDay', defaultName: 'International Day of Cooperatives' },
    { month: 7, week: 3, dow: 0, i18nKey: 'ui.globalFestivals.captiveNationsWeek', defaultName: 'Captive Nations Week' },
    { month: 11, week: 4, dow: 4, i18nKey: 'ui.globalFestivals.thanksgiving', defaultName: 'Thanksgiving' },
];

const globalSolarFestivals = [
    { month: 1, day: 1, i18nKey: 'ui.globalFestivals.newYear', defaultName: 'New Year\'s Day' },
    { month: 3, day: 8, i18nKey: 'ui.globalFestivals.womensDay', defaultName: 'International Women\'s Day' },
    { month: 4, day: 1, i18nKey: 'ui.globalFestivals.foolsDay', defaultName: 'April Fools\' Day' },
    { month: 4, day: 22, i18nKey: 'ui.globalFestivals.earthDay', defaultName: 'Earth Day' },
    { month: 5, day: 1, i18nKey: 'ui.globalFestivals.laborDay', defaultName: 'Labor Day' },
    { month: 10, day: 31, i18nKey: 'ui.globalFestivals.halloween', defaultName: 'Halloween' },
    { month: 12, day: 25, i18nKey: 'ui.globalFestivals.christmas', defaultName: 'Christmas' },
];

const VALENTINE_DAYS = {
    1: { i18nKey: 'ui.globalFestivals.diaryValentinesDay', defaultName: 'Diary Day' },
    2: { i18nKey: 'ui.globalFestivals.westernValentinesDay', defaultName: 'Western Valentine\'s Day' },
    3: { i18nKey: 'ui.globalFestivals.whiteValentinesDay', defaultName: 'White Day' },
    4: { i18nKey: 'ui.globalFestivals.blackValentinesDay', defaultName: 'Black Day' },
    5: { i18nKey: 'ui.globalFestivals.roseValentinesDay', defaultName: 'Rose Day' },
    6: { i18nKey: 'ui.globalFestivals.kissValentinesDay', defaultName: 'Kiss Day' },
    7: { i18nKey: 'ui.globalFestivals.silverValentinesDay', defaultName: 'Silver Day' },
    8: { i18nKey: 'ui.globalFestivals.greenValentinesDay', defaultName: 'Green Day' },
    9: { i18nKey: 'ui.globalFestivals.photoValentinesDay', defaultName: 'Photo Day' },
    10: { i18nKey: 'ui.globalFestivals.wineValentinesDay', defaultName: 'Wine Day' },
    11: { i18nKey: 'ui.globalFestivals.movieValentinesDay', defaultName: 'Movie Day' },
    12: { i18nKey: 'ui.globalFestivals.hugValentinesDay', defaultName: 'Hug Day' }
};

export function getGlobalSolarFestival(m, d) {
    if (!Number.isInteger(m) || m < 1 || m > 12) return null;
    if (!Number.isInteger(d) || d < 1 || d > 31) return null;
    
    let names = [];
    for (const f of globalSolarFestivals) {
        if (f.month === m && f.day === d) {
            names.push(window.t ? window.t(f.i18nKey) : f.defaultName);
        }
    }
    return names.length > 0 ? names.join(' ') : null;
}

export function getGlobalValentineFestival(m, d) {
    if (d === 14 && VALENTINE_DAYS[m]) {
        return window.t ? window.t(VALENTINE_DAYS[m].i18nKey) : VALENTINE_DAYS[m].defaultName;
    }
    return null;
}

export function getGlobalWeekFestival(y, m, d) {
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
            names.push(window.t ? window.t(f.i18nKey) : f.defaultName);
        }
    }
    return names.length > 0 ? names.join(' ') : null;
}

function calculateEaster(y) {
    if (!Number.isInteger(y) || y < 1900 || y > 2100) {
        throw new Error('Year must be between 1900 and 2100 and be an integer');
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

export function getEasterFestival(y, m, d) {
    if (m === 3 || m === 4) {
        const easter = calculateEaster(y);
        if (easter.month === m && easter.day === d) {
            return window.t ? window.t('ui.globalFestivals.easter') : 'Easter';
        }
    }
    return null;
}
