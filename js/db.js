const DB_NAME = 'TinyLedgerDB';
const DB_VERSION = 1;

let dbInstance = null;

export const initDB = () => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = (event) => {
            console.error(window.t('logs.db.error'), event.target.error);
            reject(event.target.error);
        };

        request.onsuccess = (event) => {
            dbInstance = event.target.result;
            resolve(dbInstance);
        };

        request.onupgradeneeded = (event) => {
            const db = event.target.result;

            // Transactions table (includes both single and fixed-generated single records)
            if (!db.objectStoreNames.contains('transactions')) {
                const txStore = db.createObjectStore('transactions', { keyPath: 'id', autoIncrement: true });
                txStore.createIndex('date', 'date', { unique: false });
                txStore.createIndex('type', 'type', { unique: false });
                txStore.createIndex('fixedId', 'fixedId', { unique: false }); // Associated fixed record ID
            }

            // Fixed records settings table
            if (!db.objectStoreNames.contains('fixed_records')) {
                const fixedStore = db.createObjectStore('fixed_records', { keyPath: 'id', autoIncrement: true });
                fixedStore.createIndex('startDate', 'startDate', { unique: false });
            }

            // Categories table (major and subcategories)
            if (!db.objectStoreNames.contains('categories')) {
                db.createObjectStore('categories', { keyPath: 'id', autoIncrement: true });
            }

            // Targets table
            if (!db.objectStoreNames.contains('targets')) {
                db.createObjectStore('targets', { keyPath: 'id', autoIncrement: true });
            }
        };
    });
};

// Generic helper for DB operations
const executeTx = (storeName, mode, callback) => {
    return new Promise((resolve, reject) => {
        if (!dbInstance) return reject('Database not initialized');
        const transaction = dbInstance.transaction(storeName, mode);
        const store = transaction.objectStore(storeName);
        const request = callback(store);

        request.onsuccess = () => {
            // Trigger auto-sync on write operations if auto-backup is not disabled
            if (mode === 'readwrite' && !window._disableGasAutoSync && window.gasBackupInstance && typeof window.gasBackupInstance.triggerAutoSync === 'function') {
                window.gasBackupInstance.triggerAutoSync();
            }
            resolve(request.result);
        };
        request.onerror = () => reject(request.error);
    });
};

