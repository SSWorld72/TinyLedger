import { drawPieChart, drawLineChart } from '../../utils/js/charts.js';
// import { formatNumber } from '../../utils/js/dataStorage.js';

const COLORS = [
    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
    '#FF9F40', '#C9CBCF', '#7BC043', '#F37735', '#00ADB5',
    '#E83E8C', '#6610F2', '#20C997', '#FD7E14', '#6F42C1',
];

// Helper: Format amount with signs properly
function formatNum(num) {
    return Math.round(num).toLocaleString('en-US');
}

// ---------------------------------------------------------------------------
// 多系列長條圖轉接器 (Adapter)
// ---------------------------------------------------------------------------
// 保留原本的函式簽名 drawMultiSeriesBarChart(containerId, series, colorClass)，
// 讓所有呼叫端不需要修改。
// 內部將 series 資料格式轉換為 drawLineChart 所需的格式，
// 並透過 type: 'bar' 選項，讓 charts.js 的共用渲染引擎以長條圖方式呈現。
// 如此一來，長條圖與折線圖共用同一套 Y 軸計算、格線、Tooltip、圖例。
// ---------------------------------------------------------------------------
function drawMultiSeriesBarChart(containerId, series, colorClass) {
    // 資料防護：無資料時顯示空狀態
    if (!series || series.total === 0 || series.buckets.length === 0) {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = '<div style="padding:40px 0; text-align:center; color:var(--text-muted); font-size:0.9rem;">尚無資料</div>';
        }
        return;
    }

    // 將 series 格式（buckets/categories/values）轉換為 drawLineChart 格式（[{ label, values }]）
    const lineData = series.buckets.map((bucket, bucketIndex) => {
        const values = series.categories.map(cat =>
            (series.values[cat] && series.values[cat][bucketIndex]) || 0
        );
        return { label: bucket, values };
    });

    // 將類別名稱與顏色對應為 series 選項
    const seriesOptions = series.categories.map((cat, ci) => ({
        name: cat, color: COLORS[ci % COLORS.length]
    }));

    // 轉呼叫共用圖表引擎，以 type: 'bar' 渲染為長條圖
    drawLineChart(containerId, lineData, { series: seriesOptions, type: 'bar' });
}

// ---------------------------------------------------------------------------
// Main Stats View Component
// ---------------------------------------------------------------------------

let currentState = {
    chartType: 'pie',
    period: 'month',
    trendYear: new Date().getFullYear(),
    groupBy: 'major',
    xGranularity: 'day',
    customStart: '',
    customEnd: '',
    dataType: 'expense'
};

let dbRef = null;
let stateRef = null;

export function setupStatsView(state, db) {
    dbRef = db;
    stateRef = state;
    
    // Bind Tab Buttons
    document.querySelectorAll('.stats-tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.stats-tab-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentState.chartType = e.target.dataset.type;
            renderStats();
        });
    });
    
    // Bind Period Buttons
    document.querySelectorAll('.stats-period-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.stats-period-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentState.period = e.target.dataset.period;
            renderStats();
        });
    });
    
    // Bind Group By Buttons
    document.querySelectorAll('.stats-group-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.stats-group-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentState.groupBy = e.target.dataset.groupby;
            renderStats();
        });
    });

    // Bind Data Type (Income/Expense) Buttons
    document.querySelectorAll('.stats-type-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.stats-type-btn').forEach(b => {
                b.classList.remove('active', 'btn-primary');
                b.classList.add('btn-outline');
            });
            e.target.classList.add('active', 'btn-primary');
            e.target.classList.remove('btn-outline');
            currentState.dataType = e.target.dataset.type;
            renderStats();
        });
    });
    
    // Bind X Granularity
    document.querySelectorAll('.stats-x-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.stats-x-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentState.xGranularity = e.target.dataset.x;
            renderStats();
        });
    });
    
    // Bind Custom Range
    const startInput = document.getElementById('stats-start-date');
    const endInput = document.getElementById('stats-end-date');
    startInput.addEventListener('change', (e) => { currentState.customStart = e.target.value; renderStats(); });
    endInput.addEventListener('change', (e) => { currentState.customEnd = e.target.value; renderStats(); });
    
    // Bind Annual Year
    const yearSelect = document.getElementById('stats-annual-year');
    yearSelect.addEventListener('change', (e) => { currentState.trendYear = parseInt(e.target.value, 10); renderStats(); });
}

