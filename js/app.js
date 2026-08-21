import { initState, state } from './state.js';
import { db } from './db.js';
import { initRecordModal } from './components/recordModal.js';
import { renderStats, setupStatsView } from './components/statsView.js';
import { setupSettings } from './components/settingsView.js?v=4';
import { initCalendar } from './components/calendarView.js?v=4';
import { initLocationSearch } from './components/locationSearch.js?v=1';
import { generateFixedTransactions } from './utils.js';
import { DangerZoneModule } from '../utils/js/dangerZone.js';
import { initGlobalFooter } from '../utils/js/globalFooter.js';

if (window.__APP_INITIALIZED__) {
    console.warn("app.js already initialized, skipping duplicate execution to prevent event listener double-binding.");
} else {
    window.__APP_INITIALIZED__ = true;

    document.addEventListener('DOMContentLoaded', async () => {
    // 1. Initialize State and DB
    await initState();

    // TEMPORARY: 清理因舊版雲端匯入產生的重複類別與對象 (只執行一次)
    if (!localStorage.getItem('tinyledger_deduped_v4')) {
        const cats = await db.getCategories();
        const uniqueCats = [];
        const catsToDelete = [];
        for (const cat of cats) {
            // 1. 先清除小類陣列內部的重複項目
            if (cat.sub || cat.subs) {
                cat.sub = [...new Set(cat.sub || cat.subs || [])];
                delete cat.subs; // 移除舊版命名
            }



            const existing = uniqueCats.find(c => c.type === cat.type && c.major === cat.major);
            if (existing) {
                catsToDelete.push(cat.id);
                // 2. 跨檔案合併時去重
                for (const sub of (cat.sub || [])) {
                    if (!existing.sub.includes(sub)) existing.sub.push(sub);
                }
                await db.saveCategory(existing);
            } else {
                uniqueCats.push(cat);
                await db.saveCategory(cat); // 儲存內部去重後的自己
            }
        }
        for (const id of catsToDelete) await db.deleteCategory(id);
        
        const tgts = await db.getTargets();
        const uniqueTgts = [];
        const tgtsToDelete = [];
        for (const tgt of tgts) {
            const existing = uniqueTgts.find(t => t.name === tgt.name);
            if (existing) {
                tgtsToDelete.push(tgt.id);
            } else {
                uniqueTgts.push(tgt);
            }
        }
        for (const id of tgtsToDelete) await db.deleteTarget(id);
        
        localStorage.setItem('tinyledger_deduped_v4', 'true');
        await initState(); // 重新讀取清理後的狀態
    }

    // 2. Initialize UI Components
    initRecordModal(state, db, renderRecordList);
    setupSettings(state, db, renderRecordList);
    initCalendar(state, db);
    setupStatsView(state, db);
    initLocationSearch();

    // 2.5 初始化共用 Footer
    initGlobalFooter({
        containerId: 'app-container',
        appName: 'TinyLedger',
        version: 'v1.2.4.0',
        githubUrl: 'https://github.com/SSWorld72/TinyLedger'
    });

    // 3. Setup Main Tabs
    const tabBtns = document.querySelectorAll('.app-main .tab-btn');
    const btnNavStats = document.getElementById('btn-nav-stats');

    let currentTab = 'tab-general';
    let lastListTab = 'tab-general'; // 記住最後所在的清單頁面
    let generalMonth = '';
    let fixedMonth = '';
    const monthSelector = document.getElementById('month-selector');
    if (monthSelector) {
        const today = new Date();
        const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
        generalMonth = currentMonth;
        fixedMonth = currentMonth;
    }

    const showTab = (targetId, clickedBtn = null) => {
        document.querySelectorAll('.app-main .tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.app-main .tab-content').forEach(c => c.classList.remove('active'));

        if (clickedBtn) clickedBtn.classList.add('active');

        document.getElementById(targetId).classList.add('active');

        const isListView = targetId === 'tab-general' || targetId === 'tab-fixed';
        if (isListView) {
            lastListTab = targetId;
        }

        const stickyPanel = document.getElementById('sticky-top-panel');
        if (stickyPanel) {
            stickyPanel.style.display = isListView ? 'block' : 'none';
        }

        const btnAdd = document.getElementById('btn-add-record');
        const btnList = document.getElementById('btn-nav-list');
        if (btnAdd && btnList) {
            btnAdd.style.display = isListView ? 'flex' : 'none';
            btnList.style.display = isListView ? 'none' : 'flex';
        }

        // 只有統計分析才執行其邏輯
        if (targetId === 'tab-stats') {
            renderStats(state);
        } else if (isListView) {

            // 處理一般與固定紀錄的月份獨立記憶
            if (monthSelector) {
                if (targetId === 'tab-general' && currentTab !== 'tab-general') {
                    if (currentTab === 'tab-fixed') fixedMonth = monthSelector.value;
                    monthSelector.value = generalMonth;
                    renderRecordList();
                    renderSummary();
                } else if (targetId === 'tab-fixed' && currentTab !== 'tab-fixed') {
                    if (currentTab === 'tab-general') generalMonth = monthSelector.value;
                    monthSelector.value = fixedMonth;
                    renderRecordList();
                    renderSummary();
                }
            }
        }
        
        const globalTitle = document.getElementById('global-list-title');
        if (globalTitle) {
            globalTitle.textContent = targetId === 'tab-fixed' ? '類別 / 規則' : '類別 / 明細';
        }
        
        // 如果是設定頁面，動態更新筆數
        if (targetId === 'tab-settings') {
            const countEl = document.getElementById('backup-record-count');
            if (countEl) {
                const txLen = state.transactions ? state.transactions.filter(t => !t.isFixed).length : 0;
                const fixLen = state.fixedRecords ? state.fixedRecords.length : 0;
                countEl.textContent = `📊 目前資料：手動紀錄 ${txLen} 筆、固定紀錄 ${fixLen} 筆`;
            }
        }
        
        window.scrollTo(0, 0);
        
        currentTab = targetId;
    };

    const btnNavList = document.getElementById('btn-nav-list');
    if (btnNavList) btnNavList.addEventListener('click', () => {
        const tabBtn = document.querySelector(`.tab-btn[data-target="${lastListTab}"]`);
        showTab(lastListTab, tabBtn);
    });

    if (btnNavStats) btnNavStats.addEventListener('click', () => showTab('tab-stats'));

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => showTab(btn.getAttribute('data-target'), btn));
    });

    // 3.5 Setup Modals
    const btnNavSettings = document.getElementById('btn-nav-settings');
    if (btnNavSettings) {
        btnNavSettings.addEventListener('click', () => showTab('tab-settings'));
    }

    const btnNavCalendar = document.getElementById('btn-nav-calendar');
    if (btnNavCalendar) {
        btnNavCalendar.addEventListener('click', () => showTab('tab-calendar'));
    }

    // 4. Setup Filters
    const filterMajor = document.getElementById('filter-major');
    const filterMinor = document.getElementById('filter-minor');
    const filterTarget = document.getElementById('filter-target');

    const updateMinorOptions = () => {
        if (!filterMinor || !filterMajor) return;
        const majorVal = filterMajor.value;
        filterMinor.innerHTML = '<option value="">全部</option>';
        if (majorVal) {
            const expenseCat = state.categories.expense.find(c => c.major === majorVal);
            const incomeCat = state.categories.income.find(c => c.major === majorVal);
            const subs = expenseCat ? expenseCat.sub : (incomeCat ? incomeCat.sub : []);
            subs.forEach(sub => {
                const opt = document.createElement('option');
                opt.value = sub;
                opt.textContent = sub;
                filterMinor.appendChild(opt);
            });
        }
    };

    const refreshFilterOptions = () => {
        if (filterMajor) {
            const currentVal = filterMajor.value;
            filterMajor.innerHTML = '<option value="">全部</option>';
            const majors = new Set([...state.categories.expense.map(c => c.major), ...state.categories.income.map(c => c.major)]);
            majors.forEach(major => {
                const opt = document.createElement('option');
                opt.value = major;
                opt.textContent = major;
                filterMajor.appendChild(opt);
            });
            filterMajor.value = currentVal;
        }
        if (filterTarget) {
            const currentVal = filterTarget.value;
            filterTarget.innerHTML = '<option value="">全部</option>';
            state.targets.forEach(tgt => {
                const opt = document.createElement('option');
                opt.value = tgt.name;
                opt.textContent = tgt.name;
                filterTarget.appendChild(opt);
            });
            filterTarget.value = currentVal;
        }
        updateMinorOptions();
    };
    window.refreshFilterOptions = refreshFilterOptions;

    const initFilters = () => {
        refreshFilterOptions();

        if (filterMajor) {
            filterMajor.addEventListener('change', () => {
                updateMinorOptions();
                renderSummary();
                renderRecordList();
            });
        }
        if (filterMinor) {
            filterMinor.addEventListener('change', () => {
                renderSummary();
                renderRecordList();
            });
        }
        if (filterTarget) {
            filterTarget.addEventListener('change', () => {
                renderSummary();
                renderRecordList();
            });
        }
    };

    if (monthSelector) {
        // Default to current month initialized above
        monthSelector.value = generalMonth;

        monthSelector.addEventListener('change', () => {
            if (currentTab === 'tab-general') generalMonth = monthSelector.value;
            if (currentTab === 'tab-fixed') fixedMonth = monthSelector.value;
            renderSummary();
            renderRecordList();
        });

        // Listen to stats dropdown changes
        document.getElementById('stats-period')?.addEventListener('change', () => renderStats(state));
        document.getElementById('stats-groupby')?.addEventListener('change', () => renderStats(state));
    }

    initFilters();

    // 5. Initial Render
    renderSummary();
    renderRecordList();

    // 6. Setup Sticky Header Offset Observer
    const stickyPanel = document.getElementById('sticky-top-panel');
    if (stickyPanel) {
        const updateStickyOffset = () => {
            const headerHeight = window.innerWidth <= 768 ? 54 : 74; // --app-header-height
            const panelHeight = stickyPanel.getBoundingClientRect().height;
            document.documentElement.style.setProperty('--sticky-header-offset', `${headerHeight + panelHeight}px`);
            
            // 由於 sticky-top-panel 改為 fixed 定位，需要手動推開下方內容
            const mainContent = document.querySelector('.main-content');
            if (mainContent) {
                // 如果 panelHeight 是 0，代表面板被隱藏了，將 padding-top 縮小以節省空間
                if (panelHeight === 0) {
                    mainContent.style.paddingTop = '8px';
                } else {
                    mainContent.style.paddingTop = `${panelHeight + 16}px`;
                }
            }
        };
        new ResizeObserver(updateStickyOffset).observe(stickyPanel);
        updateStickyOffset();
        window.addEventListener('resize', updateStickyOffset);
    }
});
}
export function renderSummary() {
    const monthSelector = document.getElementById('month-selector');
    const selectedMonth = monthSelector ? monthSelector.value : '';
    const filterMajor = document.getElementById('filter-major')?.value || '';
    const filterMinor = document.getElementById('filter-minor')?.value || '';
    const filterTarget = document.getElementById('filter-target')?.value || '';

    let income = 0;
    let expense = 0;
    let totalExpenseMonth = 0; // 僅受月份影響，不受其他條件過濾，用於預算進度條

    state.transactions.forEach(tx => {
        // 月份過濾
        if (!selectedMonth || (tx.date && tx.date.startsWith(selectedMonth))) {
            if (tx.type === 'expense') totalExpenseMonth += tx.amount;

            // 大類/小類/對象 過濾
            const matchMajor = !filterMajor || tx.majorCategory === filterMajor;
            const matchMinor = !filterMinor || tx.subCategory === filterMinor;
            const matchTarget = !filterTarget || tx.payee === filterTarget;

            if (matchMajor && matchMinor && matchTarget) {
                if (tx.type === 'income') income += tx.amount;
                else if (tx.type === 'expense') expense += tx.amount;
            }
        }
    });

    const elIncome = document.getElementById('total-income');
    const elExpense = document.getElementById('total-expense');
    const elBalance = document.getElementById('total-balance');

    if (elIncome) elIncome.textContent = income.toLocaleString();
    if (elExpense) elExpense.textContent = expense.toLocaleString();
    if (elBalance) elBalance.textContent = (income - expense).toLocaleString();

    // Budget calculation (僅依賴 totalExpenseMonth，不受分類/對象影響)
    const defaultBudget = 25000;
    const monthlyBudgetStr = localStorage.getItem('tinyledger_monthly_budget');
    const monthlyBudget = monthlyBudgetStr ? parseInt(monthlyBudgetStr, 10) : defaultBudget;

    const budgetLeft = monthlyBudget - totalExpenseMonth;
    let budgetPercent = monthlyBudget > 0 ? (totalExpenseMonth / monthlyBudget) * 100 : 0;
    let progressWidth = budgetPercent > 100 ? 100 : budgetPercent;

    const elBudgetTextLeft = document.getElementById('budget-text-left');
    const elBudgetTextRight = document.getElementById('budget-text-right');
    const elBudgetProgress = document.getElementById('budget-progress');

    if (elBudgetTextLeft) elBudgetTextLeft.textContent = `本月總預算 ${monthlyBudget.toLocaleString()} · 總支出已用 $${totalExpenseMonth.toLocaleString()} (${Math.round(budgetPercent)}%)`;
    if (elBudgetTextRight) {
        if (budgetLeft < 0) {
            elBudgetTextRight.textContent = `超支 ${Math.abs(budgetLeft).toLocaleString()}`;
            elBudgetTextRight.className = 'text-red';
            if (elBudgetProgress) elBudgetProgress.style.background = 'var(--chart-cherry-red)';
        } else {
            elBudgetTextRight.textContent = `剩餘 ${budgetLeft.toLocaleString()}`;
            elBudgetTextRight.className = 'text-green';
            if (elBudgetProgress) {
                if (budgetPercent < 50) {
                    elBudgetProgress.style.background = 'var(--chart-mint-green)';
                } else if (budgetPercent < 80) {
                    elBudgetProgress.style.background = 'var(--chart-tangerine-orange)';
                } else {
                    elBudgetProgress.style.background = 'var(--chart-sunset-orange)';
                }
            }
        }
    }
    if (elBudgetProgress) {
        elBudgetProgress.style.width = `${progressWidth}%`;
    }
}