export const db = {
    // Categories
    getCategories: () => executeTx('categories', 'readonly', store => store.getAll()),
    saveCategory: async (cat) => {
        const isUpdate = !!cat.id;
        const result = await executeTx('categories', 'readwrite', store => store.put(cat));
        const unnamed = window.t ? window.t('ui.common.unnamed') : '(Unnamed)';
        console.log(`${window.t('logs.db.saveCategorySuccess')}: ${cat.type} - ${cat.major || cat.name || cat.i18nKey || unnamed}`);
        return result;
    },
    deleteCategory: async (id) => {
        const result = await executeTx('categories', 'readwrite', store => store.delete(id));
        console.log(`${window.t('logs.db.deleteCategorySuccess')}: ID ${id}`);
        return result;
    },
    clearCategories: () => executeTx('categories', 'readwrite', store => store.clear()),

    // Targets
    getTargets: () => executeTx('targets', 'readonly', store => store.getAll()),
    saveTarget: async (target) => {
        const isUpdate = !!target.id;
        const result = await executeTx('targets', 'readwrite', store => store.put(target));
        console.log(`${window.t('logs.db.saveTargetSuccess')}: ${target.name}`);
        return result;
    },
    deleteTarget: async (id) => {
        const result = await executeTx('targets', 'readwrite', store => store.delete(id));
        console.log(`${window.t('logs.db.deleteTargetSuccess')}: ID ${id}`);
        return result;
    },
    clearTargets: () => executeTx('targets', 'readwrite', store => store.clear()),
    
    // Helper for sorting
    getSortLang: () => localStorage.getItem('tinyledger_lang') || undefined,

    // Transactions
    getTransactions: async () => {
        const txs = await executeTx('transactions', 'readonly', store => store.getAll());
        return txs.sort((a, b) => {
            // 1. Date: Descending order
            if (a.date !== b.date) {
                return a.date < b.date ? 1 : -1;
            }
            // 2. Type: income before expense
            if (a.type !== b.type) {
                return a.type === 'income' ? -1 : 1;
            }
            // 3. Major Category (majorCategory)
            const catA = a.majorCategory || '';
            const catB = b.majorCategory || '';
            if (catA !== catB) {
                return catA.localeCompare(catB, db.getSortLang());
            }
            // 4. Subcategory (subCategory)
            const subA = a.subCategory || '';
            const subB = b.subCategory || '';
            if (subA !== subB) {
                return subA.localeCompare(subB, db.getSortLang());
            }
            // 5. Target (payee)
            const payeeA = a.payee || '';
            const payeeB = b.payee || '';
            if (payeeA !== payeeB) {
                return payeeA.localeCompare(payeeB, db.getSortLang());
            }
            // 6. Note (note)
            const noteA = a.note || '';
            const noteB = b.note || '';
            return noteA.localeCompare(noteB, db.getSortLang());
        });
    },
    saveTransaction: async (tx) => {
        const isUpdate = !!tx.id;
        const result = await executeTx('transactions', 'readwrite', store => store.put(tx));
        console.log(`${window.t('logs.db.saveTransactionSuccess')}: ${tx.date} - ${tx.majorCategory} - ${tx.amount}`);
        return result;
    },
    batchSaveTransactions: (txs, onProgress) => {
        return new Promise((resolve, reject) => {
            if (!dbInstance) return reject(new Error('Database not initialized'));
            if (!txs || txs.length === 0) return resolve([]);
            
            const transaction = dbInstance.transaction('transactions', 'readwrite');
            const store = transaction.objectStore('transactions');
            
            transaction.oncomplete = () => {
                if (!window._disableGasAutoSync && window.gasBackupInstance && typeof window.gasBackupInstance.triggerAutoSync === 'function') {
                    window.gasBackupInstance.triggerAutoSync();
                }
                console.log(`${window.t('logs.db.batchSaveTransactionsSuccess')}: Total ${txs.length} records`);
                resolve(txs);
            };
            transaction.onerror = (e) => {
                console.error(window.t('logs.db.batchSaveTransactionsFail'), e.target.error);
                reject(e.target.error);
            };

            let completed = 0;
            const total = txs.length;
            for (const tx of txs) {
                const req = store.put(tx);
                req.onsuccess = (e) => { 
                    tx.id = e.target.result; 
                    completed++;
                    if (onProgress) onProgress(completed, total);
                };
            }
        });
    },
    deleteTransaction: async (id) => {
        const result = await executeTx('transactions', 'readwrite', store => store.delete(id));
        console.log(`${window.t('logs.db.deleteTransactionSuccess')}: ID ${id}`);
        return result;
    },
    deleteTransactionsByFixedId: (fixedId) => {
        return new Promise((resolve, reject) => {
            const transaction = dbInstance.transaction('transactions', 'readwrite');
            const store = transaction.objectStore('transactions');
            const index = store.index('fixedId');
            const request = index.openCursor(IDBKeyRange.only(fixedId));

            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    cursor.delete();
                    cursor.continue();
                } else {
                    // Trigger auto-sync on successful batch deletion if auto-backup is not disabled
                    if (!window._disableGasAutoSync && window.gasBackupInstance && typeof window.gasBackupInstance.triggerAutoSync === 'function') {
                        window.gasBackupInstance.triggerAutoSync();
                    }
                    console.log(`${window.t('logs.db.deleteTransactionsByFixedIdSuccess')}: FixedID ${fixedId}`);
                    resolve();
                }
            };
            request.onerror = (e) => reject(e.target.error);
        });
    },
    clearTransactions: () => executeTx('transactions', 'readwrite', store => store.clear()),

    // Fixed Records
    getFixedRecords: () => executeTx('fixed_records', 'readonly', store => store.getAll()),
    getFixedRecordById: (id) => executeTx('fixed_records', 'readonly', store => store.get(id)),
    saveFixedRecord: async (record) => {
        const isUpdate = !!record.id;
        const result = await executeTx('fixed_records', 'readwrite', store => store.put(record));
        console.log(window.t('logs.db.saveFixedRecordSuccess'));
        return result;
    },
    batchSaveFixedRecords: (records, onProgress) => {
        return new Promise((resolve, reject) => {
            if (!dbInstance) return reject(new Error('Database not initialized'));
            if (!records || records.length === 0) return resolve([]);
            
            const transaction = dbInstance.transaction('fixed_records', 'readwrite');
            const store = transaction.objectStore('fixed_records');
            
            transaction.oncomplete = () => {
                if (!window._disableGasAutoSync && window.gasBackupInstance && typeof window.gasBackupInstance.triggerAutoSync === 'function') {
                    window.gasBackupInstance.triggerAutoSync();
                }
                console.log(`${window.t('logs.db.batchSaveFixedRecordsSuccess')}: Total ${records.length} records`);
                resolve(records);
            };
            transaction.onerror = (e) => {
                console.error(window.t('logs.db.batchSaveFixedRecordsFail'), e.target.error);
                reject(e.target.error);
            };

            let completed = 0;
            const total = records.length;
            for (const record of records) {
                const req = store.put(record);
                req.onsuccess = (e) => { 
                    record.id = e.target.result; 
                    completed++;
                    if (onProgress) onProgress(completed, total);
                };
            }
        });
    },
    deleteFixedRecord: async (id) => {
        const result = await executeTx('fixed_records', 'readwrite', store => store.delete(id));
        console.log(`${window.t('logs.db.deleteFixedRecordSuccess')}: ID ${id}`);
        return result;
    },
    clearFixedRecords: () => executeTx('fixed_records', 'readwrite', store => store.clear()),

    closeConnection: () => {
        if (dbInstance) {
            dbInstance.close();
            dbInstance = null;
        }
    }
};
