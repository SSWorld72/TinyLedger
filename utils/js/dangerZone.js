import { showConfirmModal } from './uiDialogs.js';
import { createTipBox } from './tipBox.js';

/**
 * ============================================================================
 * 危險操作與資料庫清理 (Danger Zone)
 * ============================================================================
 * 提供系統層級的危險操作（如清除所有資料），並自帶防呆驗證彈窗與後續處理。
 * 
 * @example
 * import { mountDangerZone } from '../../utils/js/dangerZone.js';
 * 
 * // 綁定清除所有資料的按鈕，自動帶入雙重確認彈窗
 * mountDangerZone('btn-danger-clear', 'YourProjectDB');
 *//**
 * 共用輔助函式：刪除指定的 IndexedDB 資料庫
 * @param {string} dbName - 資料庫名稱
 * @returns {Promise<void>}
 */
export function deleteIndexedDB(dbName) {
    return new Promise((resolve, reject) => {
        const request = indexedDB.deleteDatabase(dbName);
        request.onsuccess = () => {
            console.log(`[資料庫] 資料庫 ${dbName} 已成功刪除`);
            resolve();
        };
        request.onerror = (e) => {
            console.error(`[資料庫] 刪除資料庫 ${dbName} 失敗:`, e);
            reject(new Error("無法刪除資料庫"));
        };
        request.onblocked = () => {
            console.warn(`[資料庫] 刪除被阻擋，請關閉其他使用此資料庫的分頁`);
            reject(new Error("刪除被阻擋，請關閉其他分頁"));
        };
    });
}


/**
 * 共用危險區域模組
 * 提供標準化的危險區域 UI 與二次確認邏輯，用於清空資料庫等高風險操作
 */
export class DangerZoneModule {
    /**
     * @param {Object} config 
     * @param {HTMLElement} config.container - 要掛載危險區域的 DOM 節點
     * @param {string} [config.title='危險區域'] - 區塊標題
     * @param {string} [config.description='清空本機的所有資料。如果您想重新開始，或清除異常資料，可點擊下方按鈕。(此操作無法復原)'] - 說明文字
     * @param {string} [config.buttonText='強制清空本機所有資料'] - 按鈕文字
     * @param {string} [config.confirmTitle='確定要清空嗎？'] - 第一次確認視窗標題
     * @param {string} [config.confirmMessage='這將會徹底刪除您手機/電腦內所有的本地資料。此操作無法復原，請確認您已經備份！'] - 第一次確認訊息
     * @param {string} [config.doubleConfirmTitle='最後確認'] - 第二次確認視窗標題
     * @param {string} [config.doubleConfirmMessage='真的要清空嗎？此操作將永久銷毀本地資料庫。'] - 第二次確認訊息
     * @param {Function} config.onClear - 執行清除邏輯的 async 函式。執行完畢後會自動 reload。
     * @param {Function} [config.setBusy] - 可選的 loading 狀態切換函式，例如 (isBusy, msg) => {}
     */
    constructor(config) {
        this.container = config.container;
        this.config = {
            title: config.title || '危險區域',
            description: config.description || '清空本機的所有資料。如果您想重新開始，或清除異常資料，可點擊下方按鈕。(此操作無法復原)',
            buttonText: config.buttonText || '強制清空本機所有資料',
            confirmTitle: config.confirmTitle || '確定要清空嗎？',
            confirmMessage: config.confirmMessage || '這將會徹底刪除您手機/電腦內所有的本地資料。\n此操作無法復原，請確認您已經備份！',
            doubleConfirmTitle: config.doubleConfirmTitle || '最後確認',
            doubleConfirmMessage: config.doubleConfirmMessage || '真的要清空嗎？\n此操作將永久銷毀本地資料庫。',
            onClear: config.onClear,
            setBusy: config.setBusy || (() => {})
        };

        if (!this.container) {
            console.error('[DangerZone] 初始化失敗：未提供 container 掛載點');
            return;
        }

        this.render();
        this.bindEvents();
    }

