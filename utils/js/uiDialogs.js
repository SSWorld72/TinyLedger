/**
 * ============================================================================
 * 共用 UI 彈窗元件 (uiDialogs)
 * ============================================================================
 * 提供泛用的對話框、選項彈窗等，基於 Tailwind CSS 構建。
 * 
 * @example
 * import { showConfirmModal } from '../../utils/js/uiDialogs.js';
 * 
 * const choice = await showConfirmModal({
 *     title: '選擇還原方式',
 *     choices: [
 *         { id: 'merge', title: '合併', desc: '保留現有資料' },
 *         { id: 'overwrite', title: '覆蓋', desc: '清空所有資料' }
 *     ]
 * });
 * console.log(choice); // 'merge' 或 'overwrite' 或 null
 */

/**
 * 顯示一個精美的選項彈窗
 * @param {Object} config - 彈窗設定
 * @param {string} config.title - 標題
 * @param {string} config.subtitle - 副標題
 * @param {string} config.icon - 標題左側圖示 (emoji)
 * @param {Array} config.choices - 選項陣列
 *   - id: 選項的識別碼 (回傳用)
 *   - title: 選項標題
 *   - badge: 右側小標籤文字
 *   - desc: 選項說明
 *   - icon: 左側圖示 (emoji)
 *   - isPrimary: 是否為主要推薦選項 (樣式不同)
 * @returns {Promise<string|null>} - 使用者選擇的 id，若取消則回傳 null
 */
