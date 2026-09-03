/**
 * ============================================================================
 * 通用資料合併與防呆模組 (DataMerger)
 * ============================================================================
 * 提供兩個階段的資料庫匯入操作，以支援預覽功能。
 * 
 * @example
 * import { DataMerger } from '../../utils/js/dataMerger.js';
 * 
 * const getFingerprint = (item) => `${item.date}_${item.amount}_${item.note}`;
 * 
 * // 1. 預覽分析
 * const analysis = DataMerger.analyze(importedData, existingData, getFingerprint);
 * console.log(`準備新增 ${analysis.pendingItems.length} 筆，已跳過重複 ${analysis.skipCount} 筆`);
 * 
 * // 2. 確認後寫入
 * if (confirm('確定要寫入嗎？')) {
 *     const savedItems = await DataMerger.execute(analysis.pendingItems, db.saveItem);
 * }
 */
export const DataMerger = {
    /**
     * 階段 1：分析並過濾出要新增的資料 (Preview)
     * @param {Array} incoming - 要匯入的資料陣列
     * @param {Array} existing - 已經存在的資料陣列
     * @param {Function} fingerprintFn - 產生唯一特徵碼的函數 (item => string)
     * @param {Set} [sharedFingerprints] - (可選) 共用的特徵碼集合，供跨步驟查閱
     * @returns {Object} { pendingItems, skipCount, fingerprints }
     */
    analyze(incoming, existing, fingerprintFn, sharedFingerprints = null) {
        if (!incoming || !Array.isArray(incoming)) {
            return { pendingItems: [], skipCount: 0, fingerprints: sharedFingerprints || new Set() };
        }
        
        const fingerprints = sharedFingerprints || new Set(existing.map(fingerprintFn));
        const pendingItems = [];
        let skipCount = 0;

        for (const item of incoming) {
            // 防呆檢查
            if (!item) continue;
            
            const fp = fingerprintFn(item);
            if (fingerprints.has(fp)) {
                skipCount++;
                continue;
            }
            
            // 複製並移除原 ID，讓 IndexedDB 等資料庫重新分配
            const itemToSave = { ...item };
            delete itemToSave.id;
            
            fingerprints.add(fp);
            pendingItems.push(itemToSave);
        }

        return { pendingItems, skipCount, fingerprints };
    },

    /**
     * 階段 2：實際執行寫入 (Execute)
     * @param {Array} pendingItems - 階段 1 分析出的欲寫入資料陣列
     * @param {Function} saveFn - 非同步的寫入函數 (item => Promise<id>)
     * @returns {Promise<Array>} 寫入後帶有新 ID 的物件陣列
     */
    async execute(pendingItems, saveFn) {
        const savedItems = [];
        if (!pendingItems || !Array.isArray(pendingItems)) return savedItems;

        for (const item of pendingItems) {
            const savedId = await saveFn(item);
            item.id = savedId;
            savedItems.push(item);
        }
        return savedItems;
    }
};
