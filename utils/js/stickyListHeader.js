/**
 * ============================================================================
 * 浮動清單標題列 (StickyListHeader)
 * ============================================================================
 * 提供可黏滯 (Sticky) 固定在頂部的表頭元件，支援多欄位排版與全選 Checkbox。
 * 解決長清單捲動時看不見標題欄位的問題，並內建響應式與全選控制項。
 * 
 * @example
 * import { StickyListHeader } from './utils/js/stickyListHeader.js';
 * 
 * const header = new StickyListHeader({
 *   container: document.getElementById('my-list'),
 *   columns: [
 *     { text: '#',          width: '48px',  align: 'right' },
 *     { text: '類別',       flex: 1 },
 *     { text: '金額',       width: '100px', align: 'right' },
 *   ],
 *   checkbox: true,           // 是否在最左側顯示全選 checkbox
 *   onSelectAll: (checked) => { ... },
 * });
 * 
 * // 動態更新全選狀態
 * header.setChecked(true);
 * 
 * 說明：
 *   - 標題列會自動黏在捲動區域頂端 (position: sticky)
 *   - 支援深色/淺色模式，使用 CSS 變數適配
 *   - 每個欄位可設定 width (固定寬)、flex (彈性寬)、align (對齊)
 */

export class StickyListHeader {
    /**
     * @param {Object} options
     * @param {HTMLElement} options.container - 目標容器，標題列會插入到此容器最前方
     * @param {Array<Object>} options.columns - 欄位定義 [{ text, width?, flex?, align? }]
     * @param {boolean} [options.checkbox=false] - 是否顯示全選 checkbox
     * @param {Function} [options.onSelectAll] - 全選 checkbox 的 change 回呼 (checked: boolean)
     * @param {string} [options.checkboxId] - 全選 checkbox 的 ID（若需要從外部控制）
     */
    constructor(options) {
        this.container = options.container;
        this.columns = options.columns || [];
        this.showCheckbox = options.checkbox || false;
        this.onSelectAll = options.onSelectAll || null;
        this.checkboxId = options.checkboxId || null;

        this.headerEl = null;
        this.checkboxEl = null;

        this._render();
    }

    _render() {
        // 建立標題列容器
        const row = document.createElement('div');
        row.className = 'sticky-list-header';

        // 全選 checkbox
        if (this.showCheckbox) {
            const cbWrap = document.createElement('div');
            cbWrap.className = 'sticky-header-checkbox';
            const cb = document.createElement('input');
            cb.type = 'checkbox';
            if (this.checkboxId) cb.id = this.checkboxId;
            cb.addEventListener('change', (e) => {
                if (this.onSelectAll) this.onSelectAll(e.target.checked);
            });
            cbWrap.appendChild(cb);
            row.appendChild(cbWrap);
            this.checkboxEl = cb;
        }

        // 欄位
        this.columns.forEach(col => {
            const cell = document.createElement('div');
            cell.className = 'sticky-header-cell';

            if (col.textRight) {
                // 左右文字模式：同一個 cell 裡左右各一
                cell.style.display = 'flex';
                cell.style.justifyContent = 'space-between';
                cell.style.alignItems = 'center';
                const spanLeft = document.createElement('span');
                spanLeft.textContent = col.text || '';
                const spanRight = document.createElement('span');
                spanRight.textContent = col.textRight;
                cell.appendChild(spanLeft);
                cell.appendChild(spanRight);
            } else {
                cell.textContent = col.text || '';
            }

            if (col.width) cell.style.width = col.width;
            if (col.minWidth) cell.style.minWidth = col.minWidth;
            if (col.flex) cell.style.flex = col.flex;
            if (col.align && !col.textRight) cell.style.textAlign = col.align;

            row.appendChild(cell);
        });

        this.headerEl = row;

        // 插入到容器最前方
        if (this.container.firstChild) {
            this.container.insertBefore(row, this.container.firstChild);
        } else {
            this.container.appendChild(row);
        }
    }

    /** 設定全選 checkbox 的勾選狀態 */
    setChecked(checked) {
        if (this.checkboxEl) this.checkboxEl.checked = checked;
    }

    /** 移除標題列 */
    destroy() {
        if (this.headerEl && this.headerEl.parentNode) {
            this.headerEl.parentNode.removeChild(this.headerEl);
        }
    }
}
