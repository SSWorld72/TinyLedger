import '../utils/js/logger.js';
import { initState, state } from './state.js';
import { db } from './db.js';
import { initRecordModal } from './components/recordModal.js';
import { renderStats, setupStatsView } from './components/statsView.js';
import { setupSettings } from './components/settingsView.js?v=6';
import { initCalendar } from './components/calendarView.js?v=4';
import { initLocationSearch } from './components/locationSearch.js?v=1';
import { generateFixedTransactions } from './utils.js';
import { DangerZoneModule } from '../utils/js/dangerZone.js';
import { initGlobalFooter } from '../utils/js/globalFooter.js';

export const ACCOUNT_COLORS = [
    { id: 'blue', name: '藍色', bgClass: 'bg-blue-50 dark:bg-blue-500/10', textClass: 'text-blue-600 dark:text-blue-400', borderClass: 'border-blue-200 dark:border-blue-500/30' },
    { id: 'green', name: '綠色', bgClass: 'bg-green-50 dark:bg-green-500/10', textClass: 'text-green-600 dark:text-green-400', borderClass: 'border-green-200 dark:border-green-500/30' },
    { id: 'red', name: '紅色', bgClass: 'bg-red-50 dark:bg-red-500/10', textClass: 'text-red-600 dark:text-red-400', borderClass: 'border-red-200 dark:border-red-500/30' },
    { id: 'yellow', name: '黃色', bgClass: 'bg-yellow-50 dark:bg-yellow-500/10', textClass: 'text-yellow-600 dark:text-yellow-400', borderClass: 'border-yellow-200 dark:border-yellow-500/30' },
    { id: 'purple', name: '紫色', bgClass: 'bg-purple-50 dark:bg-purple-500/10', textClass: 'text-purple-600 dark:text-purple-400', borderClass: 'border-purple-200 dark:border-purple-500/30' },
    { id: 'gray', name: '灰色', bgClass: 'bg-slate-50 dark:bg-slate-500/10', textClass: 'text-slate-600 dark:text-slate-400', borderClass: 'border-slate-200 dark:border-slate-500/30' }
];

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
        // 讀取帳戶列表與記憶的選取狀態
        let accounts = JSON.parse(localStorage.getItem('tinyledger_accounts')) || [];
        if (accounts.length === 0) accounts = [{ id: 'account_default' }];
        let savedFilters = JSON.parse(localStorage.getItem('tinyledger_selected_accounts'));
        
        if (savedFilters && Array.isArray(savedFilters) && savedFilters.length > 0) {
            // 過濾掉可能已經被刪除的帳戶 ID
            const validIds = accounts.map(a => String(a.id));
            window.selectedAccountIds = savedFilters.filter(id => validIds.includes(id));
            if (window.selectedAccountIds.length === 0) window.selectedAccountIds = validIds;
        } else {
            window.selectedAccountIds = accounts.map(a => String(a.id));
        }

        initAccountFilterModal();
        initRecordModal({ renderRecordList, renderSummary });
        setupSettings(state, db, renderRecordList);
        initCalendar(state, db);
        setupStatsView(state, db);
        initLocationSearch();

        // 2.5 初始化共用 Footer
        initGlobalFooter({
            containerId: 'app-container',
            appName: '小小計帳本 (TinyLedger)',
            version: 'v1.4.2.0',
            copyrightYear: '2025-2026',
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
    const selectedIds = window.selectedAccountIds || [];

    let income = 0;
    let expense = 0;
    let totalExpenseMonth = 0; // 僅受月份與帳戶影響，不受其他條件過濾，用於預算進度條

    state.transactions.forEach(tx => {
        // 帳戶過濾 (支援舊資料相容)
        const txAccountId = String(tx.accountId || 'account_default');
        if (selectedIds.length > 0 && !selectedIds.includes(txAccountId)) return;

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

    // Budget calculation (從各個帳戶讀取預算並算出進度)
    const accounts = JSON.parse(localStorage.getItem('tinyledger_accounts')) || [];
    let monthlyBudget = 0;
    
    const activeAccounts = accounts.filter(a => selectedIds.includes(String(a.id)));
    if (activeAccounts.length > 0) {
        monthlyBudget = activeAccounts.reduce((sum, acc) => sum + (acc.budget !== undefined ? acc.budget : 25000), 0);
    } else {
        monthlyBudget = accounts.reduce((sum, acc) => sum + (acc.budget !== undefined ? acc.budget : 25000), 0);
    }
    if (monthlyBudget === 0) monthlyBudget = 25000;

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

export function renderRecordList(scrollToId = null) {
    const enableListMapLink = localStorage.getItem('tinyledger_list_map_link') === 'true';
    const generalList = document.getElementById('general-record-list');
    const fixedList = document.getElementById('fixed-record-list');

    const monthSelector = document.getElementById('month-selector');
    const selectedMonth = monthSelector ? monthSelector.value : '';

    const btnToggleSelect = document.getElementById('btn-toggle-select');
    let btnBatchDelete = document.getElementById('summary-delete-overlay');

    let selectedIds = new Set();
    
    const accounts = JSON.parse(localStorage.getItem('tinyledger_accounts')) || [];
    const getAccountBadge = (accId) => {
        const id = accId || 'account_default';
        const acc = accounts.find(a => a.id === id) || { name: '帳戶 A', color: 'blue' };
        const c = ACCOUNT_COLORS.find(col => col.id === acc.color) || ACCOUNT_COLORS[0];
        return `<span class="${c.bgClass} ${c.textClass} ${c.borderClass}" style="display:inline-block; font-size:10px; padding: 2px 6px; border-radius: 4px; border-width: 1px; border-style: solid; margin-left: 6px;">${acc.name}</span>`;
    };

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
            const typeName = isFixed ? '固定規則' : '一般紀錄';
            
            if (isFixed) {
                const txs = await db.getTransactions();
                const frs = await db.getFixedRecords();
                let totalBound = 0;
                let boundLines = [];

                for (const id of selectedIds) {
                    const boundTxs = txs.filter(t => t.fixedId === id);
                    if (boundTxs.length > 0) {
                        totalBound += boundTxs.length;
                        if (boundLines.length < 5) {
                            const fr = frs.find(f => f.id === id);
                            const name = fr ? (fr.note || fr.majorCategory) : '未命名規則';
                            const d = [...new Set(boundTxs.map(t => t.date))].sort().reverse()[0];
                            boundLines.push(`- [${name}] (${boundTxs.length}筆紀錄, 如 ${d})`);
                        }
                    }
                }

                let confirmMsg = `確定要刪除這 ${selectedIds.size} 筆固定規則嗎？此動作無法復原。`;
                if (totalBound > 0) {
                    confirmMsg = `【嚴重警告】您選取的規則共自動產生了 ${totalBound} 筆歷史紀錄：\n` +
                                 boundLines.join('\n') +
                                 (boundLines.length === 5 ? '\n...及其他' : '') +
                                 `\n\n刪除規則將會「一併刪除」這些歷史紀錄！\n若只想停止產生未來紀錄，建議取消刪除並修改「結束日期」。\n\n確定要強制刪除並銷毀歷史紀錄嗎？`;
                }
                
                if (!confirm(confirmMsg)) return;

                for (const id of selectedIds) {
                    await db.deleteFixedRecord(id);
                    // 同時刪除該固定紀錄產生的所有明細
                    await db.deleteTransactionsByFixedId(id).catch(() => { });
                }
            } else {
                if (!confirm(`確定要刪除這 ${selectedIds.size} 筆${typeName}嗎？`)) return;
                for (const id of selectedIds) {
                    await db.deleteTransaction(id);
                }
            }
            
            state.transactions = await db.getTransactions();
            state.fixedRecords = await db.getFixedRecords();
            selectedIds.clear();
            updateBatchUI();
            renderRecordList();
            renderSummary();
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
    const filterAccountIds = window.selectedAccountIds || [];

    // 渲染一般紀錄
    const filteredTxs = state.transactions.filter(tx => {
        const txAccountId = String(tx.accountId || 'account_default');
        if (filterAccountIds.length > 0 && !filterAccountIds.includes(txAccountId)) return false;

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
            if (tx.id) el.dataset.id = tx.id;
            el.innerHTML = `
                <div class="col-check" style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px;">
                    <span style="font-size: 10px; color: var(--text-muted); line-height: 1; font-weight: 500; font-family: monospace;">${sortedTxs.length - idx}</span>
                    ${tx.isFixed ? '' : `<input type="checkbox" class="record-checkbox" value="${tx.id}" ${selectedIds.has(tx.id) ? 'checked' : ''}>`}
                </div>
                <div class="col-main">
                    <div style="color: var(--text-main); font-weight: 600; display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                        <span class="${tx.type === 'income' ? 'income-icon' : 'expense-icon'}" style="display:inline-block; width:18px; height:18px; font-size:11px; line-height:18px; text-align:center; border-radius:50%; color:white; flex-shrink: 0;">${tx.type === 'income' ? '收' : '支'}</span>
                        <span>${tx.majorCategory} ${tx.subCategory ? '/ ' + tx.subCategory : ''}</span>
                        ${getAccountBadge(tx.accountId)}
                    </div>
                    <div style="font-size: 13px; color: var(--text-muted); margin-top: 4px; display: flex; flex-direction: column; gap: 2px;">
                        <div>${tx.date}</div>
                        ${(tx.payee || tx.location) ? `<div style="display: flex; flex-wrap: wrap; column-gap: 12px; row-gap: 2px; line-height: 1.4;">
                            ${tx.payee ? `<div style="display: flex;"><span style="white-space: nowrap;">👤 對象：</span><span style="word-break: break-word;">${tx.payee}</span></div>` : ''}
                            ${tx.location ? `<div class="location-meta" style="display: flex; ${enableListMapLink ? 'cursor:pointer; color: var(--link-color);' : ''}"><span style="white-space: nowrap;">📍 地點：</span><span style="word-break: break-word;">${tx.location}</span></div>` : ''}
                        </div>` : ''}
                        ${tx.note ? `<div style="line-height: 1.4; display: flex;"><span style="white-space: nowrap;">📝 備註：</span><span style="word-break: break-word;">${tx.note}</span></div>` : ''}
                        ${tx.attachment ? `<div style="line-height: 1.4; display: flex; color: var(--primary-color);"><span style="white-space: nowrap;">📷 已附照片</span></div>` : ''}
                    </div>
                </div>
                ${tx.attachment ? `<div class="col-photo" style="width: 48px; height: 48px; margin-right: 12px; border-radius: 4px; overflow: hidden; flex-shrink: 0; border: 1px solid #eee; display: flex; align-items: center; justify-content: center; background-color: #fafafa;"><img src="${tx.attachment}" style="width: 100%; height: 100%; object-fit: cover;" alt="預覽"></div>` : ''}
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

        if (scrollToId) {
            setTimeout(() => {
                const targetEl = generalList.querySelector(`.list-row[data-id="${scrollToId}"]`);
                if (targetEl) {
                    targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    // 添加短暫的高亮效果讓使用者看清楚新增的資料在哪
                    targetEl.style.transition = 'background-color 1.5s ease';
                    targetEl.style.backgroundColor = 'var(--highlight-bg, #fff3cd)';
                    setTimeout(() => {
                        targetEl.style.backgroundColor = '';
                    }, 1500);
                }
            }, 100);
        }
    }

    const filteredFixed = state.fixedRecords.filter(fr => {
        const fAccountId = String(fr.accountId || 'account_default');
        if (filterAccountIds.length > 0 && !filterAccountIds.includes(fAccountId)) return false;

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
                    <div style="color: var(--text-main); font-weight: 600; display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                        <span class="${fr.type === 'income' ? 'income-icon' : 'expense-icon'}" style="display:inline-block; width:18px; height:18px; font-size:11px; line-height:18px; text-align:center; border-radius:50%; color:white; flex-shrink: 0;">${fr.type === 'income' ? '收' : '支'}</span>
                        <span>${fr.majorCategory} ${fr.subCategory ? '/ ' + fr.subCategory : ''}</span>
                        ${getAccountBadge(fr.accountId)}
                    </div>
                    <div style="font-size: 13px; color: var(--text-muted); margin-top: 4px; display: flex; flex-direction: column; gap: 2px;">
                        <div>${fr.startDate} ~ ${fr.endDate || '無期限'} · ${ruleText}</div>
                        ${(fr.payee || fr.location) ? `<div style="display: flex; flex-wrap: wrap; column-gap: 12px; row-gap: 2px; line-height: 1.4;">
                            ${fr.payee ? `<div style="display: flex;"><span style="white-space: nowrap;">👤 對象：</span><span style="word-break: break-word;">${fr.payee}</span></div>` : ''}
                            ${fr.location ? `<div class="location-meta" style="display: flex; ${enableListMapLink ? 'cursor:pointer; color: var(--link-color);' : ''}"><span style="white-space: nowrap;">📍 地點：</span><span style="word-break: break-word;">${fr.location}</span></div>` : ''}
                        </div>` : ''}
                        ${fr.note ? `<div style="line-height: 1.4; display: flex;"><span style="white-space: nowrap;">📝 備註：</span><span style="word-break: break-word;">${fr.note}</span></div>` : ''}
                        ${fr.attachment ? `<div style="line-height: 1.4; display: flex; color: var(--primary-color);"><span style="white-space: nowrap;">📷 已附照片</span></div>` : ''}
                    </div>
                </div>
                ${fr.attachment ? `<div class="col-photo" style="width: 48px; height: 48px; margin-right: 12px; border-radius: 4px; overflow: hidden; flex-shrink: 0; border: 1px solid #eee; display: flex; align-items: center; justify-content: center; background-color: #fafafa;"><img src="${fr.attachment}" style="width: 100%; height: 100%; object-fit: cover;" alt="預覽"></div>` : ''}
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
// ======== END of DOMContentLoaded ========


export function initAccountFilterModal() {
    const btnFilter = document.getElementById('btn-account-filter');
    const modal = document.getElementById('account-filter-modal');
    const btnClose = document.getElementById('btn-close-account-filter');
    const listContainer = document.getElementById('account-filter-list');
    const btnSelectAll = document.getElementById('btn-account-filter-select-all');
    const btnClearAll = document.getElementById('btn-account-filter-clear-all');
    const btnConfirm = document.getElementById('btn-confirm-account-filter');
    const textLabel = document.getElementById('account-filter-text');

    if (!btnFilter || !modal) return;

    let tempSelected = [...(window.selectedAccountIds || [])];

    const updateLabel = () => {
        let accounts = JSON.parse(localStorage.getItem('tinyledger_accounts')) || [];
        if (!accounts || accounts.length === 0) {
            accounts = [{ id: 'account_default', name: '預設帳戶' }];
        }
        if (window.selectedAccountIds.length === accounts.length) {
            textLabel.textContent = '全部帳戶';
            btnFilter.style.background = 'var(--primary-color)';
            btnFilter.style.color = '#fff';
            btnFilter.style.border = '1px solid var(--primary-color)';
        } else {
            textLabel.textContent = `帳戶 (${window.selectedAccountIds.length}/${accounts.length})`;
            btnFilter.style.background = 'var(--surface-color)';
            btnFilter.style.color = 'var(--text-color)';
            btnFilter.style.border = '1px solid var(--primary-color)';
        }
    };

    const renderList = () => {
        let accounts = JSON.parse(localStorage.getItem('tinyledger_accounts')) || [];
        if (!accounts || accounts.length === 0) {
            accounts = [{ id: 'account_default', name: '預設帳戶', color: 'blue' }];
        }
        
        listContainer.innerHTML = '';
        accounts.forEach(acc => {
            const isChecked = tempSelected.includes(String(acc.id));
            const c = ACCOUNT_COLORS.find(col => col.id === acc.color) || ACCOUNT_COLORS[0];
            
            const div = document.createElement('div');
            div.className = `${c.borderClass}`;
            div.style.display = 'flex';
            div.style.alignItems = 'center';
            div.style.justifyContent = 'space-between';
            div.style.padding = '12px 16px';
            div.style.borderWidth = '1px';
            div.style.borderStyle = 'solid';
            div.style.borderRadius = '8px';
            div.style.cursor = 'pointer';
            div.style.backgroundColor = 'var(--surface-color)';
            div.style.boxShadow = '0 2px 4px rgba(0,0,0,0.02)';
            
            div.innerHTML = `
                <div style="display: flex; flex-direction: column; gap: 4px; pointer-events: none;">
                    <span class="${c.textClass}" style="font-size: 1rem; font-weight: 600;">${acc.name}</span>
                </div>
                <label class="toggle-switch" style="margin: 0; transform: scale(0.95);">
                    <input type="checkbox" id="filter-acc-${acc.id}" value="${acc.id}" ${isChecked ? 'checked' : ''}>
                    <span class="toggle-slider"></span>
                </label>
            `;
            
            div.addEventListener('click', (e) => {
                // 阻止 label 原生的點擊聯動，統一由下方手動處理，避免互相抵銷
                e.preventDefault();

                // 點擊卡片任何地方皆手動觸發
                const cb = div.querySelector('input');
                cb.checked = !cb.checked;
                if (cb.checked) {
                    if (!tempSelected.includes(String(acc.id))) tempSelected.push(String(acc.id));
                } else {
                    tempSelected = tempSelected.filter(id => id !== String(acc.id));
                }
            });
            listContainer.appendChild(div);
        });
    };

    btnFilter.addEventListener('click', () => {
        tempSelected = [...(window.selectedAccountIds || [])];
        renderList();
        modal.classList.add('show');
    });

    btnClose.addEventListener('click', () => modal.classList.remove('show'));

    btnSelectAll.addEventListener('click', () => {
        let accounts = JSON.parse(localStorage.getItem('tinyledger_accounts')) || [{ id: 'account_default' }];
        tempSelected = accounts.map(a => String(a.id));
        renderList();
    });

    btnClearAll.addEventListener('click', () => {
        tempSelected = [];
        renderList();
    });

    btnConfirm.addEventListener('click', () => {
        if (tempSelected.length === 0) {
            alert('請至少選擇一個帳戶！');
            return;
        }
        window.selectedAccountIds = [...tempSelected];
        localStorage.setItem('tinyledger_selected_accounts', JSON.stringify(window.selectedAccountIds));
        updateLabel();
        modal.classList.remove('show');
        
        // 重新渲染畫面
        renderSummary();
        renderRecordList();
        if (typeof renderStats === 'function') renderStats();
    });

    // 初始更新 Label
    updateLabel();
}

// Ensure accountsChanged updates the UI
window.addEventListener('accountsChanged', () => {
    let accounts = JSON.parse(localStorage.getItem('tinyledger_accounts')) || [];
    if (accounts.length === 0) accounts = [{ id: 'account_default' }];
    const validIds = accounts.map(a => String(a.id));

    // 過濾掉已被刪除的帳戶 ID，若過濾後為空則恢復全選
    if (window.selectedAccountIds && window.selectedAccountIds.length > 0) {
        window.selectedAccountIds = window.selectedAccountIds.filter(id => validIds.includes(id));
    }
    if (!window.selectedAccountIds || window.selectedAccountIds.length === 0) {
        window.selectedAccountIds = [...validIds];
    }
    localStorage.setItem('tinyledger_selected_accounts', JSON.stringify(window.selectedAccountIds));

    initAccountFilterModal();
    renderSummary();
    renderRecordList();
    renderStats();
});
