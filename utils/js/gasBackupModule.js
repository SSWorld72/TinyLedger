/**
 * ============================================================================
 * GAS 私有雲端備份模組 (gasBackupModule.js)
 * ============================================================================
 * 負責與 Google Apps Script (GAS) 私有雲進行連線與資料備份/還原，並自帶完整的設定 UI。
 * 
 * @example
 * import { GasBackupModule } from '../../utils/js/gasBackupModule.js';
 * 
 * window.gasBackupInstance = new GasBackupModule({
 *     containerId: 'gas-backup-module',
 *     settingsObj: settings,
 *     onSaveSettings: saveSettings,
 *     getCleanPayload: () => JSON.parse(JSON.stringify(settings)),
 *     onRestoreSuccess: () => window.location.reload()
 * });
 */

import { showConfirmModal } from './uiDialogs.js';
import { ZipBackupHelper } from './zipBackupHelper.js';
import { createTipBox } from './tipBox.js';

export class GasBackupModule {
    /**
     * 初始化模組
     * @param {Object} config 
     * @param {string} config.containerId - 渲染 UI 的容器 ID
     * @param {Object} config.settingsObj - 專案全域設定檔物件的參照
     * @param {Function} config.onSaveSettings - 儲存設定的回呼函數
     * @param {Function} config.getCleanPayload - 取得乾淨備份資料的回呼函數 (需清除不必要的快取)
     * @param {Function} config.onRestoreSuccess - 還原成功後的回呼函數 (通常是 window.location.reload())
     * @param {Function} [config.generateRestoreConfirmMessage] - (可選) 自訂還原確認訊息
     * @param {Function} [config.generateBackupSuccessMessage] - (可選) 自訂備份成功訊息
     * @param {Function} [config.setAppBusy] - 設定 UI 忙碌狀態的回呼函數 (可選)
     * @param {string} [config.customDescriptionHtml] - 自訂的說明文字 HTML (可選)
     * @param {string} [config.appName] - 專案名稱標識 (預設: UnknownApp)
     * @param {boolean} [config.useZip] - 是否使用 ZIP 壓縮打包 (預設: false)
     */
    constructor(config) {
        this.appName = config.appName || 'UnknownApp';
        this.containerId = config.containerId;
        this.settings = config.settingsObj;
        this.onSaveSettings = config.onSaveSettings;
        this.getCleanPayload = config.getCleanPayload;
        this.onRestoreSuccess = config.onRestoreSuccess;
        this.useGlobalRestoreMode = config.useGlobalRestoreMode || false;
        this.setAppBusy = config.setAppBusy || window.setAppBusy;
        this.useZip = config.useZip || false;
        
        // 外部自訂訊息產生器
        this.generateRestoreConfirmMessage = config.generateRestoreConfirmMessage || null;
        this.generateBackupSuccessMessage = config.generateBackupSuccessMessage || null;
        
        this.customDescriptionHtml = config.customDescriptionHtml || `
            <span class="font-medium text-emerald-600">✅ 完整備份：</span>您的所有紀錄與系統偏好設定。<br>
            <span class="text-slate-400 text-[10px]">(*保持私人備份檔的極致輕量與安全)</span>
        `;
        
        this.autoSyncTimer = null;
        this.renderUI();
        this.initHelpModal();
        this.bindEvents();
    }