function getPeriodRange() {
    const now = new Date();
    if (currentState.period === 'custom') {
        return { start: currentState.customStart || '0000-01-01', end: currentState.customEnd || now.toISOString().slice(0, 10) };
    }
    const end = now.toISOString().slice(0, 10);
    if (currentState.period === 'all') return { start: '0000-01-01', end };
    if (currentState.period === 'year') return { start: `${now.getFullYear()}-01-01`, end };
    if (currentState.period === 'month') {
        const m = String(now.getMonth() + 1).padStart(2, '0');
        return { start: `${now.getFullYear()}-${m}-01`, end };
    }
    const day = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
    return { start: monday.toISOString().slice(0, 10), end };
}

function computeSlices(data, groupBy) {
    const groups = new Map();
    let total = 0;
    for (const item of data) {
        let key = '';
        if (groupBy === 'major') key = item.majorCategory || '(未分類)';
        else if (groupBy === 'sub') key = item.subCategory || item.majorCategory || '(未分類)';
        else key = item.payee || '(未指定)';
        const amt = item.amount || 0;
        groups.set(key, (groups.get(key) || 0) + amt);
        total += amt;
    }
    const entries = [...groups.entries()].sort((a, b) => b[1] - a[1]);
    const slices = entries.map(([label, value], i) => ({
        label, value, color: COLORS[i % COLORS.length],
    }));
    return { slices, total };
}

function computeCategorizedSeries(data, groupBy, xGranularity, start, end) {
    const buckets = [];
    const bucketMap = new Map();
    const allCats = new Map();

    for (const item of data) {
        if (!item.date) continue;
        if (item.date < start || item.date > end) continue;

        let bucket;
        if (xGranularity === 'month') {
            const m = parseInt(item.date.slice(5, 7), 10);
            const y = parseInt(item.date.slice(0, 4), 10);
            bucket = `${y}/${m}月`;
        } else {
            const y = parseInt(item.date.slice(0, 4), 10);
            const m = parseInt(item.date.slice(5, 7), 10);
            const d = parseInt(item.date.slice(8, 10), 10);
            bucket = `${y}/${m}/${d}`;
        }

        let cat = '';
        if (groupBy === 'major') cat = item.majorCategory || '(未分類)';
        else if (groupBy === 'sub') cat = item.subCategory || item.majorCategory || '(未分類)';
        else cat = item.payee || '(未指定)';

        if (!bucketMap.has(bucket)) bucketMap.set(bucket, new Map());
        const catMap = bucketMap.get(bucket);
        catMap.set(cat, (catMap.get(cat) || 0) + (item.amount || 0));
        allCats.set(cat, (allCats.get(cat) || 0) + (item.amount || 0));
    }

    if (xGranularity === 'month') {
        const keys = [...bucketMap.keys()].sort((a, b) => {
            const [ay, am] = a.replace('月','').split('/').map(Number);
            const [by, bm] = b.replace('月','').split('/').map(Number);
            return ay !== by ? ay - by : am - bm;
        });
        buckets.push(...keys);
    } else {
        const keys = [...bucketMap.keys()].sort((a, b) => {
            const [ay, am, ad] = a.split('/').map(Number);
            const [by, bm, bd] = b.split('/').map(Number);
            return ay !== by ? ay - by : (am !== bm ? am - bm : ad - bd);
        });
        buckets.push(...keys);
    }

    if (buckets.length === 0) return { buckets: [], categories: [], values: {}, total: 0 };

    const topCats = [...allCats.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k]) => k);
    const total = [...allCats.values()].reduce((s, v) => s + v, 0);

    const values = {};
    for (const cat of topCats) {
        values[cat] = buckets.map(b => bucketMap.get(b)?.get(cat) || 0);
    }

    return { buckets, categories: topCats, values, total };
}

