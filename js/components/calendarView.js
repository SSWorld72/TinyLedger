import { gregorianToLunar, ensureGovtHolidays, getNationalHoliday, getLunarFestival, loadPersistedHolidays } from '../../utils/js/lunarCalendar.js';
import { getGlobalValentineFestival } from '../../utils/js/globalFestivals.js';

let currentState;
let currentDb;
let calendarDate = new Date(); // Defines the currently viewed month
let currentSettings = { lunarDate: true, lunarStembranch: true, lunarSolarterm: true, lunarFestival: true, nationalHoliday: true, baziChart: true, calendarValentine: false };
const monthNames = () => window.t('ui.calendar.months');
const NUMBER_TO_CHINESE = () => window.t('ui.calendar.lunarDays');
const CHINESE_MONTHS = () => window.t('ui.calendar.lunarMonths');

function formatLunarDay(lunarInfo) {
    if (lunarInfo.day === 1) {
        return (lunarInfo.isLeap ? window.t('ui.calendar.lunarLeap') : "") + CHINESE_MONTHS()[lunarInfo.month - 1] + window.t('ui.calendar.lunarMonthSuffix');
    }
    return NUMBER_TO_CHINESE()[lunarInfo.day - 1];
}

function loadCalendarSettings() {
    try {
        const saved = JSON.parse(localStorage.getItem('tinyledger_calendar_settings'));
        if (saved) currentSettings = { ...currentSettings, ...saved };
    } catch (e) { }
}

export function initCalendar(state, db) {
    currentState = state;
    currentDb = db;

    // Load persisted national holidays from localStorage
    loadPersistedHolidays();

    loadCalendarSettings();
    window.addEventListener('calendarSettingsChanged', () => {
        loadCalendarSettings();
    });
    window.addEventListener('accountsChanged', async () => {
        const calendarTab = document.getElementById('tab-calendar');
        if (calendarTab && calendarTab.classList.contains('active')) {
            await renderCalendar();
        }
    });

    const btnNavCalendar = document.getElementById('btn-nav-calendar');

    const btnPrev = document.getElementById('btn-cal-prev');
    const btnNext = document.getElementById('btn-cal-next');
    const btnToday = document.getElementById('btn-cal-today');

    btnNavCalendar?.addEventListener('click', async () => {
        calendarDate = new Date(); // reset to current month
        await renderCalendar();
    });

    let isRendering = false;

    const yearSelect = document.getElementById('calendar-year-select');
    const monthSelect = document.getElementById('calendar-month-select');

    if (yearSelect && monthSelect) {
        yearSelect.innerHTML = '';
        const currentYear = new Date().getFullYear();
        for (let y = 2000; y <= 2080; y++) {
            const option = document.createElement('option');
            option.value = y;
            option.textContent = `${y}${window.t('ui.stats.year')}`;
            yearSelect.appendChild(option);
        }
        monthSelect.innerHTML = '';
        monthNames().forEach((m, idx) => {
            const option = document.createElement('option');
            option.value = idx;
            option.textContent = m;
            monthSelect.appendChild(option);
        });

        yearSelect.addEventListener('change', async () => {
            if (isRendering) {
                yearSelect.value = calendarDate.getFullYear(); // Revert
                return;
            }
            isRendering = true;
            try {
                calendarDate.setDate(1);
                calendarDate.setFullYear(parseInt(yearSelect.value));
                await renderCalendar();
            } finally {
                isRendering = false;
            }
        });

        monthSelect.addEventListener('change', async () => {
            if (isRendering) {
                monthSelect.value = calendarDate.getMonth(); // Revert
                return;
            }
            isRendering = true;
            try {
                calendarDate.setDate(1);
                calendarDate.setMonth(parseInt(monthSelect.value));
                await renderCalendar();
            } finally {
                isRendering = false;
            }
        });
    }

    btnPrev.onclick = async () => {
        if (isRendering) return;
        isRendering = true;
        try {
            calendarDate.setDate(1);
            calendarDate.setMonth(calendarDate.getMonth() - 1);
            await renderCalendar();
        } finally {
            isRendering = false;
        }
    };

    btnNext.onclick = async () => {
        if (isRendering) return;
        isRendering = true;
        try {
            calendarDate.setDate(1);
            calendarDate.setMonth(calendarDate.getMonth() + 1);
            await renderCalendar();
        } finally {
            isRendering = false;
        }
    };

    btnToday.onclick = async () => {
        if (isRendering) return;
        isRendering = true;
        try {
            calendarDate = new Date();
            await renderCalendar();
        } finally {
            isRendering = false;
        }
    };

    document.getElementById('btn-close-day-detail').addEventListener('click', closeDayDetail);
    const btnCloseDayDetailTop = document.getElementById('btn-close-day-detail-top');
    if (btnCloseDayDetailTop) btnCloseDayDetailTop.addEventListener('click', closeDayDetail);
}