    renderUI() {
        const container = document.getElementById(this.containerId);
        if (!container) {
            console.error(`GasBackupModule: 找不到容器 #${this.containerId}`);
            return;
        }

        container.innerHTML = `
            <div style="padding-top: 16px;">
                <div class="flex items-center justify-between mb-1">
                    <h4 style="margin: 0; font-size: 0.95rem; font-weight: 600; display: flex; align-items: center; gap: 6px; color: var(--text-main);">
                        專屬私有雲端備份 (GAS Private Cloud) (JSON)
                    </h4>
                    <span class="text-[11px] font-medium px-2 py-0.5 rounded-full" style="background: var(--active-bg); color: var(--primary-color);">自動同步</span>
                </div>
                <p class="text-[0.85rem] mb-4 text-left" style="color: var(--text-muted); margin: 4px 0 12px 0;">
                    填寫你專屬的 Backup GAS 網址，系統會透過安全的 POST 請求將你的所有資料加密傳輸並備份到你自己的 Google 雲端硬碟中。
                </p>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3 p-3 rounded-lg border" style="background: var(--bg-color); border-color: var(--border-color);">
                    <div>
                        <label class="block text-xs font-medium text-muted mb-1">變動後自動同步延遲</label>
                        <select id="gas-setting-auto-sync-interval" class="form-control" style="padding: 0.5rem;">
                            <option value="0">關閉自動同步</option>
                            <option value="5000">5 秒鐘</option>
                            <option value="60000">1 分鐘</option>
                            <option value="180000">3 分鐘</option>
                            <option value="300000">5 分鐘</option>
                            <option value="600000">10 分鐘</option>
                            <option value="900000">15 分鐘</option>
                            <option value="1800000">30 分鐘</option>
                            <option value="3600000">1 小時</option>
                            <option value="7200000">2 小時</option>
                            <option value="14400000">4 小時</option>
                            <option value="28800000">8 小時</option>
                            <option value="86400000">24 小時</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-xs font-medium text-muted mb-1" id="gas-label-backup-versions">保留版本數量 (1~99)</label>
                        <select id="gas-setting-backup-versions" class="form-control" style="padding: 0.5rem;">
                            ${Array.from({length: 99}, (_, i) => '<option value="' + (i+1) + '">' + (i+1) + '</option>').join('\\n                            ')}
                        </select>
                    </div>
                    <div class="col-span-1 md:col-span-2 flex justify-end md:-mt-2">
                        <div id="gas-last-sync-time" class="text-[11px] text-muted hidden">最近同步時間：--</div>
                    </div>
                </div>
                
                <div class="flex flex-col md:flex-row gap-4 mb-3">
                    <div class="flex-1">
                        <div class="flex items-center justify-start gap-1.5 mb-1">
                            <label class="block text-xs font-medium text-muted">專屬備份 GAS 網址</label>
                            <svg id="btn-gas-url-help" class="w-[22px] h-[22px] text-blue-500 cursor-pointer hover:text-blue-400 transition-colors" viewBox="0 0 24 24" fill="currentColor" title="點擊查看設定教學" onclick="document.getElementById('gas-help-modal').classList.remove('hidden')">
                                <path d="M11 18h2v-2h-2v2zm1-16C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-2.21 0-4 1.79-4 4h2c0-1.1.9-2 2-2s2 .9 2 2c0 2-3 1.75-3 5h2c0-2.25 3-2.5 3-5 0-2.21-1.79-4-4-4z"/>
                            </svg>
                        </div>
                        <input type="text" id="gas-setting-private-gas-url"
                            class="form-control" style="padding: 0.5rem;"
                            placeholder="https://script.google.com/macros/s/........./exec">
                        <div class="mt-2">
                            ${createTipBox({ type: 'success', html: this.customDescriptionHtml, fontSize: '0.75rem' })}
                        </div>
                    </div>
                </div>

                <div class="flex flex-col sm:flex-row gap-3">
                    <button id="gas-btn-cloud-backup"
                        class="btn-primary flex-1 flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-medium rounded-lg shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path>
                        </svg>
                        備份至私有雲
                    </button>
                    <button id="gas-btn-cloud-restore"
                        class="btn-secondary flex-1 flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-medium rounded-lg shadow-sm transition-colors">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                        </svg>
                        從雲端還原
                    </button>
                </div>
                </div>
                
                ${this.useGlobalRestoreMode ? '' : `
                <div class="mt-4 pt-4 border-t border-slate-200/50 border-dashed dark:border-slate-700/50">
                    <label class="block text-xs font-medium text-muted mb-1">雲端還原方式</label>
                    <select id="gas-setting-restore-mode"
                        class="form-control w-full text-sm block p-2 outline-none">
                        <option value="merge">合併方式 (保留本機，跳過重複)</option>
                        <option value="overwrite">覆蓋方式 (清空本機，完全覆蓋)</option>
                    </select>
                </div>
                `}
            </div>
        `;
    }

