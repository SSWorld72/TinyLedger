/**
 * 跨專案共用語意提示框模組 (Semantic Tip Box)
 * 
 * 提供標準化的語意提示框 HTML 產生器，支援 5 種類型：
 * - info    (藍色) — 一般資訊說明、操作提示
 * - success (綠色) — 成功、完成、正面確認
 * - warning (橘色) — 警告、建議、注意事項
 * - danger  (紅色) — 危險操作、不可逆、錯誤
 * - note    (紫色) — 附註、補充說明、備忘
 * 
 * 使用固定的語意色彩（不受主題引擎影響），確保在任何自訂主題下都清晰可辨。
 * 採用 inline style，零 CSS 依賴，可直接跨專案複製使用。
 * 
 * @module tipBox
 * @example
 * import { createTipBox } from '../utils/js/tipBox.js';
 * 
 * // 產生 HTML 字串
 * const html = createTipBox({
 *     type: 'warning',
 *     html: '💡 <strong>建議設定：</strong>最少要設定在 480x480 以上。'
 * });
 * 
 * // 插入 DOM
 * container.innerHTML = html;
 * 
 * // 或使用 DOM 元素版本
 * const element = createTipBoxElement({
 *     type: 'success',
 *     html: '✅ <strong>備份完成：</strong>所有資料已安全儲存。'
 * });
 * container.appendChild(element);
 */

/**
 * 五種語意類型的色彩定義
 * 每種類型包含：背景色、邊框色、左邊條色、文字色
 * @readonly
 */
const TIP_STYLES = {
    info: {
        bg: '#eff6ff',        // blue-50
        border: '#bfdbfe',    // blue-200
        accent: '#3b82f6',    // blue-500
        text: '#1e40af',      // blue-800
        darkBg: 'rgba(59, 130, 246, 0.1)',
        darkBorder: 'rgba(59, 130, 246, 0.2)',
        darkText: '#93c5fd'   // blue-300
    },
    success: {
        bg: '#ecfdf5',        // emerald-50
        border: '#a7f3d0',    // emerald-200
        accent: '#10b981',    // emerald-500
        text: '#065f46',      // emerald-800
        darkBg: 'rgba(16, 185, 129, 0.1)',
        darkBorder: 'rgba(16, 185, 129, 0.2)',
        darkText: '#6ee7b7'   // emerald-300
    },
    warning: {
        bg: '#fff7ed',        // orange-50
        border: '#fed7aa',    // orange-200
        accent: '#f97316',    // orange-500
        text: '#9a3412',      // orange-800
        darkBg: 'rgba(249, 115, 22, 0.1)',
        darkBorder: 'rgba(249, 115, 22, 0.2)',
        darkText: '#fdba74'   // orange-300
    },
    danger: {
        bg: '#fef2f2',        // red-50
        border: '#fecaca',    // red-200
        accent: '#ef4444',    // red-500
        text: '#991b1b',      // red-800
        darkBg: 'rgba(239, 68, 68, 0.1)',
        darkBorder: 'rgba(239, 68, 68, 0.2)',
        darkText: '#fca5a5'   // red-300
    },
    note: {
        bg: '#faf5ff',        // purple-50
        border: '#e9d5ff',    // purple-200
        accent: '#a855f7',    // purple-500
        text: '#6b21a8',      // purple-800
        darkBg: 'rgba(168, 85, 247, 0.1)',
        darkBorder: 'rgba(168, 85, 247, 0.2)',
        darkText: '#d8b4fe'   // purple-300
    }
};

/**
 * 產生語意提示框的 HTML 字串
 * 
 * @param {Object} options - 設定選項
 * @param {'info'|'success'|'warning'|'danger'|'note'} options.type - 語意類型
 * @param {string} options.html - 提示框內容（支援 HTML）
 * @param {string} [options.fontSize='0.85rem'] - 字體大小
 * @returns {string} 完整的提示框 HTML 字串
 */
export function createTipBox({ type = 'info', html = '', fontSize = '0.85rem' } = {}) {
    const style = TIP_STYLES[type];
    if (!style) {
        console.warn(`[TipBox] 未知的提示類型: ${type}，將使用 info 類型`);
        return createTipBox({ type: 'info', html, fontSize });
    }

    return `<div class="tip-box tip-box-${type}" style="
        font-size: ${fontSize};
        line-height: 1.6;
        padding: 10px 12px;
        border-radius: 8px;
        border: 1px solid ${style.border};
        border-left: 4px solid ${style.accent};
        background: ${style.bg};
        color: ${style.text};
    ">${html}</div>`;
}

/**
 * 產生語意提示框的 DOM 元素
 * 
 * @param {Object} options - 設定選項（同 createTipBox）
 * @param {'info'|'success'|'warning'|'danger'|'note'} options.type - 語意類型
 * @param {string} options.html - 提示框內容（支援 HTML）
 * @param {string} [options.fontSize='0.85rem'] - 字體大小
 * @returns {HTMLDivElement} 提示框 DOM 元素
 */
export function createTipBoxElement({ type = 'info', html = '', fontSize = '0.85rem' } = {}) {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = createTipBox({ type, html, fontSize });
    return wrapper.firstElementChild;
}

/**
 * 取得語意色彩定義（供外部進階客製使用）
 * 
 * @param {'info'|'success'|'warning'|'danger'|'note'} type - 語意類型
 * @returns {Object|null} 色彩定義物件，若類型不存在則回傳 null
 */
export function getTipStyle(type) {
    return TIP_STYLES[type] || null;
}
