const DB_NAME = 'TinyLedgerDB';
const DB_VERSION = 1;

let dbInstance = null;

export const initDB = () => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = (event) => {
            console.error('Database error:', event.target.error);
            reject(event.target.error);
        };

        request.onsuccess = (event) => {
            dbInstance = event.target.result;
            resolve(dbInstance);
        };

        request.onupgradeneeded = (event) => {
            const db = event.target.result;

            // 交易紀錄表 (包含單次與固定紀錄產生的單次)
            if (!db.objectStoreNames.contains('transactions')) {
                const txStore = db.createObjectStore('transactions', { keyPath: 'id', autoIncrement: true });
                txStore.createIndex('date', 'date', { unique: false });
                txStore.createIndex('type', 'type', { unique: false });
                txStore.createIndex('fixedId', 'fixedId', { unique: false }); // 關聯的固定紀錄 ID
            }

            // 固定紀錄設定表
            if (!db.objectStoreNames.contains('fixed_records')) {
                const fixedStore = db.createObjectStore('fixed_records', { keyPath: 'id', autoIncrement: true });
                fixedStore.createIndex('startDate', 'startDate', { unique: false });
            }

            // 類別表 (大小類)
            if (!db.objectStoreNames.contains('categories')) {
                db.createObjectStore('categories', { keyPath: 'id', autoIncrement: true });
            }

            // 對象表
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
            // 如果是寫入操作，且沒有停用自動備份，則觸發自動同步
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
    saveCategory: (cat) => executeTx('categories', 'readwrite', store => store.put(cat)),
    deleteCategory: (id) => executeTx('categories', 'readwrite', store => store.delete(id)),
    clearCategories: () => executeTx('categories', 'readwrite', store => store.clear()),

    // Targets
    getTargets: () => executeTx('targets', 'readonly', store => store.getAll()),
    saveTarget: (target) => executeTx('targets', 'readwrite', store => store.put(target)),
    deleteTarget: (id) => executeTx('targets', 'readwrite', store => store.delete(id)),
    clearTargets: () => executeTx('targets', 'readwrite', store => store.clear()),

    // Transactions
    getTransactions: async () => {
        const txs = await executeTx('transactions', 'readonly', store => store.getAll());
        return txs.sort((a, b) => {
            // 1. 日期 (Date): 越晚的越上面 (Descending)
            if (a.date !== b.date) {
                return a.date < b.date ? 1 : -1;
            }
            // 2. 類型 (Type): 收入在上面 (income before expense)
            if (a.type !== b.type) {
                return a.type === 'income' ? -1 : 1;
            }
            // 3. 大類 (majorCategory)
            const catA = a.majorCategory || '';
            const catB = b.majorCategory || '';
            if (catA !== catB) {
                return catA.localeCompare(catB, 'zh-TW');
            }
            // 4. 小類 (subCategory)
            const subA = a.subCategory || '';
            const subB = b.subCategory || '';
            if (subA !== subB) {
                return subA.localeCompare(subB, 'zh-TW');
            }
            // 5. 對象 (payee)
            const payeeA = a.payee || '';
            const payeeB = b.payee || '';
            if (payeeA !== payeeB) {
                return payeeA.localeCompare(payeeB, 'zh-TW');
            }
            // 6. 備註 (note)
            const noteA = a.note || '';
            const noteB = b.note || '';
            return noteA.localeCompare(noteB, 'zh-TW');
        });
    },
    saveTransaction: (tx) => executeTx('transactions', 'readwrite', store => store.put(tx)),
    deleteTransaction: (id) => executeTx('transactions', 'readwrite', store => store.delete(id)),
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
                    // 批次刪除完成，且沒有停用自動備份，觸發自動同步
                    if (!window._disableGasAutoSync && window.gasBackupInstance && typeof window.gasBackupInstance.triggerAutoSync === 'function') {
                        window.gasBackupInstance.triggerAutoSync();
                    }
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
    saveFixedRecord: (record) => executeTx('fixed_records', 'readwrite', store => store.put(record)),
    deleteFixedRecord: (id) => executeTx('fixed_records', 'readwrite', store => store.delete(id)),
    clearFixedRecords: () => executeTx('fixed_records', 'readwrite', store => store.clear()),

    closeConnection: () => {
        if (dbInstance) {
            dbInstance.close();
            dbInstance = null;
        }
    }
};