export function renderRecordList() {
    const enableListMapLink = localStorage.getItem('tinyledger_list_map_link') === 'true';
    const generalList = document.getElementById('general-record-list');
    const fixedList = document.getElementById('fixed-record-list');

    const monthSelector = document.getElementById('month-selector');
    const selectedMonth = monthSelector ? monthSelector.value : '';

    const btnToggleSelect = document.getElementById('btn-toggle-select');
    let btnBatchDelete = document.getElementById('summary-delete-overlay');

    let selectedIds = new Set();

    // 初始化或重新渲染列表時，重置批次刪除 UI
    updateBatchUI();

    function getActiveListContainer() {
        // 透過 DOM 狀態判斷當前分頁，避免依賴外部變數
        const fixedTab = document.getElementById('tab-fixed');
        if (fixedTab && fixedTab.classList.contains('active')) return fixedList;
        return generalList;
    }

    function handleSelectAll(checked) {
        const container = getActiveListContainer();
        const currentTxs = container.querySelectorAll('.record-checkbox');
        if (checked) {
            currentTxs.forEach(cb => {
                cb.checked = true;
                selectedIds.add(Number(cb.value));
            });
        } else {
            currentTxs.forEach(cb => cb.checked = false);
            selectedIds.clear();
        }
        updateBatchUI();
    }


    if (btnBatchDelete) {
        // 透過 cloneNode 清除舊有的 Event Listener (解決 Stale Closure 的問題)
        const newBtn = btnBatchDelete.cloneNode(true);
        btnBatchDelete.parentNode.replaceChild(newBtn, btnBatchDelete);
        btnBatchDelete = newBtn;

        btnBatchDelete.addEventListener('click', async () => {
            if (selectedIds.size === 0) return;
            const fixedTab = document.getElementById('tab-fixed');
            const isFixed = fixedTab && fixedTab.classList.contains('active');
            const typeName = isFixed ? '固定紀錄' : '一般紀錄';
            if (confirm(`確定要刪除這 ${selectedIds.size} 筆${typeName}嗎？`)) {
                for (const id of selectedIds) {
                    if (isFixed) {
                        await db.deleteFixedRecord(id);
                        // 同時刪除該固定紀錄產生的所有明細
                        await db.deleteTransactionsByFixedId(id).catch(() => { });
                    } else {
                        await db.deleteTransaction(id);
                    }
                }
                state.transactions = await db.getTransactions();
                state.fixedRecords = await db.getFixedRecords();
                selectedIds.clear();
                updateBatchUI();
                renderRecordList();
                renderSummary();
            }
        });
    }

    function updateBatchUI() {
        const overlay = document.getElementById('summary-delete-overlay');
        const content = document.getElementById('summary-content');
        const deleteText = document.getElementById('summary-delete-text');

        if (selectedIds.size > 0) {
            if (overlay) {
                overlay.style.opacity = '1';
                overlay.style.pointerEvents = 'auto';
                deleteText.textContent = `刪除所選 (${selectedIds.size})`;
            }
            if (content) content.style.opacity = '0';
        } else {
            if (overlay) {
                overlay.style.opacity = '0';
                overlay.style.pointerEvents = 'none';
            }
            if (content) content.style.opacity = '1';
        }

        const container = getActiveListContainer();
        const total = container.querySelectorAll('.record-checkbox').length;
        const isAllSelected = total > 0 && selectedIds.size === total;

        // 更新所有全選 checkbox 狀態
        const allSelectAlls = document.querySelectorAll('#cb-select-all-global');
        allSelectAlls.forEach(cb => cb.checked = isAllSelected);
    }

    generalList.innerHTML = '';
    fixedList.innerHTML = '';

    // 綁定全選事件 (改用全域的 cb-select-all-global)
    const cbGlobal = document.getElementById('cb-select-all-global');
    // 我們在 renderList 重新指定 onchange 而不是 addEventListener，避免重複綁定
    if (cbGlobal) {
        cbGlobal.checked = false; // 重置狀態
        cbGlobal.onchange = (e) => handleSelectAll(e.target.checked);
    }

    const filterMajor = document.getElementById('filter-major')?.value || '';
    const filterMinor = document.getElementById('filter-minor')?.value || '';
    const filterTarget = document.getElementById('filter-target')?.value || '';

    const filteredTxs = state.transactions.filter(tx => {
        const matchMonth = !selectedMonth || (tx.date && tx.date.startsWith(selectedMonth));
        const matchMajor = !filterMajor || tx.majorCategory === filterMajor;
        const matchMinor = !filterMinor || tx.subCategory === filterMinor;
        const matchTarget = !filterTarget || tx.payee === filterTarget;
        return matchMonth && matchMajor && matchMinor && matchTarget;
    });

    if (filteredTxs.length === 0) {
        generalList.innerHTML = '<div class="empty-state">該月尚無紀錄</div>';
    } else {
        const sortedTxs = [...filteredTxs].sort((a, b) => new Date(b.date) - new Date(a.date));
        sortedTxs.forEach((tx, idx) => {
            const el = document.createElement('div');
            el.className = 'list-row';
            el.innerHTML = `
                <div class="col-check">
                    ${tx.isFixed ? '' : `<input type="checkbox" class="record-checkbox" value="${tx.id}" ${selectedIds.has(tx.id) ? 'checked' : ''}>`}
                </div>
                <div class="col-main">
                    <div style="color: var(--text-main); font-weight: 600; display: flex; align-items: center; gap: 6px;">
                        <span class="${tx.type === 'income' ? 'income-icon' : 'expense-icon'}" style="display:inline-block; width:18px; height:18px; font-size:11px; line-height:18px; text-align:center; border-radius:50%; color:white;">${tx.type === 'income' ? '收' : '支'}</span>
                        ${tx.majorCategory} ${tx.subCategory ? '/ ' + tx.subCategory : ''}
                    </div>
                    <div style="font-size: 13px; color: var(--text-muted); margin-top: 4px; display: flex; flex-direction: column; gap: 2px;">
                        <div>${tx.date}</div>
                        ${(tx.payee || tx.location) ? `<div style="display: flex; flex-wrap: wrap; column-gap: 12px; row-gap: 2px; line-height: 1.4;">
                            ${tx.payee ? `<div style="display: flex;"><span style="white-space: nowrap;">👤 對象：</span><span style="word-break: break-word;">${tx.payee}</span></div>` : ''}
                            ${tx.location ? `<div class="location-meta" style="display: flex; ${enableListMapLink ? 'cursor:pointer; color: var(--link-color);' : ''}"><span style="white-space: nowrap;">📍 地點：</span><span style="word-break: break-word;">${tx.location}</span></div>` : ''}
                        </div>` : ''}
                        ${tx.note ? `<div style="line-height: 1.4; display: flex;"><span style="white-space: nowrap;">📝 備註：</span><span style="word-break: break-word;">${tx.note}</span></div>` : ''}
                    </div>
                </div>
                <div class="col-amount" style="color: ${tx.type === 'income' ? 'var(--link-color)' : 'var(--accent-red)'};">
                    ${tx.type === 'expense' ? '-' : ''}${tx.amount.toLocaleString()}
                </div>
            `;
            if (tx.isFixed) {
                el.classList.add('is-fixed-generated');
                el.title = '固定紀錄產生的明細，僅供檢視';
                el.addEventListener('click', (e) => {
                    if (enableListMapLink && e.target.closest('.location-meta')) {
                        e.stopPropagation();
                        const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(tx.location)}`;
                        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
                        if (isMobile) {
                            window.location.href = mapUrl;
                        } else {
                            window.open(mapUrl, '_blank');
                        }
                        return;
                    }
                    if (window.openRecordModalForEdit) window.openRecordModalForEdit(tx, false, true);
                });
            } else {
                el.addEventListener('click', (e) => {
                    if (enableListMapLink && e.target.closest('.location-meta')) {
                        e.stopPropagation();
                        const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(tx.location)}`;
                        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
                        if (isMobile) {
                            window.location.href = mapUrl;
                        } else {
                            window.open(mapUrl, '_blank');
                        }
                        return;
                    }
                    if (e.target.type === 'checkbox' || e.target.closest('.col-check')) {
                        const checkbox = el.querySelector('.record-checkbox');
                        if (!checkbox) return;
                        if (e.target !== checkbox) checkbox.checked = !checkbox.checked;
                        if (checkbox.checked) selectedIds.add(tx.id);
                        else selectedIds.delete(tx.id);
                        updateBatchUI();
                    } else {
                        if (window.openRecordModalForEdit) window.openRecordModalForEdit(tx, false);
                    }
                });

                const cb = el.querySelector('.record-checkbox');
                if (cb) {
                    cb.addEventListener('change', (e) => {
                        if (e.target.checked) selectedIds.add(tx.id);
                        else selectedIds.delete(tx.id);
                        updateBatchUI();
                    });
                }
            }
            generalList.appendChild(el);
        });
    }

    const filteredFixed = state.fixedRecords.filter(fr => {
        let matchMonth = true;
        if (selectedMonth) {
            const smStart = selectedMonth + '-00';
            const smEnd = selectedMonth + '-99';
            matchMonth = fr.startDate <= smEnd && (!fr.endDate || fr.endDate >= smStart);
        }

        const matchMajor = !filterMajor || fr.majorCategory === filterMajor;
        const matchMinor = !filterMinor || fr.subCategory === filterMinor;
        const matchTarget = !filterTarget || fr.payee === filterTarget;
        return matchMonth && matchMajor && matchMinor && matchTarget;
    });

    if (filteredFixed.length === 0) {
        fixedList.innerHTML = '<div class="empty-state">目前尚無符合條件的固定紀錄</div>';
    } else {
        const sortedFixed = [...filteredFixed].sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
        sortedFixed.forEach((fr, idx) => {
            const el = document.createElement('div');
            el.className = 'list-row';
            let ruleText = '';
            if (fr.rule === 'yearly') ruleText = `每年 ${fr.ruleDetail.month}月${fr.ruleDetail.day}日`;
            if (fr.rule === 'monthly') ruleText = `每月 ${fr.ruleDetail.day}日`;
            if (fr.rule === 'weekly') {
                const days = ['日', '一', '二', '三', '四', '五', '六'];
                ruleText = `每週${days[fr.ruleDetail.weekday]}`;
            }

            const txCount = state.transactions.filter(tx => tx.fixedId === fr.id).length;
            ruleText += ` · 共 ${txCount} 筆`;

            el.innerHTML = `
                <div class="col-check">
                    <input type="checkbox" class="record-checkbox" value="${fr.id}" ${selectedIds.has(fr.id) ? 'checked' : ''}>
                </div>
                <div class="col-main">
                    <div style="color: var(--text-main); font-weight: 600; display: flex; align-items: center; gap: 6px;">
                        <span class="${fr.type === 'income' ? 'income-icon' : 'expense-icon'}" style="display:inline-block; width:18px; height:18px; font-size:11px; line-height:18px; text-align:center; border-radius:50%; color:white;">${fr.type === 'income' ? '收' : '支'}</span>
                        ${fr.majorCategory} ${fr.subCategory ? '/ ' + fr.subCategory : ''}
                    </div>
                    <div style="font-size: 13px; color: var(--text-muted); margin-top: 4px; display: flex; flex-direction: column; gap: 2px;">
                        <div>${fr.startDate} ~ ${fr.endDate || '無期限'} · ${ruleText}</div>
                        ${(fr.payee || fr.location) ? `<div style="display: flex; flex-wrap: wrap; column-gap: 12px; row-gap: 2px; line-height: 1.4;">
                            ${fr.payee ? `<div style="display: flex;"><span style="white-space: nowrap;">👤 對象：</span><span style="word-break: break-word;">${fr.payee}</span></div>` : ''}
                            ${fr.location ? `<div class="location-meta" style="display: flex; ${enableListMapLink ? 'cursor:pointer; color: var(--link-color);' : ''}"><span style="white-space: nowrap;">📍 地點：</span><span style="word-break: break-word;">${fr.location}</span></div>` : ''}
                        </div>` : ''}
                        ${fr.note ? `<div style="line-height: 1.4; display: flex;"><span style="white-space: nowrap;">📝 備註：</span><span style="word-break: break-word;">${fr.note}</span></div>` : ''}
                    </div>
                </div>
                <div class="col-amount" style="color: ${fr.type === 'income' ? 'var(--link-color)' : 'var(--accent-red)'};">
                    ${fr.type === 'expense' ? '-' : ''}${fr.amount.toLocaleString()}
                </div>
            `;
            el.addEventListener('click', (e) => {
                if (enableListMapLink && e.target.closest('.location-meta')) {
                    e.stopPropagation();
                    const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fr.location)}`;
                    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
                    if (isMobile) {
                        window.location.href = mapUrl;
                    } else {
                        window.open(mapUrl, '_blank');
                    }
                    return;
                }
                if (e.target.type === 'checkbox' || e.target.closest('.col-check')) {
                    const checkbox = el.querySelector('.record-checkbox');
                    if (!checkbox) return;
                    if (e.target !== checkbox) checkbox.checked = !checkbox.checked;
                    if (checkbox.checked) selectedIds.add(fr.id);
                    else selectedIds.delete(fr.id);
                    updateBatchUI();
                } else {
                    if (window.openRecordModalForEdit) window.openRecordModalForEdit(fr, true);
                }
            });
            fixedList.appendChild(el);
        });
    }
}
