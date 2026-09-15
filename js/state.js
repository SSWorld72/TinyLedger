import { initDB, db } from './db.js';
import { migrateToI18n } from './i18nMigration.js';

export const state = {
    categories: {
        income: [],
        expense: []
    },
    targets: [],
    transactions: [],
    fixedRecords: []
};

// Default Seed Data
const defaultExpenseCategories = [
    { catId: 'cat_expense_food', i18nKey: 'categories.expense.food', type: 'expense', order: 1 },
    { catId: 'cat_expense_family', i18nKey: 'categories.expense.family', type: 'expense', order: 2 },
    { catId: 'cat_expense_medical', i18nKey: 'categories.expense.medical', type: 'expense', order: 3 },
    { catId: 'cat_expense_clothing', i18nKey: 'categories.expense.clothing', type: 'expense', order: 4 },
    { catId: 'cat_expense_device', i18nKey: 'categories.expense.device', type: 'expense', order: 5 },
    { catId: 'cat_expense_transport', i18nKey: 'categories.expense.transport', type: 'expense', order: 6 },
    { catId: 'cat_expense_entertainment', i18nKey: 'categories.expense.entertainment', type: 'expense', order: 7 },
    { catId: 'cat_expense_education', i18nKey: 'categories.expense.education', type: 'expense', order: 8 },
    { catId: 'cat_expense_tax', i18nKey: 'categories.expense.tax', type: 'expense', order: 9 },
    { catId: 'cat_expense_other', i18nKey: 'categories.expense.other', type: 'expense', order: 10 }
];

const defaultIncomeCategories = [
    { catId: 'cat_income_salary', i18nKey: 'categories.income.salary', type: 'income', order: 1 },
    { catId: 'cat_income_investment', i18nKey: 'categories.income.investment', type: 'income', order: 2 },
    { catId: 'cat_income_other', i18nKey: 'categories.income.other', type: 'income', order: 3 }
];

const defaultTargets = [
    { tgtId: 'tgt_self', i18nKey: 'targets.self', order: 1 },
    { tgtId: 'tgt_husband', i18nKey: 'targets.husband', order: 2 },
    { tgtId: 'tgt_wife', i18nKey: 'targets.wife', order: 3 },
    { tgtId: 'tgt_child', i18nKey: 'targets.child', order: 4 },
    { tgtId: 'tgt_grandpa', i18nKey: 'targets.grandpa', order: 5 },
    { tgtId: 'tgt_grandma', i18nKey: 'targets.grandma', order: 6 },
    { tgtId: 'tgt_family', i18nKey: 'targets.family', order: 7 },
    { tgtId: 'tgt_other', i18nKey: 'targets.other', order: 8 }
];

let isInitializing = false;

export const initState = async () => {
    if (isInitializing) return;
    isInitializing = true;

    try {
        await initDB();
        await migrateToI18n();
        await loadCategories();
        await loadTargets();
        await loadTransactions();
    } finally {
        isInitializing = false;
    }
};

const loadCategories = async () => {
    let cats = await db.getCategories();
    if (cats.length === 0) {
        // Seed default categories
        const seedCats = [...defaultExpenseCategories, ...defaultIncomeCategories].map(c => ({
            ...c,
            major: window.t ? window.t(c.i18nKey) : c.i18nKey,
            sub: []
        }));
        for (const cat of seedCats) {
            await db.saveCategory(cat);
        }
        cats = await db.getCategories();
    }
    
    // Safety check: ensure all categories have major, sub, and catId
    let needsResave = false;
    for (const c of cats) {
        let changed = false;
        if (!c.major) {
            c.major = c.i18nKey && window.t ? window.t(c.i18nKey) : (window.t ? window.t('ui.common.unnamed') : '(Unnamed)');
            changed = true;
        }
        if (!c.sub) {
            c.sub = [];
            changed = true;
        }
        if (!c.catId) {
            c.catId = 'custom_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5);
            changed = true;
        }
        if (changed) {
            await db.saveCategory(c);
            needsResave = true;
        }
    }

    state.categories.expense = cats.filter(c => c.type === 'expense').sort((a, b) => a.order - b.order);
    state.categories.income = cats.filter(c => c.type === 'income').sort((a, b) => a.order - b.order);
};

const loadTargets = async () => {
    let tgts = await db.getTargets();
    if (tgts.length === 0) {
        // Seed default targets
        const seedTgts = defaultTargets.map(t => ({
            ...t,
            name: window.t ? window.t(t.i18nKey) : t.i18nKey
        }));
        for (const tgt of seedTgts) {
            await db.saveTarget(tgt);
        }
        tgts = await db.getTargets();
    }
    
    // Safety check
    let needsResave = false;
    for (const t of tgts) {
        let changed = false;
        if (!t.name) {
            t.name = t.i18nKey && window.t ? window.t(t.i18nKey) : (window.t ? window.t('ui.common.unnamed') : '(Unnamed)');
            changed = true;
        }
        if (!t.tgtId) {
            t.tgtId = 'custom_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5);
            changed = true;
        }
        if (changed) {
            await db.saveTarget(t);
            needsResave = true;
        }
    }

    state.targets = tgts.sort((a, b) => a.order - b.order);
};

const loadTransactions = async () => {
    state.transactions = await db.getTransactions();
    state.fixedRecords = await db.getFixedRecords();
};
