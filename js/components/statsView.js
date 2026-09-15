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

// Helper: Get local YYYY-MM-DD string
function getLocalISODate(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

// Helper: Translate internal IDs
function getTranslatedLabel(label) {
    if (!label) return label;
    if (label.startsWith('cat_') || label.startsWith('custom_')) {
        // Look up custom or generic categories from state if possible
        if (stateRef && stateRef.categories) {
            const allCats = [...(stateRef.categories.expense || []), ...(stateRef.categories.income || [])];
            const cat = allCats.find(c => c.catId === label);
            if (cat) return cat.i18nKey ? window.t(cat.i18nKey) : cat.major;
        }
        // Fallback for cat_
        if (label.startsWith('cat_')) {
            const parts = label.split('_');
            return window.t(`categories.${parts[1]}.${parts[2]}`) || label;
        }
    }
    if (label.startsWith('tgt_')) {
        return window.t(`targets.${label.replace('tgt_', '')}`) || label;
    }
    if (window.getSubCategoryName) {
        return window.getSubCategoryName(label);
    }
    return window.t(label) || label;
}

// ---------------------------------------------------------------------------
// Multi-series bar chart adapter
// ---------------------------------------------------------------------------
// Retain the original function signature drawMultiSeriesBarChart(containerId, series, colorClass),
// so all callers don't need to be modified.
// Internally converts the series data format to the format required by drawLineChart,
// and uses the type: 'bar' option so charts.js renders it as a bar chart.
// This way, bar and line charts share the same Y-axis, grid, tooltip, and legend.
// ---------------------------------------------------------------------------
function drawMultiSeriesBarChart(containerId, series, colorClass) {
    if (!series || series.total === 0 || series.buckets.length === 0) {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = `<div style="padding:40px 0; text-align:center; color:var(--text-muted); font-size:0.9rem;">${window.t('ui.stats.noData')}</div>`;
        }
        return;
    }

    // Convert series format (buckets/categories/values) to drawLineChart format ([{ label, values }])
    const lineData = series.buckets.map((bucket, bucketIndex) => {
        const values = series.categories.map(cat =>
            (series.values[cat] && series.values[cat][bucketIndex]) || 0
        );
        return { label: bucket, values };
    });

    // Map category names and colors to series options
    const seriesOptions = series.categories.map((cat, ci) => ({
        name: cat, color: COLORS[ci % COLORS.length]
    }));

    // Call shared chart engine, render as bar chart
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
    dataType: 'expense',
    periodOffset: 0,
    drillFilters: {}
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
            currentState.periodOffset = 0;
            renderStats();
        });
    });
    
    // Bind Offset Buttons
    document.querySelectorAll('.stats-offset-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            if (currentState.period === 'all' || currentState.period === 'custom') return;
            const dir = parseInt(e.currentTarget.dataset.dir, 10);
            if (!isNaN(dir)) {
                currentState.periodOffset += dir;
                console.log(`[statsView] period: ${currentState.period}, offset: ${currentState.periodOffset}, dir: ${dir}`);
                renderStats();
            }
        });
    });
    
    // Bind Group By Buttons
    document.querySelectorAll('.stats-group-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.stats-group-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentState.groupBy = e.target.dataset.groupby;
            currentState.drillFilters = {}; // Clear drill-down state
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
        return { start: currentState.customStart || '0000-01-01', end: currentState.customEnd || getLocalISODate(now) };
    }
    if (currentState.period === 'all') {
        return { start: '0000-01-01', end: getLocalISODate(now) };
    }

    const offset = currentState.periodOffset || 0;
    const targetDate = new Date();

    if (currentState.period === 'year') {
        targetDate.setFullYear(targetDate.getFullYear() + offset);
        const y = targetDate.getFullYear();
        const endDay = offset === 0 ? getLocalISODate(now) : `${y}-12-31`;
        return { start: `${y}-01-01`, end: endDay };
    }
    if (currentState.period === 'month') {
        targetDate.setMonth(targetDate.getMonth() + offset);
        const y = targetDate.getFullYear();
        const m = String(targetDate.getMonth() + 1).padStart(2, '0');
        const lastDayObj = new Date(y, targetDate.getMonth() + 1, 0);
        let endDay = offset === 0 ? getLocalISODate(now) : `${y}-${m}-${String(lastDayObj.getDate()).padStart(2, '0')}`;
        return { start: `${y}-${m}-01`, end: endDay };
    }
    if (currentState.period === 'week') {
        targetDate.setDate(targetDate.getDate() + offset * 7);
        const day = targetDate.getDay();
        const monday = new Date(targetDate);
        monday.setDate(targetDate.getDate() - (day === 0 ? 6 : day - 1));
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        
        let endDay = offset === 0 ? getLocalISODate(now) : getLocalISODate(sunday);
        return { start: getLocalISODate(monday), end: endDay };
    }
}

