import { db } from './db.js';

import appDict from '../i18n/zh-TW.js';

const buildReverseCategoryMap = () => {
    const map = { expense: {}, income: {} };
    for (const [key, value] of Object.entries(appDict.categories.expense)) {
        map.expense[value] = `cat_expense_${key}`;
    }
    for (const [key, value] of Object.entries(appDict.categories.income)) {
        map.income[value] = `cat_income_${key}`;
    }
    return map;
};

const buildReverseTargetMap = () => {
    const map = {};
    for (const [key, value] of Object.entries(appDict.targets)) {
        map[value] = `tgt_${key}`;
    }
    return map;
};

const generateCustomId = () => 'custom_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5);

export const migrateToI18n = async () => {
    const isMigrated = localStorage.getItem('tinyledger_i18n_migrated');
    if (isMigrated) return;

    console.log(window.t ? window.t('logs.db.migrationStart') : '[DB] Migration started...');

    try {
        const catMap = {}; // mapping key: `${type}_${major}` -> newId
        const defaultCategoryMap = buildReverseCategoryMap();

        // 1. Migrate Categories
        const categories = await db.getCategories();
        for (const cat of categories) {
            // Skip if already migrated
            if (cat.catId) {
                catMap[`${cat.type}_${cat.major}`] = cat.catId;
                continue;
            }

            let newId = defaultCategoryMap[cat.type]?.[cat.major];
            if (!newId) {
                newId = generateCustomId();
            }
            
            cat.catId = newId;
            // Set i18nKey for default categories
            if (newId.startsWith('cat_')) {
                const parts = newId.split('_');
                cat.i18nKey = `categories.${parts[1]}.${parts[2]}`;
            }

            await db.saveCategory(cat);
            catMap[`${cat.type}_${cat.major}`] = newId;
        }

        // 1.5 Migrate Targets
        const tgtMap = {}; // mapping key: `name` -> newId
        const defaultTargetMap = buildReverseTargetMap();
        const targets = await db.getTargets();
        for (const tgt of targets) {
            if (tgt.tgtId) {
                tgtMap[tgt.name] = tgt.tgtId;
                continue;
            }
            let newId = defaultTargetMap[tgt.name];
            if (!newId) {
                newId = generateCustomId();
            }
            tgt.tgtId = newId;
            if (newId.startsWith('tgt_')) {
                tgt.i18nKey = `targets.${newId.replace('tgt_', '')}`;
            }
            await db.saveTarget(tgt);
            tgtMap[tgt.name] = newId;
        }

        // 2. Migrate Transactions
        const transactions = await db.getTransactions();
        for (const tx of transactions) {
            let updated = false;
            if (tx.majorCategory && !tx.majorCategory.startsWith('cat_') && !tx.majorCategory.startsWith('custom_')) {
                const newId = catMap[`${tx.type}_${tx.majorCategory}`];
                if (newId) {
                    tx.majorCategory = newId;
                    updated = true;
                }
            }
            if (tx.payee && !tx.payee.startsWith('tgt_') && !tx.payee.startsWith('custom_')) {
                const newId = tgtMap[tx.payee];
                if (newId) {
                    tx.payee = newId;
                    updated = true;
                }
            }
            if (updated) {
                await db.saveTransaction(tx);
            }
        }

        // 3. Migrate Fixed Records
        const fixedRecords = await db.getFixedRecords();
        for (const fx of fixedRecords) {
            let updated = false;
            if (fx.majorCategory && !fx.majorCategory.startsWith('cat_') && !fx.majorCategory.startsWith('custom_')) {
                const newId = catMap[`${fx.type}_${fx.majorCategory}`];
                if (newId) {
                    fx.majorCategory = newId;
                    updated = true;
                }
            }
            if (fx.payee && !fx.payee.startsWith('tgt_') && !fx.payee.startsWith('custom_')) {
                const newId = tgtMap[fx.payee];
                if (newId) {
                    fx.payee = newId;
                    updated = true;
                }
            }
            if (updated) {
                await db.saveFixedRecord(fx);
            }
        }

        localStorage.setItem('tinyledger_i18n_migrated', 'true');
        console.log(window.t ? window.t('logs.db.migrationSuccess') : '[DB] Migration completed!');
    } catch (e) {
        console.error(window.t ? window.t('logs.db.migrationFail', { error: e.message || e }) : '[DB] Migration failed:', e);
    }
};

