/**
 * ============================================================================
 * 裝置偵測模組 (deviceDetection.js)
 * ============================================================================
 * 提供判斷當前使用者是使用手機或是電腦版畫面的工具函數。
 * 
 * @example
 * import { isMobile, isDesktop, onDeviceChange } from '../../utils/js/deviceDetection.js';
 * 
 * if (isMobile()) {
 *     console.log('目前是手機版畫面');
 * }
 * 
 * const unlisten = onDeviceChange((mobile) => {
 *     console.log(mobile ? '切換為手機版' : '切換為電腦版');
 * });
 */

/**
 * 判斷是否為手機模式 (螢幕寬度小於 768px 或 userAgent 包含行動裝置特徵)
 * @returns {boolean}
 */
export function isMobile() {
    // 1. 優先使用 CSS Media Query 邏輯 (與 Tailwind md: 斷點 768px 一致)
    if (typeof window !== 'undefined' && window.matchMedia) {
        return window.matchMedia("(max-width: 767px)").matches;
    }
    
    // 2. Fallback: 使用 userAgent 判斷
    if (typeof navigator !== 'undefined') {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }
    
    return false; // 預設為電腦版
}

/**
 * 判斷是否為電腦模式
 * @returns {boolean}
 */
export function isDesktop() {
    return !isMobile();
}

/**
 * 註冊裝置改變時的監聽器 (當視窗縮放跨越斷點時觸發)
 * @param {Function} callback - 回呼函數，傳入參數為 isMobile (boolean)
 * @returns {Function} - 回傳可用於解除監聽的函數
 */
export function onDeviceChange(callback) {
    if (typeof window === 'undefined' || !window.matchMedia) return () => {};
    
    const mediaQuery = window.matchMedia("(max-width: 767px)");
    const handler = (e) => callback(e.matches);
    
    if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', handler);
        return () => mediaQuery.removeEventListener('change', handler);
    } else {
        mediaQuery.addListener(handler);
        return () => mediaQuery.removeListener(handler);
    }
}