export function showOptionsModal(config) {
    return new Promise((resolve) => {
        const modalId = 'modal-generic-options-choice';
        const existingModal = document.getElementById(modalId);
        if (existingModal) existingModal.remove();

        const modal = document.createElement('div');
        modal.id = modalId;
        modal.className = 'fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-[9999] p-4 transition-all duration-200 animate-in fade-in';
        
        let choicesHtml = '';
        config.choices.forEach(c => {
            if (c.isPrimary) {
                choicesHtml += `
                    <button id="btn-choice-${c.id}" class="w-full text-left p-4 rounded-xl border-2 border-blue-500 bg-blue-50/50 hover:bg-blue-50 hover:border-blue-600 transition-all flex items-start gap-3.5 group cursor-pointer">
                        <div class="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 text-sm font-semibold shadow-xs">
                            ${c.icon || '★'}
                        </div>
                        <div class="flex-1">
                            <div class="flex items-center justify-between">
                                <span class="font-bold text-blue-900 text-sm">${c.title}</span>
                                ${c.badge ? `<span class="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">${c.badge}</span>` : ''}
                            </div>
                            <p class="text-[11px] text-blue-700/80 mt-1 leading-relaxed">${c.desc}</p>
                        </div>
                    </button>
                `;
            } else {
                choicesHtml += `
                    <button id="btn-choice-${c.id}" class="w-full text-left p-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all flex items-start gap-3.5 group cursor-pointer">
                        <div class="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center shrink-0 text-sm font-semibold shadow-xs group-hover:bg-slate-200 group-hover:text-slate-600 transition-colors">
                            ${c.icon || '⚡'}
                        </div>
                        <div class="flex-1">
                            <div class="flex items-center justify-between">
                                <span class="font-bold text-slate-700 text-sm group-hover:text-slate-800 transition-colors">${c.title}</span>
                                ${c.badge ? `<span class="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-medium">${c.badge}</span>` : ''}
                            </div>
                            <p class="text-[11px] text-slate-500 mt-1 leading-relaxed">${c.desc}</p>
                        </div>
                    </button>
                `;
            }
        });

        modal.innerHTML = `
            <div class="bg-surface rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-theme transform transition-all scale-100">
                <div class="px-6 pt-6 pb-4 border-b border-theme flex items-center justify-between">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg shadow-xs">
                            ${config.icon || '📦'}
                        </div>
                        <div>
                            <h3 class="text-base font-bold text-main tracking-tight">${config.title}</h3>
                            <p class="text-xs text-muted mt-0.5">${config.subtitle || ''}</p>
                        </div>
                    </div>
                    <button id="btn-generic-choice-close" class="text-muted hover:text-main p-1.5 rounded-lg hover:bg-slate-500/10 transition-colors">
                        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>
                
                <div class="p-6 space-y-3">
                    ${choicesHtml}
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);

        const closeBtn = document.getElementById('btn-generic-choice-close');

        const cleanup = () => {
            modal.classList.remove('fade-in');
            modal.classList.add('fade-out');
            setTimeout(() => modal.remove(), 200);
        };

        closeBtn.onclick = () => { cleanup(); resolve(null); };
        modal.onclick = (e) => { if (e.target === modal) { cleanup(); resolve(null); } };

        config.choices.forEach(c => {
            const btn = document.getElementById(`btn-choice-${c.id}`);
            if (btn) {
                btn.onclick = () => { cleanup(); resolve(c.id); };
            }
        });
    });
}

/**
 * 顯示二次確認彈窗 (支援危險樣式)
 * @param {Object} config - 彈窗設定
 * @param {string} config.title - 標題
 * @param {string} config.message - 詳細訊息 (支援多行文字，可用 \n)
 * @param {boolean} [config.isDanger=false] - 是否為危險操作 (紅色樣式)
 * @param {string} [config.confirmText='確定'] - 確認按鈕文字
 * @param {string} [config.cancelText='取消'] - 取消按鈕文字
 * @param {string} [config.icon] - 左側圖示，預設為 ❓ 或 ⚠️
 * @returns {Promise<boolean>} - 回傳 true 表示確認，false 表示取消
 */
export function showConfirmModal(config) {
    return new Promise((resolve) => {
        const modalId = 'modal-generic-confirm';
        const existingModal = document.getElementById(modalId);
        if (existingModal) existingModal.remove();

        const modal = document.createElement('div');
        modal.id = modalId;
        modal.className = 'fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-[9999] p-4 transition-all duration-200 animate-in fade-in';
        
        const isDanger = config.isDanger === true;
        const defaultIcon = isDanger ? '⚠️' : '❓';
        const iconThemeClass = isDanger ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600';
        const confirmBtnClass = isDanger 
            ? 'bg-red-600 hover:bg-red-700 text-white shadow-sm border border-transparent focus:ring-2 focus:ring-red-500 focus:ring-offset-1'
            : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm border border-transparent focus:ring-2 focus:ring-blue-500 focus:ring-offset-1';
        
        // 將 \n 轉換為 <br> 以支援多行訊息
        const messageHtml = (config.message || '').replace(/\n/g, '<br>');

        modal.innerHTML = `
            <div class="bg-surface rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden border border-theme transform transition-all scale-100">
                <div class="p-6">
                    <div class="flex flex-col items-center text-center gap-4">
                        <div class="w-14 h-14 rounded-full ${iconThemeClass} flex items-center justify-center font-bold text-2xl shadow-xs ring-4 ring-white">
                            ${config.icon || defaultIcon}
                        </div>
                        <div>
                            <h3 class="text-lg font-bold text-main tracking-tight">${config.title}</h3>
                            <p class="text-sm text-muted mt-2 leading-relaxed">${messageHtml}</p>
                        </div>
                    </div>
                </div>
                
                <div class="px-6 py-4 bg-surface border-t border-theme flex gap-3">
                    <button id="btn-generic-confirm-cancel" class="btn-secondary flex-1 px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-xs focus:outline-none focus:ring-2 focus:ring-slate-200">
                        ${config.cancelText || '取消'}
                    </button>
                    <button id="btn-generic-confirm-ok" class="flex-1 px-4 py-2 rounded-lg text-sm font-semibold transition-all focus:outline-none ${confirmBtnClass}">
                        ${config.confirmText || '確定'}
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);

        const btnCancel = document.getElementById('btn-generic-confirm-cancel');
        const btnOk = document.getElementById('btn-generic-confirm-ok');

        const cleanup = () => {
            modal.classList.remove('fade-in');
            modal.classList.add('fade-out');
            setTimeout(() => modal.remove(), 200);
        };

        btnCancel.onclick = () => { cleanup(); resolve(false); };
        btnOk.onclick = () => { cleanup(); resolve(true); };
        modal.onclick = (e) => { if (e.target === modal) { cleanup(); resolve(false); } };
    });
}
