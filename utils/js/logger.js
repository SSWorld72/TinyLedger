/**
 * ============================================================================
 * 系統日誌模組 (logger.js)
 * ============================================================================
 * 負責攔截並記錄全域的 `console.log`、`console.warn`、`console.error`，
 * 以及捕捉未處理的錯誤 (`window.onerror`, `unhandledrejection`)。
 * 
 * 功能特色：
 * 1. 自動加上時間戳記、追蹤應用程式事件，並快取最新 999 筆日誌。
 * 2. 捕捉全域未處理的例外錯誤並記錄為 error 等級。
 * 3. 內建 UI 面板渲染邏輯，支援依日誌等級 (INFO, WARN, ERROR) 上色。
 * 
 * @example
 * // 在應用程式入口點（如 app.js）的頂部匯入即可自動啟用：
 * import '../../utils/js/logger.js';
 * 
 * // 日誌會自動被攔截：
 * console.log('這是一筆測試日誌');
 * console.error('這會顯示紅色並在 UI 面板中高亮');
 */
// 移除對特定專案 store.js 的依賴，改為動態判定
// import { settings } from '../../js/store.js';

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
    
    // 動態取得 prefix，支援跨專案
    let prefix = window.loggerPrefix || 'SYS';
    if (!window.loggerPrefix) {
        try {
            const stockSettings = JSON.parse(localStorage.getItem('stock_journal_settings') || '{}');
            if (stockSettings.apiProxyMode) {
                prefix = stockSettings.apiProxyMode === 'gas' ? 'Google' : 'Local';
            }
        } catch(e) {}
    }

    window.appLogs.unshift(`[${dateStr} ${timeStr}] [${prefix}] [${level.toUpperCase()}] ${msg}`);
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

window.addEventListener('error', (event) => {
    captureLog('error', 'Unhandled Error:', event.error || event.message);
});

window.addEventListener('unhandledrejection', (event) => {
    captureLog('error', 'Unhandled Promise Rejection:', event.reason);
});

window.clearAppLogs = () => {
    window.appLogs = [];
    try { localStorage.removeItem('app_system_logs'); } catch(e) {}
    window.dispatchEvent(new Event('app-logs-updated'));
};

/**
 * 初始化系統日誌 UI (System Logs UI)
 * @param {Object} config 
 * @param {string} config.containerId - 渲染 UI 的容器 ID
 * @param {string} [config.description] - 自訂說明文字
 */
