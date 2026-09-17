/**
 * ============================================================================
 * Theme Switcher (ThemeSwitcher)
 * ============================================================================
 * Manages switching between Dark / Light / Auto (System) theme modes and custom palettes.
 * 
 * Features:
 * 1. Listens to system theme via `window.matchMedia` and toggles `.dark` class on <html> automatically.
 * 2. Built-in multiple custom palettes (e.g. Sweet Peach, Matrix Green, Caramel Macchiato, etc.).
 * 3. Dynamically injects CSS variables (`--bg-color`, `--primary-color`, etc.) into `<style id="theme-vars">` for global UI sync.
 * 
 * @example
 * import { ThemeSwitcher } from '../../utils/js/themeSwitcher.js';
 * 
 * // Initialize theme controller
 * const themeSwitcher = new ThemeSwitcher('my_app_theme', 'auto');
 * 
 * // Apply preset or specific palette
 * themeSwitcher.setCustomTheme('peach'); 
 * 
 * // Switch between dark/light/auto mode
 * themeSwitcher.setTheme('dark'); 
 */
import { t } from './shared-i18n.js';
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
        // Find corresponding theme definition
        const themeDef = ThemeSwitcher.THEME_MODULES.find(t => t.id === theme) || ThemeSwitcher.THEME_MODULES.find(t => t.id === 'light');

        // 1. Handle basic Dark/Light DOM tags (resolve base B/W structure)
        let isDark = theme === 'dark' || themeDef.forceDark;
        if (theme === 'auto') {
            isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        }

        if (isDark) {
            document.documentElement.setAttribute('data-theme', 'dark');
        } else {
            document.documentElement.removeAttribute('data-theme');
        }

        // 2. Handle dynamic variable injection
        // First clear all old injected variables to cleanly fallback to modern-ui.css defaults
        const allVars = [
            '--bg-color', '--surface-color', '--surface-solid',
            '--primary-color', '--primary-hover', '--secondary-color',
            '--text-main', '--text-muted', '--border-color',
            '--active-bg', '--active-text', '--modal-bg',
            '--label-bg', '--label-color'
        ];
        allVars.forEach(v => document.documentElement.style.removeProperty(v));

        // 3. Inject new theme variables
        if (themeDef.variables) {
            Object.entries(themeDef.variables).forEach(([key, value]) => {
                document.documentElement.style.setProperty(key, value);
            });
        }

        // 4. Try loading from localStorage if it's a custom theme
        if (themeDef.isCustom) {
            try {
                const customVars = JSON.parse(localStorage.getItem('tinyledger_custom_theme') || '{}');
                Object.entries(customVars).forEach(([key, value]) => {
                    document.documentElement.style.setProperty(key, value);
                });
            } catch (e) {
                console.warn(t('systemLogs.themeSwitcher.readCustomThemeError'), e);
            }
        }
    }

    getPreference() {
        return this.currentPreference;
    }

    /**
     * Theme Registry
     * Defines all available theme appearances and card styles.
     * To add a theme (e.g., OLED Pitch Black), simply add an object here.
     */
    static THEME_MODULES = [
        {
            id: 'auto',
            get name() { return t('utils.theme.auto.name'); },
            get desc() { return t('utils.theme.auto.desc'); },
            icon: 'brightness_auto',
            iconBg: 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
        },
        {
            id: 'light',
            get name() { return t('utils.theme.light.name'); },
            get desc() { return t('utils.theme.light.desc'); },
            icon: 'light_mode',
            iconBg: 'bg-orange-50 dark:bg-slate-700 text-orange-500 dark:text-slate-300',
            swatches: ['#F8FAFC', '#FFFFFF', '#4F46E5', '#6366F1', '#0F172A', '#E2E8F0']
        },
        {
            id: 'dark',
            get name() { return t('utils.theme.dark.name'); },
            get desc() { return t('utils.theme.dark.desc'); },
            icon: 'brightness_4',
            iconBg: 'bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300',
            swatches: ['#0F172A', '#1E293B', '#6366F1', '#4F46E5', '#F8FAFC', '#334155']
        },
        {
            id: 'pink',
            get name() { return t('utils.theme.pink.name'); },
            get desc() { return t('utils.theme.pink.desc'); },
            icon: 'local_florist',
            iconBg: 'bg-pink-100 dark:bg-pink-500/20 text-pink-600 dark:text-pink-300',
            swatches: ['#FCE7F3', '#FDF2F8', '#DB2777', '#F472B6', '#831843', '#FBCFE8'],
            variables: {
                '--bg-color': '#FCE7F3',
                '--surface-color': 'rgba(253, 242, 248, 0.8)',
                '--surface-solid': '#FDF2F8',
                '--primary-color': '#DB2777',
                '--primary-hover': '#BE185D',
                '--secondary-color': '#F472B6',
                '--text-main': '#831843',
                '--text-muted': '#9D174D',
                '--border-color': '#FBCFE8',
                '--active-bg': 'rgba(219, 39, 119, 0.12)',
                '--active-text': '#BE185D',
                '--modal-bg': 'rgba(252, 231, 243, 0.85)',
                '--label-bg': '#FBCFE8',
                '--label-color': '#9D174D'
            }
        },
        {
            id: 'green',
            get name() { return t('utils.theme.green.name'); },
            get desc() { return t('utils.theme.green.desc'); },
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
            id: 'amber',
            get name() { return t('utils.theme.amber.name'); },
            get desc() { return t('utils.theme.amber.desc'); },
            icon: 'wb_sunny',
            iconBg: 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-300',
            swatches: ['#FEF3C7', '#FFFBEB', '#D97706', '#F59E0B', '#78350F', '#FDE68A'],
            variables: {
                '--bg-color': '#FEF3C7',
                '--surface-color': 'rgba(255, 251, 235, 0.8)',
                '--surface-solid': '#FFFBEB',
                '--primary-color': '#D97706',
                '--primary-hover': '#B45309',
                '--secondary-color': '#F59E0B',
                '--text-main': '#78350F',
                '--text-muted': '#92400E',
                '--border-color': '#FDE68A',
                '--active-bg': 'rgba(217, 119, 6, 0.12)',
                '--active-text': '#B45309',
                '--modal-bg': 'rgba(254, 243, 199, 0.85)',
                '--label-bg': '#FDE68A',
                '--label-color': '#92400E'
            }
        },
        {
            id: 'blue',
            get name() { return t('utils.theme.blue.name'); },
            get desc() { return t('utils.theme.blue.desc'); },
            icon: 'water_drop',
            iconBg: 'bg-blue-500/20 dark:bg-blue-500/20 text-blue-400 dark:text-blue-300',
            swatches: ['#082F49', '#0C4A6E', '#0EA5E9', '#38BDF8', '#F0F9FF', '#075985'],
            variables: {
                '--bg-color': '#082F49',
                '--surface-color': 'rgba(12, 74, 110, 0.8)',
                '--surface-solid': '#0C4A6E',
                '--primary-color': '#0EA5E9',
                '--primary-hover': '#0284C7',
                '--secondary-color': '#38BDF8',
                '--text-main': '#F0F9FF',
                '--text-muted': '#BAE6FD',
                '--border-color': '#075985',
                '--active-bg': 'rgba(14, 165, 233, 0.15)',
                '--active-text': '#38BDF8',
                '--modal-bg': 'rgba(8, 47, 73, 0.9)',
                '--label-bg': '#075985',
                '--label-color': '#BAE6FD'
            },
            forceDark: true
        },
        {
            id: 'matcha',
            get name() { return t('utils.theme.matcha.name'); },
            get desc() { return t('utils.theme.matcha.desc'); },
            icon: 'local_cafe',
            iconBg: 'bg-[#DEE8D5] dark:bg-[#3D5F27]/20 text-[#3D5F27] dark:text-[#5B823C]',
            swatches: ['#DEE8D5', '#F2F7EF', '#3D5F27', '#5B823C', '#192A0E', '#C5D6B8'],
            variables: {
                '--bg-color': '#DEE8D5',
                '--surface-color': 'rgba(242, 247, 239, 0.8)',
                '--surface-solid': '#F2F7EF',
                '--primary-color': '#3D5F27',
                '--primary-hover': '#2B4619',
                '--secondary-color': '#5B823C',
                '--text-main': '#192A0E',
                '--text-muted': '#324A1E',
                '--border-color': '#C5D6B8',
                '--active-bg': 'rgba(61, 95, 39, 0.12)',
                '--active-text': '#2B4619',
                '--modal-bg': 'rgba(222, 232, 213, 0.85)',
                '--label-bg': '#C5D6B8',
                '--label-color': '#243B14'
            }
        },
        {
            id: 'purple',
            get name() { return t('utils.theme.purple.name'); },
            get desc() { return t('utils.theme.purple.desc'); },
            icon: 'nightlight',
            iconBg: 'bg-purple-500/20 dark:bg-purple-500/20 text-purple-400 dark:text-purple-300',
            swatches: ['#2E1065', '#3B0764', '#A855F7', '#C084FC', '#FAF5FF', '#4C1D95'],
            variables: {
                '--bg-color': '#2E1065',
                '--surface-color': 'rgba(59, 7, 100, 0.8)',
                '--surface-solid': '#3B0764',
                '--primary-color': '#A855F7',
                '--primary-hover': '#9333EA',
                '--secondary-color': '#C084FC',
                '--text-main': '#FAF5FF',
                '--text-muted': '#E9D5FF',
                '--border-color': '#4C1D95',
                '--active-bg': 'rgba(168, 85, 247, 0.15)',
                '--active-text': '#C084FC',
                '--modal-bg': 'rgba(46, 16, 101, 0.9)',
                '--label-bg': '#4C1D95',
                '--label-color': '#E9D5FF'
            },
            forceDark: true
        },
        {
            id: 'teal',
            get name() { return t('utils.theme.teal.name'); },
            get desc() { return t('utils.theme.teal.desc'); },
            icon: 'air',
            iconBg: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-300',
            swatches: ['#D1FAE5', '#ECFDF5', '#10B981', '#34D399', '#064E3B', '#A7F3D0'],
            variables: {
                '--bg-color': '#D1FAE5',
                '--surface-color': 'rgba(236, 253, 245, 0.8)',
                '--surface-solid': '#ECFDF5',
                '--primary-color': '#10B981',
                '--primary-hover': '#059669',
                '--secondary-color': '#34D399',
                '--text-main': '#064E3B',
                '--text-muted': '#047857',
                '--border-color': '#A7F3D0',
                '--active-bg': 'rgba(16, 185, 129, 0.12)',
                '--active-text': '#059669',
                '--modal-bg': 'rgba(209, 250, 229, 0.85)',
                '--label-bg': '#A7F3D0',
                '--label-color': '#047857'
            }
        },
        {
            id: 'rose',
            get name() { return t('utils.theme.rose.name'); },
            get desc() { return t('utils.theme.rose.desc'); },
            icon: 'wine_bar',
            iconBg: 'bg-rose-500/20 dark:bg-rose-500/20 text-rose-400 dark:text-rose-300',
            swatches: ['#4C0519', '#881337', '#F43F5E', '#FB7185', '#FFF1F2', '#9F1239'],
            variables: {
                '--bg-color': '#4C0519',
                '--surface-color': 'rgba(136, 19, 55, 0.8)',
                '--surface-solid': '#881337',
                '--primary-color': '#F43F5E',
                '--primary-hover': '#E11D48',
                '--secondary-color': '#FB7185',
                '--text-main': '#FFF1F2',
                '--text-muted': '#FECDD3',
                '--border-color': '#9F1239',
                '--active-bg': 'rgba(244, 63, 94, 0.15)',
                '--active-text': '#FB7185',
                '--modal-bg': 'rgba(76, 5, 25, 0.9)',
                '--label-bg': '#9F1239',
                '--label-color': '#FECDD3'
            },
            forceDark: true
        },
        {
            id: 'slate',
            get name() { return t('utils.theme.slate.name'); },
            get desc() { return t('utils.theme.slate.desc'); },
            icon: 'architecture',
            iconBg: 'bg-zinc-200 dark:bg-zinc-600/20 text-zinc-700 dark:text-zinc-300',
            swatches: ['#E4E4E7', '#F4F4F5', '#52525B', '#71717A', '#18181B', '#D4D4D8'],
            variables: {
                '--bg-color': '#E4E4E7',
                '--surface-color': 'rgba(244, 244, 245, 0.8)',
                '--surface-solid': '#F4F4F5',
                '--primary-color': '#52525B',
                '--primary-hover': '#3F3F46',
                '--secondary-color': '#71717A',
                '--text-main': '#18181B',
                '--text-muted': '#3F3F46',
                '--border-color': '#D4D4D8',
                '--active-bg': 'rgba(82, 82, 91, 0.12)',
                '--active-text': '#3F3F46',
                '--modal-bg': 'rgba(228, 228, 231, 0.85)',
                '--label-bg': '#D4D4D8',
                '--label-color': '#27272A'
            }
        },
        {
            id: 'custom',
            get name() { return t('utils.theme.custom.name'); },
            get desc() { return t('utils.theme.custom.desc'); },
            icon: 'palette',
            iconBg: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
            swatches: ['#E5E7EB', '#FFFFFF', '#6B7280', '#9CA3AF', '#374151', '#D1D5DB'],
            isCustom: true
        }
    ];

    /**
     * Mount theme selector UI (Shared across projects)
     * @param {Object} options
     * @param {string} options.containerId - DOM ID of the container
     * @param {Function} [options.onChange] - Callback when theme changes
     */
    mountThemeSelectorUI({ containerId, onChange }) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.warn(t('systemLogs.themeSwitcher.containerNotFound', { containerId }));
            return;
        }

        // Clear container and build wrapper
        container.innerHTML = '';
        const wrapper = document.createElement('div');
        wrapper.className = 'flex gap-3 w-full';
        wrapper.style.flexWrap = 'wrap';
        wrapper.style.alignItems = 'stretch';

        // Build Select element
        const select = document.createElement('select');
        select.className = 'py-2.5 px-3 rounded-xl border focus:outline-none focus:border-blue-500 transition-colors cursor-pointer text-[0.95rem] font-medium shadow-sm';
        select.style.backgroundColor = 'var(--surface-color)';
        select.style.borderColor = 'var(--border-color, #E2E8F0)';
        select.style.color = 'var(--text-main)';
        select.style.flex = '1 1 30%';

        // Generate options
        ThemeSwitcher.THEME_MODULES.forEach(themeDef => {
            const option = document.createElement('option');
            option.value = themeDef.id;
            option.textContent = `${themeDef.name}`;
            
            // Enable each option in the dropdown to preview the theme's colors in real-time
            if (themeDef.variables && themeDef.variables['--bg-color']) {
                option.style.backgroundColor = themeDef.variables['--bg-color'];
                option.style.color = themeDef.variables['--text-main'];
            } else if (themeDef.id === 'dark') {
                option.style.backgroundColor = '#0F172A';
                option.style.color = '#F8FAFC';
            } else if (themeDef.id === 'custom') {
                // Try to read custom theme colors
                try {
                    const customVars = JSON.parse(localStorage.getItem('tinyledger_custom_theme') || '{}');
                    if (customVars['--base-bg']) {
                        option.style.backgroundColor = customVars['--base-bg'];
                        option.style.color = customVars['--base-text'];
                    } else {
                        option.style.backgroundColor = '#F8FAFC'; // Default custom color
                        option.style.color = '#0F172A';
                    }
                } catch (e) { }
            } else {
                // Default background for light or auto
                option.style.backgroundColor = '#FFFFFF';
                option.style.color = '#1E293B';
            }

            select.appendChild(option);
        });

        const currentTheme = this.getPreference() || 'auto';
        select.value = currentTheme;

        // Build dynamic preview card
        const previewBox = document.createElement('div');
        previewBox.className = 'flex items-center gap-3 p-3.5 rounded-xl border shadow-sm transition-all';
        previewBox.style.backgroundColor = 'var(--bg-color)';
        previewBox.style.borderColor = 'var(--border-color)';
        previewBox.style.flex = '2 1 60%';

        const renderPreview = (themeId) => {
            const themeDef = ThemeSwitcher.THEME_MODULES.find(t => t.id === themeId) || ThemeSwitcher.THEME_MODULES[0];

            // Assemble swatches UI
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
                ${themeDef.isCustom ? `<button id="btn-edit-custom-theme" class="btn btn-outline text-xs py-1.5 px-3 rounded-lg ml-2 shadow-sm font-medium flex items-center gap-1"><span class="material-icons" style="font-size:14px;">edit</span>${t('utils.theme.customColorsBtn')}</button>` : ''}
            `;

            // Bind "Custom Colors" button event
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

        // Initialize preview
        renderPreview(currentTheme);

        // Bind Select change event
        select.addEventListener('change', (e) => {
            const newTheme = e.target.value;
            this.setTheme(newTheme);
            renderPreview(newTheme);
            const localizedThemeName = t(`utils.theme.${newTheme}.name`);
            const themeName = localizedThemeName !== `utils.theme.${newTheme}.name` ? localizedThemeName : newTheme;
            console.log(t('systemLogs.themeSwitcher.switchedTheme', { newTheme: themeName }));
            if (onChange) onChange(newTheme);

            // Automatically open palette if custom theme is selected
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
     * Open custom theme palette modal
     * @param {Function} onSaveCallback - Callback after save
     */
    static openCustomThemeModal(onSaveCallback) {
        const modalId = 'modal-custom-theme-builder';
        const existingModal = document.getElementById(modalId);
        if (existingModal) existingModal.remove();

        const modal = document.createElement('div');
        modal.id = modalId;
        modal.className = 'fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-[9999] p-4 transition-all duration-200 animate-in fade-in';

        // Read current settings (or use default)
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
                        <h2 class="text-lg font-bold text-slate-800 dark:text-slate-100">${t('utils.theme.customModalTitle')}</h2>
                    </div>
                    <button id="btn-close-custom-theme" class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-slate-500 cursor-pointer">
                        <span class="material-icons text-[20px]">close</span>
                    </button>
                </div>
                
                <div class="p-5 overflow-y-auto flex-1">
                    <p class="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
                        ${t('utils.theme.customModalDesc')}
                    </p>
                    
                    <div class="grid grid-cols-2 gap-4">
                        ${this._renderColorInput('bg', t('utils.theme.colors.bg'), currentBases.bg)}
                        ${this._renderColorInput('surface', t('utils.theme.colors.surface'), currentBases.surface)}
                        ${this._renderColorInput('primary', t('utils.theme.colors.primary'), currentBases.primary)}
                        ${this._renderColorInput('secondary', t('utils.theme.colors.secondary'), currentBases.secondary)}
                        ${this._renderColorInput('text', t('utils.theme.colors.text'), currentBases.text)}
                        ${this._renderColorInput('border', t('utils.theme.colors.border'), currentBases.border)}
                    </div>
                </div>

                <div class="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-3">
                    <button id="btn-cancel-custom-theme" class="px-4 py-2 rounded-lg font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer text-sm">${t('utils.theme.cancel')}</button>
                    <button id="btn-save-custom-theme" class="px-5 py-2 rounded-lg font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-colors cursor-pointer text-sm flex items-center gap-1.5">
                        <span class="material-icons text-[18px]">check</span> ${t('utils.theme.apply')}
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Bind events
        modal.querySelector('#btn-close-custom-theme').addEventListener('click', () => modal.remove());
        modal.querySelector('#btn-cancel-custom-theme').addEventListener('click', () => modal.remove());

        // Sync Hex string update
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

            // Save original 6 colors and derive other variables
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
