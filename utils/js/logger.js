/**
 * ============================================================================
 * System Logs Module (logger.js)
 * ============================================================================
 * Responsible for intercepting and recording global `console.log`, `console.warn`, 
 * `console.error`, and catching unhandled errors (`window.onerror`, `unhandledrejection`).
 * 
 * Features:
 * 1. Automatically adds timestamps, tracks app events, and caches the latest 999 logs.
 * 2. Catches global unhandled exceptions and logs them as error level.
 * 3. Built-in UI panel rendering logic, supports coloring by log level (INFO, WARN, ERROR).
 * 
 * @example
 * // Import at the top of the application entry point (e.g. app.js) to enable automatically:
 * import '../../utils/js/logger.js';
 * 
 * // Logs will be intercepted automatically:
 * console.log('This is a test log');
 * console.error('This will show red and be highlighted in the UI panel');
 */
// Removed dependency on specific project store.js, changed to dynamic resolution
// import { settings } from '../../js/store.js';
import { t } from './shared-i18n.js';

// === System Logs Tracker ===
const maxLogs = 999;
let storedLogs = [];
try {
    storedLogs = JSON.parse(localStorage.getItem('app_system_logs') || '[]');
    if (!Array.isArray(storedLogs)) storedLogs = [];
} catch (e) {
    storedLogs = [];
}
window.appLogs = storedLogs;

const captureLog = (level, ...args) => {
    let msg = args.map(a => {
        if (a instanceof Error) {
            return a.message + (a.stack ? '\n' + a.stack : '');
        }
        return (typeof a === 'object' ? JSON.stringify(a) : String(a));
    }).join(' ');

    // Intercept specific noisy third-party errors for translation
    if (msg.includes('<gmp-place-autocomplete>: Encountered a network request error')) {
        msg = t('systemLogs.gmap.networkError');
    }
    const now = new Date();
    const dateStr = now.getFullYear() + '/' + String(now.getMonth() + 1).padStart(2, '0') + '/' + String(now.getDate()).padStart(2, '0');
    const timeStr = now.toLocaleTimeString('zh-TW', { hour12: false });

    // Get prefix dynamically, supporting cross-project
    let prefix = window.loggerPrefix || 'SYS';
    if (!window.loggerPrefix) {
        try {
            const stockSettings = JSON.parse(localStorage.getItem('stock_journal_settings') || '{}');
            if (stockSettings.apiProxyMode) {
                prefix = stockSettings.apiProxyMode === 'gas' ? 'Google' : 'Local';
            }
        } catch (e) { }
    }

    window.appLogs.unshift(`[${dateStr} ${timeStr}] [${prefix}] [${level.toUpperCase()}] ${msg}`);
    if (window.appLogs.length > maxLogs) window.appLogs.pop();

    try {
        localStorage.setItem('app_system_logs', JSON.stringify(window.appLogs));
    } catch (e) { }

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
    try { localStorage.removeItem('app_system_logs'); } catch (e) { }
    window.dispatchEvent(new Event('app-logs-updated'));
};

/**
 * Initialize System Logs UI
 * @param {Object} config 
 * @param {string} config.containerId - Container ID for rendering UI
 * @param {string} [config.description] - Custom description text
 */
