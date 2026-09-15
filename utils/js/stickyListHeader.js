/**
 * ============================================================================
 * Sticky List Header (StickyListHeader)
 * ============================================================================
 * Provides a sticky header component for lists, supporting multi-column layout and a select-all checkbox.
 * Solves the issue of invisible header columns during long list scrolling, and includes responsive and select-all controls.
 * 
 * @example
 * import { StickyListHeader } from './utils/js/stickyListHeader.js';
 * 
 * const header = new StickyListHeader({
 *   container: document.getElementById('my-list'),
 *   columns: [
 *     { text: '#',          width: '48px',  align: 'right' },
 *     { text: 'Category',   flex: 1 },
 *     { text: 'Amount',     width: '100px', align: 'right' },
 *   ],
 *   checkbox: true,           // Whether to show select-all checkbox on the far left
 *   onSelectAll: (checked) => { ... },
 * });
 * 
 * // Dynamically update select-all status
 * header.setChecked(true);
 * 
 * Description:
 *   - The header will automatically stick to the top of the scrollable area (position: sticky)
 *   - Supports dark/light mode, adapts using CSS variables
 *   - Each column can be configured with width (fixed), flex (flexible), and align (alignment)
 */

export class StickyListHeader {
    /**
     * @param {Object} options
     * @param {HTMLElement} options.container - Target container, header will be prepended to this container
     * @param {Array<Object>} options.columns - Column definitions [{ text, width?, flex?, align? }]
     * @param {boolean} [options.checkbox=false] - Whether to show the select-all checkbox
     * @param {Function} [options.onSelectAll] - Change callback for select-all checkbox (checked: boolean)
     * @param {string} [options.checkboxId] - ID for the select-all checkbox (if external control is needed)
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
        // Create header row container
        const row = document.createElement('div');
        row.className = 'sticky-list-header';

        // Select-all checkbox
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

        // Columns
        this.columns.forEach(col => {
            const cell = document.createElement('div');
            cell.className = 'sticky-header-cell';

            if (col.textRight) {
                // Left-right text mode: one on the left, one on the right in the same cell
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

        // Prepend to container
        if (this.container.firstChild) {
            this.container.insertBefore(row, this.container.firstChild);
        } else {
            this.container.appendChild(row);
        }
    }

    /** Set checked state of the select-all checkbox */
    setChecked(checked) {
        if (this.checkboxEl) this.checkboxEl.checked = checked;
    }

    /** Remove the header */
    destroy() {
        if (this.headerEl && this.headerEl.parentNode) {
            this.headerEl.parentNode.removeChild(this.headerEl);
        }
    }
}