export function renderStats() {
    if (!stateRef || !stateRef.transactions) return;
    
    // Toggle UI controls based on chartType
    const isAnnual = currentState.chartType === 'annual';
    const isTimeline = currentState.chartType === 'bar' || currentState.chartType === 'line';
    
    document.getElementById('stats-filter-period').style.display = isAnnual ? 'none' : 'flex';
    document.getElementById('stats-custom-range').style.display = (!isAnnual && currentState.period === 'custom') ? 'flex' : 'none';
    document.getElementById('stats-filter-groupby').style.display = isAnnual ? 'none' : 'flex';
    document.getElementById('stats-filter-x-axis').style.display = isTimeline ? 'flex' : 'none';
    document.getElementById('stats-filter-year').style.display = isAnnual ? 'flex' : 'none';
    
    const rangeDisplay = document.getElementById('stats-range-display');
    const { start, end } = getPeriodRange();
    if (!isAnnual && currentState.period !== 'custom') {
        rangeDisplay.textContent = `${start} ～ ${end}`;
        rangeDisplay.style.display = 'block';
    } else {
        rangeDisplay.style.display = 'none';
    }

    const contentContainer = document.getElementById('stats-view-content');
    contentContainer.innerHTML = ''; // Clear old content
    
    const allItems = stateRef.transactions;
    
    // Populate available years for annual view
    if (isAnnual) {
        const years = new Set();
        years.add(new Date().getFullYear());
        allItems.forEach(item => {
            if (item.date) years.add(parseInt(item.date.slice(0, 4), 10));
        });
        const sortedYears = [...years].sort((a, b) => b - a);
        const yearSelect = document.getElementById('stats-annual-year');
        if (yearSelect.options.length !== sortedYears.length) {
            yearSelect.innerHTML = sortedYears.map(y => `<option value="${y}">${y} 年</option>`).join('');
            yearSelect.value = currentState.trendYear;
        }
    }
    
    // ----------------------------------------------------
    // SHARED CHART SECTION RENDERER (MODULARIZED)
    // ----------------------------------------------------
    const renderChartSection = (title, colorClass, containerId, data, series = null) => {
        const wrapper = document.createElement('div');
        wrapper.style.marginBottom = '32px';
        
        const titleEl = document.createElement('h3');
        const totalNum = currentState.chartType === 'pie' ? data.total : series.total;
        titleEl.textContent = `${title}：${formatNum(totalNum)}`;
        titleEl.className = colorClass;
        titleEl.style.marginBottom = '8px';
        titleEl.style.fontSize = '1.1rem';
        wrapper.appendChild(titleEl);
        
        const noData = currentState.chartType === 'pie' ? data.total === 0 : (series.total === 0 || series.buckets.length === 0);
        
        if (noData) {
            wrapper.innerHTML += '<div style="padding:40px 0; text-align:center; color:var(--text-muted); font-size:0.9rem;">尚無資料</div>';
        } else {
            let layout = wrapper;
            if (currentState.chartType === 'pie') {
                layout = document.createElement('div');
                layout.style.display = 'flex';
                layout.style.flexDirection = 'column';
                layout.style.gap = '8px'; // 縮小間距
                layout.style.alignItems = 'center';
                wrapper.appendChild(layout);
            }
            
            // Chart Box
            const chartBox = document.createElement('div');
            chartBox.id = containerId;
            chartBox.style.width = '100%';
            chartBox.style.margin = '0 auto';
            if (currentState.chartType === 'pie') {
                chartBox.style.maxWidth = '450px'; // 限制最大寬度，避免電腦版圖表過大
                // 不設定高度，讓 SVG 自動按比例撐開
            } else {
                chartBox.style.maxWidth = '1000px';
                chartBox.style.height = '360px';
            }
            layout.appendChild(chartBox);
            // ★ 關鍵修復：必須先將 wrapper 加到網頁上，圖表庫才能透過 getElementById 找到這個容器！
            contentContainer.appendChild(wrapper);
            
            // Now we can safely draw charts because the container is in the DOM
            if (currentState.chartType === 'bar') {
                drawMultiSeriesBarChart(containerId, series, colorClass);
            } else if (currentState.chartType === 'line') {
                const lineData = series.buckets.map((b, bi) => {
                    const values = series.categories.map(cat => (series.values[cat] && series.values[cat][bi]) || 0);
                    return { label: b, values };
                });
                const seriesOptions = series.categories.map((cat, ci) => ({
                    name: cat, color: COLORS[ci % COLORS.length]
                }));
                drawLineChart(containerId, lineData, { series: seriesOptions, smooth: true, fill: false });
            }
            
            // Detailed Table Box
            const tableBox = document.createElement('div');
            tableBox.style.width = '100%';
            if (currentState.chartType !== 'pie') {
                tableBox.style.maxWidth = '1000px';
                tableBox.style.margin = '24px auto 0 auto';
            }
            
            let tableHTML = `
                <table style="width:100%; border-collapse: collapse; font-size: 0.85rem;">
                    <thead>
                        <tr style="border-bottom: 2px solid var(--border-color);">
                            <th style="text-align:left; padding:4px 8px;">${currentState.groupBy === 'major' ? '大類' : (currentState.groupBy === 'sub' ? '小類' : '對象')}</th>
                            <th style="text-align:right; padding:4px 8px;">金額</th>
                            <th style="text-align:right; padding:4px 8px;">佔比</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            
            data.slices.forEach(s => {
                tableHTML += `
                    <tr style="border-bottom: 1px solid var(--border-color);">
                        <td style="padding:4px 8px; display:flex; align-items:center; gap:6px;">
                            <span style="width:10px; height:10px; border-radius:2px; background:${s.color}; display:inline-block;"></span>
                            ${s.label}
                        </td>
                        <td style="text-align:right; padding:4px 8px; font-weight:500;">${formatNum(s.value)}</td>
                        <td style="text-align:right; padding:4px 8px; color:var(--text-muted);">${((s.value / data.total) * 100).toFixed(1)}%</td>
                    </tr>
                `;
            });
            
            tableHTML += `
                    </tbody>
                    <tfoot>
                        <tr style="border-top: 2px solid var(--border-color); font-weight:bold;">
                            <td style="padding:4px 8px;">合計</td>
                            <td style="text-align:right; padding:4px 8px;">${formatNum(data.total)}</td>
                            <td style="text-align:right; padding:4px 8px;">100%</td>
                        </tr>
                    </tfoot>
                </table>
            `;
            
            tableBox.innerHTML = tableHTML;
            layout.appendChild(tableBox);
            
            // Post-render step for pie chart
            if (currentState.chartType === 'pie') {
                // 產生一般圓餅圖，不額外加入文字
                drawPieChart(containerId, data.slices, {});
            }
        }
    };

    // ----------------------------------------------------
    // PIE CHART VIEW
    // ----------------------------------------------------
    if (currentState.chartType === 'pie') {
        const filtered = allItems.filter(item => item.date && item.date >= start && item.date <= end);
        const targetFiltered = filtered.filter(i => i.type === currentState.dataType);
        const targetData = computeSlices(targetFiltered, currentState.groupBy);
        
        const title = currentState.dataType === 'income' ? '收入' : '支出';
        const colorClass = currentState.dataType === 'income' ? 'text-income' : 'text-expense';
        renderChartSection(title, colorClass, `pie-chart-${currentState.dataType}`, targetData);
    }
    
    // ----------------------------------------------------
    // TIMELINE (BAR / LINE) CHART VIEW
    // ----------------------------------------------------
    else if (isTimeline) {
        const filtered = allItems.filter(item => item.date && item.date >= start && item.date <= end);
        const targetFiltered = filtered.filter(i => i.type === currentState.dataType);
        
        const targetSeries = computeCategorizedSeries(targetFiltered, currentState.groupBy, currentState.xGranularity, start, end);
        const targetData = computeSlices(targetFiltered, currentState.groupBy);
        
        const title = currentState.dataType === 'income' ? '收入' : '支出';
        const colorClass = currentState.dataType === 'income' ? 'text-income' : 'text-expense';
        renderChartSection(title, colorClass, `trend-chart-${currentState.dataType}`, targetData, targetSeries);
    }
    
    // ----------------------------------------------------
    // ANNUAL REPORT VIEW
    // ----------------------------------------------------
    else if (isAnnual) {
        const yearItems = allItems.filter(item => item.date && item.date.startsWith(`${currentState.trendYear}-`));
        
        if (yearItems.length === 0) {
            contentContainer.innerHTML = `<div style="padding:80px 0; text-align:center; color:var(--text-muted);">${currentState.trendYear} 年尚無記錄</div>`;
            return;
        }
        
        const totalIncome = yearItems.filter(i => i.type === 'income').reduce((s, i) => s + (i.amount || 0), 0);
        const totalExpense = yearItems.filter(i => i.type === 'expense').reduce((s, i) => s + (i.amount || 0), 0);
        const balance = totalIncome - totalExpense;
        
        const catMap = new Map();
        for (const item of yearItems) {
            if (item.type !== 'expense') continue;
            const key = item.majorCategory || '(未分類)';
            catMap.set(key, (catMap.get(key) || 0) + (item.amount || 0));
        }
        const topCats = [...catMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
        
        const monthTable = Array.from({ length: 12 }, (_, i) => {
            const key = `${currentState.trendYear}-${String(i + 1).padStart(2, '0')}`;
            const mItems = yearItems.filter(t => t.date && t.date.startsWith(key));
            const inc = mItems.filter(t => t.type === 'income').reduce((s, t) => s + (t.amount || 0), 0);
            const exp = mItems.filter(t => t.type === 'expense').reduce((s, t) => s + (t.amount || 0), 0);
            return { month: `${i + 1}月`, income: inc, expense: exp, balance: inc - exp };
        });
        
        let html = `
            <!-- Summary Cards -->
            <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:12px; margin-bottom:24px;">
                <div style="background:var(--income-bg, #eff6ff); border:1px solid #bfdbfe; border-radius:12px; padding:16px; text-align:center;">
                    <div style="font-size:0.8rem; color:var(--text-muted); margin-bottom:4px;">總收入</div>
                    <div style="font-size:1.2rem; font-weight:bold;" class="text-income">${formatNum(totalIncome)}</div>
                </div>
                <div style="background:var(--expense-bg, #fef2f2); border:1px solid #fecaca; border-radius:12px; padding:16px; text-align:center;">
                    <div style="font-size:0.8rem; color:var(--text-muted); margin-bottom:4px;">總支出</div>
                    <div style="font-size:1.2rem; font-weight:bold;" class="text-expense">${formatNum(totalExpense)}</div>
                </div>
                <div style="background:${balance >= 0 ? '#f0fdf4' : '#fef2f2'}; border:1px solid ${balance >= 0 ? '#bbf7d0' : '#fecaca'}; border-radius:12px; padding:16px; text-align:center;">
                    <div style="font-size:0.8rem; color:var(--text-muted); margin-bottom:4px;">結餘</div>
                    <div style="font-size:1.2rem; font-weight:bold;" class="${balance >= 0 ? 'text-income' : 'text-expense'}">${balance > 0 ? '+' : ''}${formatNum(balance)}</div>
                </div>
            </div>
            
            <!-- Monthly Table -->
            <h3 style="font-size:1rem; margin-bottom:12px;">各月明細</h3>
            <div style="overflow-x:auto; margin-bottom:32px;">
                <table style="width:100%; border-collapse: collapse; font-size: 0.85rem;">
                    <thead>
                        <tr style="border-bottom: 2px solid var(--border-color);">
                            <th style="text-align:left; padding:8px;">月份</th>
                            <th style="text-align:right; padding:8px;">收入</th>
                            <th style="text-align:right; padding:8px;">支出</th>
                            <th style="text-align:right; padding:8px;">結餘</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        monthTable.forEach(r => {
            const isEmpty = r.income === 0 && r.expense === 0;
            html += `
                <tr style="border-bottom: 1px solid var(--border-color); ${isEmpty ? 'opacity:0.4;' : ''}">
                    <td style="padding:8px;">${r.month}</td>
                    <td style="text-align:right; padding:8px;" class="text-income">${r.income > 0 ? formatNum(r.income) : '-'}</td>
                    <td style="text-align:right; padding:8px;" class="text-expense">${r.expense > 0 ? formatNum(r.expense) : '-'}</td>
                    <td style="text-align:right; padding:8px; font-weight:bold;" class="${r.balance >= 0 ? 'text-income' : 'text-expense'}">
                        ${isEmpty ? '-' : (r.balance > 0 ? '+' + formatNum(r.balance) : formatNum(r.balance))}
                    </td>
                </tr>
            `;
        });
        
        html += `
                    </tbody>
                </table>
            </div>
        `;
        
        // Top 5 Expenses
        if (topCats.length > 0) {
            html += `
                <h3 style="font-size:1rem; margin-bottom:16px;">前五大支出類別</h3>
                <div style="display:flex; flex-direction:column; gap:12px;">
            `;
            topCats.forEach(([cat, amt], i) => {
                const pct = totalExpense > 0 ? (amt / totalExpense) * 100 : 0;
                html += `
                    <div style="display:flex; align-items:center; gap:12px; font-size:0.85rem;">
                        <span style="width:24px; text-align:right; color:var(--text-muted);">${i + 1}.</span>
                        <span style="flex:1;">${cat}</span>
                        <span style="width:48px; text-align:right; color:var(--text-muted);">${pct.toFixed(1)}%</span>
                        <span style="width:72px; text-align:right; font-weight:500;">${formatNum(amt)}</span>
                        <div style="width:100px; height:6px; border-radius:3px; background:var(--bg-color); overflow:hidden;">
                            <div style="height:100%; border-radius:3px; background:${COLORS[i % COLORS.length]}; width:${Math.min(pct, 100)}%;"></div>
                        </div>
                    </div>
                `;
            });
            html += `</div>`;
        }
        
        contentContainer.innerHTML = html;
    }
}