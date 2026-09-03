/**
 * ZIP 備份與還原共用模組 (zipBackupHelper.js)
 * 負責將 JSON 資料打包為 ZIP，抽離照片，並支援年度拆分。
 */

export class ZipBackupHelper {
    /**
     * 建立 ZIP 備份檔
     * @param {Object} data 包含 transactions, fixedRecords, categories, targets, preferences
     * @param {Object} options { mode: 'daily' | 'yearly', includePhotos: true | false }
     * @returns {Promise<Blob>} ZIP 檔案的 Blob
     */
    static async createBackupZip(data, options = { mode: 'daily', includePhotos: true }) {
        if (typeof window.JSZip === 'undefined') {
            throw new Error('找不到 JSZip 套件，請確認是否已載入。');
        }

        const zip = new window.JSZip();
        const dataFolder = zip.folder("data");
        const photosFolder = zip.folder("photos");

        const txs = data.transactions || [];
        
        // 處理照片抽離
        const processedTxs = txs.map(tx => {
            const newTx = { ...tx };
            if (newTx.attachment) {
                if (options.includePhotos) {
                    try {
                        const match = newTx.attachment.match(/^data:(image\/(jpeg|png|webp|gif));base64,(.*)$/);
                        if (match) {
                            const ext = match[2];
                            const base64Data = match[3];
                            // 若 newTx.id 不存在，則產生一個隨機字串作為替代
                            const safeId = newTx.id || ('gen_' + Math.random().toString(36).substring(2, 8));
                            const fileName = `tx_${safeId}.${ext}`;
                            photosFolder.file(fileName, base64Data, { base64: true });
                            newTx.photo_ref = `photos/${fileName}`;
                        }
                    } catch (e) {
                        console.warn(`[備份] 處理照片失敗 (ID: ${newTx.id || '未知'}):`, e);
                    }
                }
                // 無論是否備份照片，原來的 base64 都移除以節省空間
                delete newTx.attachment;
            }
            return newTx;
        });

        // 處理年度拆分 (僅針對 transactions)
        if (options.mode === 'yearly') {
            const yearlyData = {};
            processedTxs.forEach(tx => {
                const year = tx.date ? tx.date.substring(0, 4) : 'unknown';
                if (!yearlyData[year]) yearlyData[year] = [];
                yearlyData[year].push(tx);
            });

            for (const [year, yearTxs] of Object.entries(yearlyData)) {
                dataFolder.file(`transactions_${year}.json`, JSON.stringify(yearTxs, null, 2));
            }
        } else {
            // 日常備份：全部寫在一起
            dataFolder.file('transactions.json', JSON.stringify(processedTxs, null, 2));
        }

        // 寫入全域資料
        const globalData = {
            fixedRecords: data.fixedRecords || [],
            categories: data.categories || [],
            targets: data.targets || [],
            preferences: data.preferences || {}
        };
        dataFolder.file('global.json', JSON.stringify(globalData, null, 2));

        // 產生 ZIP Blob
        const zipBlob = await zip.generateAsync({ 
            type: "blob",
            compression: "DEFLATE",
            compressionOptions: {
                level: 6 // 適中的壓縮率
            }
        });
        return zipBlob;
    }

    /**
     * 解析 ZIP 備份檔並還原為資料物件
     * @param {Blob|ArrayBuffer} fileBuffer ZIP 檔案資料
     * @returns {Promise<Object>} 還原後的資料物件
     */
    static async extractBackupZip(fileBuffer) {
        if (typeof window.JSZip === 'undefined') {
            throw new Error('找不到 JSZip 套件，請確認是否已載入。');
        }

        const zip = new window.JSZip();
        await zip.loadAsync(fileBuffer);

        const restoredData = {
            transactions: [],
            fixedRecords: [],
            categories: [],
            targets: [],
            preferences: {}
        };

        // 讀取 data 資料夾內的所有 JSON
        const dataFolder = zip.folder("data");
        if (!dataFolder) {
            throw new Error('備份檔格式錯誤：找不到 data 資料夾');
        }

        // JSZip.folder 返回的是所有在這個 folder 內的檔案 (包含子目錄)
        // 為了避免問題，我們可以用 zip.files 遍歷
        const jsonFiles = Object.keys(zip.files).filter(name => name.startsWith('data/') && name.endsWith('.json'));
        
        for (const relativePath of jsonFiles) {
            const file = zip.file(relativePath);
            if (!file) continue;
            
            const content = await file.async("string");
            const parsed = JSON.parse(content);
            
            // 判斷檔名決定是哪種資料
            const fileName = relativePath.split('/').pop(); // data/transactions_2024.json -> transactions_2024.json
            
            if (fileName === 'global.json') {
                restoredData.fixedRecords = parsed.fixedRecords || [];
                restoredData.categories = parsed.categories || [];
                restoredData.targets = parsed.targets || [];
                restoredData.preferences = parsed.preferences || {};
            } else if (fileName.startsWith('transactions')) {
                restoredData.transactions = restoredData.transactions.concat(parsed);
            }
        }

        // 處理照片回填
        for (const tx of restoredData.transactions) {
            if (tx.photo_ref) {
                const photoFile = zip.file(tx.photo_ref);
                if (photoFile) {
                    try {
                        const base64Data = await photoFile.async("base64");
                        const ext = tx.photo_ref.split('.').pop();
                        tx.attachment = `data:image/${ext};base64,${base64Data}`;
                    } catch (e) {
                        console.warn(`[還原] 讀取照片失敗 (${tx.photo_ref}):`, e);
                    }
                }
                delete tx.photo_ref;
            }
        }

        return restoredData;
    }
}
