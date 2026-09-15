/**
 * ============================================================================
 * Google API Key Configuration Shared Module (googleApiModule.js)
 * ============================================================================
 * Dynamically generates "API Key Settings Field" and "Application Tutorial Modal" with high customizability.
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
     * @param {Object} config - Configuration parameters
     * @param {string} config.containerId - HTML container ID to mount to
     * @param {string} config.storageKey - Key name for saving to localStorage
     * @param {string} [config.apiName="Google API"] - API name to display
     * @param {Array<string>} [config.requiredApis=[]] - List of required Google APIs for this feature (used to generate tutorial)
     */
    constructor(config) {
        this.containerId = config.containerId;
        this.storageKey = config.storageKey;
        this.apiName = config.apiName || 'Google API';
        this.requiredApis = config.requiredApis || [];

        if (!this.containerId || !this.storageKey) {
            console.error(window.t ? window.t('utils.googleApi.missingParams') : 'GoogleApiModule: Missing required parameters containerId or storageKey');
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
            console.error(window.t ? window.t('utils.googleApi.containerNotFound', { id: this.containerId }) : `GoogleApiModule: Cannot find container #${this.containerId}`);
            return;
        }

        const requiredApisHtml = this.requiredApis.map(api => 
            `<strong style="color: #ea4335;">${api}</strong>`
        ).join(', ');

        container.innerHTML = `
            <div class="form-group">
                <h4 style="margin: 0; font-size: 0.95rem; font-weight: 600; display: flex; align-items: center; gap: 6px; margin-bottom: 8px; color: var(--text-main);">
                    ${this.apiName} Key
                    <svg id="btn-${this.containerId}-help" class="cursor-pointer transition-colors" viewBox="0 0 24 24" fill="currentColor" 
                        style="width: 18px; height: 18px; color: var(--primary-color);" 
                        title="${window.t ? window.t('utils.googleApi.titleHelp') : 'Click to view tutorial'}" onclick="document.getElementById('modal-${this.containerId}-help').style.display='flex'">
                        <path d="M11 18h2v-2h-2v2zm1-16C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-2.21 0-4 1.79-4 4h2c0-1.1.9-2 2-2s2 .9 2 2c0 2-3 1.75-3 5h2c0-2.25 3-2.5 3-5 0-2.21-1.79-4-4-4z"/>
                    </svg>
                </h4>
                <input type="text" class="form-control" id="input-${this.containerId}-key" 
                    placeholder="${window.t ? window.t('utils.googleApi.placeholderKey') : 'Enter API Key (Optional)'}" style="width: 100%; padding: 8px; border: 1px solid var(--border-color); border-radius: 4px; background: var(--bg-color); color: var(--text-main);">
            </div>
        `;

        // Mount the Modal independently to the body to avoid disappearing due to outer modal's transform/overflow
        let modalWrapper = document.getElementById(`modal-${this.containerId}-help`);
        if (!modalWrapper) {
            modalWrapper = document.createElement('div');
            modalWrapper.id = `modal-${this.containerId}-help`;
            modalWrapper.style.cssText = 'display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 99999; align-items: center; justify-content: center;';
            modalWrapper.innerHTML = `
                <div style="max-width: 520px; width: 92%; background: var(--bg-color); border-radius: 12px; box-shadow: 0 8px 32px rgba(0,0,0,0.2); overflow: hidden; display: flex; flex-direction: column;">
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid var(--border-color); background: var(--surface-color);">
                        <h2 style="margin: 0; font-size: 1.15rem; font-weight: 600; color: var(--text-main); display: flex; align-items: center; gap: 8px;">
                            <svg style="width: 20px; height: 20px; color: var(--primary-color);" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                            ${this.apiName} ${window.t ? window.t('utils.googleApi.tutorialTitle') : 'Tutorial'}
                        </h2>
                        <button id="btn-close-${this.containerId}-help" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: var(--text-muted); line-height: 1;">&times;</button>
                    </div>
                    <div style="padding: 20px; font-size: 0.9rem; line-height: 1.7; color: var(--text-main); overflow-y: auto; max-height: 70vh;">
                        <p style="margin: 0 0 12px 0; color: var(--text-muted);">
                            ${window.t ? window.t('utils.googleApi.intro') : 'This feature requires a <strong style="color: var(--text-main);">Google Cloud API Key</strong>...'}
                        </p>
                        <hr style="border: none; border-top: 1px solid var(--border-color); margin: 16px 0;">

                        <div style="margin-bottom: 16px;">
                            <strong style="display: inline-block; background: var(--active-bg); color: var(--primary-color); padding: 2px 8px; border-radius: 4px; font-size: 0.8rem; margin-bottom: 8px;">${window.t ? window.t('utils.googleApi.stage1') : 'Phase 1'}</strong>
                            <ol style="margin: 4px 0 0 0; padding-left: 20px;">
                                <li style="margin-bottom: 6px;">${window.t ? window.t('utils.googleApi.stage1_1') : 'Go to Console'}</li>
                                <li style="margin-bottom: 6px;">${window.t ? window.t('utils.googleApi.stage1_2') : 'Create project'}</li>
                                <li style="margin-bottom: 6px;">${window.t ? window.t('utils.googleApi.stage1_3') : 'Name project'}</li>
                                <li style="margin-bottom: 6px;">${window.t ? window.t('utils.googleApi.stage1_4') : 'Select project'}</li>
                            </ol>
                        </div>

                        <div style="margin-bottom: 16px;">
                            <strong style="display: inline-block; background: var(--active-bg); color: var(--primary-color); padding: 2px 8px; border-radius: 4px; font-size: 0.8rem; margin-bottom: 8px;">${window.t ? window.t('utils.googleApi.stage2') : 'Phase 2'}</strong>
                            <ol style="margin: 4px 0 0 0; padding-left: 20px;">
                                <li style="margin-bottom: 6px;">${window.t ? window.t('utils.googleApi.stage2_1') : 'Go to Library'}</li>
                                <li style="margin-bottom: 6px;">${window.t ? window.t('utils.googleApi.stage2_2', { apis: requiredApisHtml ? requiredApisHtml : (window.t ? window.t('utils.googleApi.stage2_2_default') : '<strong style="color: var(--primary-color);">Corresponding APIs</strong>') }) : 'Search API'}</li>
                                <li style="margin-bottom: 6px;">${window.t ? window.t('utils.googleApi.stage2_3') : 'Go to Credentials'}</li>
                                <li style="margin-bottom: 6px;">${window.t ? window.t('utils.googleApi.stage2_4') : 'Create API Key'}</li>
                                <li style="margin-bottom: 6px;">${window.t ? window.t('utils.googleApi.stage2_5') : 'Copy Key'}</li>
                            </ol>
                        </div>

                        <div style="margin-bottom: 16px;">
                            <strong style="display: inline-block; background: var(--active-bg); color: var(--primary-color); padding: 2px 8px; border-radius: 4px; font-size: 0.8rem; margin-bottom: 8px;">${window.t ? window.t('utils.googleApi.stage3') : 'Phase 3'}</strong>
                            <ol style="margin: 4px 0 0 0; padding-left: 20px;">
                                <li style="margin-bottom: 6px;">${window.t ? window.t('utils.googleApi.stage3_1') : 'Edit Key'}</li>
                                <li style="margin-bottom: 6px;">${window.t ? window.t('utils.googleApi.stage3_2') : 'Restrict Key'}</li>
                                <li style="margin-bottom: 6px;">${window.t ? window.t('utils.googleApi.stage3_3') : 'API Restrictions'}</li>
                                <li style="margin-bottom: 6px;">${window.t ? window.t('utils.googleApi.stage3_4') : 'Save'}</li>
                                <li style="margin-bottom: 6px;">${window.t ? window.t('utils.googleApi.stage3_5', { apiName: this.apiName }) : 'Paste Key'}</li>
                            </ol>
                        </div>

                        <div style="background: var(--active-bg); color: var(--primary-color); padding: 10px 12px; border-radius: 8px; border: 1px solid var(--border-color); display: flex; align-items: flex-start; gap: 8px; margin-top: 8px;">
                            <svg style="width: 18px; height: 18px; flex-shrink: 0; margin-top: 2px;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path></svg>
                            <span style="font-size: 0.8rem; line-height: 1.5; font-weight: 500;">${window.t ? window.t('utils.googleApi.freeQuota') : 'Google quota info'}</span>
                        </div>
                    </div>
                    <div style="display: flex; justify-content: flex-end; padding: 12px 20px; border-top: 1px solid var(--border-color); background: var(--surface-color);">
                        <button id="btn-ok-${this.containerId}-help" style="padding: 8px 20px; font-weight: 600; background: var(--primary-color); color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 0.9rem; transition: filter 0.2s;" onmouseover="this.style.filter='brightness(1.1)'" onmouseout="this.style.filter='brightness(1)'">${window.t ? window.t('utils.googleApi.btnOk') : 'Got It'}</button>
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

