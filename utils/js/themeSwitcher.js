/**
 * ============================================================================
 * 主題切換器 (ThemeSwitcher)
 * ============================================================================
 * 深色 / 淺色 / 自動 (跟隨系統) 主題模式的切換與狀態管理。
 * 透過 `window.matchMedia` 監聽系統主題切換，並自動加上或移除 `<html>` 標籤的 `.dark` class。
 * 
 * @example
 * import { ThemeSwitcher } from '../../utils/js/themeSwitcher.js';
 * 
 * // 初始化主題控制器 (預設自動跟隨系統)
 * const themeSwitcher = new ThemeSwitcher('my_app_theme', 'auto');
 * themeSwitcher.setTheme('dark'); // 強制切換為深色模式
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
        if (theme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
        } else {
            document.documentElement.removeAttribute('data-theme');
        }
    }
    
    getPreference() {
        return this.currentPreference;
    }
}
