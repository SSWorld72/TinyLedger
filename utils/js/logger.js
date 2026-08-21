/**
 * ============================================================================
 * 系統日誌模組 (logger.js)
 * ============================================================================
 * 負責攔截並記錄全域的 `console.log`、`console.warn` 與 `console.error`。
 * 自動加上時間戳記、追蹤應用程式事件，並將最新 999 筆日誌快取至 `localStorage`。
 * 
 * @example
 * // 在應用程式入口點（如 app.js）的頂部匯入即可自動啟用：
 * import '../../utils/js/logger.js';
 * 
 * // 之後的 console.log 都會被自動記錄至 window.appLogs
 * console.log('這是一筆測試日誌');
 */
import { settings } from '../../js/store.js';

// === System Logs Tracker ===
const maxLogs = 999;
let storedLogs = [];
try {
    storedLogs = JSON.parse(localStorage.getItem('app_system_logs') || '[]');
    if (!Array.isArray(storedLogs)) storedLogs = [];
} catch(e) {
    storedLogs = [];
}
window.appLogs = storedLogs;

const captureLog = (level, ...args) => {
    const msg = args.map(a => {
        if (a instanceof Error) {
            return a.message + (a.stack ? '\n' + a.stack : '');
        }
        return (typeof a === 'object' ? JSON.stringify(a) : String(a));
    }).join(' ');
    const now = new Date();
    const dateStr = now.getFullYear() + '/' + String(now.getMonth() + 1).padStart(2, '0') + '/' + String(now.getDate()).padStart(2, '0');
    const timeStr = now.toLocaleTimeString('zh-TW', { hour12: false });
    const proxyMode = settings.apiProxyMode === 'gas' ? 'Google' : 'Local';
    window.appLogs.unshift(`[${dateStr} ${timeStr}] [${proxyMode}] [${level.toUpperCase()}] ${msg}`);
    if (window.appLogs.length > maxLogs) window.appLogs.pop();
    
    try {
        localStorage.setItem('app_system_logs', JSON.stringify(window.appLogs));
    } catch(e) {}
    
    // Dispatch event so UI can update
    window.dispatchEvent(new Event('app-logs-updated'));
};

// Intercept console
const originalLog = console.log;
const originalWarn = console.warn;
const originalError = console.error;

console.log("App initializing... v25");
console.log = (...args) => { captureLog('info', ...args); originalLog(...args); };
console.warn = (...args) => { captureLog('warn', ...args); originalWarn(...args); };
console.error = (...args) => { captureLog('error', ...args); originalError(...args); };

window.clearAppLogs = () => {
    window.appLogs = [];
    try { localStorage.removeItem('app_system_logs'); } catch(e) {}
    window.dispatchEvent(new Event('app-logs-updated'));
};