    initHelpModal() {
        let gasHelpModal = document.getElementById('gas-help-modal');
        if (!gasHelpModal) {
            gasHelpModal = document.createElement('div');
            gasHelpModal.id = 'gas-help-modal';
            gasHelpModal.className = 'hidden fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4';
            gasHelpModal.innerHTML = `
                <div class="rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col border" style="background-color: var(--surface-solid); border-color: var(--border-color);">
                    <div class="px-5 py-4 flex justify-between items-center" style="background-color: var(--bg-color); border-bottom: 1px solid var(--border-color);">
                        <h3 class="font-semibold text-lg flex items-center gap-2" style="color: var(--text-main);">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="color: var(--primary-color);">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                            專屬備份 GAS 網址申請教學
                        </h3>
                        <button id="btn-close-gas-help"
                            class="transition-colors focus:outline-none cursor-pointer" style="color: var(--text-muted);">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                        </button>
                    </div>
                    <div class="p-5 text-sm leading-relaxed overflow-y-auto max-h-[70vh] space-y-4" style="color: var(--text-muted);">
                        <p>
                            為了確保您的財務或私密資料<strong style="color: var(--text-main);">絕對安全</strong>，本系統提供「專屬私有雲端備份」機制。
                            您的資料將直接上傳至您個人的 Google Drive，不經過任何第三方伺服器。
                        </p>
                        <hr style="border-color: var(--border-color); opacity: 0.5;">

                        <div>
                            <strong class="px-2 py-1 rounded text-xs mb-2 inline-block" style="background-color: var(--active-bg); color: var(--active-text);">第一階段：貼上程式碼</strong>
                            <ol class="list-decimal pl-5 space-y-1.5 mt-1" style="color: var(--text-muted);">
                                <li>前往 <a href="https://script.google.com/" target="_blank" class="hover:underline font-medium" style="color: var(--primary-color);">Google Apps Script</a>，點選左上角的「＋ 新專案」。</li>
                                <li>點選左上方預設的「未命名的專案」，將它改名為容易辨識的名稱，例如：<code class="px-1 rounded text-[12px]" style="background-color: var(--bg-color); color: var(--secondary-color);">${this.appName} (私有雲端備份)</code>。</li>
                                <li>在中間的程式碼編輯區，把原本的 <code class="px-1 rounded text-[11px]" style="background-color: var(--bg-color); color: var(--secondary-color);">function myFunction() {}</code> 全部刪除。</li>
                                <li>將本系統專屬的 <code class="px-1 rounded font-mono text-[11px]" style="background-color: var(--bg-color); color: var(--secondary-color);">gas_private_backup.js</code> 程式碼全部貼上並儲存。</li>
                            </ol>
                        </div>

                        <div>
                            <strong class="px-2 py-1 rounded text-xs mb-2 inline-block" style="background-color: var(--active-bg); color: var(--active-text);">第二階段：部署並設定權限</strong>
                            <ol class="list-decimal pl-5 space-y-1.5 mt-1" style="color: var(--text-muted);">
                                <li>點擊畫面右上角的藍色按鈕「部署」，選擇「新增部署作業」。</li>
                                <li>在跳出的視窗中，點擊左上角齒輪圖示，勾選「網頁應用程式」。</li>
                                <li><strong style="color: var(--secondary-color);">【最重要】</strong>「執行身分」請務必選擇「我」，「誰可以存取」請選擇「所有人」。</li>
                                <li>設定好後，按下右下角的「部署」。</li>
                            </ol>
                        </div>

                        <div>
                            <strong class="px-2 py-1 rounded text-xs mb-2 inline-block" style="background-color: var(--active-bg); color: var(--active-text);">第三階段：授權與取得網址</strong>
                            <ol class="list-decimal pl-5 space-y-1.5 mt-1" style="color: var(--text-muted);">
                                <li>(首次部署) 系統會跳出授權視窗，請點擊「授權存取」並選擇您的帳號。</li>
                                <li>(首次部署) 若出現警告，請點擊左下角「進階」->「前往 (不安全)」，然後點擊「允許」。</li>
                                <li>授權完成後，複製「網頁應用程式」下方的「網址 (URL)」，貼回設定頁面的格子中！</li>
                            </ol>
                        </div>

                        <div class="p-3 rounded-lg border" style="background-color: var(--active-bg); color: var(--text-main); border-color: var(--border-color);">
                            <div class="flex items-start gap-2">
                                <svg class="w-5 h-5 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="color: var(--primary-color);"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                                <span class="text-xs leading-relaxed font-medium">如果您已經部署過最新通用版 GAS，可以直接貼上同一個網址！不同專案的備份檔會自動獨立分開，不會互相覆蓋。</span>
                            </div>
                        </div>
                    </div>
                    <div class="px-5 py-4 flex justify-end" style="background-color: var(--bg-color); border-top: 1px solid var(--border-color);">
                        <button id="btn-gas-help-ok" class="px-5 py-2 font-medium rounded-lg transition-colors cursor-pointer" style="background-color: var(--primary-color); color: #fff;">我了解了</button>
                    </div>
                </div>
            `;
            document.body.appendChild(gasHelpModal);
            
            // 綁定關閉事件
            const closeModal = () => gasHelpModal.classList.add('hidden');
            document.getElementById('btn-close-gas-help')?.addEventListener('click', closeModal);
            document.getElementById('btn-gas-help-ok')?.addEventListener('click', closeModal);
            // 點擊背景遮罩也可以關閉
            gasHelpModal.addEventListener('click', (e) => {
                if (e.target === gasHelpModal) closeModal();
            });
        }
    }

