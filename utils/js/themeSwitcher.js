/**
 * ============================================================================
 * 主題切換器 (ThemeSwitcher)
 * ============================================================================
 * 深色 / 淺色 / 自動 (跟隨系統) 主題模式的切換與自訂調色盤管理。
 * 
 * 功能特色：
 * 1. 透過 `window.matchMedia` 監聽系統主題，自動切換 <html> 的 `.dark` class。
 * 2. 內建多套自訂調色盤 (如：蜜桃甜心、綠碼幽光、焦糖瑪奇朵等)。
 * 3. 動態注入 CSS 變數 (`--bg-color`, `--primary-color` 等) 至 `<style id="theme-vars">` 中，讓全站 UI 隨主題連動。
 * 
 * @example
 * import { ThemeSwitcher } from '../../utils/js/themeSwitcher.js';
 * 
 * // 初始化主題控制器
 * const themeSwitcher = new ThemeSwitcher('my_app_theme', 'auto');
 * 
 * // 套用預設或特定的調色盤
 * themeSwitcher.setCustomTheme('peach'); 
 * 
 * // 切換深色/淺色/自動模式
 * themeSwitcher.setTheme('dark'); 
 */
export class ThemeSwitcher {
    /**
     * @param {string} storageKey - Key to save theme preference in localStorage
     * @param {string} defaultTheme - 'auto', 'light', or 'dark'
     */
    constructor(storageKey = 'theme-preference', defaultTheme = 'auto') {
        this.storageKey = storageKey;
        this.currentPreference = localStorage.getItem(this.storageKey) || defaultTheme;

        // Listen to system changes if 'auto'
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (this.currentPreference === 'auto') {
                this.applyTheme(e.matches ? 'dark' : 'light');
            }
        });

        // Initial application
        this.setTheme(this.currentPreference);
    }

    setTheme(theme) {
        this.currentPreference = theme;
        localStorage.setItem(this.storageKey, theme);

        let targetTheme = theme;
        if (theme === 'auto') {
            targetTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }

        this.applyTheme(targetTheme);
    }

    applyTheme(theme) {
        // 先尋找對應的主題定義
        const themeDef = ThemeSwitcher.THEME_MODULES.find(t => t.id === theme) || ThemeSwitcher.THEME_MODULES.find(t => t.id === 'light');

        // 1. 處理基礎 Dark/Light DOM 標籤 (解決底層基礎黑白架構)
        let isDark = theme === 'dark' || themeDef.forceDark;
        if (theme === 'auto') {
            isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        }

        if (isDark) {
            document.documentElement.setAttribute('data-theme', 'dark');
        } else {
            document.documentElement.removeAttribute('data-theme');
        }

        // 2. 處理動態變數注入
        // 先清除所有可能被注入過的舊變數，讓它能乾淨地退回 modern-ui.css 的預設值
        const allVars = [
            '--bg-color', '--surface-color', '--surface-solid',
            '--primary-color', '--primary-hover', '--secondary-color',
            '--text-main', '--text-muted', '--border-color',
            '--active-bg', '--active-text', '--modal-bg',
            '--label-bg', '--label-color'
        ];
        allVars.forEach(v => document.documentElement.style.removeProperty(v));

        // 3. 注入新主題定義的變數
        if (themeDef.variables) {
            Object.entries(themeDef.variables).forEach(([key, value]) => {
                document.documentElement.style.setProperty(key, value);
            });
        }

        // 4. 如果是自定義主題，嘗試從 localStorage 讀取
        if (themeDef.isCustom) {
            try {
                const customVars = JSON.parse(localStorage.getItem('tinyledger_custom_theme') || '{}');
                Object.entries(customVars).forEach(([key, value]) => {
                    document.documentElement.style.setProperty(key, value);
                });
            } catch (e) {
                console.warn('[ThemeSwitcher] 讀取自訂主題失敗', e);
            }
        }
    }

    getPreference() {
        return this.currentPreference;
    }

    /**
     * 主題模組定義檔 (Theme Registry)
     * 定義所有可用的主題外觀與卡片樣式。
     * 若要新增主題 (如 OLED 極黑模式)，只需在此新增一筆物件即可。
     */
    static THEME_MODULES = [
        {
            id: 'auto',
            name: '跟隨系統',
            desc: '依照裝置設定',
            icon: 'brightness_auto',
            iconBg: 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
        },
        {
            id: 'light',
            name: '淺色模式',
            desc: '明亮乾淨介面',
            icon: 'light_mode',
            iconBg: 'bg-orange-50 dark:bg-slate-700 text-orange-500 dark:text-slate-300',
            swatches: ['#F8FAFC', '#FFFFFF', '#4F46E5', '#6366F1', '#0F172A', '#E2E8F0']
        },
        {
            id: 'dark',
            name: '深色模式',
            desc: '護眼沉浸體驗',
            icon: 'dark_mode',
            iconBg: 'bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300',
            swatches: ['#0F172A', '#1E293B', '#6366F1', '#4F46E5', '#F8FAFC', '#334155']
        },
        {
            id: 'pink',
            name: '蜜桃甜心',
            desc: '甜蜜溫柔的粉嫩氛圍',
            icon: 'local_florist',
            iconBg: 'bg-pink-50 dark:bg-pink-500/20 text-pink-500 dark:text-pink-300',
            swatches: ['#FDF2F8', '#FFFFFF', '#DB2777', '#F472B6', '#831843', '#FCE7F3'],
            variables: {
                '--bg-color': '#FDF2F8',
                '--surface-color': 'rgba(255, 255, 255, 0.8)',
                '--surface-solid': '#FFFFFF',
                '--primary-color': '#DB2777',
                '--primary-hover': '#BE185D',
                '--secondary-color': '#F472B6',
                '--text-main': '#831843',
                '--text-muted': '#9D174D',
                '--border-color': '#FCE7F3',
                '--active-bg': 'rgba(219, 39, 119, 0.1)',
                '--active-text': '#BE185D',
                '--modal-bg': 'rgba(253, 242, 248, 0.85)',
                '--label-bg': '#FCE7F3',
                '--label-color': '#9D174D'
            }
        },
        {
            id: 'green',
            name: '綠碼幽光',
            desc: '閃爍的神秘綠碼',
            icon: 'terminal',
            iconBg: 'bg-green-50 dark:bg-green-500/20 text-green-500 dark:text-green-300',
            swatches: ['#050505', '#111827', '#22C55E', '#15803D', '#4ADE80', '#064E3B'],
            variables: {
                '--bg-color': '#050505',
                '--surface-color': 'rgba(17, 24, 39, 0.8)',
                '--surface-solid': '#111827',
                '--primary-color': '#22C55E',
                '--primary-hover': '#16A34A',
                '--secondary-color': '#15803D',
                '--text-main': '#4ADE80',
                '--text-muted': '#22C55E',
                '--border-color': '#064E3B',
                '--active-bg': 'rgba(34, 197, 94, 0.15)',
                '--active-text': '#86EFAC',
                '--modal-bg': 'rgba(5, 5, 5, 0.9)',
                '--label-bg': '#064E3B',
                '--label-color': '#4ADE80'
            },
            forceDark: true
        },
        {
            id: 'blue',
            name: '碧波微瀾',
            desc: '柔和寧靜的藍光',
            icon: 'water_drop',
            iconBg: 'bg-blue-50 dark:bg-blue-500/20 text-blue-500 dark:text-blue-300',
            swatches: ['#F0F9FF', '#FFFFFF', '#0369A1', '#38BDF8', '#082F49', '#E0F2FE'],
            variables: {
                '--bg-color': '#F0F9FF',
                '--surface-color': 'rgba(255, 255, 255, 0.8)',
                '--surface-solid': '#FFFFFF',
                '--primary-color': '#0369A1',
                '--primary-hover': '#075985',
                '--secondary-color': '#38BDF8',
                '--text-main': '#082F49',
                '--text-muted': '#0C4A6E',
                '--border-color': '#E0F2FE',
                '--active-bg': 'rgba(3, 105, 161, 0.1)',
                '--active-text': '#075985',
                '--modal-bg': 'rgba(240, 249, 255, 0.85)',
                '--label-bg': '#E0F2FE',
                '--label-color': '#0C4A6E'
            }
        },
        {
            id: 'purple',
            name: '薰衣草園',
            desc: '瀰漫芬芳的薰紫色調',
            icon: 'nightlight',
            iconBg: 'bg-purple-50 dark:bg-purple-500/20 text-purple-500 dark:text-purple-300',
            swatches: ['#FAF5FF', '#FFFFFF', '#7E22CE', '#A855F7', '#3B0764', '#F3E8FF'],
            variables: {
                '--bg-color': '#FAF5FF',
                '--surface-color': 'rgba(255, 255, 255, 0.8)',
                '--surface-solid': '#FFFFFF',
                '--primary-color': '#7E22CE',
                '--primary-hover': '#6B21A8',
                '--secondary-color': '#A855F7',
                '--text-main': '#3B0764',
                '--text-muted': '#581C87',
                '--border-color': '#F3E8FF',
                '--active-bg': 'rgba(126, 34, 206, 0.1)',
                '--active-text': '#6B21A8',
                '--modal-bg': 'rgba(250, 245, 255, 0.85)',
                '--label-bg': '#F3E8FF',
                '--label-color': '#581C87'
            }
        },
        {
            id: 'amber',
            name: '琥珀暖陽',
            desc: '溫暖活力，像午後陽光般舒適',
            icon: 'wb_sunny',
            iconBg: 'bg-amber-50 dark:bg-amber-500/20 text-amber-500 dark:text-amber-300',
            swatches: ['#FFFBEB', '#FFFFFF', '#D97706', '#F59E0B', '#78350F', '#FEF3C7'],
            variables: {
                '--bg-color': '#FFFBEB',
                '--surface-color': 'rgba(255, 255, 255, 0.8)',
                '--surface-solid': '#FFFFFF',
                '--primary-color': '#D97706',
                '--primary-hover': '#B45309',
                '--secondary-color': '#F59E0B',
                '--text-main': '#78350F',
                '--text-muted': '#92400E',
                '--border-color': '#FEF3C7',
                '--active-bg': 'rgba(217, 119, 6, 0.1)',
                '--active-text': '#B45309',
                '--modal-bg': 'rgba(255, 251, 235, 0.85)',
                '--label-bg': '#FEF3C7',
                '--label-color': '#92400E'
            }
        },
        {
            id: 'orange',
            name: '焦糖瑪奇朵',
            desc: '醇厚質感，帶來咖啡館的愜意氛圍',
            icon: 'coffee',
            iconBg: 'bg-orange-50 dark:bg-orange-500/20 text-orange-500 dark:text-orange-300',
            swatches: ['#FFF7ED', '#FFFFFF', '#C2410C', '#EA580C', '#431407', '#FFEDD5'],
            variables: {
                '--bg-color': '#FFF7ED',
                '--surface-color': 'rgba(255, 255, 255, 0.8)',
                '--surface-solid': '#FFFFFF',
                '--primary-color': '#C2410C',
                '--primary-hover': '#9A3412',
                '--secondary-color': '#EA580C',
                '--text-main': '#431407',
                '--text-muted': '#7C2D12',
                '--border-color': '#FFEDD5',
                '--active-bg': 'rgba(194, 65, 12, 0.1)',
                '--active-text': '#9A3412',
                '--modal-bg': 'rgba(255, 247, 237, 0.85)',
                '--label-bg': '#FFEDD5',
                '--label-color': '#7C2D12'
            }
        },
        {
            id: 'teal',
            name: '薄荷微風',
            desc: '清新舒爽，如夏日微風般的薄荷綠',
            icon: 'air',
            iconBg: 'bg-teal-50 dark:bg-teal-500/20 text-teal-500 dark:text-teal-300',
            swatches: ['#F0FDFA', '#FFFFFF', '#0D9488', '#14B8A6', '#134E4A', '#CCFBF1'],
            variables: {
                '--bg-color': '#F0FDFA',
                '--surface-color': 'rgba(255, 255, 255, 0.8)',
                '--surface-solid': '#FFFFFF',
                '--primary-color': '#0D9488',
                '--primary-hover': '#0F766E',
                '--secondary-color': '#14B8A6',
                '--text-main': '#134E4A',
                '--text-muted': '#115E59',
                '--border-color': '#CCFBF1',
                '--active-bg': 'rgba(13, 148, 136, 0.1)',
                '--active-text': '#0F766E',
                '--modal-bg': 'rgba(240, 253, 250, 0.85)',
                '--label-bg': '#CCFBF1',
                '--label-color': '#115E59'
            }
        },
        {
            id: 'rose',
            name: '酒紅玫瑰',
            desc: '濃郁高雅，散發成熟魅力的深紅色',
            icon: 'wine_bar',
            iconBg: 'bg-rose-50 dark:bg-rose-500/20 text-rose-500 dark:text-rose-300',
            swatches: ['#FFF1F2', '#FFFFFF', '#E11D48', '#F43F5E', '#4C0519', '#FFE4E6'],
            variables: {
                '--bg-color': '#FFF1F2',
                '--surface-color': 'rgba(255, 255, 255, 0.8)',
                '--surface-solid': '#FFFFFF',
                '--primary-color': '#E11D48',
                '--primary-hover': '#BE123C',
                '--secondary-color': '#F43F5E',
                '--text-main': '#4C0519',
                '--text-muted': '#881337',
                '--border-color': '#FFE4E6',
                '--active-bg': 'rgba(225, 29, 72, 0.1)',
                '--active-text': '#BE123C',
                '--modal-bg': 'rgba(255, 241, 242, 0.85)',
                '--label-bg': '#FFE4E6',
                '--label-color': '#881337'
            }
        },
        {
            id: 'slate',
            name: '極簡石板',
            desc: '專注內容的無色設計',
            icon: 'architecture',
            iconBg: 'bg-slate-50 dark:bg-slate-500/20 text-slate-500 dark:text-slate-300',
            swatches: ['#F8FAFC', '#FFFFFF', '#475569', '#64748B', '#0F172A', '#E2E8F0'],
            variables: {
                '--bg-color': '#F8FAFC',
                '--surface-color': 'rgba(255, 255, 255, 0.8)',
                '--surface-solid': '#FFFFFF',
                '--primary-color': '#475569',
                '--primary-hover': '#334155',
                '--secondary-color': '#64748B',
                '--text-main': '#0F172A',
                '--text-muted': '#1E293B',
                '--border-color': '#E2E8F0',
                '--active-bg': 'rgba(71, 85, 105, 0.1)',
                '--active-text': '#334155',
                '--modal-bg': 'rgba(248, 250, 252, 0.85)',
                '--label-bg': '#E2E8F0',
                '--label-color': '#1E293B'
            }
        },
        {
            id: 'custom',
            name: '自定義主題',
            desc: '專屬的個人色彩',
            icon: 'palette',
            iconBg: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
            swatches: ['#E5E7EB', '#FFFFFF', '#6B7280', '#9CA3AF', '#374151', '#D1D5DB'],
            isCustom: true
        }
    ];

    /**
     * 掛載主題選擇器 UI (跨專案共用)
     * @param {Object} options
     * @param {string} options.containerId - 容器的 DOM ID
     * @param {Function} [options.onChange] - 切換主題時的回呼函式
     */
    mountThemeSelectorUI({ containerId, onChange }) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.warn(`[ThemeSwitcher] 找不到主題容器: ${containerId}`);
            return;
        }

        // 清空容器，建立選單模式的外層
        container.innerHTML = '';
        const wrapper = document.createElement('div');
        wrapper.className = 'flex gap-3 w-full';
        wrapper.style.flexWrap = 'wrap';
        wrapper.style.alignItems = 'stretch';

        // 建立 Select 元素
        const select = document.createElement('select');
        select.className = 'py-2.5 px-3 rounded-xl border focus:outline-none focus:border-blue-500 transition-colors cursor-pointer text-[0.95rem] font-medium shadow-sm';
        select.style.backgroundColor = 'var(--surface-color)';
        select.style.borderColor = 'var(--border-color, #E2E8F0)';
        select.style.color = 'var(--text-main)';
        select.style.flex = '1';
        select.style.minWidth = '250px';

        // 產生選項
        ThemeSwitcher.THEME_MODULES.forEach(themeDef => {
            const option = document.createElement('option');
            option.value = themeDef.id;
            option.textContent = `${themeDef.name}`;
            select.appendChild(option);
        });

        const currentTheme = this.getPreference() || 'auto';
        select.value = currentTheme;

        // 建立動態預覽卡片
        const previewBox = document.createElement('div');
        previewBox.className = 'flex items-center gap-3 p-3.5 rounded-xl border shadow-sm transition-all';
        previewBox.style.backgroundColor = 'var(--bg-color)';
        previewBox.style.borderColor = 'var(--border-color)';
        previewBox.style.flex = '1';
        previewBox.style.minWidth = '250px';

        const renderPreview = (themeId) => {
            const themeDef = ThemeSwitcher.THEME_MODULES.find(t => t.id === themeId) || ThemeSwitcher.THEME_MODULES[0];

            // 組合色票 UI
            let swatchesToRender = themeDef.swatches;
            if (themeDef.isCustom) {
                try {
                    const customVars = JSON.parse(localStorage.getItem('tinyledger_custom_theme') || '{}');
                    if (customVars['--base-bg']) {
                        swatchesToRender = [
                            customVars['--base-bg'],
                            customVars['--base-surface'],
                            customVars['--base-primary'],
                            customVars['--base-secondary'],
                            customVars['--base-text'],
                            customVars['--base-border']
                        ];
                    }
                } catch (e) { }
            }

            let swatchesHTML = '';
            if (swatchesToRender) {
                swatchesHTML = `
                    <div class="flex gap-1.5 mt-2">
                        ${swatchesToRender.map(color => `<div class="w-4 h-4 rounded shadow-sm" style="background-color: ${color}; border: 1px solid rgba(128, 128, 128, 0.4);"></div>`).join('')}
                    </div>
                `;
            }

            previewBox.innerHTML = `
                <div class="w-12 h-12 rounded-full flex items-center justify-center ${themeDef.iconBg} shrink-0 shadow-sm">
                    <span class="material-icons text-[24px]">${themeDef.icon}</span>
                </div>
                <div class="flex flex-col flex-1">
                    <span class="text-[0.95rem] font-bold leading-tight text-main">${themeDef.name}</span>
                    <span class="text-xs mt-0.5 leading-tight text-muted">${themeDef.desc}</span>
                    ${swatchesHTML}
                </div>
                ${themeDef.isCustom ? `<button id="btn-edit-custom-theme" class="btn btn-outline text-xs py-1.5 px-3 rounded-lg ml-2 shadow-sm font-medium flex items-center gap-1"><span class="material-icons" style="font-size:14px;">edit</span>自訂顏色</button>` : ''}
            `;

            // 綁定「自訂顏色」按鈕事件
            if (themeDef.isCustom) {
                const btn = previewBox.querySelector('#btn-edit-custom-theme');
                if (btn) {
                    btn.addEventListener('click', () => {
                        ThemeSwitcher.openCustomThemeModal(() => {
                            this.setTheme('custom');
                            renderPreview('custom');
                            if (onChange) onChange('custom');
                        });
                    });
                }
            }
        };

        // 初始化預覽
        renderPreview(currentTheme);

        // 綁定 Select 變更事件
        select.addEventListener('change', (e) => {
            const newTheme = e.target.value;
            this.setTheme(newTheme);
            renderPreview(newTheme);
            console.log(`[ThemeSwitcher] 已透過選單切換外觀主題為: ${newTheme}`);
            if (onChange) onChange(newTheme);

            // 如果選中自訂主題，自動開啟調色盤
            if (newTheme === 'custom') {
                ThemeSwitcher.openCustomThemeModal(() => {
                    this.setTheme('custom');
                    renderPreview('custom');
                    if (onChange) onChange('custom');
                });
            }
        });

        wrapper.appendChild(select);
        wrapper.appendChild(previewBox);
        container.appendChild(wrapper);
    }

    /**
     * 開啟自定義主題調色盤
     * @param {Function} onSaveCallback - 儲存完成後的回呼
     */
    static openCustomThemeModal(onSaveCallback) {
        const modalId = 'modal-custom-theme-builder';
        const existingModal = document.getElementById(modalId);
        if (existingModal) existingModal.remove();

        const modal = document.createElement('div');
        modal.id = modalId;
        modal.className = 'fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-[9999] p-4 transition-all duration-200 animate-in fade-in';

        // 讀取目前設定 (若無則使用預設值)
        let currentBases = {
            bg: '#F8FAFC', surface: '#FFFFFF', primary: '#4F46E5',
            secondary: '#6366F1', text: '#0F172A', border: '#E2E8F0'
        };
        try {
            const customVars = JSON.parse(localStorage.getItem('tinyledger_custom_theme') || '{}');
            if (customVars['--base-bg']) {
                currentBases = {
                    bg: customVars['--base-bg'],
                    surface: customVars['--base-surface'],
                    primary: customVars['--base-primary'],
                    secondary: customVars['--base-secondary'],
                    text: customVars['--base-text'],
                    border: customVars['--base-border']
                };
            }
        } catch (e) { }

        modal.innerHTML = `
            <div class="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div class="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
                    <div class="flex items-center gap-2">
                        <span class="material-icons text-indigo-500">palette</span>
                        <h2 class="text-lg font-bold text-slate-800 dark:text-slate-100">自訂主題調色盤</h2>
                    </div>
                    <button id="btn-close-custom-theme" class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-slate-500 cursor-pointer">
                        <span class="material-icons text-[20px]">close</span>
                    </button>
                </div>
                
                <div class="p-5 overflow-y-auto flex-1">
                    <p class="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
                        請挑選 6 個核心色彩，系統將為您自動推導出所有的介面衍生顏色（包含半透明毛玻璃效果與按鈕狀態色）。
                    </p>
                    
                    <div class="grid grid-cols-2 gap-4">
                        ${this._renderColorInput('bg', '主背景色', currentBases.bg)}
                        ${this._renderColorInput('surface', '卡片區塊色', currentBases.surface)}
                        ${this._renderColorInput('primary', '主強調色', currentBases.primary)}
                        ${this._renderColorInput('secondary', '次強調色', currentBases.secondary)}
                        ${this._renderColorInput('text', '主文字色', currentBases.text)}
                        ${this._renderColorInput('border', '邊框色', currentBases.border)}
                    </div>
                </div>

                <div class="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-3">
                    <button id="btn-cancel-custom-theme" class="px-4 py-2 rounded-lg font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer text-sm">取消</button>
                    <button id="btn-save-custom-theme" class="px-5 py-2 rounded-lg font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-colors cursor-pointer text-sm flex items-center gap-1.5">
                        <span class="material-icons text-[18px]">check</span> 套用
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // 事件綁定
        modal.querySelector('#btn-close-custom-theme').addEventListener('click', () => modal.remove());
        modal.querySelector('#btn-cancel-custom-theme').addEventListener('click', () => modal.remove());

        // Hex 字串同步更新
        ['bg', 'surface', 'primary', 'secondary', 'text', 'border'].forEach(id => {
            const input = modal.querySelector(`#color-${id}`);
            const hexLabel = modal.querySelector(`#hex-${id}`);
            input.addEventListener('input', (e) => {
                hexLabel.textContent = e.target.value.toUpperCase();
            });
        });

        modal.querySelector('#btn-save-custom-theme').addEventListener('click', () => {
            const bg = modal.querySelector('#color-bg').value;
            const surface = modal.querySelector('#color-surface').value;
            const primary = modal.querySelector('#color-primary').value;
            const secondary = modal.querySelector('#color-secondary').value;
            const text = modal.querySelector('#color-text').value;
            const border = modal.querySelector('#color-border').value;

            // 儲存原始 6 色，並推導其他變數
            const customVars = {
                '--base-bg': bg,
                '--base-surface': surface,
                '--base-primary': primary,
                '--base-secondary': secondary,
                '--base-text': text,
                '--base-border': border,

                '--bg-color': bg,
                '--surface-color': `${surface}CC`, // 80% opacity
                '--surface-solid': surface,
                '--primary-color': primary,
                '--primary-hover': primary,
                '--secondary-color': secondary,
                '--text-main': text,
                '--text-muted': `${text}B3`, // 70% opacity
                '--border-color': border,
                '--active-bg': `${primary}1A`, // 10% opacity
                '--active-text': primary,
                '--modal-bg': `${surface}E6`, // 90% opacity
                '--label-bg': border,
                '--label-color': text
            };

            localStorage.setItem('tinyledger_custom_theme', JSON.stringify(customVars));
            modal.remove();
            if (onSaveCallback) onSaveCallback();
        });
    }

    static _renderColorInput(id, label, value) {
        return `
            <div class="flex flex-col gap-1.5">
                <label class="text-xs font-bold text-slate-700 dark:text-slate-300">${label}</label>
                <div class="flex items-center gap-2 p-1.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 hover:border-indigo-400 transition-colors">
                    <input type="color" id="color-${id}" value="${value}" class="w-7 h-7 rounded cursor-pointer border-0 p-0 bg-transparent shrink-0" />
                    <span class="text-xs font-mono text-slate-500 dark:text-slate-400 uppercase flex-1" id="hex-${id}">${value}</span>
                </div>
            </div>
        `;
    }
}