function computeSlices(data, groupBy) {
    const groups = new Map();
    let total = 0;
    for (const item of data) {
        let key = '';
        if (groupBy === 'major') key = item.majorCategory ? getTranslatedLabel(item.majorCategory) : window.t('ui.stats.unclassified');
        else if (groupBy === 'sub') key = item.subCategory ? getTranslatedLabel(item.subCategory) : (item.majorCategory ? getTranslatedLabel(item.majorCategory) : window.t('ui.stats.unclassified'));
        else key = item.payee ? getTranslatedLabel(item.payee) : window.t('ui.stats.unspecified');
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
            bucket = `${y}/${m}${window.t('ui.stats.monthSuffix')}`;
        } else {
            const y = parseInt(item.date.slice(0, 4), 10);
            const m = parseInt(item.date.slice(5, 7), 10);
            const d = parseInt(item.date.slice(8, 10), 10);
            bucket = `${y}/${m}/${d}`;
        }

        let cat = '';
        if (groupBy === 'major') cat = item.majorCategory ? getTranslatedLabel(item.majorCategory) : window.t('ui.stats.unclassified');
        else if (groupBy === 'sub') cat = item.subCategory ? getTranslatedLabel(item.subCategory) : (item.majorCategory ? getTranslatedLabel(item.majorCategory) : window.t('ui.stats.unclassified'));
        else cat = item.payee ? getTranslatedLabel(item.payee) : window.t('ui.stats.unspecified');

        if (!bucketMap.has(bucket)) bucketMap.set(bucket, new Map());
        const catMap = bucketMap.get(bucket);
        catMap.set(cat, (catMap.get(cat) || 0) + (item.amount || 0));
        allCats.set(cat, (allCats.get(cat) || 0) + (item.amount || 0));
    }

    if (xGranularity === 'month') {
        const keys = [...bucketMap.keys()].sort((a, b) => {
            const monthSuffix = window.t('ui.stats.monthSuffix');
            const [ay, am] = a.replace(monthSuffix, '').split('/').map(Number);
            const [by, bm] = b.replace(monthSuffix, '').split('/').map(Number);
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
    
    let allItems = stateRef.transactions;

    // Account filtering
    const selectedIds = window.selectedAccountIds || [];
    if (selectedIds.length > 0) {
        allItems = allItems.filter(tx => {
            const txAccountId = String(tx.accountId || 'account_default');
            return selectedIds.includes(txAccountId);
        });
    }
    
    // Apply drill-down filters
    if (currentState.drillFilters && Object.keys(currentState.drillFilters).length > 0) {
        allItems = allItems.filter(item => {
            for (const [k, v] of Object.entries(currentState.drillFilters)) {
                let itemVal = item[k];
                if (k === 'majorCategory') {
                    itemVal = itemVal ? getTranslatedLabel(itemVal) : window.t('ui.stats.unclassified');
                } else if (k === 'subCategory') {
                    itemVal = itemVal ? getTranslatedLabel(itemVal) : (item.majorCategory ? getTranslatedLabel(item.majorCategory) : window.t('ui.stats.unclassified'));
                } else if (k === 'payee') {
                    itemVal = itemVal ? getTranslatedLabel(itemVal) : window.t('ui.stats.unspecified');
                }
                
                if (itemVal !== v) return false;
            }
            return true;
        });
    }
    
    // Unify UI update for GroupBtn to ensure consistency with currentState.groupBy
    document.querySelectorAll('.stats-group-btn').forEach(b => {
        if (b.dataset.groupby === currentState.groupBy) b.classList.add('active');
        else b.classList.remove('active');
    });

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
            yearSelect.innerHTML = sortedYears.map(y => `<option value="${y}">${y} ${window.t('ui.stats.year')}</option>`).join('');
            yearSelect.value = currentState.trendYear;
        }
    }
    
    // ----------------------------------------------------
    // SHARED CHART SECTION RENDERER (MODULARIZED)
    // ----------------------------------------------------
    const renderChartSection = (title, colorClass, containerId, data, series = null) => {
        const wrapper = document.createElement('div');
        wrapper.style.marginBottom = '32px';
        
        // Create title and drill-down breadcrumbs
        const titleRow = document.createElement('div');
        titleRow.style.display = 'flex';
        titleRow.style.justifyContent = 'space-between';
        titleRow.style.alignItems = 'center';
        titleRow.style.marginBottom = '8px';
        
        const titleContainer = document.createElement('div');
        titleContainer.style.display = 'flex';
        titleContainer.style.alignItems = 'center';
        titleContainer.style.gap = '8px';
        titleContainer.style.flexWrap = 'wrap';

        // Root title (e.g. Expense)
        const rootTitle = document.createElement('h3');
        rootTitle.textContent = title;
        rootTitle.className = colorClass;
        rootTitle.style.fontSize = '1.1rem';
        rootTitle.style.margin = '0';
        titleContainer.appendChild(rootTitle);

        const totalNum = currentState.chartType === 'pie' ? data.total : (series ? series.total : 0);
        
        // Drill-down breadcrumb buttons
        if (currentState.drillFilters && Object.keys(currentState.drillFilters).length > 0) {
            // Add [All] button
            const allBtn = document.createElement('button');
            allBtn.className = 'btn btn-outline text-xs px-2 py-1';
            allBtn.textContent = window.t('ui.list.filterAll');
            allBtn.onclick = () => {
                currentState.drillFilters = {};
                currentState.groupBy = 'major';
                renderStats();
            };
            titleContainer.appendChild(allBtn);

            const keys = ['majorCategory', 'subCategory', 'payee'];
            keys.forEach(k => {
                const val = currentState.drillFilters[k];
                if (val) {
                    const arrow = document.createElement('span');
                    arrow.textContent = '>';
                    arrow.style.color = 'var(--text-muted)';
                    arrow.style.fontSize = '0.85rem';
                    titleContainer.appendChild(arrow);

                    const btn = document.createElement('button');
                    btn.className = 'btn btn-outline text-xs px-2 py-1';
                    btn.textContent = val;
                    btn.onclick = () => {
                        // Click breadcrumb to keep current level, clear deeper filters
                        if (k === 'majorCategory') {
                            delete currentState.drillFilters.subCategory;
                            delete currentState.drillFilters.payee;
                            currentState.groupBy = 'sub';
                        } else if (k === 'subCategory') {
                            delete currentState.drillFilters.payee;
                            currentState.groupBy = 'payee';
                        } else if (k === 'payee') {
                            currentState.groupBy = 'major';
                        }
                        renderStats();
                    };
                    titleContainer.appendChild(btn);
                }
            });
        }
        
        // Total amount
        const totalSpan = document.createElement('span');
        totalSpan.textContent = `: ${formatNum(totalNum)}`;
        totalSpan.className = colorClass;
        totalSpan.style.fontSize = '1.1rem';
        totalSpan.style.fontWeight = 'bold';
        titleContainer.appendChild(totalSpan);

        titleRow.appendChild(titleContainer);
        wrapper.appendChild(titleRow);
        
        const noData = currentState.chartType === 'pie' ? data.total === 0 : (series.total === 0 || series.buckets.length === 0);
        
        if (noData) {
            wrapper.innerHTML += `<div style="padding:40px 0; text-align:center; color:var(--text-muted); font-size:0.9rem;">${window.t('ui.stats.noData')}</div>`;
            contentContainer.appendChild(wrapper);
        } else {
            let layout = wrapper;
            if (currentState.chartType === 'pie') {
                layout = document.createElement('div');
                layout.style.display = 'flex';
                layout.style.flexDirection = 'column';
                layout.style.gap = '8px'; // Reduce gap
                layout.style.alignItems = 'center';
                wrapper.appendChild(layout);
            }
            
            // Chart Box
            const chartBox = document.createElement('div');
            chartBox.id = containerId;
            chartBox.style.width = '100%';
            chartBox.style.margin = '0 auto';
            if (currentState.chartType === 'pie') {
                chartBox.style.maxWidth = '450px'; // Limit max width to avoid oversized pie charts on desktop
                // Do not set height, let SVG scale automatically
            } else {
                chartBox.style.maxWidth = '1000px';
                chartBox.style.height = '360px';
            }
            layout.appendChild(chartBox);
            
            // ★ Critical fix: wrapper must be added to the DOM first, so chart library can find it via getElementById
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
                            <th style="text-align:left; padding:4px 8px;">${currentState.groupBy === 'major' ? window.t('ui.stats.tableMajor') : (currentState.groupBy === 'sub' ? window.t('ui.stats.tableSub') : window.t('ui.stats.tableTarget'))}</th>
                            <th style="text-align:right; padding:4px 8px;">${window.t('ui.stats.tableAmount')}</th>
                            <th style="text-align:right; padding:4px 8px;">${window.t('ui.stats.tablePercent')}</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            
            data.slices.forEach(s => {
                tableHTML += `
                    <tr class="stats-legend-row" data-label="${s.label}" style="cursor:pointer; border-bottom: 1px solid var(--border-color); transition: background-color 0.2s;">
                        <td style="padding:8px; display:flex; align-items:center; gap:8px;">
                            <span style="width:12px; height:12px; border-radius:50%; background-color:${s.color}; display:inline-block;"></span>
                            <span>${s.label}</span>
                        </td>
                        <td style="text-align:right; padding:8px;">${formatNum(s.value)}</td>
                        <td style="text-align:right; padding:8px; color:var(--text-muted);">${totalNum > 0 ? ((s.value / totalNum) * 100).toFixed(1) : '0.0'}%</td>
                    </tr>
                `;
            });
            
            tableHTML += `
                    </tbody>
                    <tfoot>
                        <tr style="border-top: 2px solid var(--border-color); font-weight:bold;">
                            <td style="padding:4px 8px;">${window.t('ui.stats.tableTotal')}</td>
                            <td style="text-align:right; padding:4px 8px;">${formatNum(data.total)}</td>
                            <td style="text-align:right; padding:4px 8px;">100%</td>
                        </tr>
                    </tfoot>
                </table>
            `;
            
            tableBox.innerHTML = tableHTML;
            layout.appendChild(tableBox);
            
            // Extract drill-down shared logic
            const handleDrillDown = (label) => {
                if (currentState.groupBy === 'major') {
                    currentState.drillFilters.majorCategory = label;
                    currentState.groupBy = 'sub';
                } else if (currentState.groupBy === 'sub') {
                    currentState.drillFilters.subCategory = label;
                    currentState.groupBy = 'payee';
                } else if (currentState.groupBy === 'payee') {
                    currentState.drillFilters.payee = label;
                    currentState.groupBy = 'major';
                }
                
                // Sync GroupBtn UI above
                document.querySelectorAll('.stats-group-btn').forEach(b => {
                    if (b.dataset.groupby === currentState.groupBy) b.classList.add('active');
                    else b.classList.remove('active');
                });
                
                renderStats();
            };
            
            // Bind drill-down event (legend table)
            tableBox.querySelectorAll('.stats-legend-row').forEach(row => {
                row.addEventListener('click', (e) => handleDrillDown(e.currentTarget.dataset.label));
            });
            
            // Post-render step for pie chart
            if (currentState.chartType === 'pie') {
                // Generate normal pie chart and bind click event to the chart itself
                drawPieChart(containerId, data.slices, {
                    onClick: (item) => handleDrillDown(item.label)
                });
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
        
        const title = currentState.dataType === 'income' ? window.t('ui.stats.income') : window.t('ui.stats.expense');
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
        
        const title = currentState.dataType === 'income' ? window.t('ui.stats.income') : window.t('ui.stats.expense');
        const colorClass = currentState.dataType === 'income' ? 'text-income' : 'text-expense';
        renderChartSection(title, colorClass, `trend-chart-${currentState.dataType}`, targetData, targetSeries);
    }
    
    // ----------------------------------------------------
    // ANNUAL REPORT VIEW
    // ----------------------------------------------------
    else if (isAnnual) {
        const yearItems = allItems.filter(item => item.date && item.date.startsWith(`${currentState.trendYear}-`));
        
        if (yearItems.length === 0) {
            contentContainer.innerHTML = `<div style="padding:80px 0; text-align:center; color:var(--text-muted);">${window.t('ui.stats.noAnnualRecord', { year: currentState.trendYear })}</div>`;
            return;
        }
        
        const totalIncome = yearItems.filter(i => i.type === 'income').reduce((s, i) => s + (i.amount || 0), 0);
        const totalExpense = yearItems.filter(i => i.type === 'expense').reduce((s, i) => s + (i.amount || 0), 0);
        const balance = totalIncome - totalExpense;
        
        const catMap = new Map();
        for (const item of yearItems) {
            if (item.type !== 'expense') continue;
            const key = item.majorCategory ? getTranslatedLabel(item.majorCategory) : window.t('ui.stats.unclassified');
            catMap.set(key, (catMap.get(key) || 0) + (item.amount || 0));
        }
        const topCats = [...catMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
        
        const monthTable = Array.from({ length: 12 }, (_, i) => {
            const key = `${currentState.trendYear}-${String(i + 1).padStart(2, '0')}`;
            const mItems = yearItems.filter(t => t.date && t.date.startsWith(key));
            const inc = mItems.filter(t => t.type === 'income').reduce((s, t) => s + (t.amount || 0), 0);
            const exp = mItems.filter(t => t.type === 'expense').reduce((s, t) => s + (t.amount || 0), 0);
            return { month: `${i + 1}${window.t('ui.stats.monthSuffix')}`, income: inc, expense: exp, balance: inc - exp };
        });
        
        let html = `
            <!-- Summary Cards -->
            <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:12px; margin-bottom:24px;">
                <div style="background:var(--income-bg, #eff6ff); border:1px solid #bfdbfe; border-radius:12px; padding:16px; text-align:center;">
                    <div style="font-size:0.8rem; color:var(--text-muted); margin-bottom:4px;">${window.t('ui.stats.annualTotalIncome')}</div>
                    <div style="font-size:1.2rem; font-weight:bold;" class="text-income">${formatNum(totalIncome)}</div>
                </div>
                <div style="background:var(--expense-bg, #fef2f2); border:1px solid #fecaca; border-radius:12px; padding:16px; text-align:center;">
                    <div style="font-size:0.8rem; color:var(--text-muted); margin-bottom:4px;">${window.t('ui.stats.annualTotalExpense')}</div>
                    <div style="font-size:1.2rem; font-weight:bold;" class="text-expense">${formatNum(totalExpense)}</div>
                </div>
                <div style="background:${balance >= 0 ? '#f0fdf4' : '#fef2f2'}; border:1px solid ${balance >= 0 ? '#bbf7d0' : '#fecaca'}; border-radius:12px; padding:16px; text-align:center;">
                    <div style="font-size:0.8rem; color:var(--text-muted); margin-bottom:4px;">${window.t('ui.stats.annualBalance')}</div>
                    <div style="font-size:1.2rem; font-weight:bold;" class="${balance >= 0 ? 'text-income' : 'text-expense'}">${balance > 0 ? '+' : ''}${formatNum(balance)}</div>
                </div>
            </div>
            
            <!-- Monthly Table -->
            <h3 style="font-size:1rem; margin-bottom:12px;">${window.t('ui.stats.monthlyDetails')}</h3>
            <div style="overflow-x:auto; margin-bottom:32px;">
                <table style="width:100%; border-collapse: collapse; font-size: 0.85rem;">
                    <thead>
                        <tr style="border-bottom: 2px solid var(--border-color);">
                            <th style="text-align:left; padding:8px;">${window.t('ui.stats.month')}</th>
                            <th style="text-align:right; padding:8px;">${window.t('ui.stats.income')}</th>
                            <th style="text-align:right; padding:8px;">${window.t('ui.stats.expense')}</th>
                            <th style="text-align:right; padding:8px;">${window.t('ui.stats.annualBalance')}</th>
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
                <h3 style="font-size:1rem; margin-bottom:16px;">${window.t('ui.stats.top5Expenses')}</h3>
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