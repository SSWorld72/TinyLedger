import '../utils/js/logger.js';
import { I18nEngine } from '../utils/js/i18nEngine.js?v=3';
window.i18nEngine = new I18nEngine();
window.t = window.i18nEngine.t.bind(window.i18nEngine);
// DO NOT use top-level await here, otherwise DOMContentLoaded will be missed!

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
import { loadHTMLComponents } from './utils/htmlLoader.js';

export const ACCOUNT_COLORS = [
    { id: 'blue', name: window.t('ui.accounts.colors.blue'), bgClass: 'bg-blue-50 dark:bg-blue-500/10', textClass: 'text-blue-600 dark:text-blue-400', borderClass: 'border-blue-200 dark:border-blue-500/30' },
    { id: 'green', name: window.t('ui.accounts.colors.green'), bgClass: 'bg-green-50 dark:bg-green-500/10', textClass: 'text-green-600 dark:text-green-400', borderClass: 'border-green-200 dark:border-green-500/30' },
    { id: 'red', name: window.t('ui.accounts.colors.red'), bgClass: 'bg-red-50 dark:bg-red-500/10', textClass: 'text-red-600 dark:text-red-400', borderClass: 'border-red-200 dark:border-red-500/30' },
    { id: 'yellow', name: window.t('ui.accounts.colors.yellow'), bgClass: 'bg-yellow-50 dark:bg-yellow-500/10', textClass: 'text-yellow-600 dark:text-yellow-400', borderClass: 'border-yellow-200 dark:border-yellow-500/30' },
    { id: 'purple', name: window.t('ui.accounts.colors.purple'), bgClass: 'bg-purple-50 dark:bg-purple-500/10', textClass: 'text-purple-600 dark:text-purple-400', borderClass: 'border-purple-200 dark:border-purple-500/30' },
    { id: 'gray', name: window.t('ui.accounts.colors.gray'), bgClass: 'bg-slate-50 dark:bg-slate-500/10', textClass: 'text-slate-600 dark:text-slate-400', borderClass: 'border-slate-200 dark:border-slate-500/30' }
];

export const getCategoryName = (catId, type) => {
    if (!catId) return '';
    if (!catId.startsWith('cat_') && !catId.startsWith('custom_')) return catId;
    const cats = type ? state.categories[type] : [...state.categories.expense, ...state.categories.income];
    const cat = cats.find(c => c.catId === catId);
    if (cat) return cat.i18nKey ? window.t(cat.i18nKey) : cat.major;
    return catId;
};

export const getTargetName = (tgtId) => {
    if (!tgtId) return '';
    if (!tgtId.startsWith('tgt_') && !tgtId.startsWith('custom_')) return tgtId;
    const tgt = state.targets.find(t => t.tgtId === tgtId);
    if (tgt) return tgt.i18nKey ? window.t(tgt.i18nKey) : tgt.name;
    return tgtId;
};

import zhTWDict from '../i18n/zh-TW.js';

let reverseSubcatMap = null;
export const getSubCategoryName = (subName) => {
    if (!subName) return '';
    if (!reverseSubcatMap) {
        reverseSubcatMap = {};
        // Build a bidirectional map using default zh-TW dictionary and the current language dictionary
        const dicts = [zhTWDict];
        if (window.i18nEngine && window.i18nEngine.dict) dicts.push(window.i18nEngine.dict);
        
        for (const dict of dicts) {
            for (const type of ['expense', 'income']) {
                if (!dict || !dict.subcategories || !dict.subcategories[type]) continue;
                for (const [major, subs] of Object.entries(dict.subcategories[type])) {
                    for (const [key, val] of Object.entries(subs)) {
                        reverseSubcatMap[val] = `subcategories.${type}.${major}.${key}`;
                    }
                }
            }
        }
    }
    const i18nKey = reverseSubcatMap[subName];
    return i18nKey && window.t ? window.t(i18nKey) : subName;
};
window.getSubCategoryName = getSubCategoryName;
window.getCategoryName = getCategoryName;
window.getTargetName = getTargetName;