async function renderCalendar() {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();

    const yearSelect = document.getElementById('calendar-year-select');
    const monthSelect = document.getElementById('calendar-month-select');
    if (yearSelect && monthSelect) {
        yearSelect.value = year;
        monthSelect.value = month;
    } else {
        const titleEl = document.getElementById('calendar-title');
        if (titleEl) titleEl.textContent = `${year}${window.t('ui.stats.year')} ${monthNames()[month]}`;
    }

    // Ensure holidays are loaded for this year (now fetches directly, no callback needed)
    try {
        await ensureGovtHolidays(year);
    } catch (err) {
        console.warn(window.t('logs.calendar.loadHolidaysFail'), err);
    }


    const grid = document.getElementById('calendar-grid');
    grid.innerHTML = '';
    closeDayDetail();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const startOffset = firstDay.getDay(); // 0 (Sun) to 6 (Sat)
    const endOffset = 6 - lastDay.getDay();

    const totalDays = startOffset + lastDay.getDate() + endOffset;

    let currentDate = new Date(year, month, 1 - startOffset);
    const todayStr = getLocalDateString(new Date());

    // Group transactions by date string YYYY-MM-DD
    const txByDate = {};
    const selectedIds = window.selectedAccountIds || [];
    for (const tx of currentState.transactions) {
        const txAccountId = String(tx.accountId || 'account_default');
        if (selectedIds.length > 0 && !selectedIds.includes(txAccountId)) continue;

        if (!txByDate[tx.date]) txByDate[tx.date] = { expense: 0, income: 0, list: [] };
        txByDate[tx.date].list.push(tx);
        if (tx.type === 'expense') txByDate[tx.date].expense++;
        else if (tx.type === 'income') txByDate[tx.date].income++;
    }

    for (let i = 0; i < totalDays; i++) {
        const d = currentDate.getDate();
        const m = currentDate.getMonth();
        const y = currentDate.getFullYear();

        const dateStr = getLocalDateString(currentDate);
        const isCurrentMonth = m === month;
        const isToday = dateStr === todayStr;

        const lunarInfo = gregorianToLunar(y, m + 1, d);
        const txData = txByDate[dateStr];

        const cell = document.createElement('div');
        cell.className = `calendar-cell ${isCurrentMonth ? '' : 'other-month'} ${isToday ? 'today' : ''}`;
        cell.dataset.date = dateStr;

        // Date Number
        const dateNum = document.createElement('div');
        dateNum.className = 'cal-gregorian';
        if (lunarInfo.isNationalHoliday && currentSettings.nationalHoliday) {
            dateNum.classList.add('cal-holiday');
        }
        dateNum.textContent = d;
        
        // --- Check if it is an important festival ---
        let importantFestivalName = '';
        try {
            const isImportantFestivalsEnabled = localStorage.getItem('tinyledger_important_festivals_enabled') === 'true';
            if (isImportantFestivalsEnabled) {
                const festivals = JSON.parse(localStorage.getItem('tinyledger_important_festivals') || '[]');
                const monthDayStr = `${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                const matchedFestivals = festivals.filter(f => f.date === monthDayStr);
                if (matchedFestivals.length > 0) {
                    importantFestivalName = matchedFestivals.map(f => f.name).join(window.t('ui.record.festivalJoin'));
                    dateNum.classList.add('cal-star');
                }
            }
        } catch (err) {}
        // -------------------------

        if (txData && (txData.income > 0 || txData.expense > 0)) {
            const getAlpha = (c) => {
                if (c === 0) return 0;
                if (c === 1) return 0.2;
                if (c === 2) return 0.4;
                if (c === 3) return 0.6;
                return 0.8;
            };

            const incAlpha = getAlpha(txData.income);
            const expAlpha = getAlpha(txData.expense);

            if (txData.income > 0) dateNum.style.setProperty('--inc-alpha', incAlpha);
            if (txData.expense > 0) dateNum.style.setProperty('--exp-alpha', expAlpha);

            if (txData.income > 0 && txData.expense > 0) {
                dateNum.classList.add('heat-both');
            } else if (txData.income > 0) {
                dateNum.classList.add('heat-inc');
            } else if (txData.expense > 0) {
                dateNum.classList.add('heat-exp');
            }

            if (txData.income >= 3 || txData.expense >= 3) {
                dateNum.style.color = 'white';
            }
        } else if (importantFestivalName !== '') {
            // Important festival with no transactions, display as star with half income/expense
            dateNum.style.setProperty('--inc-alpha', 0.6);
            dateNum.style.setProperty('--exp-alpha', 0.6);
            dateNum.classList.add('heat-both');
            dateNum.style.color = 'white';
        }
        
        cell.appendChild(dateNum);

        // 1. Lunar date with month
        if (currentSettings.lunarDate) {
            const el = document.createElement('div');
            el.className = 'cal-lunar cal-lunar-date';
            el.textContent = lunarInfo.monthName + lunarInfo.dayName;
            cell.appendChild(el);
        }

        // 2. Stem-Branch (GanZhi)
        if (currentSettings.lunarStembranch) {
            const el = document.createElement('div');
            el.className = 'cal-lunar cal-lunar-date';
            el.textContent = lunarInfo.dayGanZhi;
            cell.appendChild(el);
        }

        // 3. 24 Solar Terms
        if (currentSettings.lunarSolarterm && lunarInfo.solarTerm) {
            const el = document.createElement('div');
            el.className = 'cal-lunar cal-term';
            el.textContent = lunarInfo.solarTerm;
            cell.appendChild(el);
        }

        // 4. Traditional festivals and holidays
        let displayLunarFestival = lunarInfo.lunarFestivalStr;
        let displayNational = lunarInfo.nationalHoliday;
        let displayGlobalFestival = lunarInfo.globalFestivalStr;

        if (currentSettings.lunarFestival && displayLunarFestival && currentSettings.nationalHoliday && displayNational) {
            let parts = displayLunarFestival.split(' ');
            let filteredParts = parts.filter(part => {
                let a = part.replace(/[\u53f0]/g, '\u81fa');
                let b = displayNational.replace(/[\u53f0]/g, '\u81fa');
                for (let i = 0; i < a.length - 1; i++) {
                    if (b.includes(a.substring(i, i + 2))) return false;
                }
                return true;
            });
            displayLunarFestival = filteredParts.join(' ').trim();
        }

        if (currentSettings.lunarFestival && displayLunarFestival) {
            const el = document.createElement('div');
            el.className = 'cal-lunar cal-lunar-festival';
            el.textContent = displayLunarFestival;
            cell.appendChild(el);
        }

        if (currentSettings.globalFestival && displayGlobalFestival) {
            const el = document.createElement('div');
            el.className = 'cal-lunar cal-global-festival';
            el.textContent = displayGlobalFestival;
            cell.appendChild(el);
        }
        
        if (currentSettings.calendarValentine) {
            const valentineFest = getGlobalValentineFestival(m + 1, d);
            if (valentineFest) {
                const el = document.createElement('div');
                el.className = 'cal-lunar cal-valentine-festival';
                el.textContent = valentineFest;
                cell.appendChild(el);
            }
        }

        if (currentSettings.nationalHoliday && displayNational) {
            const el = document.createElement('div');
            el.className = 'cal-lunar cal-national-holiday';
            el.textContent = displayNational;
            cell.appendChild(el);
        }

        // Click to show details
        cell.addEventListener('click', () => {
            document.querySelectorAll('.calendar-cell').forEach(c => c.classList.remove('selected'));
            cell.classList.add('selected');
            showDayDetail(dateStr, lunarInfo, txData ? txData.list : [], importantFestivalName);
        });

        grid.appendChild(cell);

        // Next day
        currentDate.setDate(currentDate.getDate() + 1);
    }
}

function showDayDetail(dateStr, lunarInfo, transactions, importantFestivalName = '') {
    const detailPanel = document.getElementById('calendar-day-detail');
    detailPanel.style.display = 'flex';
    
    // Smooth scroll to the detail block
    setTimeout(() => {
        detailPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 50);

    document.getElementById('day-detail-date').textContent = `${dateStr} ${window.t('ui.calendar.recordOf')}`;

    // Render Messages (Lunar, Solar Terms, Festivals)
    let msgContainer = document.getElementById('day-detail-messages');
    const baziContainer = document.getElementById('day-detail-bazi');
    if (!msgContainer) {
        msgContainer = document.createElement('div');
        msgContainer.id = 'day-detail-messages';
        msgContainer.style.marginBottom = '12px';
        msgContainer.style.textAlign = 'center';
        msgContainer.style.lineHeight = '1.6';
        baziContainer.parentNode.insertBefore(msgContainer, baziContainer);
    }
    msgContainer.innerHTML = '';
    const topMessages = [];
    const bottomMessages = [];
    
    if (currentSettings.lunarDate) {
        topMessages.push(`<span style="color: var(--text-color); font-weight: bold;">${lunarInfo.monthName}${lunarInfo.dayName}</span>`);
    }
    if (currentSettings.lunarStembranch) {
        topMessages.push(`<span style="color: var(--text-muted);">${lunarInfo.dayGanZhi} Day</span>`);
    }
    if (currentSettings.lunarSolarterm && lunarInfo.solarTerm) {
        bottomMessages.push(`<span style="color: #10b981; font-weight: bold;">${lunarInfo.solarTerm}</span>`);
    }
    
    let displayLunarFestival = lunarInfo.lunarFestivalStr;
    let displayGlobalFestival = lunarInfo.globalFestivalStr;
    let displayNational = lunarInfo.nationalHoliday;
    
    if (currentSettings.lunarFestival && displayLunarFestival && currentSettings.nationalHoliday && displayNational) {
        let parts = displayLunarFestival.split(' ');
        let filteredParts = parts.filter(part => {
            let a = part.replace(/[\u53f0]/g, '\u81fa');
            let b = displayNational.replace(/[\u53f0]/g, '\u81fa');
            for (let i = 0; i < a.length - 1; i++) {
                if (b.includes(a.substring(i, i + 2))) return false;
            }
            return true;
        });
        displayLunarFestival = filteredParts.join(' ').trim();
    }
    
    if (currentSettings.lunarFestival && displayLunarFestival) {
        bottomMessages.push(`<span style="color: #8b5cf6; font-weight: bold;">${displayLunarFestival}</span>`);
    }
    if (currentSettings.globalFestival && displayGlobalFestival) {
        bottomMessages.push(`<span style="color: #0d9488; font-weight: bold;">${displayGlobalFestival}</span>`);
    }
    if (currentSettings.nationalHoliday && displayNational) {
        bottomMessages.push(`<span style="color: #ef4444; font-weight: bold;">${displayNational}</span>`);
    }

    let finalHtml = '';
    const separator = ' <span style="color:var(--border-color); margin: 0 4px;">|</span> ';
    if (topMessages.length > 0) {
        finalHtml += `<div>${topMessages.join(separator)}</div>`;
    }
    if (bottomMessages.length > 0) {
        finalHtml += `<div style="margin-top: 4px;">${bottomMessages.join(separator)}</div>`;
    }
    
    if (finalHtml !== '') {
        msgContainer.innerHTML = finalHtml;
        msgContainer.style.display = 'block';
    } else {
        msgContainer.style.display = 'none';
    }

    // Render BaZi
    baziContainer.innerHTML = '';

    if (lunarInfo.bazi && currentSettings.baziChart) {
        baziContainer.style.flexWrap = 'wrap';
        
        ['year', 'month', 'day'].forEach(pillar => {
            const pillarText = lunarInfo.bazi[`${pillar}Pillar`];
            if (!pillarText) return;

            const pDiv = document.createElement('div');
            pDiv.className = 'bazi-pillar';

            let label = pillar === 'year' ? window.t('ui.calendar.baziYearPillar') : pillar === 'month' ? window.t('ui.calendar.baziMonthPillar') : window.t('ui.calendar.baziDayPillar');

            const tenGod = lunarInfo.bazi[`${pillar}TenGod`];
            const hiddenStems = lunarInfo.bazi[`${pillar}Hidden`] || [];
            const nayin = lunarInfo.bazi[`${pillar}Nayin`];

            pDiv.innerHTML = `
                <div class="bazi-title">${label}</div>
                <div class="bazi-ganzhi">${pillarText}</div>
                <div class="bazi-shishen">${tenGod || window.t('ui.calendar.baziDayMaster')}</div>
                <div class="bazi-canggan">${hiddenStems.join('')}</div>
                <div class="bazi-nayin">${nayin}</div>
            `;
            baziContainer.appendChild(pDiv);
        });

        const noteDiv = document.createElement('div');
        noteDiv.style = "width: 100%; font-size: 0.75rem; color: var(--text-muted); text-align: center; margin-top: 4px;";
        noteDiv.textContent = window.t('ui.calendar.baziNote');
        
        if (importantFestivalName) {
            const festDiv = document.createElement('div');
            festDiv.style = "width: 100%; text-align: center; margin-top: -12px; margin-bottom: -16px;";
            festDiv.innerHTML = `<span style="background-color: var(--surface-color); padding: 8px 16px; border-radius: 16px; color: #f59e0b; font-weight: bold; font-size: 1.25rem; border: 1px solid var(--border-color); display: inline-block;">⭐ ${importantFestivalName}</span>`;
            baziContainer.appendChild(festDiv);
        }
        
        baziContainer.appendChild(noteDiv);
    } else {
        if (importantFestivalName) {
            const festDiv = document.createElement('div');
            // When baziChart is disabled, there are no pillars above it. We still need to counteract the flex gap with noteDiv.
            festDiv.style = "width: 100%; text-align: center; margin-top: 0px; margin-bottom: -16px;";
            festDiv.innerHTML = `<span style="background-color: var(--surface-color); padding: 8px 16px; border-radius: 16px; color: #f59e0b; font-weight: bold; font-size: 1.25rem; border: 1px solid var(--border-color); display: inline-block;">⭐ ${importantFestivalName}</span>`;
            baziContainer.appendChild(festDiv);
        }
    }

    // Render Transactions
    const recordsContainer = document.getElementById('day-detail-records');
    recordsContainer.innerHTML = '';

    if (!transactions || transactions.length === 0) {
        recordsContainer.innerHTML = `<div style="text-align:center; color: var(--text-muted); padding: 16px;">${window.t('ui.calendar.noRecord')}</div>`;
    } else {
        transactions.forEach(tx => {
            const isExpense = tx.type === 'expense';
            const item = document.createElement('div');
            item.className = `cal-record-item ${tx.type}`;
            item.innerHTML = `
                <div style="display:flex; flex-direction: column;">
                    <span style="font-weight: bold;">${window.getCategoryName ? window.getCategoryName(tx.majorCategory) : tx.majorCategory} / ${tx.subCategory ? (window.getSubCategoryName ? window.getSubCategoryName(tx.subCategory) : tx.subCategory) : ''}</span>
                    <span style="font-size: 0.85rem; color: var(--text-muted);">${tx.payee ? (window.getTargetName ? window.getTargetName(tx.payee) : tx.payee) : ''}${tx.note ? ' - ' + tx.note : ''}</span>
                </div>
                <div class="amount" style="font-weight: bold;">${isExpense ? '-' : ''}${tx.amount}</div>
            `;
            recordsContainer.appendChild(item);
        });
    }
}

function closeDayDetail() {
    document.getElementById('calendar-day-detail').style.display = 'none';
    document.querySelectorAll('.calendar-cell').forEach(c => c.classList.remove('selected'));
}

function getLocalDateString(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}
