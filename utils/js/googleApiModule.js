/**
 * ============================================================================
 * Google API Key 設定共用模組 (googleApiModule.js)
 * ============================================================================
 * 動態產生「API Key 設定欄位」與「申請教學彈窗」，支援高度客製化。
 * 
 * @example
 * import { GoogleApiModule } from '../../utils/js/googleApiModule.js';
 * 
 * const apiKeyModule = new GoogleApiModule({
 *     containerId: 'google-api-container',
 *     storageKey: 'my_project_google_api_key',
 *     apiName: 'Google Maps API',
 *     requiredApis: ['Maps JavaScript API', 'Places API']
 * });
 */
export class GoogleApiModule {
    /**
     * @param {Object} config - 設定參數
     * @param {string} config.containerId - 要掛載的 HTML 容器 ID
     * @param {string} config.storageKey - 存入 localStorage 的 Key 名稱
     * @param {string} [config.apiName="Google API"] - 顯示的 API 名稱
     * @param {Array<string>} [config.requiredApis=[]] - 該功能需要的 Google API 列表 (用於生成教學說明)
     */
    constructor(config) {
        this.containerId = config.containerId;
        this.storageKey = config.storageKey;
        this.apiName = config.apiName || 'Google API';
        this.requiredApis = config.requiredApis || [];

        if (!this.containerId || !this.storageKey) {
            console.error('GoogleApiModule: 缺少必要的參數 containerId 或 storageKey');
            return;
        }

        this.init();
    }

    init() {
        this.renderUI();
        this.bindEvents();
        this.loadSettings();
    }