export function mountSystemLogsUI(config) {
    const container = document.getElementById(config.containerId);
    if (!container) {
        console.error('mountSystemLogsUI: 找不到容器 #' + config.containerId);
        return;
    }

    // Render HTML structure
    container.innerHTML = `
        <div class="settings-section mt-8 mb-8 rounded-3xl p-4 sm:p-5 border" style="background: var(--surface-color); border-color: var(--border-color);">
            <div class="flex items-center gap-3 mb-4 px-2">
                <div class="w-9 h-9 rounded-xl flex items-center justify-center shadow-sm border" style="background: var(--active-bg); color: var(--primary-color); border-color: var(--border-color);">
                    <span class="material-icons text-[20px]">receipt_long</span>
                </div>
                <h3 class="m-0 text-[1.05rem] font-bold text-main tracking-wide">系統日誌 (System Logs)</h3>
            </div>
            
            <div class="rounded-2xl p-4 shadow-sm border" style="background: var(--bg-color); border-color: var(--border-color);">
                <div class="flex flex-col sm:flex-row gap-2 mb-3">
                    <div class="relative w-full sm:flex-1">
                        <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            <span class="material-icons text-[16px] text-slate-400">search</span>
                        </div>
                        <input type="text" id="log-time-filter"
                            class="w-full text-sm pl-9 pr-2 py-2 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:text-slate-200 placeholder-slate-400 shadow-sm border"
                            style="background: var(--surface-color); border-color: var(--border-color); color: var(--text-main);"
                            placeholder="搜尋時間或關鍵字...">
                    </div>
                    <div class="flex gap-2 w-full sm:w-auto">
                        <button id="btn-copy-logs"
                            class="flex-1 sm:flex-none whitespace-nowrap text-sm px-3 py-2 rounded-xl transition-colors flex items-center justify-center gap-1 shadow-sm border"
                            style="background: var(--surface-color); border-color: var(--border-color); color: var(--text-main);"
                            title="複製過濾後的日誌">
                            <span class="material-icons text-[16px]">content_copy</span>
                            <span class="hidden sm:inline">複製</span>
                        </button>
                        <button id="btn-export-logs"
                            class="flex-1 sm:flex-none whitespace-nowrap text-sm px-3 py-2 rounded-xl transition-colors flex items-center justify-center gap-1 shadow-sm border"
                            style="background: var(--surface-color); border-color: var(--border-color); color: var(--text-main);">
                            <span class="material-icons text-[16px]">download</span>
                            <span class="hidden sm:inline">匯出</span>
                        </button>
                        <button id="btn-clear-logs"
                            class="flex-1 sm:flex-none whitespace-nowrap text-sm px-3 py-2 rounded-xl transition-colors flex items-center justify-center gap-1 shadow-sm border"
                            style="background: var(--surface-color); border-color: var(--border-color); color: #ef4444;"
                            title="清空日誌">
                            <span class="material-icons text-[16px]">delete_sweep</span>
                            <span class="hidden sm:inline">清除</span>
                        </button>
                    </div>
                </div>

                <div class="bg-slate-900 dark:bg-black/50 rounded-xl p-3 h-48 overflow-y-auto border border-slate-800 dark:border-slate-700/50">
                    <pre id="system-logs-container"
                        class="text-[11px] sm:text-xs text-slate-300 font-mono whitespace-pre-wrap leading-relaxed break-all m-0"
                        style="scrollbar-width: thin; scrollbar-color: #334155 #0f172a;"></pre>
                </div>
                <p class="text-[11px] text-muted mt-3 text-center sm:text-left m-0">
                    ${config.description || '顯示最近 999 筆主控台日誌，方便排解連線或資料同步問題。'}
                </p>
            </div>
        </div>
    `;

    // Bind logic
    const logContainer = document.getElementById('system-logs-container');
    const filterInput = document.getElementById('log-time-filter');
    const btnClear = document.getElementById('btn-clear-logs');
    const btnExport = document.getElementById('btn-export-logs');
    const btnCopy = document.getElementById('btn-copy-logs');

    const renderLogs = () => {
        if (!logContainer) return;
        const logs = window.appLogs || [];
        const keyword = filterInput ? filterInput.value.trim().toLowerCase() : '';
        const filteredLogs = keyword ? logs.filter(l => l.toLowerCase().includes(keyword)) : logs;
        
        // 解析並美化日誌，加入顏色
        const formattedLogs = filteredLogs.map(logStr => {
            // 先跳脫 HTML，防止 XSS
            const escaped = logStr.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            // 嘗試解析格式： [時間] [模組] [層級] 訊息
            const match = escaped.match(/^(\[.*?\])\s+(\[.*?\])\s+(\[.*?\])\s+(.*)$/);
            if (!match) return escaped;
            
            const time = match[1];
            const module = match[2];
            const level = match[3];
            const msg = match[4];
            
            let levelColor = 'text-emerald-400'; // 預設 INFO 顏色
            if (level.includes('WARN')) levelColor = 'text-amber-400';
            if (level.includes('ERROR')) levelColor = 'text-rose-400';
            
            return `<span class="text-slate-400">${time}</span> <span class="text-indigo-400">${module}</span> <span class="${levelColor} font-bold">${level}</span> <span class="${levelColor}">${msg}</span>`;
        });
        
        logContainer.innerHTML = formattedLogs.join('\n');
        logContainer.scrollTop = 0;
    };

    window.addEventListener('app-logs-updated', renderLogs);
    if (filterInput) {
        filterInput.addEventListener('input', renderLogs);
    }
    if (btnClear) {
        btnClear.addEventListener('click', () => {
            if (confirm('確定要清空所有系統日誌嗎？此操作無法復原。')) {
                if (window.clearAppLogs) window.clearAppLogs();
            }
        });
    }
    if (btnExport) {
        btnExport.addEventListener('click', () => {
            const currentContent = logContainer.textContent;
            if (!currentContent) {
                alert('目前沒有可匯出的日誌');
                return;
            }
            const blob = new Blob([currentContent], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `SystemLogs_Export_${new Date().toISOString().replace(/[:.]/g, '-')}.txt`;
            a.click();
            URL.revokeObjectURL(url);
        });
    }
    if (btnCopy) {
        btnCopy.addEventListener('click', () => {
            const currentContent = logContainer.textContent;
            if (!currentContent) {
                alert('目前沒有可複製的日誌');
                return;
            }
            navigator.clipboard.writeText(currentContent).then(() => {
                alert('日誌已複製到剪貼簿');
            }).catch(err => {
                alert('複製失敗: ' + err);
            });
        });
    }

    // Initial render
    renderLogs();
}