if (window.__APP_INITIALIZED__) {
    console.warn(window.t('logs.app.alreadyInitialized'));
} else {
    window.__APP_INITIALIZED__ = true;

    document.addEventListener('DOMContentLoaded', async () => {
        // -1. Load all modularized HTML components first
        await loadHTMLComponents();

        // 0. Initialize I18n Dictionary First
        await window.i18nEngine.loadLanguage(window.i18nEngine.currentLang);
        
        // 1. Initialize State and DB
        await initState();

        // 1.5 Bind i18n DOM
        window.i18nEngine.bindDOM();

        // TEMPORARY: Clean up duplicate categories and targets caused by legacy cloud sync (run once)
        if (!localStorage.getItem('tinyledger_deduped_v4')) {
            const cats = await db.getCategories();
            const uniqueCats = [];
            const catsToDelete = [];
            for (const cat of cats) {
                // 1. First clear duplicate items within subcategory arrays
                if (cat.sub || cat.subs) {
                    cat.sub = [...new Set(cat.sub || cat.subs || [])];
                    delete cat.subs; // Remove legacy naming
                }



                const existing = uniqueCats.find(c => c.type === cat.type && c.major === cat.major);
                if (existing) {
                    catsToDelete.push(cat.id);
                    // 2. Deduplicate during cross-file merge
                    for (const sub of (cat.sub || [])) {
                        if (!existing.sub.includes(sub)) existing.sub.push(sub);
                    }
                    await db.saveCategory(existing);
                } else {
                    uniqueCats.push(cat);
                    await db.saveCategory(cat); // Save internally deduplicated self
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
            await initState(); // Reload state after cleanup
        }

        // 2. Initialize UI Components
        // Read account list and remembered selection state
        let accounts = JSON.parse(localStorage.getItem('tinyledger_accounts')) || [];
        if (accounts.length === 0) accounts = [{ id: 'account_default' }];
        let savedFilters = JSON.parse(localStorage.getItem('tinyledger_selected_accounts'));

        if (savedFilters && Array.isArray(savedFilters) && savedFilters.length > 0) {
            // Filter out potentially deleted account IDs
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

        // 2.5 Initialize Shared Footer
        initGlobalFooter({
            containerId: 'app-container',
            appName: window.t('ui.app.fullName') || window.t('ui.app.name'),
            version: 'v1.5.7.1',
            copyrightYear: '2025-2026',
            githubUrl: 'https://github.com/SSWorld72/TinyLedger'
        });

        // 3. Setup Main Tabs
        const tabBtns = document.querySelectorAll('.app-main .tab-btn');
        const btnNavStats = document.getElementById('btn-nav-stats');

        let currentTab = 'tab-general';
        let lastListTab = 'tab-general'; // Remember the last list page visited
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

            // Only execute logic for stats analysis
            if (targetId === 'tab-stats') {
                renderStats(state);
            } else if (isListView) {

                // Handle independent month memory for general and fixed records
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
                globalTitle.textContent = targetId === 'tab-fixed' ? window.t('ui.tabs.rules') : window.t('ui.tabs.details');
            }

            // If settings page, dynamically update record count
            if (targetId === 'tab-settings') {
                const countEl = document.getElementById('backup-record-count');
                if (countEl) {
                    const txLen = state.transactions ? state.transactions.filter(t => !t.isFixed).length : 0;
                    const fixLen = state.fixedRecords ? state.fixedRecords.length : 0;
                    countEl.textContent = window.t('ui.list.summary', { txLen, fixLen });
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
            const majorId = filterMajor.value;
            filterMinor.innerHTML = `<option value="">${window.t('ui.list.filterAll')}</option>`;
            if (majorId) {
                const cat = [...state.categories.expense, ...state.categories.income].find(c => c.catId === majorId);
                const subs = cat ? (cat.sub || []) : [];

                subs.forEach(sub => {
                    const opt = document.createElement('option');
                    opt.value = sub;
                    opt.textContent = getSubCategoryName(sub);
                    filterMinor.appendChild(opt);
                });
            }
        };

        const refreshFilterOptions = () => {
            if (filterMajor) {
                const currentVal = filterMajor.value;
                filterMajor.innerHTML = `<option value="">${window.t('ui.list.filterAll')}</option>`;
                const majors = [...state.categories.expense, ...state.categories.income];
                majors.forEach(cat => {
                    const majorName = cat.i18nKey ? window.t(cat.i18nKey) : cat.major;
                    const opt = document.createElement('option');
                    opt.value = cat.catId;
                    opt.textContent = majorName;
                    filterMajor.appendChild(opt);
                });
                filterMajor.value = currentVal;
            }
            if (filterTarget) {
                const currentVal = filterTarget.value;
                filterTarget.innerHTML = `<option value="">${window.t('ui.list.filterAll')}</option>`;
                state.targets.forEach(tgt => {
                    const tName = tgt.i18nKey ? window.t(tgt.i18nKey) : tgt.name;
                    const opt = document.createElement('option');
                    opt.value = tgt.tgtId;
                    opt.textContent = tName;
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
                    currentGeneralPage = 1;
                    currentFixedPage = 1;
                    renderSummary();
                    renderRecordList();
                });
            }
            if (filterMinor) {
                filterMinor.addEventListener('change', () => {
                    currentGeneralPage = 1;
                    currentFixedPage = 1;
                    renderSummary();
                    renderRecordList();
                });
            }
            if (filterTarget) {
                filterTarget.addEventListener('change', () => {
                    currentGeneralPage = 1;
                    currentFixedPage = 1;
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
                currentGeneralPage = 1;
                currentFixedPage = 1;
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

        // 5.5 Initialize page-size select from localStorage, then bind change event
        const pageSizeSelect = document.getElementById('global-page-size');
        if (pageSizeSelect) {
            const savedPageSize = localStorage.getItem('tinyledger_page_size') || '10';
            pageSizeSelect.value = savedPageSize;
            pageSizeSelect.addEventListener('change', () => {
                localStorage.setItem('tinyledger_page_size', pageSizeSelect.value);
                console.log(window.t ? window.t('logs.app.pageSizeChanged') || `[App] Page size changed to ${pageSizeSelect.value}` : `[App] Page size changed to ${pageSizeSelect.value}`);
                currentGeneralPage = 1;
                currentFixedPage = 1;
                renderRecordList();
            });
        }

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
    let totalExpenseMonth = 0; // Only affected by month and account, not filtered by other conditions, used for budget progress bar

    state.transactions.forEach(tx => {
        // Account filter (supports legacy data compatibility)
        const txAccountId = String(tx.accountId || 'account_default');
        if (selectedIds.length > 0 && !selectedIds.includes(txAccountId)) return;

        // Month filter
        if (!selectedMonth || (tx.date && tx.date.startsWith(selectedMonth))) {
            if (tx.type === 'expense') totalExpenseMonth += tx.amount;

            // Major/minor/target filter
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

    // Budget calculation (read budget from each account and calculate progress)
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

    if (elBudgetTextLeft) elBudgetTextLeft.textContent = window.t('ui.budget.status', { monthlyBudget: monthlyBudget.toLocaleString(), totalExpenseMonth: totalExpenseMonth.toLocaleString(), budgetPercent: Math.round(budgetPercent) });
    if (elBudgetTextRight) {
        if (budgetLeft < 0) {
            elBudgetTextRight.textContent = window.t('ui.budget.over', { amount: Math.abs(budgetLeft).toLocaleString() });
            elBudgetTextRight.className = 'text-red';
            if (elBudgetProgress) elBudgetProgress.style.background = 'var(--chart-cherry-red)';
        } else {
            elBudgetTextRight.textContent = window.t('ui.budget.left', { amount: budgetLeft.toLocaleString() });
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

// ======== Pagination State ========
let currentGeneralPage = 1;
let currentFixedPage = 1;

/** Read current pageSize from select or localStorage (fallback to 10) */
function getPageSize() {
    const sel = document.getElementById('global-page-size');
    if (sel) return sel.value; // 'all' or number string
    return localStorage.getItem('tinyledger_page_size') || '10';
}

/**
 * Render pagination controls into the given container.
 * @param {HTMLElement} container
 * @param {number} currentPage
 * @param {number} totalPages
 * @param {function} onPageChange - called with new page number
 */
function renderPagination(container, currentPage, totalPages, onPageChange) {
    if (!container) return;
    container.innerHTML = '';
    if (totalPages <= 1) return; // No controls needed for single page

    const style = 'padding: 4px 10px; border: 1px solid var(--border-color); border-radius: 4px; background: var(--bg-color); color: var(--text-main); cursor: pointer; font-size: 0.85rem;';
    const disabledStyle = 'padding: 4px 10px; border: 1px solid var(--border-color); border-radius: 4px; background: var(--surface-color); color: var(--text-muted); cursor: default; font-size: 0.85rem; opacity: 0.5;';

    const btnPrev = document.createElement('button');
    btnPrev.textContent = window.t('ui.list.prevPage') || 'Prev';
    btnPrev.setAttribute('style', currentPage <= 1 ? disabledStyle : style);
    btnPrev.disabled = currentPage <= 1;
    btnPrev.addEventListener('click', () => { if (currentPage > 1) onPageChange(currentPage - 1); });

    const info = document.createElement('span');
    info.style.cssText = 'font-size: 0.85rem; color: var(--text-muted);';
    info.textContent = (window.t('ui.list.pageInfo') || 'Page {current} of {total}')
        .replace('{current}', currentPage)
        .replace('{total}', totalPages);

    const btnNext = document.createElement('button');
    btnNext.textContent = window.t('ui.list.nextPage') || 'Next';
    btnNext.setAttribute('style', currentPage >= totalPages ? disabledStyle : style);
    btnNext.disabled = currentPage >= totalPages;
    btnNext.addEventListener('click', () => { if (currentPage < totalPages) onPageChange(currentPage + 1); });

    container.appendChild(btnPrev);
    container.appendChild(info);
    container.appendChild(btnNext);
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
        const acc = accounts.find(a => a.id === id) || { name: window.t('ui.accounts.defaultName'), color: 'blue' };
        const c = ACCOUNT_COLORS.find(col => col.id === acc.color) || ACCOUNT_COLORS[0];
        return `<span class="${c.bgClass} ${c.textClass} ${c.borderClass}" style="display:inline-block; font-size:10px; padding: 2px 6px; border-radius: 4px; border-width: 1px; border-style: solid; margin-left: 6px;">${acc.name}</span>`;
    };

    // Reset batch delete UI when initializing or re-rendering list
    updateBatchUI();

    function getActiveListContainer() {
        // Determine current tab via DOM state to avoid relying on external variables
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
        // Use cloneNode to remove old Event Listeners (solves Stale Closure issue)
        const newBtn = btnBatchDelete.cloneNode(true);
        btnBatchDelete.parentNode.replaceChild(newBtn, btnBatchDelete);
        btnBatchDelete = newBtn;

        btnBatchDelete.addEventListener('click', async () => {
            if (selectedIds.size === 0) return;
            const fixedTab = document.getElementById('tab-fixed');
            const isFixed = fixedTab && fixedTab.classList.contains('active');
            const typeName = isFixed ? window.t('ui.batch.typeNameFixed') : window.t('ui.batch.typeNameGeneral');

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
                            const name = fr ? (fr.note || fr.majorCategory) : window.t('ui.batch.unnamedRule');
                            const d = [...new Set(boundTxs.map(t => t.date))].sort().reverse()[0];
                            boundLines.push(window.t('ui.batch.boundPreview', { name, count: boundTxs.length, date: d }));
                        }
                    }
                }

                let confirmMsg = window.t('ui.batch.confirmDeleteFixed', { count: selectedIds.size });
                if (totalBound > 0) {
                    confirmMsg = window.t('ui.batch.confirmDeleteFixedBound', {
                        totalBound,
                        boundLines: boundLines.join('\n') + (boundLines.length === 5 ? '\n' + window.t('ui.batch.andOthers') : '')
                    });
                }

                if (!confirm(confirmMsg)) return;

                for (const id of selectedIds) {
                    await db.deleteFixedRecord(id);
                    // Simultaneously delete all transactions generated by this fixed record
                    await db.deleteTransactionsByFixedId(id).catch(() => { });
                }
            } else {
                if (!confirm(window.t('ui.batch.confirmDeleteType', { count: selectedIds.size, typeName }))) return;
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
                deleteText.textContent = window.t('ui.batch.btnDeleteSelected', { count: selectedIds.size });
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

        // Update all select-all checkbox states
        const allSelectAlls = document.querySelectorAll('#cb-select-all-global');
        allSelectAlls.forEach(cb => cb.checked = isAllSelected);
    }

    generalList.innerHTML = '';
    fixedList.innerHTML = '';

    // Bind select-all event (use global cb-select-all-global)
    const cbGlobal = document.getElementById('cb-select-all-global');
    // Reassign onchange in renderList instead of addEventListener to prevent duplicate binding
    if (cbGlobal) {
        cbGlobal.checked = false; // Reset state
        cbGlobal.onchange = (e) => handleSelectAll(e.target.checked);
    }

    const filterMajor = document.getElementById('filter-major')?.value || '';
    const filterMinor = document.getElementById('filter-minor')?.value || '';
    const filterTarget = document.getElementById('filter-target')?.value || '';
    const filterAccountIds = window.selectedAccountIds || [];

    // Render general records
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
        generalList.innerHTML = `<div class="empty-state">${window.t('ui.list.emptyGeneral')}</div>`;
    } else {
        // Pre-compute order maps to avoid expensive .find() operations inside the .sort() loop
        const majorOrderMap = new Map();
        const minorOrderMap = new Map();
        const allCats = [...(state.categories.expense || []), ...(state.categories.income || [])];
        allCats.forEach(c => {
            majorOrderMap.set(c.catId, c.order);
            if (c.sub && Array.isArray(c.sub)) {
                c.sub.forEach((subName, idx) => minorOrderMap.set(`${c.catId}|${subName}`, idx));
            }
        });
        const targetOrderMap = new Map();
        (state.targets || []).forEach(t => targetOrderMap.set(t.tgtId, t.order));

        const sortedTxs = [...filteredTxs].sort((a, b) => {
            const dateDiff = new Date(b.date) - new Date(a.date);
            if (dateDiff !== 0) return dateDiff;
            
            const majorA = a.majorCategory || '';
            const majorB = b.majorCategory || '';
            const orderMajorA = majorOrderMap.has(majorA) ? majorOrderMap.get(majorA) : 9999;
            const orderMajorB = majorOrderMap.has(majorB) ? majorOrderMap.get(majorB) : 9999;
            if (orderMajorA !== orderMajorB) return orderMajorA - orderMajorB;

            const minorA = a.subCategory || '';
            const minorB = b.subCategory || '';
            const orderMinorA = minorOrderMap.has(`${majorA}|${minorA}`) ? minorOrderMap.get(`${majorA}|${minorA}`) : 9999;
            const orderMinorB = minorOrderMap.has(`${majorB}|${minorB}`) ? minorOrderMap.get(`${majorB}|${minorB}`) : 9999;
            if (orderMinorA !== orderMinorB) return orderMinorA - orderMinorB;

            const payeeA = a.payee || '';
            const payeeB = b.payee || '';
            const orderPayeeA = targetOrderMap.has(payeeA) ? targetOrderMap.get(payeeA) : 9999;
            const orderPayeeB = targetOrderMap.has(payeeB) ? targetOrderMap.get(payeeB) : 9999;
            if (orderPayeeA !== orderPayeeB) return orderPayeeA - orderPayeeB;

            const amountDiff = (b.amount || 0) - (a.amount || 0);
            if (amountDiff !== 0) return amountDiff;

            const noteA = a.note || '';
            const noteB = b.note || '';
            return noteA.localeCompare(noteB);
        });

        // --- Pagination: slice sortedTxs for current page ---
        const pageSizeVal = getPageSize();
        const isAllGeneral = pageSizeVal === 'all';
        const pageSizeGeneral = isAllGeneral ? sortedTxs.length : Math.max(1, parseInt(pageSizeVal, 10) || 10);
        const totalGeneralPages = isAllGeneral ? 1 : Math.max(1, Math.ceil(sortedTxs.length / pageSizeGeneral));
        // Clamp page
        if (currentGeneralPage > totalGeneralPages) currentGeneralPage = totalGeneralPages;
        const startGeneral = (currentGeneralPage - 1) * pageSizeGeneral;
        const pagedTxs = isAllGeneral ? sortedTxs : sortedTxs.slice(startGeneral, startGeneral + pageSizeGeneral);

        pagedTxs.forEach((tx, idx) => {
            const el = document.createElement('div');
            el.className = 'list-row';
            if (tx.id) el.dataset.id = tx.id;
            // Sequential index based on full sorted list position (not page)
            const globalIdx = startGeneral + idx;
            el.innerHTML = `
                <div class="col-check" style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px;">
                    <span style="font-size: 10px; color: var(--text-muted); line-height: 1; font-weight: 500; font-family: monospace;">#${sortedTxs.length - globalIdx}</span>
                    ${tx.isFixed ? '' : `<input type="checkbox" class="record-checkbox" value="${tx.id}" ${selectedIds.has(tx.id) ? 'checked' : ''}>`}
                </div>
                <div class="col-main">
                    <div style="color: var(--text-main); font-weight: 600; display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                        <span class="${tx.type === 'income' ? 'income-icon' : 'expense-icon'}" style="display:inline-block; width:18px; height:18px; font-size:11px; line-height:18px; text-align:center; border-radius:50%; color:white; flex-shrink: 0;">${tx.type === 'income' ? window.t('ui.record.typeIncome') : window.t('ui.record.typeExpense')}</span>
                        <span>${getCategoryName(tx.majorCategory, tx.type)} ${tx.subCategory ? '/ ' + getSubCategoryName(tx.subCategory) : ''}</span>
                        ${getAccountBadge(tx.accountId)}
                    </div>
                    <div style="font-size: 13px; color: var(--text-muted); margin-top: 4px; display: flex; flex-direction: column; gap: 2px;">
                        <div>${tx.date}</div>
                        ${(tx.payee || tx.location) ? `<div style="display: flex; flex-wrap: wrap; column-gap: 12px; row-gap: 2px; line-height: 1.4;">
                            ${tx.payee ? `<div style="display: flex;"><span style="white-space: nowrap;">${window.t('ui.record.labelTarget')}</span><span style="word-break: break-word;">${getTargetName(tx.payee)}</span></div>` : ''}
                            ${tx.location ? `<div class="location-meta" style="display: flex; ${enableListMapLink ? 'cursor:pointer; color: var(--link-color);' : ''}"><span style="white-space: nowrap;">${window.t('ui.record.labelLocation')}</span><span style="word-break: break-word;">${tx.location}</span></div>` : ''}
                        </div>` : ''}
                        ${tx.note ? `<div style="line-height: 1.4; display: flex;"><span style="white-space: nowrap;">${window.t('ui.record.labelNote')}</span><span style="word-break: break-word;">${tx.note}</span></div>` : ''}
                        ${tx.attachment ? `<div style="line-height: 1.4; display: flex; color: var(--primary-color);"><span style="white-space: nowrap;">${window.t('ui.record.labelPhoto')}</span></div>` : ''}
                    </div>
                </div>
                ${tx.attachment ? `<div class="col-photo" style="width: 48px; height: 48px; margin-right: 12px; border-radius: 4px; overflow: hidden; flex-shrink: 0; border: 1px solid #eee; display: flex; align-items: center; justify-content: center; background-color: #fafafa;"><img src="${tx.attachment}" style="width: 100%; height: 100%; object-fit: cover;" alt="${window.t('ui.record.attachment')}"></div>` : ''}
                <div class="col-amount" style="color: ${tx.type === 'income' ? 'var(--link-color)' : 'var(--accent-red)'};">
                    ${tx.type === 'expense' ? '-' : ''}${tx.amount.toLocaleString()}
                </div>
            `;
            if (tx.isFixed) {
                el.classList.add('is-fixed-generated');
                el.title = window.t('ui.record.fixedGeneratedTip');
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

        // Render general pagination controls
        const generalPagination = document.getElementById('general-pagination');
        renderPagination(generalPagination, currentGeneralPage, totalGeneralPages, (newPage) => {
            currentGeneralPage = newPage;
            renderRecordList();
        });

        if (scrollToId) {
            setTimeout(() => {
                const targetEl = generalList.querySelector(`.list-row[data-id="${scrollToId}"]`);
                if (targetEl) {
                    targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    // Add brief highlight effect to show user where new data is added
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
        fixedList.innerHTML = `<div class="empty-state">${window.t('ui.list.emptyFixed')}</div>`;
    } else {
        const sortedFixed = [...filteredFixed].sort((a, b) => {
            const dateDiff = new Date(b.startDate) - new Date(a.startDate);
            if (dateDiff !== 0) return dateDiff;
            
            const majorA = a.majorCategory || '';
            const majorB = b.majorCategory || '';
            const majorDiff = majorA.localeCompare(majorB);
            if (majorDiff !== 0) return majorDiff;

            const minorA = a.subCategory || '';
            const minorB = b.subCategory || '';
            const minorDiff = minorA.localeCompare(minorB);
            if (minorDiff !== 0) return minorDiff;

            const payeeA = a.payee || '';
            const payeeB = b.payee || '';
            const payeeDiff = payeeA.localeCompare(payeeB);
            if (payeeDiff !== 0) return payeeDiff;

            const amountDiff = (b.amount || 0) - (a.amount || 0);
            if (amountDiff !== 0) return amountDiff;

            const noteA = a.note || '';
            const noteB = b.note || '';
            return noteA.localeCompare(noteB);
        });

        // --- Pagination: slice sortedFixed for current page ---
        const pageSizeValFixed = getPageSize();
        const isAllFixed = pageSizeValFixed === 'all';
        const pageSizeFixed = isAllFixed ? sortedFixed.length : Math.max(1, parseInt(pageSizeValFixed, 10) || 10);
        const totalFixedPages = isAllFixed ? 1 : Math.max(1, Math.ceil(sortedFixed.length / pageSizeFixed));
        if (currentFixedPage > totalFixedPages) currentFixedPage = totalFixedPages;
        const startFixed = (currentFixedPage - 1) * pageSizeFixed;
        const pagedFixed = isAllFixed ? sortedFixed : sortedFixed.slice(startFixed, startFixed + pageSizeFixed);

        pagedFixed.forEach((fr, idx) => {
            const el = document.createElement('div');
            el.className = 'list-row';
            let ruleText = '';
            if (fr.rule === 'yearly') ruleText = window.t('ui.record.ruleYearly', { month: fr.ruleDetail.month, day: fr.ruleDetail.day });
            if (fr.rule === 'monthly') ruleText = window.t('ui.record.ruleMonthly', { day: fr.ruleDetail.day });
            if (fr.rule === 'weekly') {
                const days = window.t('ui.record.weekdays');
                ruleText = window.t('ui.record.ruleWeekly', { weekday: days[fr.ruleDetail.weekday] });
            }

            const txCount = state.transactions.filter(tx => tx.fixedId === fr.id).length;
            ruleText += ' · ' + window.t('ui.record.ruleCount', { count: txCount });

            // Sequential index based on full sorted list position (not page)
            const globalFixedIdx = startFixed + idx;
            el.innerHTML = `
                <div class="col-check" style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px;">
                    <span style="font-size: 10px; color: var(--text-muted); line-height: 1; font-weight: 500; font-family: monospace;">#${sortedFixed.length - globalFixedIdx}</span>
                    <input type="checkbox" class="record-checkbox" value="${fr.id}" ${selectedIds.has(fr.id) ? 'checked' : ''}>
                </div>
                <div class="col-main">
                    <div style="color: var(--text-main); font-weight: 600; display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                        <span class="${fr.type === 'income' ? 'income-icon' : 'expense-icon'}" style="display:inline-block; width:18px; height:18px; font-size:11px; line-height:18px; text-align:center; border-radius:50%; color:white; flex-shrink: 0;">${fr.type === 'income' ? window.t('ui.record.typeIncome') : window.t('ui.record.typeExpense')}</span>
                        <span>${getCategoryName(fr.majorCategory, fr.type)} ${fr.subCategory ? '/ ' + getSubCategoryName(fr.subCategory) : ''}</span>
                        ${getAccountBadge(fr.accountId)}
                    </div>
                    <div style="font-size: 13px; color: var(--text-muted); margin-top: 4px; display: flex; flex-direction: column; gap: 2px;">
                        <div>${fr.startDate} ~ ${fr.endDate || window.t('ui.record.noDeadline')} · ${ruleText}</div>
                        ${(fr.payee || fr.location) ? `<div style="display: flex; flex-wrap: wrap; column-gap: 12px; row-gap: 2px; line-height: 1.4;">
                            ${fr.payee ? `<div style="display: flex;"><span style="white-space: nowrap;">${window.t('ui.record.labelTarget')}</span><span style="word-break: break-word;">${getTargetName(fr.payee)}</span></div>` : ''}
                            ${fr.location ? `<div class="location-meta" style="display: flex; ${enableListMapLink ? 'cursor:pointer; color: var(--link-color);' : ''}"><span style="white-space: nowrap;">${window.t('ui.record.labelLocation')}</span><span style="word-break: break-word;">${fr.location}</span></div>` : ''}
                        </div>` : ''}
                        ${fr.note ? `<div style="line-height: 1.4; display: flex;"><span style="white-space: nowrap;">${window.t('ui.record.labelNote')}</span><span style="word-break: break-word;">${fr.note}</span></div>` : ''}
                        ${fr.attachment ? `<div style="line-height: 1.4; display: flex; color: var(--primary-color);"><span style="white-space: nowrap;">${window.t('ui.record.labelPhoto')}</span></div>` : ''}
                    </div>
                </div>
                ${fr.attachment ? `<div class="col-photo" style="width: 48px; height: 48px; margin-right: 12px; border-radius: 4px; overflow: hidden; flex-shrink: 0; border: 1px solid #eee; display: flex; align-items: center; justify-content: center; background-color: #fafafa;"><img src="${fr.attachment}" style="width: 100%; height: 100%; object-fit: cover;" alt="${window.t('ui.record.attachment')}"></div>` : ''}
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

        // Render fixed pagination controls
        const fixedPagination = document.getElementById('fixed-pagination');
        renderPagination(fixedPagination, currentFixedPage, totalFixedPages, (newPage) => {
            currentFixedPage = newPage;
            renderRecordList();
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
            accounts = [{ id: 'account_default', name: window.t('ui.accounts.defaultName') }];
        }
        if (window.selectedAccountIds.length === accounts.length) {
            textLabel.textContent = window.t('ui.accounts.filterAll');
            btnFilter.style.background = 'var(--primary-color)';
            btnFilter.style.color = '#fff';
            btnFilter.style.border = '1px solid var(--primary-color)';
        } else {
            textLabel.textContent = window.t('ui.accounts.filterPartial', { selected: window.selectedAccountIds.length, total: accounts.length });
            btnFilter.style.background = 'var(--surface-color)';
            btnFilter.style.color = 'var(--text-color)';
            btnFilter.style.border = '1px solid var(--primary-color)';
        }
    };

    const renderList = () => {
        let accounts = JSON.parse(localStorage.getItem('tinyledger_accounts')) || [];
        if (!accounts || accounts.length === 0) {
            accounts = [{ id: 'account_default', name: window.t('ui.accounts.defaultName'), color: 'blue' }];
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
                // Prevent label native click linking, handle manually below to avoid mutual cancellation
                e.preventDefault();

                // Trigger manually when clicking anywhere on the card
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
            alert(window.t('ui.accounts.alertNoAccount'));
            return;
        }
        window.selectedAccountIds = [...tempSelected];
        localStorage.setItem('tinyledger_selected_accounts', JSON.stringify(window.selectedAccountIds));
        updateLabel();
        modal.classList.remove('show');

        // Re-render UI
        renderSummary();
        renderRecordList();
        if (typeof renderStats === 'function') renderStats();
    });

    // Initial Label update
    updateLabel();
}

// Ensure accountsChanged updates the UI
window.addEventListener('accountsChanged', () => {
    let accounts = JSON.parse(localStorage.getItem('tinyledger_accounts')) || [];
    if (accounts.length === 0) accounts = [{ id: 'account_default' }];
    const validIds = accounts.map(a => String(a.id));

    // Filter out deleted account IDs, restore select-all if empty after filtering
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