    bindEvents() {
        const gasUrlInput = document.getElementById('gas-setting-private-gas-url');
        if (gasUrlInput) {
            gasUrlInput.value = this.settings.privateGasUrl || '';
            gasUrlInput.addEventListener('input', (e) => {
                const oldUrl = this.settings.privateGasUrl;
                const newUrl = e.target.value.trim();
                this.settings.privateGasUrl = newUrl;
                
                // 【安全機制】如果原本沒有網址（代表新環境剛貼上準備還原），鎖定自動同步，防止空資料上傳
                if (!oldUrl && newUrl) {
                    this.isAutoSyncLocked = true;
                    console.log('[GasBackup] 初次設定 URL，已暫時鎖定自動同步，防止空資料覆蓋雲端。');
                }
                
                this.onSaveSettings();
            });
        }

        const autoSyncIntervalSelect = document.getElementById('gas-setting-auto-sync-interval');
        if (autoSyncIntervalSelect) {
            autoSyncIntervalSelect.value = (this.settings.autoSyncInterval !== undefined ? this.settings.autoSyncInterval : 5000).toString();
            autoSyncIntervalSelect.addEventListener('change', (e) => {
                this.settings.autoSyncInterval = parseInt(e.target.value, 10);
                this.onSaveSettings();
            });
        }

        if (!this.useGlobalRestoreMode) {
            const restoreModeSelect = document.getElementById('gas-setting-restore-mode');
            if (restoreModeSelect) {
                restoreModeSelect.value = this.settings.cloudRestoreMode || 'merge';
                restoreModeSelect.addEventListener('change', (e) => {
                    this.settings.cloudRestoreMode = e.target.value;
                    this.onSaveSettings();
                });
            }
        }

        const backupVersionsInput = document.getElementById('gas-setting-backup-versions');
        
        if (backupVersionsInput) {
            backupVersionsInput.value = this.settings.backupVersions || 10;

            backupVersionsInput.addEventListener('change', (e) => {
                let val = parseInt(e.target.value, 10);
                if (val < 1) val = 1;
                if (val > 99) val = 99;
                e.target.value = val;
                this.settings.backupVersions = val;
                this.onSaveSettings();
            });
        }
        
        const syncTimeEl = document.getElementById('gas-last-sync-time');
        if (syncTimeEl) {
            if (this.settings.lastSyncTime) {
                syncTimeEl.textContent = `最近同步時間：${this.settings.lastSyncTime}`;
                syncTimeEl.classList.remove('hidden');
            } else {
                syncTimeEl.textContent = '最近同步時間：尚未同步';
                syncTimeEl.classList.remove('hidden');
            }
        }

        const btnBackup = document.getElementById('gas-btn-cloud-backup');
        if (btnBackup) {
            btnBackup.addEventListener('click', () => this.backupToPrivateCloud(false));
        }

        const btnRestore = document.getElementById('gas-btn-cloud-restore');
        if (btnRestore) {
            btnRestore.addEventListener('click', () => this.restoreFromPrivateCloud());
        }

        // 綁定教學彈窗事件
        const btnGasHelp = document.getElementById('btn-gas-url-help');
        const gasHelpModal = document.getElementById('gas-help-modal');
        const btnGasHelpClose = document.getElementById('btn-gas-help-close');
        const btnGasHelpOk = document.getElementById('btn-gas-help-ok');
        
        if (btnGasHelp && gasHelpModal) {
            btnGasHelp.addEventListener('click', () => gasHelpModal.classList.remove('hidden'));
            const closeModal = () => gasHelpModal.classList.add('hidden');
            
            if (btnGasHelpClose) btnGasHelpClose.addEventListener('click', closeModal);
            if (btnGasHelpOk) btnGasHelpOk.addEventListener('click', closeModal);
            // 點擊背景關閉
            gasHelpModal.addEventListener('click', (e) => {
                if (e.target === gasHelpModal) closeModal();
            });
        }
    }

    triggerAutoSync() {
        if (!this.settings.privateGasUrl) return;
        
        const interval = this.settings.autoSyncInterval !== undefined ? this.settings.autoSyncInterval : 5000;
        if (interval <= 0) {
            if (this.autoSyncTimer) clearTimeout(this.autoSyncTimer);
            return;
        }
        
        if (this.autoSyncTimer) clearTimeout(this.autoSyncTimer);
        this.autoSyncTimer = setTimeout(() => {
            console.log(`[雲端備份] 延遲 ${interval} 毫秒後觸發背景自動同步：準備將本地資料庫打包上傳至專屬私有雲進行備份。`);
            this.backupToPrivateCloud(true);
        }, interval);
    }