export function mountSystemLogsUI(config) {
    const container = document.getElementById(config.containerId);
    if (!container) {
        console.error(window.t ? window.t('systemLogs.logger.containerNotFound', { id: config.containerId }) : 'mountSystemLogsUI: Cannot find container #' + config.containerId);
        return;
    }

    // Render HTML structure
    container.innerHTML = `
        <div class="settings-section mt-8 mb-8 rounded-3xl p-4 sm:p-5 border" style="background: var(--surface-color); border-color: var(--border-color);">
            <div class="flex items-center gap-3 mb-4 px-2">
                <div class="w-9 h-9 rounded-xl flex items-center justify-center shadow-sm border" style="background: var(--active-bg); color: var(--active-text); border-color: var(--border-color);">
                    <span class="material-icons text-[20px]">receipt_long</span>
                </div>
                <h3 class="m-0 text-[1.05rem] font-bold text-main tracking-wide">${window.t ? window.t('ui.settings.systemLogs.title') : 'System Logs'}</h3>
            </div>
            
            <div class="rounded-2xl overflow-hidden shadow-sm border" style="background: var(--bg-color); border-color: var(--border-color);">
                <div class="flex flex-col sm:flex-row gap-2 p-4 pb-3">
                    <div class="relative w-full sm:flex-1">
                        <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            <span class="material-icons text-[16px] text-slate-400">search</span>
                        </div>
                        <input type="text" id="log-time-filter"
                            class="w-full text-sm pl-9 pr-2 py-2 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:text-slate-200 placeholder-slate-400 shadow-sm border"
                            style="background: var(--surface-color); border-color: var(--border-color); color: var(--text-main);"
                            placeholder="${window.t ? window.t('ui.settings.systemLogs.placeholderSearch') : 'Search...'}">
                    </div>
                    <div class="flex gap-2 w-full sm:w-auto">
                        <button id="btn-copy-logs"
                            class="flex-1 sm:flex-none whitespace-nowrap text-sm px-3 py-2 rounded-xl transition-colors flex items-center justify-center gap-1 shadow-sm border"
                            style="background: var(--surface-color); border-color: var(--border-color); color: var(--text-main);"
                            title="${window.t ? window.t('ui.settings.systemLogs.titleCopy') : 'Copy filtered logs'}">
                            <span class="material-icons text-[16px]">content_copy</span>
                            <span class="hidden sm:inline">${window.t ? window.t('ui.settings.systemLogs.btnCopy') : 'Copy'}</span>
                        </button>
                        <button id="btn-export-logs"
                            class="flex-1 sm:flex-none whitespace-nowrap text-sm px-3 py-2 rounded-xl transition-colors flex items-center justify-center gap-1 shadow-sm border"
                            style="background: var(--surface-color); border-color: var(--border-color); color: var(--text-main);">
                            <span class="material-icons text-[16px]">download</span>
                            <span class="hidden sm:inline">${window.t ? window.t('ui.settings.systemLogs.btnExport') : 'Export'}</span>
                        </button>
                        <button id="btn-clear-logs"
                            class="flex-1 sm:flex-none whitespace-nowrap text-sm px-3 py-2 rounded-xl transition-colors flex items-center justify-center gap-1 shadow-sm border"
                            style="background: var(--surface-color); border-color: var(--border-color); color: #ef4444;"
                            title="${window.t ? window.t('ui.settings.systemLogs.titleClear') : 'Clear logs'}">
                            <span class="material-icons text-[16px]">delete_sweep</span>
                            <span class="hidden sm:inline">${window.t ? window.t('ui.settings.systemLogs.btnClear') : 'Clear'}</span>
                        </button>
                    </div>
                </div>

                <div style="border-top: 1px solid var(--border-color); border-bottom: 1px solid var(--border-color);">
                    <div class="bg-slate-900 dark:bg-black/50 p-4 h-48 overflow-y-auto">
                        <pre id="system-logs-container"
                            class="text-[11px] sm:text-xs text-slate-300 font-mono whitespace-pre-wrap leading-relaxed break-all m-0"
                            style="scrollbar-width: thin; scrollbar-color: #334155 #0f172a;"></pre>
                    </div>
                </div>
                <p class="text-[11px] text-muted p-4 text-center sm:text-left m-0">
                    ${config.description || (window.t ? window.t('ui.settings.systemLogs.desc') : 'Display system logs.')}
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

        // Parse and beautify logs, add colors
        const formattedLogs = filteredLogs.map(logStr => {
            // Escape HTML first to prevent XSS
            const escaped = logStr.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            // Attempt to parse format: [time] [module] [level] message
            const match = escaped.match(/^(\[.*?\])\s+(\[.*?\])\s+(\[.*?\])\s+(.*)$/);
            if (!match) return escaped;

            const time = match[1];
            const module = match[2];
            const level = match[3];
            const msg = match[4];

            let levelColor = 'text-emerald-400'; // Default INFO color
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
            if (confirm(window.t ? window.t('ui.settings.systemLogs.confirmClear') : 'Are you sure you want to clear all system logs?')) {
                if (window.clearAppLogs) window.clearAppLogs();
            }
        });
    }
    if (btnExport) {
        btnExport.addEventListener('click', () => {
            const currentContent = logContainer.textContent;
            if (!currentContent) {
                alert(window.t ? window.t('ui.settings.systemLogs.emptyExport') : 'No logs to export');
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
                alert(window.t ? window.t('ui.settings.systemLogs.emptyCopy') : 'No logs to copy');
                return;
            }
            navigator.clipboard.writeText(currentContent).then(() => {
                alert(window.t ? window.t('ui.settings.systemLogs.copySuccess') : 'Logs copied');
            }).catch(err => {
                alert((window.t ? window.t('ui.settings.systemLogs.copyError') : 'Copy failed: {error}').replace('{error}', err));
            });
        });
    }

    // Initial render
    renderLogs();
}