    renderUI() {
        const container = document.getElementById(this.containerId);
        if (!container) {
            console.error(`GoogleApiModule: 找不到容器 #${this.containerId}`);
            return;
        }

        const requiredApisHtml = this.requiredApis.map(api => 
            `<strong style="color: #ea4335;">${api}</strong>`
        ).join('、');

        container.innerHTML = `
            <div class="form-group" style="margin-top:12px;">
                <div class="form-label" style="display: flex; align-items: center; justify-content: flex-start; gap: 8px; margin-bottom: 8px;">
                    <span style="font-weight: bold; color: var(--text-color);">${this.apiName} Key</span>
                    <svg id="btn-${this.containerId}-help" class="w-[22px] h-[22px] cursor-pointer transition-colors" viewBox="0 0 24 24" fill="currentColor" 
                        style="width: 22px; height: 22px; color: #3b82f6;" 
                        title="點擊查看申請教學" onclick="document.getElementById('modal-${this.containerId}-help').style.display='flex'">
                        <path d="M11 18h2v-2h-2v2zm1-16C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-2.21 0-4 1.79-4 4h2c0-1.1.9-2 2-2s2 .9 2 2c0 2-3 1.75-3 5h2c0-2.25 3-2.5 3-5 0-2.21-1.79-4-4-4z"/>
                    </svg>
                </div>
                <input type="text" class="form-control" id="input-${this.containerId}-key" 
                    placeholder="輸入 API Key (選填)" style="width: 100%; padding: 8px; border: 1px solid var(--border-color); border-radius: 4px; background: var(--bg-color); color: var(--text-color);">
            </div>
        `;

        // 將 Modal 獨立掛載到 body 上，避免被外層 modal 的 transform / overflow 影響導致消失
        let modalWrapper = document.getElementById(`modal-${this.containerId}-help`);
        if (!modalWrapper) {
            modalWrapper = document.createElement('div');
            modalWrapper.id = `modal-${this.containerId}-help`;
            // 移除 className = 'modal-overlay'，避免被外部 CSS (例如 TinyLedger) 設為 opacity: 0 或 pointer-events: none
            modalWrapper.style.cssText = 'display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 99999; align-items: center; justify-content: center;';
            modalWrapper.innerHTML = `
                <div style="max-width: 520px; width: 92%; background: var(--bg-color, #fff); border-radius: 12px; box-shadow: 0 8px 32px rgba(0,0,0,0.2); overflow: hidden; display: flex; flex-direction: column;">
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid var(--border-color, #e2e8f0); background: var(--surface-color, #f8fafc);">
                        <h2 style="margin: 0; font-size: 1.15rem; font-weight: 600; color: var(--text-color, #1e293b); display: flex; align-items: center; gap: 8px;">
                            <svg style="width: 20px; height: 20px; color: #3b82f6;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                            ${this.apiName} 申請教學
                        </h2>
                        <button id="btn-close-${this.containerId}-help" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: var(--text-muted, #94a3b8); line-height: 1;">&times;</button>
                    </div>
                    <div style="padding: 20px; font-size: 0.9rem; line-height: 1.7; color: var(--text-color, #334155); overflow-y: auto; max-height: 70vh;">
                        <p style="margin: 0 0 12px 0; color: var(--text-muted, #64748b);">
                            本功能需要一組 <strong style="color: var(--text-color, #1e293b);">Google Cloud API 金鑰</strong>，
                            用於啟用地圖相關服務（如地點搜尋、自動完成等）。金鑰僅儲存於您的瀏覽器本機，不會上傳至任何伺服器。
                        </p>
                        <hr style="border: none; border-top: 1px solid var(--border-color, #e2e8f0); margin: 16px 0;">

                        <div style="margin-bottom: 16px;">
                            <strong style="display: inline-block; background: #eff6ff; color: #1d4ed8; padding: 2px 8px; border-radius: 4px; font-size: 0.8rem; margin-bottom: 8px;">第一階段：建立 Google Cloud 專案</strong>
                            <ol style="margin: 4px 0 0 0; padding-left: 20px;">
                                <li style="margin-bottom: 6px;">前往 <a href="https://console.cloud.google.com/" target="_blank" style="color: #3b82f6; text-decoration: underline; font-weight: 600;">Google Cloud Console</a>，使用您的 Google 帳號登入。</li>
                                <li style="margin-bottom: 6px;">點擊頂部導覽列的「<strong style="color: var(--text-color, #1e293b);">選取專案</strong>」下拉選單，再點擊右上角的「<strong style="color: var(--text-color, #1e293b);">新增專案</strong>」。</li>
                                <li style="margin-bottom: 6px;">輸入一個容易辨識的專案名稱（例如：<code style="background: var(--surface-color, #f1f5f9); padding: 1px 6px; border-radius: 3px; font-size: 0.85em; color: #e11d48;">My Map App</code>），然後按「建立」。</li>
                                <li style="margin-bottom: 6px;">建立完成後，確認目前已選擇到該專案（頂部應顯示您剛建立的專案名稱）。</li>
                            </ol>
                        </div>

                        <div style="margin-bottom: 16px;">
                            <strong style="display: inline-block; background: #eff6ff; color: #1d4ed8; padding: 2px 8px; border-radius: 4px; font-size: 0.8rem; margin-bottom: 8px;">第二階段：啟用 API 並建立金鑰</strong>
                            <ol style="margin: 4px 0 0 0; padding-left: 20px;">
                                <li style="margin-bottom: 6px;">在左側選單中點擊「<strong style="color: var(--text-color, #1e293b);">API 和服務</strong>」>「<strong style="color: var(--text-color, #1e293b);">程式庫</strong>」。</li>
                                <li style="margin-bottom: 6px;">在搜尋框中逐一搜尋以下 API，點進去後按「<strong style="color: #3b82f6;">啟用</strong>」：<br>${requiredApisHtml ? requiredApisHtml : '<strong style="color: #ea4335;">對應的 API</strong>'}。</li>
                                <li style="margin-bottom: 6px;">回到左側選單，點擊「<strong style="color: var(--text-color, #1e293b);">API 和服務</strong>」>「<strong style="color: var(--text-color, #1e293b);">憑證</strong>」。</li>
                                <li style="margin-bottom: 6px;">點擊頂部的「<strong style="color: var(--text-color, #1e293b);">+ 建立憑證</strong>」>「<strong style="color: #8b5cf6;">API 金鑰</strong>」，系統會自動產生一組金鑰。</li>
                                <li style="margin-bottom: 6px;">在彈出的視窗中，先<strong style="color: #ea4335;">複製</strong>這組金鑰（之後要貼回來）。</li>
                            </ol>
                        </div>

                        <div style="margin-bottom: 16px;">
                            <strong style="display: inline-block; background: #eff6ff; color: #1d4ed8; padding: 2px 8px; border-radius: 4px; font-size: 0.8rem; margin-bottom: 8px;">第三階段：（建議）限制金鑰 + 貼回設定</strong>
                            <ol style="margin: 4px 0 0 0; padding-left: 20px;">
                                <li style="margin-bottom: 6px;">在剛才的彈出視窗中，點擊「<strong style="color: var(--text-color, #1e293b);">編輯 API 金鑰</strong>」（或在憑證列表中點該金鑰的鉛筆圖示）。</li>
                                <li style="margin-bottom: 6px;">向下捲動到「<strong style="color: var(--text-color, #1e293b);">API 限制</strong>」區塊，選擇「<strong style="color: var(--text-color, #1e293b);">限制金鑰</strong>」，然後下拉勾選您剛才啟用的 API 進行綁定。</li>
                                <li style="margin-bottom: 6px;">按下「<strong style="color: #3b82f6;">儲存</strong>」即可。</li>
                                <li style="margin-bottom: 6px;">最後，將複製好的金鑰貼回本頁的「<strong style="color: var(--text-color, #1e293b);">${this.apiName} Key</strong>」輸入框中，大功告成！</li>
                            </ol>
                        </div>

                        <div style="background: #eff6ff; color: #1e40af; padding: 10px 12px; border-radius: 8px; border: 1px solid #bfdbfe; display: flex; align-items: flex-start; gap: 8px; margin-top: 8px;">
                            <svg style="width: 18px; height: 18px; flex-shrink: 0; margin-top: 2px;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path></svg>
                            <span style="font-size: 0.8rem; line-height: 1.5; font-weight: 500;">Google 提供每月 200 美元的免費額度，一般個人使用完全不需擔心費用問題。設定帳單帳戶是 Google 的必要步驟，不代表會馬上收費。</span>
                        </div>
                    </div>
                    <div style="display: flex; justify-content: flex-end; padding: 12px 20px; border-top: 1px solid var(--border-color, #e2e8f0); background: var(--surface-color, #f8fafc);">
                        <button id="btn-ok-${this.containerId}-help" style="padding: 8px 20px; font-weight: 600; background: #3b82f6; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 0.9rem; transition: background 0.2s;">了解</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modalWrapper);
        }
    }

    bindEvents() {
        const inputElement = document.getElementById(`input-${this.containerId}-key`);
        if (inputElement) {
            inputElement.addEventListener('change', (e) => {
                localStorage.setItem(this.storageKey, e.target.value.trim());
            });
        }

        const btnHelp = document.getElementById(`btn-${this.containerId}-help`);
        const helpModal = document.getElementById(`modal-${this.containerId}-help`);
        const btnClose = document.getElementById(`btn-close-${this.containerId}-help`);
        const btnOk = document.getElementById(`btn-ok-${this.containerId}-help`);

        if (btnHelp && helpModal) {
            const openModal = () => helpModal.style.display = 'flex';
            const closeModal = () => helpModal.style.display = 'none';

            btnHelp.addEventListener('click', openModal);
            if (btnClose) btnClose.addEventListener('click', closeModal);
            if (btnOk) btnOk.addEventListener('click', closeModal);
            helpModal.addEventListener('click', (e) => {
                if (e.target === helpModal) closeModal();
            });
        }
    }

    loadSettings() {
        const inputElement = document.getElementById(`input-${this.containerId}-key`);
        if (inputElement) {
            inputElement.value = localStorage.getItem(this.storageKey) || '';
        }
    }
}