/**
 * Migrate imported backup data from legacy text-based categories/targets to internal IDs.
 * @param {Object} backupData - The parsed JSON data from a backup.
 * @param {Array} existingCategories - Local DB categories to match custom IDs.
 * @param {Array} existingTargets - Local DB targets to match custom IDs.
 */
export const migrateImportedData = (backupData, existingCategories = [], existingTargets = []) => {
    if (!backupData) return backupData;
    
    const catMap = {}; // mapping key: `${type}_${major}` -> newId
    const defaultCategoryMap = buildReverseCategoryMap();
    
    // 1. Build map from existing local DB (so custom categories map correctly)
    for (const cat of existingCategories) {
        if (cat.catId) {
            catMap[`${cat.type}_${cat.major}`] = cat.catId;
        }
    }
    
    // 2. Map imported categories
    if (backupData.categories && Array.isArray(backupData.categories)) {
        for (const cat of backupData.categories) {
            if (cat.catId) {
                catMap[`${cat.type}_${cat.major}`] = cat.catId;
                continue;
            }
            const key = `${cat.type}_${cat.major}`;
            let newId = catMap[key] || defaultCategoryMap[cat.type]?.[cat.major];
            if (newId) {
                cat.catId = newId;
                if (newId.startsWith('cat_')) {
                    const parts = newId.split('_');
                    cat.i18nKey = `categories.${parts[1]}.${parts[2]}`;
                }
                catMap[key] = newId;
            }
        }
    }
    
    const tgtMap = {}; // mapping key: `name` -> newId
    const defaultTargetMap = buildReverseTargetMap();
    
    // 1. Build map from existing local DB
    for (const tgt of existingTargets) {
        if (tgt.tgtId) {
            tgtMap[tgt.name] = tgt.tgtId;
        }
    }
    
    // 2. Map imported targets
    if (backupData.targets && Array.isArray(backupData.targets)) {
        for (const tgt of backupData.targets) {
            if (tgt.tgtId) {
                tgtMap[tgt.name] = tgt.tgtId;
                continue;
            }
            let newId = tgtMap[tgt.name] || defaultTargetMap[tgt.name];
            if (newId) {
                tgt.tgtId = newId;
                if (newId.startsWith('tgt_')) {
                    tgt.i18nKey = `targets.${newId.replace('tgt_', '')}`;
                }
                tgtMap[tgt.name] = newId;
            }
        }
    }
    
    // Migrate Transactions
    if (backupData.transactions && Array.isArray(backupData.transactions)) {
        for (const tx of backupData.transactions) {
            if (tx.majorCategory && !tx.majorCategory.startsWith('cat_') && !tx.majorCategory.startsWith('custom_')) {
                const newId = catMap[`${tx.type}_${tx.majorCategory}`] || defaultCategoryMap[tx.type]?.[tx.majorCategory];
                if (newId) tx.majorCategory = newId;
            }
            if (tx.payee && !tx.payee.startsWith('tgt_') && !tx.payee.startsWith('custom_')) {
                const newId = tgtMap[tx.payee] || defaultTargetMap[tx.payee];
                if (newId) tx.payee = newId;
            }
        }
    }
    
    // Migrate Fixed Records
    if (backupData.fixedRecords && Array.isArray(backupData.fixedRecords)) {
        for (const fx of backupData.fixedRecords) {
            if (fx.majorCategory && !fx.majorCategory.startsWith('cat_') && !fx.majorCategory.startsWith('custom_')) {
                const newId = catMap[`${fx.type}_${fx.majorCategory}`] || defaultCategoryMap[fx.type]?.[fx.majorCategory];
                if (newId) fx.majorCategory = newId;
            }
            if (fx.payee && !fx.payee.startsWith('tgt_') && !fx.payee.startsWith('custom_')) {
                const newId = tgtMap[fx.payee] || defaultTargetMap[fx.payee];
                if (newId) fx.payee = newId;
            }
        }
    }
    
    return backupData;
};