    stopAutoSync() {
        if (this.autoSyncTimer) {
            clearTimeout(this.autoSyncTimer);
            this.autoSyncTimer = null;
            console.log('[雲端備份] 背景自動同步已強制停止。');
        }
    }

    async backupToPrivateCloud(isAutoSync = false) {
        if (isAutoSync) {
            if (this.isAutoSyncLocked) return;
            this.isAutoSyncLocked = true;
        } else {
            this.isAutoSyncLocked = false;
        }
        if (!this.settings.privateGasUrl) {
            if (!isAutoSync) alert('請先在上方輸入您的「專屬備份 GAS URL」！');
            return;
        }
        const btn = document.getElementById('gas-btn-cloud-backup');
        if (btn && !isAutoSync) btn.disabled = true;
        try {
            const payloadData = await this.getCleanPayload();
            
            // 從 LocalStorage 讀取進階備份設定
            const backupSettings = JSON.parse(localStorage.getItem('global_backup_settings')) || {
                mode: 'daily',
                includePhotos: true
            };

            if (this.setAppBusy && !isAutoSync) {
                this.setAppBusy(true, {
                    title: '私有雲備份中',
                    detail: '正在打包所有資料為 ZIP...',
                    statusText: '打包中...',
                    progress: 20
                });
            }

            // 1. 產生備份資料與檔名
            const d = new Date();
            const pad = n => (n < 10 ? '0' + n : n);
            const timeStr = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
            
            let uploadData = '';
            let backupFileName = '';
            let fileSizeKb = '0';

            if (!this.useZip) {
                // 不使用 ZIP 壓縮，採用原始 JSON (加入縮排，方便閱讀)
                const jsonStr = JSON.stringify(payloadData, null, 2);
                backupFileName = `${this.appName}_PrivateBackup_${timeStr}.json`;
                const blob = new Blob([jsonStr], { type: 'application/json' });
                fileSizeKb = (blob.size / 1024).toFixed(1);

                uploadData = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => {
                        const result = reader.result;
                        resolve(result.substring(result.indexOf(',') + 1));
                    };
                    reader.onerror = reject;
                    reader.readAsDataURL(blob);
                });
            } else {
                // 使用 ZIP 壓縮並轉為 Base64
                const zipBlob = await ZipBackupHelper.createBackupZip(payloadData, backupSettings);
                fileSizeKb = (zipBlob.size / 1024).toFixed(1);
                backupFileName = `${this.appName}_PrivateBackup_${timeStr}.zip`;

                uploadData = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => {
                        const result = reader.result;
                        resolve(result.substring(result.indexOf(',') + 1));
                    };
                    reader.onerror = reject;
                    reader.readAsDataURL(zipBlob);
                });
            }

            // 3. 切割上傳 (Chunked Upload)
            // 每個 chunk 大小設定為 2MB (字元長度)
            const chunkSize = 2 * 1024 * 1024; 
            const totalChunks = Math.ceil(uploadData.length / chunkSize);
            const sessionId = 'session_' + Date.now() + '_' + Math.floor(Math.random() * 1000);

            if (this.setAppBusy && !isAutoSync) {
                this.setAppBusy(true, {
                    title: '私有雲備份中',
                    detail: `正在上傳至雲端空間...\n檔案大小: ${fileSizeKb} KB\n共切分為 ${totalChunks} 包傳輸`,
                    statusText: '上傳中...',
                    progress: 40
                });
            }

            let resData = null;
            let success = false;
            
            for (let i = 0; i < totalChunks; i++) {
                const start = i * chunkSize;
                const end = Math.min(start + chunkSize, uploadData.length);
                const chunkStr = uploadData.substring(start, end);

                if (this.setAppBusy && !isAutoSync) {
                    this.setAppBusy(true, {
                        title: '私有雲備份中',
                        detail: `正在上傳至雲端空間...\n檔案大小: ${fileSizeKb} KB\n共切分為 ${totalChunks} 包傳輸\n目前上傳進度: ${i + 1} / ${totalChunks}`,
                        statusText: `上傳第 ${i + 1} 包...`,
                        progress: 40 + Math.floor((i / totalChunks) * 60)
                    });
                }

                const uploadPayload = {
                    action: 'backup_chunk',
                    uploadSessionId: sessionId,
                    chunkIndex: i,
                    totalChunks: totalChunks,
                    data: chunkStr,
                    appName: this.appName,
                    fileName: backupFileName,
                    backupVersions: this.settings.backupVersions || 10
                };

                const res = await fetch(this.settings.privateGasUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                    body: JSON.stringify(uploadPayload)
                });
                
                resData = await res.json();
                if (resData && resData.status === 'success') {
                    success = true;
                } else {
                    success = false;
                    throw new Error(resData.message || '雲端回傳錯誤');
                }
            }
            
            if (success) {
                // 更新同步時間
                const syncTimeEl = document.getElementById('gas-last-sync-time');
                let twTime = '';
                if (syncTimeEl) {
                    const now = new Date();
                    twTime = new Intl.DateTimeFormat('zh-TW', {
                        year: 'numeric', month: '2-digit', day: '2-digit',
                        hour: '2-digit', minute: '2-digit', second: '2-digit',
                        hour12: false
                    }).format(now);
                    syncTimeEl.textContent = `最近同步時間：${twTime}`;
                    syncTimeEl.classList.remove('hidden');
                }
                
                this.settings.lastSyncTime = twTime;
                this.onSaveSettings();

                console.log(`[雲端備份] ${isAutoSync ? '背景自動' : '手動'}備份資料庫（backupToPrivateCloud）成功: 檔案大小 ${fileSizeKb} KB`);

                if (!isAutoSync) {
                    let successMsg = '✅ 備份成功！';
                    if (typeof this.generateBackupSuccessMessage === 'function') {
                        successMsg = await this.generateBackupSuccessMessage(payloadData);
                    }
                    if (this.setAppBusy) {
                        this.setAppBusy(false, { success: true, message: successMsg });
                    } else {
                        alert(successMsg);
                    }
                }
            } else {
                throw new Error((resData && resData.message) || '雲端回傳錯誤');
            }
        } catch (err) {
            console.error('備份發生錯誤:', err);
            if (!isAutoSync) {
                alert('備份失敗: ' + err.message);
                if (this.setAppBusy) this.setAppBusy(false, { error: true, message: '備份失敗' });
            }
        } finally {
            if (btn && !isAutoSync) btn.disabled = false;
            if (isAutoSync) {
                this.isAutoSyncLocked = false;
            }
        }
    }

    async restoreFromPrivateCloud() {
        this.isAutoSyncLocked = false;
        if (!this.settings.privateGasUrl) {
            alert('請先在上方輸入您的「專屬備份 GAS URL」！');
            return;
        }
        if (!confirm('警告：從雲端還原將會覆蓋本機所有的紀錄與設定！\n強烈建議您先使用備份工具進行本地備份。\n\n確定要繼續還原嗎？')) {
            return;
        }
        const btn = document.getElementById('gas-btn-cloud-restore');
        if (btn) btn.disabled = true;
        try {
            if (this.setAppBusy) {
                this.setAppBusy(true, {
                    title: '私有雲還原中',
                    detail: '正在連線取得備份版本清單...',
                    statusText: '連線中...',
                    progress: 20
                });
            }
            
            let fetchUrl = this.settings.privateGasUrl;
            const urlBase = fetchUrl.includes('?') ? `${fetchUrl}&appName=${encodeURIComponent(this.appName)}` : `${fetchUrl}?appName=${encodeURIComponent(this.appName)}`;
            
            // 1. 取得版本清單
            const listRes = await fetch(`${urlBase}&action=list`);
            const listText = await listRes.text();
            let listPayload;
            try {
                listPayload = JSON.parse(listText);
            } catch (e) {
                console.error("雲端回傳非 JSON 資料:", listText);
                let extraHint = '';
                if (listText.toLowerCase().includes('<html')) {
                    extraHint = '\\n(系統接收到網頁 HTML 而非資料。請檢查：1. 是否複製到指令碼編輯器的網址？必須是「網頁應用程式」網址。2. 發布權限是否設為「所有人」？)';
                }
                throw new Error('無法解析雲端資料。請確認網址正確且 GAS 腳本已更新至最新版。' + extraHint);
            }
            if (listPayload.status === 'error') {
                throw new Error('雲端回傳錯誤：' + listPayload.message);
            }

            const versions = listPayload.data || [];
            if (versions.length === 0) {
                throw new Error('還原失敗：雲端尚無備份資料。');
            }

            let selectedFileId = null;
            let selectedFileName = null;

            // 2. 如果只有一個版本，直接還原；否則顯示選擇選單
            if (versions.length === 1) {
                selectedFileId = versions[0].id || versions[0].fileId;
                selectedFileName = versions[0].name || versions[0].fileName;
            } else {
                if (this.setAppBusy) this.setAppBusy(false); // 暫時關閉 loading 以顯示選單
                selectedFileId = await this.showVersionSelectModal(versions);
                if (!selectedFileId) {
                    return; // 使用者取消
                }
                selectedFileName = versions.find(v => (v.id || v.fileId) === selectedFileId)?.name || 'Backup.zip';
                if (this.setAppBusy) {
                    this.setAppBusy(true, {
                        title: '私有雲還原中',
                        detail: `正在下載 ${selectedFileName}...`,
                        statusText: '下載中...',
                        progress: 50
                    });
                }
            }
            
            // 3. 下載指定版本的內容
            const restoreRes = await fetch(`${urlBase}&action=download&fileId=${encodeURIComponent(selectedFileId)}`);
            const restoreText = await restoreRes.text();
            let payload;
            try {
                payload = JSON.parse(restoreText);
            } catch (e) {
                throw new Error('還原失敗：無法解析下載的備份檔。');
            }
            
            if (payload.status === 'error') {
                throw new Error('雲端回傳錯誤：' + payload.message);
            }
            
            let backupData = null;
            const isZip = payload.isZip || (selectedFileName && selectedFileName.endsWith('.zip'));

            if (isZip) {
                // 將 Base64 解碼為 ArrayBuffer，交給 ZipBackupHelper
                const base64String = payload.data;
                const binaryString = atob(base64String);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }
                backupData = await ZipBackupHelper.extractBackupZip(bytes.buffer);
            } else {
                // 舊版純文字 JSON 相容
                let outerBackupData = payload.data;
                if (!outerBackupData) throw new Error('還原失敗：備份檔格式不正確或內容為空。');
                
                if (typeof outerBackupData === 'string') {
                    try { 
                        outerBackupData = JSON.parse(outerBackupData); 
                    } catch(e) {
                        // 嘗試 Base64 解碼 (相容新版 GAS 的 download action 對舊版 JSON 檔案的處理)
                        try {
                            const decodedStr = decodeURIComponent(escape(atob(outerBackupData)));
                            outerBackupData = JSON.parse(decodedStr);
                        } catch(e2) {
                            // 若依然失敗，交由後續錯誤處理
                        }
                    }
                }
                
                backupData = outerBackupData.data ? outerBackupData.data : outerBackupData;
                
                if (typeof backupData === 'string') {
                    try { backupData = JSON.parse(backupData); } catch(e) {
                        throw new Error('還原失敗：無法解析雲端備份資料，可能檔案已損壞。');
                    }
                }
            }

            let confirmMessage = '📦 雲端備份讀取成功！\n\n【警告】確定要使用這份資料覆蓋本機所有紀錄嗎？';
            if (typeof this.generateRestoreConfirmMessage === 'function') {
                confirmMessage = await this.generateRestoreConfirmMessage(backupData);
            }

            if (this.setAppBusy) this.setAppBusy(false);
            
            let isOverwrite = false;
            if (this.useGlobalRestoreMode) {
                const globalRestoreModeEl = document.getElementById('global-restore-mode');
                isOverwrite = globalRestoreModeEl ? (globalRestoreModeEl.value === 'overwrite') : false;
            } else {
                isOverwrite = this.settings.cloudRestoreMode === 'overwrite';
            }
            
            const isConfirmed = await showConfirmModal({
                title: '備份檔解析完成',
                message: confirmMessage,
                confirmText: '開始還原',
                cancelText: '取消',
                icon: '📦',
                isDanger: isOverwrite
            });

            if (!isConfirmed) {
                return;
            }

            if (this.setAppBusy) {
                this.setAppBusy(true, {
                    title: '私有雲還原中',
                    detail: '正在處理備份資料...',
                    statusText: '處理中...',
                    progress: 80
                });
            }

            const oldPrivateGasUrl = this.settings.privateGasUrl;
            
            for (const key in this.settings) {
                delete this.settings[key];
            }
            
            // 寫入全域資料
            if (backupData.preferences && backupData.preferences.gasSettings) {
                try {
                    const parsedGasSettings = typeof backupData.preferences.gasSettings === 'string' 
                        ? JSON.parse(backupData.preferences.gasSettings) 
                        : backupData.preferences.gasSettings;
                    Object.assign(this.settings, parsedGasSettings);
                } catch(e) {}
            } else {
                if (backupData.preferences && typeof backupData.preferences === 'object' && !Array.isArray(backupData.preferences)) {
                    Object.assign(this.settings, backupData.preferences);
                } else {
                    Object.assign(this.settings, backupData);
                }
            }
            
            const newPrivateGasUrl = this.settings.privateGasUrl;

            // 1. 檢查並詢問 Private Gas Url
            if (newPrivateGasUrl && oldPrivateGasUrl && newPrivateGasUrl !== oldPrivateGasUrl) {
                const msg = `⚠️ 發現備份檔中的「專屬備份 GAS 網址」與本機不同！\n\n[備份] ${newPrivateGasUrl}\n[本機] ${oldPrivateGasUrl}\n\n是否要使用備份的網址「覆蓋」本機網址？\n\n(按「確定」覆蓋，按「取消」保留本機網址)`;
                if (!confirm(msg)) {
                    this.settings.privateGasUrl = oldPrivateGasUrl;
                }
            } else if (!newPrivateGasUrl && oldPrivateGasUrl) {
                this.settings.privateGasUrl = oldPrivateGasUrl;
            }

            await this.onSaveSettings();
            
            console.log('[雲端備份] 從私有雲還原資料庫（restoreFromPrivateCloud）成功');
            
            if (this.onRestoreSuccess) {
                await this.onRestoreSuccess(backupData);
            } else {
                if (this.setAppBusy) this.setAppBusy(false);
                alert('還原成功！系統將自動重新載入。');
                window.location.reload();
            }
        } catch (err) {
            console.error('還原發生錯誤:', err);
            alert('還原失敗: ' + err.message);
            if (this.setAppBusy) this.setAppBusy(false, { error: true, message: '還原失敗' });
        } finally {
            if (btn) btn.disabled = false;
        }
    }

    // 建立並顯示版本選擇彈出視窗
    showVersionSelectModal(versions) {
        return new Promise((resolve) => {
            // 建立 UI
            const overlay = document.createElement('div');
            overlay.className = 'fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-[9999] p-4';
            
            const modal = document.createElement('div');
            modal.className = 'bg-white rounded-xl shadow-2xl w-full max-w-sm flex flex-col overflow-hidden';
            
            // Header
            const header = document.createElement('div');
            header.className = 'px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50';
            header.innerHTML = `
                <h3 class="font-bold text-slate-800 text-base">選擇還原版本</h3>
                <button class="text-slate-400 hover:text-slate-600 transition-colors p-1" id="btn-close-version-modal">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
            `;
            
            // Body
            const body = document.createElement('div');
            body.className = 'p-2 max-h-[60vh] overflow-y-auto';
            
            const list = document.createElement('div');
            list.className = 'flex flex-col gap-1';
            
            versions.forEach((v, index) => {
                const btn = document.createElement('button');
                btn.className = 'w-full text-left px-4 py-3 rounded-lg hover:bg-blue-50 focus:bg-blue-50 focus:outline-none transition-colors group border border-transparent hover:border-blue-100 flex items-center justify-between';
                
                const d = new Date(v.date || v.dateCreated);
                const dateStr = d.toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' });
                const timeStr = d.toLocaleTimeString('zh-TW', { hour12: false });
                
                let badge = '';
                if (index === 0) {
                    badge = '<span class="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-100 text-emerald-700 ml-2">最新</span>';
                }
                
                const displayFileName = (v.name || v.fileName || 'Backup').replace(/\.jsonl?$/, '');
                
                btn.innerHTML = `
                    <div class="flex flex-col">
                        <div class="flex items-center">
                            <span class="font-medium text-slate-700 group-hover:text-blue-700">${dateStr} ${timeStr}</span>
                            ${badge}
                        </div>
                        <span class="text-xs text-slate-400 mt-0.5 font-mono">${displayFileName}</span>
                    </div>
                    <svg class="w-5 h-5 text-slate-300 group-hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
                `;
                
                btn.onclick = () => {
                    document.body.removeChild(overlay);
                    resolve(v.id || v.fileId);
                };
                list.appendChild(btn);
            });
            
            body.appendChild(list);
            modal.appendChild(header);
            modal.appendChild(body);
            overlay.appendChild(modal);
            document.body.appendChild(overlay);
            
            // Close event
            document.getElementById('btn-close-version-modal').onclick = () => {
                document.body.removeChild(overlay);
                resolve(null);
            };
            
            // Click outside to close
            overlay.onclick = (e) => {
                if (e.target === overlay) {
                    document.body.removeChild(overlay);
                    resolve(null);
                }
            };
        });
    }
}
