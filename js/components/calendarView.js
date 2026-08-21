import { gregorianToLunar, ensureGovtHolidays, getNationalHoliday, getLunarFestival, loadPersistedHolidays, getValentineFestival } from '../../utils/js/lunarCalendar.js';

let currentState;
let currentDb;
let calendarDate = new Date(); // Defines the currently viewed month
let currentSettings = { lunarDate: true, lunarStembranch: true, lunarSolarterm: true, lunarFestival: true, nationalHoliday: true, baziChart: true, calendarValentine: false };
const monthNames = ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"];
const NUMBER_TO_CHINESE = ["初一", "初二", "初三", "初四", "初五", "初六", "初七", "初八", "初九", "初十", "十一", "十二", "十三", "十四", "十五", "十六", "十七", "十八", "十九", "二十", "廿一", "廿二", "廿三", "廿四", "廿五", "廿六", "廿七", "廿八", "廿九", "三十"];
const CHINESE_MONTHS = ["正", "二", "三", "四", "五", "六", "七", "八", "九", "十", "十一", "腊"];

function formatLunarDay(lunarInfo) {
    if (lunarInfo.day === 1) {
        return (lunarInfo.isLeap ? "閏" : "") + CHINESE_MONTHS[lunarInfo.month - 1] + "月";
    }
    return NUMBER_TO_CHINESE[lunarInfo.day - 1];
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

    // 從 localStorage 載入已持久化的國定假日資料
    loadPersistedHolidays();

    loadCalendarSettings();
    window.addEventListener('calendarSettingsChanged', () => {
        loadCalendarSettings();
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
            option.textContent = `${y}年`;
            yearSelect.appendChild(option);
        }
        monthSelect.innerHTML = '';
        monthNames.forEach((m, idx) => {
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
        if (titleEl) titleEl.textContent = `${year}年 ${monthNames[month]}`;
    }

    // Ensure holidays are loaded for this year (now fetches directly, no callback needed)
    try {
        await ensureGovtHolidays(year);
    } catch (err) {
        console.warn('無法載入該年度國定假日資料，繼續渲染基本日曆:', err);
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
    for (const tx of currentState.transactions) {
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
        
        // --- 檢查是否為重要節日 ---
        let importantFestivalName = '';
        try {
            const isImportantFestivalsEnabled = localStorage.getItem('tinyledger_important_festivals_enabled') === 'true';
            if (isImportantFestivalsEnabled) {
                const festivals = JSON.parse(localStorage.getItem('tinyledger_important_festivals') || '[]');
                const monthDayStr = `${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                const matchedFestivals = festivals.filter(f => f.date === monthDayStr);
                if (matchedFestivals.length > 0) {
                    importantFestivalName = matchedFestivals.map(f => f.name).join('、');
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
            // 該日為重要節日且無交易紀錄，依需求顯示為「星星符號，同時也是收入和支出各一半」
            dateNum.style.setProperty('--inc-alpha', 0.6);
            dateNum.style.setProperty('--exp-alpha', 0.6);
            dateNum.classList.add('heat-both');
            dateNum.style.color = 'white';
        }
        
        cell.appendChild(dateNum);

        // 1. 農曆日期 加上月份
        if (currentSettings.lunarDate) {
            const el = document.createElement('div');
            el.className = 'cal-lunar cal-lunar-date';
            el.textContent = lunarInfo.monthName + lunarInfo.dayName;
            cell.appendChild(el);
        }

        // 2. 天干地支
        if (currentSettings.lunarStembranch) {
            const el = document.createElement('div');
            el.className = 'cal-lunar cal-lunar-date';
            el.textContent = lunarInfo.dayGanZhi;
            cell.appendChild(el);
        }

        // 3. 24節氣
        if (currentSettings.lunarSolarterm && lunarInfo.solarTerm) {
            const el = document.createElement('div');
            el.className = 'cal-lunar cal-term';
            el.textContent = lunarInfo.solarTerm;
            cell.appendChild(el);
        }

        // 4. 傳統節慶假日
        let displayFestival = lunarInfo.festival;
        let displayNational = lunarInfo.nationalHoliday;

        if (currentSettings.lunarFestival && displayFestival && currentSettings.nationalHoliday && displayNational) {
            let parts = displayFestival.split(' ');
            let filteredParts = parts.filter(part => {
                let a = part.replace(/台/g, '臺');
                let b = displayNational.replace(/台/g, '臺');
                for (let i = 0; i < a.length - 1; i++) {
                    if (b.includes(a.substring(i, i + 2))) return false;
                }
                return true;
            });
            displayFestival = filteredParts.join(' ').trim();
        }

        if (currentSettings.lunarFestival && displayFestival) {
            const el = document.createElement('div');
            el.className = 'cal-lunar cal-lunar-festival';
            el.textContent = displayFestival;
            cell.appendChild(el);
        }
        
        if (currentSettings.calendarValentine) {
            const valentineFest = getValentineFestival(m + 1, d);
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

    document.getElementById('day-detail-date').textContent = `${dateStr} 的紀錄`;

    // Render Messages (農曆、節氣、節慶)
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
        topMessages.push(`<span style="color: var(--text-muted);">${lunarInfo.dayGanZhi}日</span>`);
    }
    if (currentSettings.lunarSolarterm && lunarInfo.solarTerm) {
        bottomMessages.push(`<span style="color: #10b981; font-weight: bold;">${lunarInfo.solarTerm}</span>`);
    }
    
    let displayFestival = lunarInfo.festival;
    let displayNational = lunarInfo.nationalHoliday;
    
    if (currentSettings.lunarFestival && displayFestival && currentSettings.nationalHoliday && displayNational) {
        let parts = displayFestival.split(' ');
        let filteredParts = parts.filter(part => {
            let a = part.replace(/台/g, '臺');
            let b = displayNational.replace(/台/g, '臺');
            for (let i = 0; i < a.length - 1; i++) {
                if (b.includes(a.substring(i, i + 2))) return false;
            }
            return true;
        });
        displayFestival = filteredParts.join(' ').trim();
    }
    
    if (currentSettings.lunarFestival && displayFestival) {
        bottomMessages.push(`<span style="color: #8b5cf6; font-weight: bold;">${displayFestival}</span>`);
    }
    if (currentSettings.nationalHoliday && displayNational) {
        bottomMessages.push(`<span style="color: #ef4444; font-weight: bold;">${displayNational}</span>`);
    }
    if (importantFestivalName) {
        bottomMessages.push(`<span style="color: #f59e0b; font-weight: bold;">⭐ ${importantFestivalName}</span>`);
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

            let label = pillar === 'year' ? '年柱' : pillar === 'month' ? '月柱' : '日柱';

            const tenGod = lunarInfo.bazi[`${pillar}TenGod`];
            const hiddenStems = lunarInfo.bazi[`${pillar}Hidden`] || [];
            const nayin = lunarInfo.bazi[`${pillar}Nayin`];

            pDiv.innerHTML = `
                <div class="bazi-title">${label}</div>
                <div class="bazi-ganzhi">${pillarText}</div>
                <div class="bazi-shishen">${tenGod || '日主'}</div>
                <div class="bazi-canggan">${hiddenStems.join('')}</div>
                <div class="bazi-nayin">${nayin}</div>
            `;
            baziContainer.appendChild(pDiv);
        });

        const noteDiv = document.createElement('div');
        noteDiv.style = "width: 100%; font-size: 0.75rem; color: var(--text-muted); text-align: center; margin-top: 4px;";
        noteDiv.textContent = "* 輕量級排盤：節氣切換以 00:00 為界 (無精確時分)";
        baziContainer.appendChild(noteDiv);
    }

    // Render Transactions
    const recordsContainer = document.getElementById('day-detail-records');
    recordsContainer.innerHTML = '';

    if (!transactions || transactions.length === 0) {
        recordsContainer.innerHTML = '<div style="text-align:center; color: var(--text-muted); padding: 16px;">當日尚無紀錄</div>';
    } else {
        transactions.forEach(tx => {
            const isExpense = tx.type === 'expense';
            const item = document.createElement('div');
            item.className = `cal-record-item ${tx.type}`;
            item.innerHTML = `
                <div style="display:flex; flex-direction: column;">
                    <span style="font-weight: bold;">${tx.majorCategory} / ${tx.subCategory}</span>
                    <span style="font-size: 0.85rem; color: var(--text-muted);">${tx.payee || ''}${tx.note ? ' - ' + tx.note : ''}</span>
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