    render() {
        // 使用 Tailwind 兼容的內聯樣式與類別，確保在沒有 Tailwind 的專案也能正常顯示
        this.container.innerHTML = `
            <div style="margin-top: 1.5rem; border-top: 1px dashed #fca5a5; padding-top: 1.5rem;">
                <h4 style="color: #ef4444; margin-bottom: 0.5rem; font-size: 0.95rem; display: flex; align-items: center; gap: 4px; font-weight: 600;">
                    <svg style="width: 1.1rem; height: 1.1rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                    </svg>
                    ${this.config.title}
                </h4>
                <div style="margin-bottom: 1rem;">
                    ${createTipBox({ type: 'danger', html: this.config.description })}
                </div>
                <button id="btn-danger-zone-execute" 
                    style="width: 100%; background-color: #fef2f2; color: #ef4444; border: 1px solid #fecaca; padding: 10px 16px; border-radius: 8px; font-weight: 600; display: flex; justify-content: center; align-items: center; gap: 6px; transition: all 0.2s; cursor: pointer;"
                    onmouseover="this.style.backgroundColor='#fee2e2'; this.style.borderColor='#f87171';"
                    onmouseout="this.style.backgroundColor='#fef2f2'; this.style.borderColor='#fecaca';">
                    <svg style="width: 1.25rem; height: 1.25rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                    ${this.config.buttonText}
                </button>
            </div>
        `;
    }

    bindEvents() {
        const btn = this.container.querySelector('#btn-danger-zone-execute');
        btn.addEventListener('click', async () => {
            // 第一次確認
            const firstConfirm = await showConfirmModal({
                title: this.config.confirmTitle,
                message: this.config.confirmMessage,
                isDanger: true,
                confirmText: '我要清空',
                cancelText: '取消',
                icon: '⚠️'
            });

            if (!firstConfirm) return;

            // 第二次確認
            const secondConfirm = await showConfirmModal({
                title: this.config.doubleConfirmTitle,
                message: this.config.doubleConfirmMessage,
                isDanger: true,
                confirmText: '確定銷毀資料',
                cancelText: '再想一下',
                icon: '🔥'
            });

            if (!secondConfirm) return;

            // 執行清空邏輯
            if (this.config.setBusy) {
                this.config.setBusy(true, { title: '正在清空資料', detail: '刪除中...' });
            }

            try {
                if (typeof this.config.onClear === 'function') {
                    await this.config.onClear();
                }
                
                // 成功清除後，重載頁面以反映最新狀態
                if (this.config.setBusy) this.config.setBusy(false);
                alert('✅ 本機所有資料已徹底清空！系統將自動重新載入。');
                window.location.reload();
                
            } catch (error) {
                console.error('[DangerZone] 清空資料失敗:', error);
                if (this.config.setBusy) this.config.setBusy(false);
                alert('清空資料時發生錯誤: ' + error.message);
            }
        });
    }
}

/**
 * 高階輔助函式：一鍵掛載危險區域
 * 將類別實例化、資料庫刪除與 localStorage 清除邏輯完全封裝。
 * 
 * @param {Object} config
 * @param {string} config.containerId - 掛載點元素的 ID
 * @param {string} config.dbName - 要刪除的 IndexedDB 名稱
 * @param {string} [config.localStorageKey] - 要刪除的 LocalStorage 鍵名
 * @param {string} [config.description] - 客製化說明文字
 * @param {Function} [config.preClear] - 清空前的 hook 函式 (可用於關閉 DB 連線)
 */
export function mountDangerZone(config) {
    const container = document.getElementById(config.containerId);
    if (!container) {
        console.warn(`[DangerZone] 找不到掛載點 #${config.containerId}`);
        return;
    }

    new DangerZoneModule({
        container: container,
        description: config.description,
        onClear: async () => {
            if (typeof config.preClear === 'function') {
                await config.preClear();
            }
            if (config.dbName) {
                await deleteIndexedDB(config.dbName);
            }
            if (config.localStorageKey) {
                localStorage.removeItem(config.localStorageKey);
            }
        }
    });
}
