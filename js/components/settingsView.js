import { setAppBusy } from '../../utils/js/uiBlocker.js';
import { fetchAndPersistHolidays, getHolidayLastUpdated } from '../../utils/js/lunarCalendar.js';
import { generateFixedTransactions, getTxFingerprint, getFixedFingerprint } from '../utils.js';
import { GasBackupModule } from '../../utils/js/gasBackupModule.js';
import { GoogleApiModule } from '../../utils/js/googleApiModule.js';
import { mountDangerZone, DangerZoneModule, deleteIndexedDB } from '../../utils/js/dangerZone.js';
import { DataMerger } from '../../utils/js/dataMerger.js';
import { showConfirmModal } from '../../utils/js/uiDialogs.js';
import { ZipBackupHelper } from '../../utils/js/zipBackupHelper.js';
import { mountSystemLogsUI } from '../../utils/js/logger.js';
import { migrateImportedData } from '../i18nMigration.js';

// Get complete preferences (including defaults) to ensure unsaved settings are backed up correctly
function getCompletePreferences() {
    const defaultCalSettings = {
        lunarDate: true, lunarStembranch: true, lunarSolarterm: true, 
        lunarFestival: true, nationalHoliday: true, baziChart: true, calendarValentine: false
    };
    const savedCal = JSON.parse(localStorage.getItem('tinyledger_calendar_settings')) || {};
    
    const defaultGasSettings = {
        backupOverwrite: false, backupVersions: 50, cloudRestoreMode: 'merge', autoSyncDelay: 5, privateGasUrl: ''
    };
    const savedGas = JSON.parse(localStorage.getItem('tinyledger_gas_settings')) || {};

    return {
        theme: localStorage.getItem('tinyledger-theme') || 'light',
        customTheme: localStorage.getItem('tinyledger_custom_theme') || '{}',
        budget: localStorage.getItem('tinyledger_monthly_budget') || '25000',
        calendar: JSON.stringify({ ...defaultCalSettings, ...savedCal }),
        gmapsKey: localStorage.getItem('tinyledger_gmaps_api_key') || '',
        gasSettings: JSON.stringify({ ...defaultGasSettings, ...savedGas }),
        mapLink: localStorage.getItem('tinyledger_list_map_link') || 'false',
        importantFestivalsEnabled: localStorage.getItem('tinyledger_important_festivals_enabled') || 'false',
        importantFestivals: localStorage.getItem('tinyledger_important_festivals') || '[]',
        photoUploadEnabled: localStorage.getItem('tinyledger_photo_upload_enabled') !== 'false', // Default to enabled
        photoSize: localStorage.getItem('tinyledger_photo_size') || '640',
        photoQuality: localStorage.getItem('tinyledger_photo_quality') || '0.7',
        accounts: localStorage.getItem('tinyledger_accounts') || '[]',
        lang: localStorage.getItem('tinyledger_lang') || 'en-US',
        pageSize: localStorage.getItem('tinyledger_page_size') || '10'
    };
}

export function setupSettings(state, db, renderApp) {
    const btnExport = document.getElementById('btn-export-json');
    const inputImport = document.getElementById('input-import-json');
    
    // Update input to accept both ZIP and JSON
    if (inputImport) {
        inputImport.accept = ".zip, application/zip, application/x-zip-compressed, .json, application/json";
    }

    // Setup Theme Switcher UI (rendered via module)
    if (window.themeSwitcher) {
        window.themeSwitcher.mountThemeSelectorUI({ 
            containerId: 'theme-selector-container' 
        });
    }

    // Setup Language Switcher UI
    if (window.i18nEngine && window.i18nEngine.mountLanguageSelectorUI) {
        window.i18nEngine.mountLanguageSelectorUI({
            containerId: 'language-selector-container'
        });
    }

    // Setup Budget Setting (removed global budget, changed to per-account budget)
    // Budget logic has been moved down to openAccountModal

    // Setup Accounts (multi-account parameters)
    const accountsContainer = document.getElementById('settings-accounts-container');
    const btnAddAccount = document.getElementById('btn-add-account');
    const getAccountColors = () => [
        { id: 'blue', name: window.t('ui.settings.accounts.colors.blue') || 'Blue', bgClass: 'bg-blue-50 dark:bg-blue-500/10', textClass: 'text-blue-600 dark:text-blue-400', borderClass: 'border-blue-200 dark:border-blue-500/30', badgeBg: 'bg-blue-600 dark:bg-blue-500 text-white' },
        { id: 'green', name: window.t('ui.settings.accounts.colors.green') || 'Green', bgClass: 'bg-green-50 dark:bg-green-500/10', textClass: 'text-green-600 dark:text-green-400', borderClass: 'border-green-200 dark:border-green-500/30', badgeBg: 'bg-green-600 dark:bg-green-500 text-white' },
        { id: 'red', name: window.t('ui.settings.accounts.colors.red') || 'Red', bgClass: 'bg-red-50 dark:bg-red-500/10', textClass: 'text-red-600 dark:text-red-400', borderClass: 'border-red-200 dark:border-red-500/30', badgeBg: 'bg-red-600 dark:bg-red-500 text-white' },
        { id: 'yellow', name: window.t('ui.settings.accounts.colors.yellow') || 'Yellow', bgClass: 'bg-yellow-50 dark:bg-yellow-500/10', textClass: 'text-yellow-600 dark:text-yellow-400', borderClass: 'border-yellow-200 dark:border-yellow-500/30', badgeBg: 'bg-yellow-600 dark:bg-yellow-500 text-white' },
        { id: 'purple', name: window.t('ui.settings.accounts.colors.purple') || 'Purple', bgClass: 'bg-purple-50 dark:bg-purple-500/10', textClass: 'text-purple-600 dark:text-purple-400', borderClass: 'border-purple-200 dark:border-purple-500/30', badgeBg: 'bg-purple-600 dark:bg-purple-500 text-white' },
        { id: 'gray', name: window.t('ui.settings.accounts.colors.gray') || 'Gray', bgClass: 'bg-slate-50 dark:bg-slate-500/10', textClass: 'text-slate-600 dark:text-slate-400', borderClass: 'border-slate-200 dark:border-slate-500/30', badgeBg: 'bg-slate-600 dark:bg-slate-500 text-white' }
    ];

    function getAccounts() {
        let accounts = JSON.parse(localStorage.getItem('tinyledger_accounts'));
        if (!accounts || accounts.length === 0) {
            accounts = [{ id: 'account_default', name: window.t('ui.settings.accounts.defaultAccountName') || 'Account A', color: 'blue', isDefault: true }];
            localStorage.setItem('tinyledger_accounts', JSON.stringify(accounts));
        }
        return accounts;
    }

    function saveAccounts(accounts) {
        localStorage.setItem('tinyledger_accounts', JSON.stringify(accounts));
        console.log(window.t('logs.settings.saveAccountsSuccess') || '[Settings] Update account settings (saveAccounts) success');
        window.dispatchEvent(new CustomEvent('accountsChanged'));
    }

    function renderAccounts() {
        if (!accountsContainer) return;
        const accounts = getAccounts();
        accountsContainer.innerHTML = '';
        
        if (accounts.length >= 6) {
            if(btnAddAccount) btnAddAccount.style.display = 'none';
        } else {
            if(btnAddAccount) btnAddAccount.style.display = 'flex';
        }

        accounts.forEach(account => {
            const colorDef = getAccountColors().find(c => c.id === account.color) || getAccountColors()[0];
            const isDefaultBadge = account.isDefault ? `<span class="${colorDef.badgeBg}" style="font-size: 0.7rem; padding: 2px 6px; border-radius: 4px; margin-left: 8px;">${window.t('ui.settings.accounts.isDefault')}</span>` : '';
            const setBtnHtml = !account.isDefault ? `<button class="btn-set-default" data-id="${account.id}" style="border: none; background: transparent; color: var(--text-muted); cursor: pointer; font-size: 0.8rem;">${window.t('ui.settings.accounts.setDefault')}</button>` : '';
            const budgetText = (account.budget !== undefined) ? Number(account.budget).toLocaleString() : '25,000';
            
            const cardHtml = `
                <div class="account-card border border-solid ${colorDef.borderClass}" style="background: var(--surface-color); border-radius: 12px; padding: 1rem; position: relative; margin-bottom: 0.75rem;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div style="display: flex; flex-direction: column; gap: 6px;">
                            <div class="${colorDef.textClass}" style="font-weight: bold; font-size: 1.1rem; display: flex; align-items: center;">
                                ${account.name} ${isDefaultBadge}
                            </div>
                            <div style="font-size: 0.85rem; color: var(--text-muted); display: flex; align-items: center; gap: 4px;">
                                <span class="material-icons" style="font-size: 14px;">savings</span>
                                ${window.t('ui.settings.accounts.budget').replace('${amount}', budgetText)}
                            </div>
                        </div>
                        <div style="display: flex; gap: 8px; align-items: center;">
                            ${setBtnHtml}
                            <button class="btn-edit-account" data-id="${account.id}" style="border: none; background: transparent; color: var(--text-muted); cursor: pointer; padding: 4px;"><span class="material-icons" style="font-size: 16px;">edit</span></button>
                            ${accounts.length > 1 && !account.isDefault ? `<button class="btn-delete-account" data-id="${account.id}" style="border: none; background: transparent; color: var(--text-muted); cursor: pointer; padding: 4px;"><span class="material-icons" style="font-size: 16px;">delete</span></button>` : ''}
                        </div>
                    </div>
                </div>
            `;
            const div = document.createElement('div');
            div.innerHTML = cardHtml;
            accountsContainer.appendChild(div.firstElementChild);
        });

        // Bind events
        accountsContainer.querySelectorAll('.btn-set-default').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                let accounts = getAccounts();
                accounts.forEach(a => a.isDefault = (String(a.id) === String(id)));
                saveAccounts(accounts);
                renderAccounts();
            });
        });

        accountsContainer.querySelectorAll('.btn-delete-account').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.currentTarget.dataset.id;
                
                // Check if there is still data bound to this account
                try {
                    const txs = await db.getTransactions();
                    const fixed = await db.getFixedRecords();
                    const boundTxs = txs.filter(t => String(t.accountId) === String(id) || (String(id) === 'account_default' && !t.accountId));
                    const boundFixed = fixed.filter(f => String(f.accountId) === String(id) || (String(id) === 'account_default' && !f.accountId));
                    
                    if (boundTxs.length > 0 || boundFixed.length > 0) {
                        let msg = window.t('ui.settings.accounts.deleteErrorMsg');
                        
                        if (boundTxs.length > 0) {
                            const dates = [...new Set(boundTxs.map(t => t.date))].sort().reverse();
                            const displayDates = dates.slice(0, 5).join(', ');
                            const moreStr = dates.length > 5 ? (window.t('ui.settings.targets.moreDates', { count: dates.length }) || ` and ${dates.length} more dates`) : '';
                            msg += window.t('ui.settings.accounts.deleteErrorTxs').replace('{count}', boundTxs.length).replace('{dates}', displayDates + moreStr);
                        }
                        
                        if (boundFixed.length > 0) {
                            msg += window.t('ui.settings.accounts.deleteErrorFixed').replace('{count}', boundFixed.length);
                        }
                        
                        msg += window.t('ui.settings.accounts.deleteErrorEnd');
                        alert(msg);
                        return;
                    }
                } catch(err) {
                    console.error(window.t('logs.settings.checkAccountError'), err);
                }

                const isConfirmed = await showConfirmModal({
                    title: window.t('ui.settings.accounts.deleteConfirmTitle'),
                    isDanger: true
                });
                
                if (isConfirmed) {
                    let accounts = getAccounts();
                    accounts = accounts.filter(a => String(a.id) !== String(id));
                    if (accounts.length > 0 && !accounts.find(a => a.isDefault)) {
                        accounts[0].isDefault = true;
                    }
                    saveAccounts(accounts);
                    renderAccounts();
                }
            });
        });

        accountsContainer.querySelectorAll('.btn-edit-account').forEach(btn => {
            btn.addEventListener('click', (e) => {
                try {
                    const id = e.currentTarget.dataset.id;
                    const accounts = getAccounts();
                    const account = accounts.find(a => String(a.id) === String(id));
                    if (account) openAccountModal(account);
                } catch(err) {
                    alert(window.t('logs.settings.checkAccountError') + ' ' + err.message);
                    console.error(err);
                }
            });
        });
    }

    if (btnAddAccount) {
        btnAddAccount.addEventListener('click', (e) => {
            e.preventDefault();
            try {
                openAccountModal(null);
            } catch(err) {
                alert(window.t('logs.settings.checkAccountError') + ' ' + err.message);
                console.error(err);
            }
        });
    }

    function openAccountModal(existingAccount) {
        // Create modal dynamically
        const modalId = 'account-edit-modal';
        let modal = document.getElementById(modalId);
        if (!modal) {
            modal = document.createElement('div');
            modal.id = modalId;
            modal.className = 'fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 transition-all duration-200';
            modal.style.display = 'none';
            modal.style.zIndex = '10000';
            modal.innerHTML = `
                <div class="bg-surface rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-theme transform transition-all scale-100">
                    <div class="px-6 pt-6 pb-4 border-b border-theme flex items-center justify-between">
                        <h3 id="${modalId}-title" class="text-lg font-bold text-main tracking-tight">${window.t('ui.settings.accounts.add')}</h3>
                        <button type="button" class="text-muted hover:text-main p-1.5 rounded-lg hover:bg-slate-500/10 transition-colors flex items-center justify-center" onclick="document.getElementById('${modalId}').style.display='none'">
                            <span class="material-icons text-xl" style="font-size: 20px;">close</span>
                        </button>
                    </div>
                    <div class="p-6 space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-main mb-1">${window.t('ui.settings.accounts.accountName')}</label>
                            <input type="text" id="${modalId}-name" class="form-control w-full px-4 py-2" placeholder="${window.t('ui.settings.accounts.accountNamePh')}" maxlength="20">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-main mb-2">${window.t('ui.settings.accounts.tagColor')}</label>
                            <div id="${modalId}-colors" class="flex flex-wrap gap-2">
                                ${getAccountColors().map(c => `<div class="color-swatch flex items-center justify-center w-8 h-8 rounded-full cursor-pointer transition-all ${c.bgClass} border-2 border-solid ${c.borderClass}" data-color="${c.id}"></div>`).join('')}
                            </div>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-main mb-1">${window.t('ui.settings.accounts.monthlyBudget')}</label>
                            <input type="number" id="${modalId}-budget" class="form-control w-full px-4 py-2" placeholder="${window.t('ui.settings.accounts.budgetPh')}" min="0">
                        </div>
                    </div>
                    <div class="px-6 py-4 bg-surface border-t border-theme">
                        <button type="button" id="${modalId}-save" class="btn-primary w-full font-semibold py-2.5 rounded-lg transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1">${window.t('ui.settings.accounts.save')}</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
            
            const colorSwatches = modal.querySelectorAll('.color-swatch');
            colorSwatches.forEach(sw => {
                sw.addEventListener('click', (e) => {
                    colorSwatches.forEach(s => s.innerHTML = '');
                    e.currentTarget.innerHTML = `<span class="material-icons ${getAccountColors().find(c => c.id === e.currentTarget.dataset.color).textClass}" style="font-size: 16px;">check</span>`;
                    modal.dataset.selectedColor = e.currentTarget.dataset.color;
                });
            });
        }
        
        // Reset and populate
        const nameInput = document.getElementById(`${modalId}-name`);
        const budgetInput = document.getElementById(`${modalId}-budget`);
        const btnSave = document.getElementById(`${modalId}-save`);
        const title = document.getElementById(`${modalId}-title`);
        
        nameInput.value = existingAccount ? existingAccount.name : '';
        budgetInput.value = (existingAccount && existingAccount.budget !== undefined) ? existingAccount.budget : '25000';
        const targetColor = (existingAccount && existingAccount.color) ? existingAccount.color : 'blue';
        modal.dataset.selectedColor = targetColor;
        
        const colorSwatches = modal.querySelectorAll('.color-swatch');
        colorSwatches.forEach(s => {
            if (s.dataset.color === targetColor) {
                const cDef = getAccountColors().find(c => c.id === targetColor) || getAccountColors()[0];
                s.innerHTML = `<span class="material-icons ${cDef.textClass}" style="font-size: 16px;">check</span>`;
            } else {
                s.innerHTML = '';
            }
        });

        title.textContent = existingAccount ? window.t('ui.settings.accounts.edit') : window.t('ui.settings.accounts.add');
        
        // Force elevate z-index and append to the end of DOM tree to avoid being covered by other settings pages
        modal.style.zIndex = '99999';
        if (modal.parentNode) {
            modal.parentNode.appendChild(modal);
        } else {
            document.body.appendChild(modal);
        }
        
        modal.style.display = 'flex';
        
        btnSave.onclick = () => {
            const name = nameInput.value.trim();
            if (!name) {
                alert(window.t('ui.settings.accounts.requireName'));
                return;
            }
            const newBudgetStr = budgetInput.value.trim();
            const newBudget = newBudgetStr ? parseInt(newBudgetStr, 10) : 25000;

            let accounts = getAccounts();
            if (existingAccount) {
                const idx = accounts.findIndex(a => String(a.id) === String(existingAccount.id));
                if (idx > -1) {
                    accounts[idx].name = name;
                    accounts[idx].color = modal.dataset.selectedColor;
                    accounts[idx].budget = newBudget;
                }
            } else {
                accounts.push({
                    id: 'account_' + Date.now(),
                    name: name,
                    color: modal.dataset.selectedColor,
                    budget: newBudget,
                    isDefault: accounts.length === 0
                });
            }
            saveAccounts(accounts);
            renderAccounts();
            modal.style.display = 'none';
        };
    }

    renderAccounts();

    // Setup Calendar Settings
    const defaultCalSettings = {
        lunarDate: true,
        lunarStembranch: true,
        lunarSolarterm: true,
        lunarFestival: true,
        globalFestival: true,
        nationalHoliday: true,
        baziChart: true,
        calendarValentine: false
    };
    const savedCalSettings = { ...defaultCalSettings, ...(JSON.parse(localStorage.getItem('tinyledger_calendar_settings')) || {}) };
    
    const calToggles = [
        { id: 'toggle-lunar-date', key: 'lunarDate' },
        { id: 'toggle-lunar-stembranch', key: 'lunarStembranch' },
        { id: 'toggle-lunar-solarterm', key: 'lunarSolarterm' },
        { id: 'toggle-lunar-festival', key: 'lunarFestival' },
        { id: 'toggle-global-festival', key: 'globalFestival' },
        { id: 'toggle-national-holiday', key: 'nationalHoliday' },
        { id: 'toggle-bazi-chart', key: 'baziChart' },
        { id: 'toggle-calendar-valentine', key: 'calendarValentine' }
    ];

    calToggles.forEach(t => {
        const el = document.getElementById(t.id);
        if (el) {
            el.checked = savedCalSettings[t.key] === true;
            
            if (t.key === 'nationalHoliday') {
                const btnUpdateHolidays = document.getElementById('btn-update-holidays');
                if (btnUpdateHolidays) {
                    btnUpdateHolidays.disabled = !el.checked;
                }
            }

            el.addEventListener('change', (e) => {
                savedCalSettings[t.key] = e.target.checked;
                localStorage.setItem('tinyledger_calendar_settings', JSON.stringify(savedCalSettings));
                window.dispatchEvent(new CustomEvent('calendarSettingsChanged'));
                
                if (t.key === 'nationalHoliday') {
                    const btnUpdateHolidays = document.getElementById('btn-update-holidays');
                    if (btnUpdateHolidays) {
                        btnUpdateHolidays.disabled = !e.target.checked;
                    }
                }
            });
        }
    });

    // Important festival reminder settings
    const toggleImportantFestivals = document.getElementById('toggle-important-festivals');
    const festivalsContainer = document.getElementById('important-festivals-container');
    const festivalsList = document.getElementById('important-festivals-list');
    const btnAddFestival = document.getElementById('btn-add-important-festival');

    if (toggleImportantFestivals && festivalsContainer) {
        const isEnabled = localStorage.getItem('tinyledger_important_festivals_enabled') === 'true';
        toggleImportantFestivals.checked = isEnabled;
        festivalsContainer.style.display = isEnabled ? 'block' : 'none';

        toggleImportantFestivals.addEventListener('change', (e) => {
            const enabled = e.target.checked;
            localStorage.setItem('tinyledger_important_festivals_enabled', enabled ? 'true' : 'false');
            festivalsContainer.style.display = enabled ? 'block' : 'none';
            window.dispatchEvent(new CustomEvent('calendarSettingsChanged'));
        });

        let festivals = JSON.parse(localStorage.getItem('tinyledger_important_festivals') || '[]');

        const saveFestivals = () => {
            festivals.sort((a, b) => {
                if (!a.date && !b.date) return 0;
                if (!a.date) return 1;
                if (!b.date) return -1;
                return a.date.localeCompare(b.date);
            });
            localStorage.setItem('tinyledger_important_festivals', JSON.stringify(festivals));
            window.dispatchEvent(new CustomEvent('calendarSettingsChanged'));
        };

        const renderFestivals = () => {
            if (!festivalsList) return;
            festivalsList.innerHTML = '';
            festivals.forEach((f, index) => {
                const item = document.createElement('div');
                item.style.cssText = 'border: 1px solid var(--border-color); padding: 8px; border-radius: 4px; display: flex; flex-direction: column; gap: 8px; position: relative; background: var(--bg-color);';
                
                const m = f.date ? parseInt(f.date.split('-')[0], 10) : '';
                const d = f.date ? parseInt(f.date.split('-')[1], 10) : '';

                const mSuffix = window.t('ui.settings.calendar.monthSuffix') || 'M';
                const dSuffix = window.t('ui.settings.calendar.daySuffix') || 'D';
                const monthOptions = Array.from({length: 12}, (_, i) => {
                    const val = i + 1;
                    return `<option value="${val}" ${m === val ? 'selected' : ''}>${val}${mSuffix}</option>`;
                }).join('');

                const dayOptions = Array.from({length: 31}, (_, i) => {
                    const val = i + 1;
                    return `<option value="${val}" ${d === val ? 'selected' : ''}>${val}${dSuffix}</option>`;
                }).join('');

                item.innerHTML = `
                    <button class="btn-close" style="position: absolute; right: 4px; top: 4px; font-size: 16px; width: 24px; height: 24px; display: flex; justify-content: center; align-items: center;" data-index="${index}">&times;</button>
                    <div style="display: flex; gap: 8px; padding-right: 24px;">
                        <div style="display: flex; gap: 6px; flex: 2; align-items: center; min-width: 0;">
                            <select class="form-control festival-month" style="padding: 4px 8px; width: 100%; min-width: 0; appearance: none; -webkit-appearance: none;">
                                <option value="" disabled ${m === '' ? 'selected' : ''}>${window.t('ui.settings.calendar.monthPh') || 'M'}</option>
                                ${monthOptions}
                            </select>
                            <span>/</span>
                            <select class="form-control festival-day" style="padding: 4px 8px; width: 100%; min-width: 0; appearance: none; -webkit-appearance: none;">
                                <option value="" disabled ${d === '' ? 'selected' : ''}>${window.t('ui.settings.calendar.dayPh') || 'D'}</option>
                                ${dayOptions}
                            </select>
                        </div>
                        <input type="text" class="form-control festival-name" placeholder="${window.t('ui.settings.calendar.festivalNamePh') || 'Festival Name'}" value="${f.name || ''}" style="flex: 2; min-width: 0;">
                    </div>
                    <div style="display: flex; gap: 8px; align-items: center;">
                        <span style="font-size: 0.75rem; color: var(--text-muted); white-space: nowrap;">${window.t('ui.settings.calendar.remindDaysBefore') || 'Remind(Days):'}</span>
                        <input type="number" class="form-control festival-r1" min="0" placeholder="${(window.t('ui.settings.calendar.dayNumPh') || 'Days {n}').replace('{n}', 1)}" value="${f.reminders[0] ?? ''}" style="flex: 1; padding: 4px; min-width: 0;">
                        <input type="number" class="form-control festival-r2" min="0" placeholder="${(window.t('ui.settings.calendar.dayNumPh') || 'Days {n}').replace('{n}', 2)}" value="${f.reminders[1] ?? ''}" style="flex: 1; padding: 4px; min-width: 0;">
                        <input type="number" class="form-control festival-r3" min="0" placeholder="${(window.t('ui.settings.calendar.dayNumPh') || 'Days {n}').replace('{n}', 3)}" value="${f.reminders[2] ?? ''}" style="flex: 1; padding: 4px; min-width: 0;">
                    </div>
                `;

                const updateData = () => {
                    f.name = item.querySelector('.festival-name').value;
                    const mVal = item.querySelector('.festival-month').value;
                    const dVal = item.querySelector('.festival-day').value;
                    if (mVal && dVal) {
                        f.date = `${String(mVal).padStart(2, '0')}-${String(dVal).padStart(2, '0')}`;
                    } else {
                        f.date = '';
                    }
                    const r1 = item.querySelector('.festival-r1').value;
                    const r2 = item.querySelector('.festival-r2').value;
                    const r3 = item.querySelector('.festival-r3').value;
                    f.reminders = [r1, r2, r3].map(v => v !== '' ? parseInt(v, 10) : null).filter(v => v !== null && !isNaN(v));
                    // Only save; do NOT call renderFestivals() here to avoid re-rendering
                    // the DOM while the user is still interacting with inputs/selects.
                    saveFestivals();
                };

                // Auto-save when input or select changes
                item.querySelectorAll('input, select').forEach(inp => inp.addEventListener('change', updateData));
                item.querySelector('.btn-close').addEventListener('click', () => {
                    festivals.splice(index, 1);
                    saveFestivals();
                    renderFestivals();
                });

                festivalsList.appendChild(item);
            });

            if (btnAddFestival) {
                btnAddFestival.style.display = festivals.length >= 10 ? 'none' : 'block';
            }
        };

        if (btnAddFestival) {
            btnAddFestival.addEventListener('click', () => {
                if (festivals.length < 10) {
                    festivals.push({ name: '', date: '', reminders: [] });
                    saveFestivals();
                    renderFestivals();
                }
            });
        }

        renderFestivals();
    }

    // List location link to map settings
    const toggleListMapLink = document.getElementById('toggle-list-map-link');
    if (toggleListMapLink) {
        // Default to disabled (false)
        const isEnabled = localStorage.getItem('tinyledger_list_map_link') === 'true';
        toggleListMapLink.checked = isEnabled;
        toggleListMapLink.addEventListener('change', (e) => {
            localStorage.setItem('tinyledger_list_map_link', e.target.checked ? 'true' : 'false');
            if (renderApp) renderApp();
        });
    }

    // Photo settings
    const togglePhotoUpload = document.getElementById('toggle-photo-upload');
    const photoSettingsContainer = document.getElementById('photo-settings-container');
    const selectPhotoSize = document.getElementById('select-photo-size');
    const selectPhotoQuality = document.getElementById('select-photo-quality');

    if (togglePhotoUpload) {
        // Initialize
        const isPhotoUploadEnabled = localStorage.getItem('tinyledger_photo_upload_enabled') !== 'false';
        togglePhotoUpload.checked = isPhotoUploadEnabled;
        if (photoSettingsContainer) {
            photoSettingsContainer.style.display = isPhotoUploadEnabled ? 'block' : 'none';
        }
        if (selectPhotoSize) selectPhotoSize.value = localStorage.getItem('tinyledger_photo_size') || '640';
        if (selectPhotoQuality) selectPhotoQuality.value = localStorage.getItem('tinyledger_photo_quality') || '0.7';

        // Event listeners
        togglePhotoUpload.addEventListener('change', (e) => {
            localStorage.setItem('tinyledger_photo_upload_enabled', e.target.checked);
            if (photoSettingsContainer) {
                photoSettingsContainer.style.display = e.target.checked ? 'block' : 'none';
            }
        });
        if (selectPhotoSize) {
            selectPhotoSize.addEventListener('change', (e) => {
                localStorage.setItem('tinyledger_photo_size', e.target.value);
            });
        }
        if (selectPhotoQuality) {
            selectPhotoQuality.addEventListener('change', (e) => {
                localStorage.setItem('tinyledger_photo_quality', e.target.value);
            });
        }
    }

    // Initialize backup settings
    const backupSettings = JSON.parse(localStorage.getItem('global_backup_settings')) || {
        mode: 'daily',
        yearlyRange: 'all',
        includePhotos: true
    };

    const radioBackupModes = document.querySelectorAll('input[name="backup_mode"]');
    const radioYearlyRanges = document.querySelectorAll('input[name="backup_yearly_range"]');
    const toggleBackupPhotos = document.getElementById('toggle-backup-photos');
    const backupYearlyOptions = document.getElementById('backup-yearly-options');

    if (radioBackupModes.length > 0) {
        radioBackupModes.forEach(radio => {
            if (radio.value === backupSettings.mode) radio.checked = true;
            radio.addEventListener('change', (e) => {
                backupSettings.mode = e.target.value;
                localStorage.setItem('global_backup_settings', JSON.stringify(backupSettings));
                if (backupYearlyOptions) {
                    if (backupSettings.mode === 'yearly') {
                        backupYearlyOptions.classList.remove('hidden');
                    } else {
                        backupYearlyOptions.classList.add('hidden');
                    }
                }
            });
        });
        
        // Initial display state
        if (backupYearlyOptions) {
            if (backupSettings.mode === 'yearly') {
                backupYearlyOptions.classList.remove('hidden');
            } else {
                backupYearlyOptions.classList.add('hidden');
            }
        }
    }

    if (radioYearlyRanges.length > 0) {
        radioYearlyRanges.forEach(radio => {
            if (radio.value === backupSettings.yearlyRange) radio.checked = true;
            radio.addEventListener('change', (e) => {
                backupSettings.yearlyRange = e.target.value;
                localStorage.setItem('global_backup_settings', JSON.stringify(backupSettings));
            });
        });
    }

    if (toggleBackupPhotos) {
        toggleBackupPhotos.checked = backupSettings.includePhotos !== false; // default true
        toggleBackupPhotos.addEventListener('change', (e) => {
            backupSettings.includePhotos = e.target.checked;
            localStorage.setItem('global_backup_settings', JSON.stringify(backupSettings));
        });
    }

    const btnUpdateHolidays = document.getElementById('btn-update-holidays');
    const labelHolidayUpdated = document.getElementById('label-holiday-updated');
    // Setup API Key Help Modal and Input (old version removed, replaced with GoogleApiModule)
    if (!window.googleApiModuleInstance) {
        window.googleApiModuleInstance = new GoogleApiModule({
            containerId: 'google-api-module-container',
            storageKey: 'tinyledger_gmaps_api_key', // Keep old key for backwards compatibility
            apiName: 'Google Maps API',
            requiredApis: ['Maps JavaScript API', 'Places API', 'Places API (New)']
        });
    }

    // Show last updated time
    if (labelHolidayUpdated) {
        const lastUpdated = getHolidayLastUpdated();
        const prefix = window.t('ui.settings.calendar.nationalHoliday.lastUpdated') || 'Last Updated: ';
        const noneText = window.t('ui.settings.calendar.nationalHoliday.neverUpdated') || 'None';
        labelHolidayUpdated.textContent = lastUpdated ? `${prefix}${lastUpdated}` : `${prefix}${noneText}`;
    }

    if (btnUpdateHolidays) {
        btnUpdateHolidays.addEventListener('click', async () => {
            btnUpdateHolidays.disabled = true;
            btnUpdateHolidays.textContent = window.t('ui.settings.calendar.nationalHoliday.updating');

            try {
                const currentYear = new Date().getFullYear();
                const years = [currentYear, currentYear + 1];
                const result = await fetchAndPersistHolidays(years);

                if (result.success) {
                    if (labelHolidayUpdated) {
                        labelHolidayUpdated.textContent = `${window.t('ui.settings.calendar.nationalHoliday.lastUpdated')}${getHolidayLastUpdated()}`;
                    }
                    let logMsg = window.t('ui.settings.calendar.nationalHoliday.updateSuccessLog', { years: years.join('、'), count: result.count });
                    console.log(logMsg);
                    alert(window.t('ui.settings.calendar.nationalHoliday.updateSuccess', { years: years.join('、'), count: result.count }));
                    // Notify calendar to re-render
                    window.dispatchEvent(new CustomEvent('calendarSettingsChanged'));
                } else {
                    alert(window.t('ui.settings.calendar.nationalHoliday.updateError').replace('{error}', result.error || 'Unknown Error'));
                }
            } catch (e) {
                alert(window.t('ui.settings.calendar.nationalHoliday.updateError').replace('{error}', e.message));
            } finally {
                btnUpdateHolidays.disabled = false;
                btnUpdateHolidays.textContent = window.t('ui.settings.calendar.nationalHoliday.updateNow');
            }
        });
    }

    // Initialize private cloud backup module (GasBackupModule)
    const gasContainer = document.getElementById('gas-backup-module');
    if (gasContainer) {
        // Load existing GAS settings from LocalStorage
        const gasSettings = JSON.parse(localStorage.getItem('tinyledger_gas_settings')) || {};
        window.gasBackupInstance = new GasBackupModule({
            appName: 'TinyLedger',
            containerId: 'gas-backup-module',
            settingsObj: gasSettings,
            useGlobalRestoreMode: true,
            setAppBusy: setAppBusy,
            useZip: true,
            onSaveSettings: () => {
                localStorage.setItem('tinyledger_gas_settings', JSON.stringify(gasSettings));
                console.log(window.t('logs.settings.cloudBackupSuccess') || '[Settings] Update cloud backup settings (onSaveSettings) success');
            },
            getCleanPayload: async () => {
                // Collect all data from IndexedDB
                const txs = (await db.getTransactions())
                    .filter(t => !t.isFixed)
                    .map(t => { const { id, ...rest } = t; return rest; });
                const rawFixed = await db.getFixedRecords();
                
                const cats = (await db.getCategories()).map(c => { const { id, ...rest } = c; return rest; });
                const tgts = (await db.getTargets()).map(t => { const { id, ...rest } = t; return rest; });

                // Collect LocalStorage settings (including defaults)
                const localPrefs = getCompletePreferences();

                return {
                    transactions: txs,
                    fixedRecords: rawFixed,
                    categories: cats,
                    targets: tgts,
                    preferences: localPrefs
                };
            },
            generateBackupSuccessMessage: async (backupData) => {
                const txCount = (backupData.transactions && Array.isArray(backupData.transactions)) ? backupData.transactions.length : 0;
                const fixedCount = (backupData.fixedRecords && Array.isArray(backupData.fixedRecords)) ? backupData.fixedRecords.length : 0;
                const catCount = (backupData.categories && Array.isArray(backupData.categories)) ? backupData.categories.length : 0;
                const tgtCount = (backupData.targets && Array.isArray(backupData.targets)) ? backupData.targets.length : 0;
                return window.t('ui.settings.cloudBackup.successSummary')
                    .replace('{txCount}', txCount)
                    .replace('{fixedCount}', fixedCount)
                    .replace('{catCount}', catCount)
                    .replace('{tgtCount}', tgtCount);
            },
            generateRestoreConfirmMessage: async (backupData) => {
                const globalRestoreModeEl = document.getElementById('global-restore-mode');
                const mode = globalRestoreModeEl ? globalRestoreModeEl.value : 'merge';

                const existingTxs = await db.getTransactions();
                const existingFixed = await db.getFixedRecords();
                const isLocalDbEmpty = existingTxs.length === 0 && existingFixed.length === 0;

                // Migrate imported data to match local database format (Chinese to internal IDs)
                if (backupData) {
                    backupData = migrateImportedData(backupData, state.categories.expense.concat(state.categories.income), state.targets);
                }

                let txCount = 0, txSkipCount = 0;
                let fixedCount = 0, fixedSkipCount = 0;
                let catCount = 0, catSkipCount = 0;
                let tgtCount = 0, tgtSkipCount = 0;

                if (mode === 'overwrite') {
                    txCount = (backupData.transactions || []).length;
                    fixedCount = (backupData.fixedRecords || []).length;
                    catCount = (backupData.categories || []).length;
                    tgtCount = (backupData.targets || []).length;
                } else {
                    const txFingerprints = new Set(existingTxs.map(getTxFingerprint));
                    const fixedFingerprints = new Set(existingFixed.map(getFixedFingerprint));
                    
                    let pendingFixed = [];
                    if (backupData.fixedRecords && Array.isArray(backupData.fixedRecords)) {
                        const fixedAnalysis = DataMerger.analyze(backupData.fixedRecords, existingFixed, getFixedFingerprint, fixedFingerprints);
                        pendingFixed = fixedAnalysis.pendingItems;
                        fixedCount = pendingFixed.length;
                        fixedSkipCount = fixedAnalysis.skipCount;
                    }
                    
                    if (backupData.transactions && Array.isArray(backupData.transactions)) {
                        const previewGeneratedTxs = pendingFixed.flatMap(fr => generateFixedTransactions(fr));
                        const previewGenTxAnalysis = DataMerger.analyze(previewGeneratedTxs, existingTxs, getTxFingerprint, txFingerprints);
                        
                        const importedTxs = backupData.transactions;
                        importedTxs.forEach(tx => { if (typeof tx.amount === 'string') tx.amount = Number(tx.amount); });
                        const txAnalysis = DataMerger.analyze(importedTxs, existingTxs, getTxFingerprint, txFingerprints);
                        
                        txCount = txAnalysis.pendingItems.length;
                        txSkipCount = txAnalysis.skipCount + previewGenTxAnalysis.skipCount;
                    }
            
                    if (backupData.targets && Array.isArray(backupData.targets)) {
                        const existingTargetNames = new Set(state.targets.map(t => t.name));
                        backupData.targets.forEach(tg => {
                            if (!existingTargetNames.has(tg.name)) tgtCount++;
                            else tgtSkipCount++;
                        });
                    }
            
                    if (backupData.categories && Array.isArray(backupData.categories)) {
                        backupData.categories.forEach(cat => {
                            const typeCats = cat.type === 'expense' ? state.categories.expense : state.categories.income;
                            let existingMajor = typeCats.find(c => c.major === cat.major);
                            if (existingMajor) {
                                let subModified = false;
                                for (const sub of cat.sub) {
                                    if (!existingMajor.sub.includes(sub)) {
                                        subModified = true;
                                        break;
                                    }
                                }
                                if (subModified) catCount++;
                                else catSkipCount++;
                            } else {
                                catCount++;
                            }
                        });
                    }
                }
                
                let warnMsg = '';
                if (isLocalDbEmpty) {
                    warnMsg = window.t('ui.settings.cloudBackup.restoreConfirmEmpty');
                } else if (mode === 'overwrite') {
                    warnMsg = window.t('ui.settings.cloudBackup.restoreConfirmOverwrite');
                } else {
                    warnMsg = window.t('ui.settings.cloudBackup.restoreConfirmMerge');
                }

                let totalTx = txCount + txSkipCount;
                let totalFixed = fixedCount + fixedSkipCount;
                let totalCat = catCount + catSkipCount;
                let totalTgt = tgtCount + tgtSkipCount;

                let msg = window.t('ui.settings.cloudBackup.restoreSummary')
                            .replace('{txCount}', totalTx)
                            .replace('{fixedCount}', totalFixed)
                            .replace('{catCount}', totalCat)
                            .replace('{tgtCount}', totalTgt);
                
                if (txSkipCount > 0 || fixedSkipCount > 0 || catSkipCount > 0 || tgtSkipCount > 0) {
                    msg += window.t('ui.settings.cloudBackup.restoreFiltered');
                    if (txSkipCount > 0) msg += window.t('ui.settings.cloudBackup.restoreFilteredTx').replace('{txSkip}', txSkipCount);
                    if (fixedSkipCount > 0) msg += window.t('ui.settings.cloudBackup.restoreFilteredFixed').replace('{fixedSkip}', fixedSkipCount);
                    if (catSkipCount > 0) msg += window.t('ui.settings.cloudBackup.restoreFilteredCat').replace('{catSkip}', catSkipCount);
                    if (tgtSkipCount > 0) msg += window.t('ui.settings.cloudBackup.restoreFilteredTgt').replace('{tgtSkip}', tgtSkipCount);
                }
                msg += `\n${warnMsg}`;
                return msg;
            },
            onRestoreSuccess: async (payload) => {
                window._disableGasAutoSync = true;
                try {
                    const globalRestoreModeEl = document.getElementById('global-restore-mode');
                    const mode = globalRestoreModeEl ? globalRestoreModeEl.value : 'merge';

                    if (mode === 'overwrite') {
                        // [Overwrite Mode]: Clear local data first
                        await db.clearTransactions();
                        await db.clearFixedRecords();
                        await db.clearCategories();
                        await db.clearTargets();
                    }

                    // 1. Restore LocalStorage settings
                    if (payload.preferences) {
                        // Single-value settings: always overwrite regardless of mode
                        if (payload.preferences.lang) localStorage.setItem('tinyledger_lang', payload.preferences.lang);
                        if (payload.preferences.theme) localStorage.setItem('tinyledger-theme', payload.preferences.theme);
                        if (payload.preferences.customTheme) localStorage.setItem('tinyledger_custom_theme', payload.preferences.customTheme);
                        if (payload.preferences.budget) localStorage.setItem('tinyledger_monthly_budget', payload.preferences.budget);
                        if (payload.preferences.calendar) localStorage.setItem('tinyledger_calendar_settings', payload.preferences.calendar);
                        if (payload.preferences.gmapsKey !== undefined) localStorage.setItem('tinyledger_gmaps_api_key', payload.preferences.gmapsKey);
                        if (payload.preferences.mapLink !== undefined) localStorage.setItem('tinyledger_list_map_link', payload.preferences.mapLink);
                        if (payload.preferences.gasSettings) localStorage.setItem('tinyledger_gas_settings', payload.preferences.gasSettings);
                        if (payload.preferences.importantFestivalsEnabled !== undefined) localStorage.setItem('tinyledger_important_festivals_enabled', payload.preferences.importantFestivalsEnabled);
                        if (payload.preferences.photoUploadEnabled !== undefined) localStorage.setItem('tinyledger_photo_upload_enabled', payload.preferences.photoUploadEnabled.toString());
                        if (payload.preferences.photoSize !== undefined) localStorage.setItem('tinyledger_photo_size', payload.preferences.photoSize);
                        if (payload.preferences.photoQuality !== undefined) localStorage.setItem('tinyledger_photo_quality', payload.preferences.photoQuality);
                        // pageSize: fallback to '10' if missing in older backups
                        if (payload.preferences.pageSize !== undefined) localStorage.setItem('tinyledger_page_size', payload.preferences.pageSize);

                        // Multi-value settings: merge or overwrite depending on mode
                        if (payload.preferences.accounts !== undefined) {
                            if (mode === 'overwrite') {
                                // Overwrite: replace all accounts directly
                                localStorage.setItem('tinyledger_accounts', payload.preferences.accounts);
                            } else {
                                // Merge: update existing accounts or add new ones (dedup by id)
                                const localAccounts = JSON.parse(localStorage.getItem('tinyledger_accounts') || '[]');
                                const backupAccounts = JSON.parse(payload.preferences.accounts || '[]');
                                const localAccountMap = new Map(localAccounts.map(a => [String(a.id), a]));
                                for (const bAcc of backupAccounts) {
                                    if (localAccountMap.has(String(bAcc.id))) {
                                        Object.assign(localAccountMap.get(String(bAcc.id)), bAcc);
                                    } else {
                                        localAccountMap.set(String(bAcc.id), bAcc);
                                    }
                                }
                                localStorage.setItem('tinyledger_accounts', JSON.stringify(Array.from(localAccountMap.values())));
                            }
                        } else if (mode === 'overwrite') {
                            // If backup has no accounts and mode is overwrite, clear local accounts
                            localStorage.removeItem('tinyledger_accounts');
                        }

                        if (payload.preferences.importantFestivals !== undefined) {
                            if (mode === 'overwrite') {
                                // Overwrite: replace all festivals directly
                                localStorage.setItem('tinyledger_important_festivals', payload.preferences.importantFestivals);
                            } else {
                                // Merge: add backup festivals that don't exist locally (dedup by date+name)
                                const localFestivals = JSON.parse(localStorage.getItem('tinyledger_important_festivals') || '[]');
                                const backupFestivals = JSON.parse(payload.preferences.importantFestivals || '[]');
                                const localFestivalKeys = new Set(localFestivals.map(f => `${f.date || ''}|${f.name || ''}`));
                                const mergedFestivals = [...localFestivals];
                                for (const bFest of backupFestivals) {
                                    const key = `${bFest.date || ''}|${bFest.name || ''}`;
                                    if (!localFestivalKeys.has(key)) {
                                        mergedFestivals.push(bFest);
                                        localFestivalKeys.add(key);
                                    }
                                }
                                localStorage.setItem('tinyledger_important_festivals', JSON.stringify(mergedFestivals));
                            }
                        }
                    }

                    // 2. Restore IndexedDB database (merge logic)
                    let importedData = payload;
                    // Convert recurringRules to fixedRecords (backwards compatibility)
                    if (importedData.recurringRules && Array.isArray(importedData.recurringRules) && !importedData.fixedRecords) {
                        importedData.fixedRecords = importedData.recurringRules.map(r => {
                            let ruleDetail = {};
                            if (r.recurrenceType === 'yearly') ruleDetail = { month: r.recMonth || 1, day: r.recDay || 1 };
                            else if (r.recurrenceType === 'monthly') ruleDetail = { day: r.recDay || 1 };
                            else if (r.recurrenceType === 'weekly') ruleDetail = { weekday: r.recDayOfWeek || 0 };
                            
                            return {
                                startDate: r.startDate || '', endDate: r.endDate || '',
                                rule: r.recurrenceType || 'monthly', ruleDetail: ruleDetail,
                                type: r.type || r.recType || 'expense', majorCategory: r.majorCategory || '',
                                subCategory: r.subCategory || r.minorCategory || '', amount: Number(r.amount) || 0,
                                payee: r.payee || r.target || '', location: r.location || '',
                                note: r.note || '', attachment: r.attachment || ''
                            };
                        });
                    }

                    // 2.5 Prepare existing data for merging and deduplication
                    const existingCategories = await db.getCategories();
                    const existingTargets = await db.getTargets();
                    const existingTxs = await db.getTransactions();
                    const existingFixed = await db.getFixedRecords();
                    
                    const txFingerprints = new Set(existingTxs.map(getTxFingerprint));
                    const fixedFingerprints = new Set(existingFixed.map(getFixedFingerprint));

                    // 3. Analyze Fixed and Normal Records first for accurate totals
                    const fixedAnalysis = DataMerger.analyze(importedData.fixedRecords || [], existingFixed, getFixedFingerprint, fixedFingerprints);
                    let fixedCount = fixedAnalysis.pendingItems.length;
                    let fixedSkipCount = fixedAnalysis.skipCount;
                    
                    if (importedData.transactions) {
                        for (const tx of importedData.transactions) {
                            if (typeof tx.amount === 'string') tx.amount = Number(tx.amount);
                        }
                    }
                    const txAnalysis = DataMerger.analyze(importedData.transactions || [], existingTxs, getTxFingerprint, txFingerprints);
                    let txCount = txAnalysis.pendingItems.length;
                    let txSkipCount = txAnalysis.skipCount;

                    const totalTx = importedData.transactions ? importedData.transactions.length : 0;
                    const totalFixed = importedData.fixedRecords ? importedData.fixedRecords.length : 0;
                    const totalCat = importedData.categories ? importedData.categories.length : 0;
                    const totalTgt = importedData.targets ? importedData.targets.length : 0;
                    
                    let catCount = 0; let catSkipCount = 0;
                    let tgtCount = 0; let tgtSkipCount = 0;

                    const fmt = window.t('ui.settings.backup.progressFormat');
                    const getLine = (typeStr, current, total) => {
                        if (total === 0) return fmt.done.replace('{type}', typeStr).replace('{current}', 0).replace('{total}', 0);
                        if (current === 0) return fmt.wait.replace('{type}', typeStr).replace('{current}', current).replace('{total}', total);
                        if (current >= total) return fmt.done.replace('{type}', typeStr).replace('{current}', total).replace('{total}', total);
                        return fmt.doing.replace('{type}', typeStr).replace('{current}', current).replace('{total}', total);
                    };

                    const progressState = {
                        tx: { c: txSkipCount, t: totalTx },
                        fixed: { c: fixedSkipCount, t: totalFixed },
                        cat: { c: 0, t: totalCat },
                        tgt: { c: 0, t: totalTgt }
                    };

                    const updateUI = (progressPct) => {
                        const detailStr = [
                            getLine(fmt.typeTx, progressState.tx.c, progressState.tx.t),
                            getLine(fmt.typeFixed, progressState.fixed.c, progressState.fixed.t),
                            getLine(fmt.typeCat, progressState.cat.c, progressState.cat.t),
                            getLine(fmt.typeTgt, progressState.tgt.c, progressState.tgt.t)
                        ].join('\n');
                        setAppBusy(true, { 
                            title: window.t('ui.settings.cloudBackup.syncing'), 
                            detail: detailStr, 
                            progress: Math.min(100, Math.max(0, progressPct))
                        });
                    };

                    updateUI(30);

                    // Execute Targets
                    if (importedData.targets && Array.isArray(importedData.targets)) {
                        const existingTargetNames = new Set(existingTargets.map(t => t.name));
                        let tgtIdx = 0;
                        for (const tg of importedData.targets) {
                            if (!existingTargetNames.has(tg.name)) {
                                existingTargetNames.add(tg.name);
                                delete tg.id;
                                await db.saveTarget(tg);
                                tgtCount++;
                            } else {
                                tgtSkipCount++;
                            }
                            tgtIdx++;
                            progressState.tgt.c = tgtIdx;
                            updateUI(32 + (tgtIdx / totalTgt) * 2);
                        }
                    }

                    // Execute Categories
                    if (importedData.categories && Array.isArray(importedData.categories)) {
                        let catIdx = 0;
                        for (const cat of importedData.categories) {
                            let existingCat = existingCategories.find(c => c.type === cat.type && c.major === cat.major);
                            if (existingCat) {
                                let subModified = false;
                                for (const sub of (cat.sub || cat.subs || [])) {
                                    if (!existingCat.sub.includes(sub)) {
                                        existingCat.sub.push(sub);
                                        subModified = true;
                                    }
                                }
                                if (subModified) {
                                    await db.saveCategory(existingCat);
                                    catCount++;
                                } else {
                                    catSkipCount++;
                                }
                            } else {
                                delete cat.id;
                                await db.saveCategory(cat);
                                existingCategories.push(cat);
                                catCount++;
                            }
                            catIdx++;
                            progressState.cat.c = catIdx;
                            updateUI(35 + (catIdx / totalCat) * 3);
                        }
                    }

                    // Execute Fixed Records
                    const savedFixed = await DataMerger.executeBatch(fixedAnalysis.pendingItems, db.batchSaveFixedRecords, (current, total) => {
                        progressState.fixed.c = current + fixedSkipCount;
                        updateUI(40 + (current / total) * 10);
                    });

                    // Generate Txs from saved Fixed Records
                    const generatedTxs = savedFixed.flatMap(fr => generateFixedTransactions(fr));
                    const genTxAnalysis = DataMerger.analyze(generatedTxs, existingTxs, getTxFingerprint, txFingerprints);
                    // Include genTx skips in total skip count for final message
                    txSkipCount += genTxAnalysis.skipCount;
                    await DataMerger.executeBatch(genTxAnalysis.pendingItems, db.batchSaveTransactions, (current, total) => {
                        updateUI(50 + (current / Math.max(1, total)) * 5);
                    });

                    // Execute Imported Txs
                    await DataMerger.executeBatch(txAnalysis.pendingItems, db.batchSaveTransactions, (current, total) => {
                        progressState.tx.c = current + txAnalysis.skipCount; // original skip count before genTx addition
                        updateUI(55 + (current / total) * 45);
                    });
                    
                    progressState.tx.c = totalTx;
                    progressState.fixed.c = totalFixed;
                    progressState.cat.c = totalCat;
                    progressState.tgt.c = totalTgt;
                    updateUI(100);

                    // (Prepare to show success message, removed redundant early close)
                    
                    let addsArray = [
                        window.t('ui.settings.cloudBackup.addedTx').replace('{tx}', txCount), 
                        window.t('ui.settings.cloudBackup.addedFixed').replace('{fixed}', fixedCount)
                    ];
                    if (catCount > 0) addsArray.push(window.t('ui.settings.cloudBackup.addedCat').replace('{cat}', catCount));
                    if (tgtCount > 0) addsArray.push(window.t('ui.settings.cloudBackup.addedTgt').replace('{tgt}', tgtCount));
                    const addsStr = addsArray.join('、');

                    let finalMsg = '';
                    const wasEmpty = existingTxs.length === 0 && existingFixed.length === 0;
                    if (wasEmpty) {
                        finalMsg = window.t('ui.settings.cloudBackup.restoreCompleteEmpty').replace('{adds}', addsStr);
                    } else if (mode === 'overwrite') {
                        finalMsg = window.t('ui.settings.cloudBackup.restoreCompleteOverwrite').replace('{adds}', addsStr);
                    } else {
                        finalMsg = window.t('ui.settings.cloudBackup.restoreCompleteMerge').replace('{adds}', addsStr);
                        if (txSkipCount > 0 || fixedSkipCount > 0 || catSkipCount > 0 || tgtSkipCount > 0) {
                            finalMsg += window.t('ui.settings.cloudBackup.restoreCompleteMergeSkipped');
                            if (txSkipCount > 0) finalMsg += window.t('ui.settings.cloudBackup.restoreFilteredTx').replace('{txSkip}', txSkipCount);
                            if (fixedSkipCount > 0) finalMsg += window.t('ui.settings.cloudBackup.restoreFilteredFixed').replace('{fixedSkip}', fixedSkipCount);
                            if (catSkipCount > 0) finalMsg += window.t('ui.settings.cloudBackup.restoreFilteredCat').replace('{catSkip}', catSkipCount);
                            if (tgtSkipCount > 0) finalMsg += window.t('ui.settings.cloudBackup.restoreFilteredTgt').replace('{tgtSkip}', tgtSkipCount);
                        }
                        finalMsg += `\n\n${window.t('ui.settings.backup.reloading') || 'System is reloading...'}`;
                    }

                    if (typeof setAppBusy === 'function') {
                        setAppBusy(false, { success: true, message: finalMsg });
                    }
                    setTimeout(() => window.location.reload(), 2500);
                } catch (e) {
                    throw new Error((window.t('logs.settings.restoreError') || 'Error during restore: ') + e.message);
                } finally {
                    window._disableGasAutoSync = false;
                }
            },
            customDescriptionHtml: `
                <span class="font-medium text-emerald-600">✅ ${window.t('ui.settings.backup.fullBackup') || 'Full Backup:'}</span>${window.t('ui.settings.backup.fullBackupDesc') || 'All your records, categories, and settings.'}<br>
                <span class="text-slate-400 text-[10px]">(*${window.t('ui.settings.backup.overwriteWarning') || 'Restoring from private cloud will completely overwrite local data'})</span>
            `
        });
    }

    if (btnExport && !btnExport.hasAttribute('data-bound')) {
        btnExport.setAttribute('data-bound', 'true');
        btnExport.addEventListener('click', async () => {
            setAppBusy(true, { title: window.t('ui.settings.backup.exportingTitle') || 'Exporting Data', detail: window.t('ui.settings.backup.exporting') });
            try {
                // Exclude auto-generated details from fixed records when exporting
                const txs = (await db.getTransactions()).filter(t => !t.isFixed);
                
                const rawFixed = await db.getFixedRecords();
                
                const cats = await db.getCategories();
                const tgts = await db.getTargets();
                
                // Collect LocalStorage settings (including defaults)
                const localPrefs = getCompletePreferences();

                const appData = {
                    transactions: txs,
                    fixedRecords: rawFixed,
                    categories: cats,
                    targets: tgts,
                    preferences: localPrefs
                };
                
                const backupSettings = JSON.parse(localStorage.getItem('global_backup_settings')) || {
                    mode: 'daily',
                    includePhotos: true
                };

                const zipBlob = await ZipBackupHelper.createBackupZip(appData, {
                    mode: backupSettings.mode,
                    includePhotos: backupSettings.includePhotos
                });
                
                const url = URL.createObjectURL(zipBlob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `TinyLedger_Backup_${new Date().toISOString().split('T')[0]}.zip`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                
                const exportMsg = window.t('ui.settings.backup.exportSuccess')
                    .replace('{txCount}', txs.length)
                    .replace('{fixedCount}', rawFixed.length)
                    .replace('{catCount}', cats.length)
                    .replace('{tgtCount}', tgts.length);
                console.log((window.t('logs.settings.exportJsonSuccess') || '[Backup] Manual export local backup (btn-export-json) success: ZIP size ') + `${Math.round(zipBlob.size/1024)} KB`);
                setAppBusy(false, { success: true, message: exportMsg });
            } catch (e) {
                setAppBusy(false, { error: true, message: window.t('ui.settings.backup.exportError').replace('{error}', e.message) });
            }
        });
    }
    
    if (inputImport && !inputImport.hasAttribute('data-bound')) {
        inputImport.setAttribute('data-bound', 'true');
        inputImport.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            window._disableGasAutoSync = true;
            setAppBusy(true, { title: window.t('ui.settings.backup.manualImport'), detail: window.t('ui.settings.backup.importing') });
            
            try {
                let importedData;
                
                if (file.name.toLowerCase().endsWith('.zip')) {
                    importedData = await ZipBackupHelper.extractBackupZip(file);
                } else if (file.name.toLowerCase().endsWith('.json')) {
                    const content = await new Promise((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onload = (evt) => resolve(evt.target.result);
                        reader.onerror = () => reject(new Error(window.t('logs.settings.fileReadError') || "File read failed"));
                        reader.readAsText(file);
                    });
                    
                    let parsed;
                    try {
                        parsed = JSON.parse(content);
                    } catch (err) {
                        throw new Error(window.t('ui.settings.backup.errorJsonParse'));
                    }
                    
                    // Support standard config/data envelope, or direct data format (e.g. old cloud backups)
                    if (!parsed || (!parsed.data && !parsed.transactions)) {
                        throw new Error(window.t('ui.settings.backup.errorOldFormat'));
                    }
                    importedData = parsed.data || parsed;
                } else {
                    throw new Error(window.t('ui.settings.backup.errorUnsupportedFile'));
                }

                // 1. Restore system settings (Preferences)
                if (importedData.preferences) {
                    // Single-value settings: always overwrite regardless of mode
                    if (importedData.preferences.lang) localStorage.setItem('tinyledger_lang', importedData.preferences.lang);
                    if (importedData.preferences.theme) localStorage.setItem('tinyledger-theme', importedData.preferences.theme);
                    if (importedData.preferences.customTheme) localStorage.setItem('tinyledger_custom_theme', importedData.preferences.customTheme);
                    if (importedData.preferences.budget) localStorage.setItem('tinyledger_monthly_budget', importedData.preferences.budget);
                    if (importedData.preferences.calendar) localStorage.setItem('tinyledger_calendar_settings', importedData.preferences.calendar);
                    if (importedData.preferences.gmapsKey !== undefined) localStorage.setItem('tinyledger_gmaps_api_key', importedData.preferences.gmapsKey);
                    if (importedData.preferences.mapLink !== undefined) localStorage.setItem('tinyledger_list_map_link', importedData.preferences.mapLink);
                    if (importedData.preferences.importantFestivalsEnabled !== undefined) localStorage.setItem('tinyledger_important_festivals_enabled', importedData.preferences.importantFestivalsEnabled);
                    if (importedData.preferences.photoUploadEnabled !== undefined) localStorage.setItem('tinyledger_photo_upload_enabled', importedData.preferences.photoUploadEnabled.toString());
                    if (importedData.preferences.photoSize !== undefined) localStorage.setItem('tinyledger_photo_size', importedData.preferences.photoSize);
                    if (importedData.preferences.photoQuality !== undefined) localStorage.setItem('tinyledger_photo_quality', importedData.preferences.photoQuality);
                    // pageSize: fallback to '10' if missing in older backups
                    if (importedData.preferences.pageSize !== undefined) localStorage.setItem('tinyledger_page_size', importedData.preferences.pageSize);

                    // [Local JSON Restore]: Parse gasSettings to check if URL differs, prompt for overwrite if different
                    if (importedData.preferences.gasSettings) {
                        const newGasStr = importedData.preferences.gasSettings;
                        const oldGasStr = localStorage.getItem('tinyledger_gas_settings');
                        
                        if (newGasStr && oldGasStr && newGasStr !== oldGasStr) {
                            try {
                                const parsedNew = JSON.parse(newGasStr);
                                const parsedOld = JSON.parse(oldGasStr);
                                
                                if (parsedNew.privateGasUrl && parsedOld.privateGasUrl && parsedNew.privateGasUrl !== parsedOld.privateGasUrl) {
                                    const msg = window.t('ui.settings.backup.gasUrlConflictPrompt')
                                        .replace('{newUrl}', parsedNew.privateGasUrl)
                                        .replace('{oldUrl}', parsedOld.privateGasUrl);
                                    if (!confirm(msg)) {
                                        parsedNew.privateGasUrl = parsedOld.privateGasUrl;
                                    }
                                } else if (!parsedNew.privateGasUrl && parsedOld.privateGasUrl) {
                                    parsedNew.privateGasUrl = parsedOld.privateGasUrl;
                                }
                                localStorage.setItem('tinyledger_gas_settings', JSON.stringify(parsedNew));
                            } catch (e) {
                                localStorage.setItem('tinyledger_gas_settings', newGasStr);
                            }
                        } else {
                            localStorage.setItem('tinyledger_gas_settings', newGasStr);
                        }
                    }

                    // Read restoreMode early to determine multi-value merge strategy
                    const prefRestoreModeEl = document.getElementById('global-restore-mode');
                    const prefRestoreMode = prefRestoreModeEl ? prefRestoreModeEl.value : 'merge';
                    const isPrefOverwrite = prefRestoreMode === 'overwrite';

                    // Multi-value settings: merge or overwrite depending on mode
                    if (importedData.preferences.accounts !== undefined) {
                        if (isPrefOverwrite) {
                            // Overwrite: replace all accounts directly
                            localStorage.setItem('tinyledger_accounts', importedData.preferences.accounts);
                        } else {
                            // Merge: update existing accounts or add new ones (dedup by id)
                            const localAccounts = JSON.parse(localStorage.getItem('tinyledger_accounts') || '[]');
                            const backupAccounts = JSON.parse(importedData.preferences.accounts || '[]');
                            const localAccountMap = new Map(localAccounts.map(a => [String(a.id), a]));
                            for (const bAcc of backupAccounts) {
                                if (localAccountMap.has(String(bAcc.id))) {
                                    Object.assign(localAccountMap.get(String(bAcc.id)), bAcc);
                                } else {
                                    localAccountMap.set(String(bAcc.id), bAcc);
                                }
                            }
                            localStorage.setItem('tinyledger_accounts', JSON.stringify(Array.from(localAccountMap.values())));
                        }
                    } else if (isPrefOverwrite) {
                        // If backup has no accounts and mode is overwrite, clear local accounts
                        localStorage.removeItem('tinyledger_accounts');
                    }

                    if (importedData.preferences.importantFestivals !== undefined) {
                        if (isPrefOverwrite) {
                            // Overwrite: replace all festivals directly
                            localStorage.setItem('tinyledger_important_festivals', importedData.preferences.importantFestivals);
                        } else {
                            // Merge: add backup festivals that don't exist locally (dedup by date+name)
                            const localFestivals = JSON.parse(localStorage.getItem('tinyledger_important_festivals') || '[]');
                            const backupFestivals = JSON.parse(importedData.preferences.importantFestivals || '[]');
                            const localFestivalKeys = new Set(localFestivals.map(f => `${f.date || ''}|${f.name || ''}`));
                            const mergedFestivals = [...localFestivals];
                            for (const bFest of backupFestivals) {
                                const key = `${bFest.date || ''}|${bFest.name || ''}`;
                                if (!localFestivalKeys.has(key)) {
                                    mergedFestivals.push(bFest);
                                    localFestivalKeys.add(key);
                                }
                            }
                            localStorage.setItem('tinyledger_important_festivals', JSON.stringify(mergedFestivals));
                        }
                    }

                    // Trigger theme reapply event
                    window.dispatchEvent(new Event('storage'));
                }

                    const globalRestoreModeEl = document.getElementById('global-restore-mode');
                    const restoreMode = globalRestoreModeEl ? globalRestoreModeEl.value : 'merge';
                    const isOverwrite = restoreMode === 'overwrite';

                    let txCount = 0;
                    let txSkipCount = 0;
                    let fixedCount = 0;
                    let fixedSkipCount = 0;
                    
                    const newTxs = [];
                    let existingTxs = [];
                    let existingFixed = [];
                    
                    if (!isOverwrite) {
                        existingTxs = await db.getTransactions();
                        existingFixed = await db.getFixedRecords();
                    }
                    
                    const txFingerprints = new Set(existingTxs.map(getTxFingerprint));
                    const fixedFingerprints = new Set(existingFixed.map(getFixedFingerprint));
                    
                    // Migrate imported data to match local database format (Chinese to internal IDs)
                    if (importedData) {
                        importedData = migrateImportedData(importedData, state.categories.expense.concat(state.categories.income), state.targets);
                    }
                    
                    // 1. Analyze Fixed Records
                    const fixedAnalysis = DataMerger.analyze(importedData.fixedRecords || [], existingFixed, getFixedFingerprint, fixedFingerprints);
                    const pendingFixed = fixedAnalysis.pendingItems;
                    fixedCount = pendingFixed.length;
                    fixedSkipCount = fixedAnalysis.skipCount;
                    
                    // 2. Analyze Imported Txs
                    if (importedData.transactions) {
                        for (const tx of importedData.transactions) {
                            if (typeof tx.amount === 'string') tx.amount = Number(tx.amount);
                        }
                    }
                    // Simulate generation of fixed transactions for accurate preview skip count
                    // (Ensure execution order matches: generate fixed txs, THEN analyze normal txs)
                    const previewTxFingerprints = new Set(txFingerprints);
                    const previewGeneratedTxs = pendingFixed.flatMap(fr => generateFixedTransactions(fr));
                    const previewGenTxAnalysis = DataMerger.analyze(previewGeneratedTxs, existingTxs, getTxFingerprint, previewTxFingerprints);
                    
                    const previewTxAnalysis = DataMerger.analyze(importedData.transactions, existingTxs, getTxFingerprint, previewTxFingerprints);
                    txCount = previewTxAnalysis.pendingItems.length;
                    txSkipCount = previewTxAnalysis.skipCount + previewGenTxAnalysis.skipCount;

                    let catCount = 0;
                    let catSkipCount = 0;
                    let tgtCount = 0;
                    let tgtSkipCount = 0;

                    const checkTargets = isOverwrite ? [] : state.targets;
                    if (importedData.targets && Array.isArray(importedData.targets)) {
                        const existingTargetNames = new Set(checkTargets.map(t => t.name));
                        importedData.targets.forEach(tg => {
                            if (!existingTargetNames.has(tg.name)) tgtCount++;
                            else tgtSkipCount++;
                        });
                    }

                    const checkCategories = isOverwrite ? { expense: [], income: [] } : state.categories;
                    if (importedData.categories && Array.isArray(importedData.categories)) {
                        importedData.categories.forEach(cat => {
                            const typeCats = cat.type === 'expense' ? checkCategories.expense : checkCategories.income;
                            let existingMajor = typeCats.find(c => c.major === cat.major);
                            if (existingMajor) {
                                let subModified = false;
                                for (const sub of cat.sub) {
                                    if (!existingMajor.sub.includes(sub)) {
                                        subModified = true;
                                        break;
                                    }
                                }
                                if (subModified) catCount++;
                                else catSkipCount++;
                            } else {
                                catCount++;
                            }
                        });
                    }

                    // Show preview confirmation modal
                    setAppBusy(false);
                    let totalTx = txCount + txSkipCount;
                    let totalFixed = fixedCount + fixedSkipCount;
                    let totalCat = catCount + catSkipCount;
                    let totalTgt = tgtCount + tgtSkipCount;

                    let confirmMsg = window.t('ui.settings.cloudBackup.restoreSummary')
                        .replace('{txCount}', totalTx)
                        .replace('{fixedCount}', totalFixed)
                        .replace('{catCount}', totalCat)
                        .replace('{tgtCount}', totalTgt);
                    if (txSkipCount > 0 || fixedSkipCount > 0 || catSkipCount > 0 || tgtSkipCount > 0) {
                        confirmMsg += window.t('ui.settings.cloudBackup.restoreFiltered');
                        if (txSkipCount > 0) confirmMsg += window.t('ui.settings.cloudBackup.restoreFilteredTx').replace('{txSkip}', txSkipCount);
                        if (fixedSkipCount > 0) confirmMsg += window.t('ui.settings.cloudBackup.restoreFilteredFixed').replace('{fixedSkip}', fixedSkipCount);
                        if (catSkipCount > 0) confirmMsg += window.t('ui.settings.cloudBackup.restoreFilteredCat').replace('{catSkip}', catSkipCount);
                        if (tgtSkipCount > 0) confirmMsg += window.t('ui.settings.cloudBackup.restoreFilteredTgt').replace('{tgtSkip}', tgtSkipCount);
                    }
                    
                    const isConfirmed = await showConfirmModal({
                        title: window.t('ui.settings.backup.parsedTitle'),
                        message: confirmMsg,
                        confirmText: window.t('ui.settings.backup.startImport'),
                        cancelText: window.t('ui.settings.backup.cancel'),
                        icon: '📂'
                    });
                    
                    if (!isConfirmed) {
                        inputImport.value = ''; // reset
                        return;
                    }
                    
                    if (isOverwrite) {
                        setAppBusy(true, { title: window.t('ui.settings.backup.clearingData'), detail: window.t('ui.settings.backup.deletingRecords'), progress: 40 });
                        await db.clearTransactions();
                        await db.clearFixedRecords();
                        await db.clearCategories();
                        await db.clearTargets();
                        state.categories = { expense: [], income: [] };
                        state.targets = [];
                    }

                    const fmt = window.t('ui.settings.backup.progressFormat');
                    const getLine = (typeStr, current, total) => {
                        if (total === 0) return fmt.done.replace('{type}', typeStr).replace('{current}', 0).replace('{total}', 0);
                        if (current === 0) return fmt.wait.replace('{type}', typeStr).replace('{current}', current).replace('{total}', total);
                        if (current >= total) return fmt.done.replace('{type}', typeStr).replace('{current}', total).replace('{total}', total);
                        return fmt.doing.replace('{type}', typeStr).replace('{current}', current).replace('{total}', total);
                    };

                    const progressState = {
                        tx: { c: txSkipCount, t: totalTx },
                        fixed: { c: fixedSkipCount, t: totalFixed },
                        cat: { c: catSkipCount, t: totalCat },
                        tgt: { c: tgtSkipCount, t: totalTgt }
                    };

                    const updateUI = (progressPct) => {
                        const detailStr = [
                            getLine(fmt.typeTx, progressState.tx.c, progressState.tx.t),
                            getLine(fmt.typeFixed, progressState.fixed.c, progressState.fixed.t),
                            getLine(fmt.typeCat, progressState.cat.c, progressState.cat.t),
                            getLine(fmt.typeTgt, progressState.tgt.c, progressState.tgt.t)
                        ].join('\n');
                        setAppBusy(true, { 
                            title: window.t('ui.settings.backup.restoringLocal'), 
                            detail: detailStr, 
                            progress: Math.min(100, Math.max(0, progressPct))
                        });
                    };

                    updateUI(40);
                    
                    // Execute actual database writes
                    const savedFixed = await DataMerger.executeBatch(pendingFixed, db.batchSaveFixedRecords, (current, total) => {
                        progressState.fixed.c = current + fixedSkipCount;
                        updateUI(40 + (current / total) * 5);
                    });
                    
                    // Generate details from newly written fixed records and save
                    const generatedTxs = savedFixed.flatMap(fr => generateFixedTransactions(fr));
                    const genTxAnalysis = DataMerger.analyze(generatedTxs, existingTxs, getTxFingerprint, txFingerprints);
                    await DataMerger.executeBatch(genTxAnalysis.pendingItems, db.batchSaveTransactions, (current, total) => {
                        updateUI(45 + (current / Math.max(1, total)) * 5);
                    });

                    // Re-analyze normal records (using updated txFingerprints) and save
                    const txAnalysis = DataMerger.analyze(importedData.transactions || [], existingTxs, getTxFingerprint, txFingerprints);
                    const savedTxs = await DataMerger.executeBatch(txAnalysis.pendingItems, db.batchSaveTransactions, (current, total) => {
                        progressState.tx.c = current + txSkipCount;
                        updateUI(50 + (current / total) * 40);
                    });
                    newTxs.push(...savedTxs);


                    
                    // Import Targets directly from backup if available
                    if (importedData.targets && Array.isArray(importedData.targets)) {
                        const existingTargetNames = new Set(state.targets.map(t => t.name));
                        let tgtIdx = 0;
                        for (const tg of importedData.targets) {
                            if (!existingTargetNames.has(tg.name)) {
                                existingTargetNames.add(tg.name);
                                // Do not delete tg.id to keep original data IDs (if user expects consistent IDs)
                                const newTarget = { ...tg, order: tg.order !== undefined ? tg.order : state.targets.length + 1 };
                                const id = await db.saveTarget(newTarget);
                                newTarget.id = id;
                                state.targets.push(newTarget);
                            }
                            tgtIdx++;
                            progressState.tgt.c = Math.floor((tgtIdx / importedData.targets.length) * (totalTgt - tgtSkipCount)) + tgtSkipCount;
                            updateUI(90 + (tgtIdx / importedData.targets.length) * 2);
                        }
                    }

                    // Import Categories directly from backup if available
                    if (importedData.categories && Array.isArray(importedData.categories)) {
                        let catIdx = 0;
                        for (const cat of importedData.categories) {
                            const typeCats = cat.type === 'expense' ? state.categories.expense : state.categories.income;
                            let existingMajor = typeCats.find(c => c.major === cat.major);
                            if (existingMajor) {
                                // Merge subcategories
                                let subModified = false;
                                for (const sub of cat.sub) {
                                    if (!existingMajor.sub.includes(sub)) {
                                        existingMajor.sub.push(sub);
                                        subModified = true;
                                    }
                                }
                                if (subModified) {
                                    await db.saveCategory(existingMajor);
                                }
                            } else {
                                delete cat.id;
                                const newCat = { ...cat, order: cat.order !== undefined ? cat.order : typeCats.length + 1 };
                                const id = await db.saveCategory(newCat);
                                newCat.id = id;
                                typeCats.push(newCat);
                            }
                            catIdx++;
                            progressState.cat.c = Math.floor((catIdx / importedData.categories.length) * (totalCat - catSkipCount)) + catSkipCount;
                            updateUI(92 + (catIdx / importedData.categories.length) * 2);
                        }
                    }

                    // Add Categories automatically from transactions to ensure no orphans
                    const uniqueTargets = new Set(state.targets.map(t => t.name));
                    
                    // Efficiency optimization: Only extract categories and targets for "non-duplicate" new records
                    if (newTxs.length > 0) {
                        const modifiedCats = new Set();
                        for (const tx of newTxs) {
                            // Extract Target (payee)
                            if (tx.payee && !uniqueTargets.has(tx.payee)) {
                                uniqueTargets.add(tx.payee);
                                const newTarget = { name: tx.payee, order: state.targets.length + 1 };
                                state.targets.push(newTarget);
                                // Target needs ID immediately for potential relation, but we can do it after or just let it generate.
                                // It's better to collect new targets and batch save them or save them as we find them (usually very few).
                                // Actually, targets are usually few, but to be safe:
                            }
                            
                            // Match by catId OR major to handle both formats:
                            // - App's native format: majorCategory = major name (e.g. "Food")
                            // - generate_sample format: majorCategory = catId (e.g. "cat_expense_food")
                            const typeCats = tx.type === 'expense' ? state.categories.expense : state.categories.income;
                            let majorCat = typeCats.find(c =>
                                c.major === tx.majorCategory || c.catId === tx.majorCategory
                            );
                            if (!majorCat) {
                                majorCat = { type: tx.type, major: tx.majorCategory, sub: [] };
                                typeCats.push(majorCat);
                                modifiedCats.add(majorCat);
                            }
                            if (tx.subCategory && !majorCat.sub.includes(tx.subCategory)) {
                                majorCat.sub.push(tx.subCategory);
                                modifiedCats.add(majorCat);
                            }
                        }

                        // Save new targets
                        const newTargetsToSave = state.targets.filter(t => !t.id);
                        let savedTgts = 0;
                        for (const tg of newTargetsToSave) {
                            const id = await db.saveTarget(tg);
                            tg.id = id;
                            savedTgts++;
                            updateUI(94 + (savedTgts / newTargetsToSave.length) * 2);
                        }
                        
                        // Save modified categories
                        let savedCats = 0;
                        for (const cat of modifiedCats) {
                            const catId = await db.saveCategory(cat);
                            if (!cat.id) cat.id = catId;
                            savedCats++;
                            updateUI(96 + (savedCats / modifiedCats.size) * 3);
                        }
                    }
                    
                    progressState.tx.c = totalTx;
                    progressState.fixed.c = totalFixed;
                    progressState.cat.c = totalCat;
                    progressState.tgt.c = totalTgt;
                    updateUI(100);
                    
                    // Refresh app state and UI
                    state.transactions = await db.getTransactions();
                    state.fixedRecords = await db.getFixedRecords();
                    console.log((window.t('logs.settings.importJsonSuccess') || '[Backup] Import from local backup (input-import-json) success: added/updated ') + `${newTxs.length} records`);
                    if (typeof renderApp === 'function') renderApp();
                    
                    let addsArray = [
                        window.t('ui.settings.cloudBackup.addedTx').replace('{tx}', txCount), 
                        window.t('ui.settings.cloudBackup.addedFixed').replace('{fixed}', fixedCount)
                    ];
                    if (catCount > 0) addsArray.push(window.t('ui.settings.cloudBackup.addedCat').replace('{cat}', catCount));
                    if (tgtCount > 0) addsArray.push(window.t('ui.settings.cloudBackup.addedTgt').replace('{tgt}', tgtCount));
                    const addsStr = addsArray.join('、');
                    
                    let msg = window.t('ui.settings.backup.importComplete').replace('{adds}', addsStr);
                    if (txSkipCount > 0 || fixedSkipCount > 0 || catSkipCount > 0 || tgtSkipCount > 0) {
                        msg += window.t('ui.settings.cloudBackup.restoreCompleteMergeSkipped');
                        if (txSkipCount > 0) msg += window.t('ui.settings.cloudBackup.restoreFilteredTx').replace('{txSkip}', txSkipCount);
                        if (fixedSkipCount > 0) msg += window.t('ui.settings.cloudBackup.restoreFilteredFixed').replace('{fixedSkip}', fixedSkipCount);
                        if (catSkipCount > 0) msg += window.t('ui.settings.cloudBackup.restoreFilteredCat').replace('{catSkip}', catSkipCount);
                        if (tgtSkipCount > 0) msg += window.t('ui.settings.cloudBackup.restoreFilteredTgt').replace('{tgtSkip}', tgtSkipCount);
                    }
                    
                    msg += `\n\n${window.t('ui.settings.backup.reloading') || 'System is reloading...'}`;
                    setAppBusy(false, { success: true, message: msg });
                    setTimeout(() => window.location.reload(), 2500);
                } catch (error) {
                    setAppBusy(false, { error: true, message: window.t('ui.settings.backup.importError').replace('{error}', error.message) });
                } finally {
                    inputImport.value = ''; // reset
                    window._disableGasAutoSync = false;
                }
        });
    }

    // Initialize Danger Zone - Use DangerZoneModule directly to mount, with custom logic to clear IndexedDB and localStorage
    const dangerZoneContainer = document.getElementById('danger-zone-module');
    if (dangerZoneContainer) {
        new DangerZoneModule({
            container: dangerZoneContainer,
            onClear: async () => {
                // Close IndexedDB connection first
                await db.closeConnection();
                // Delete IndexedDB
                await deleteIndexedDB('TinyLedgerDB');
                
                // Define keys that should not be forcefully cleared (Google Maps API, GAS Cloud Settings, i18n migration flag, language setting)
                const keysToKeep = [
                    'tinyledger_gmaps_api_key',
                    'tinyledger_gas_settings',
                    'tinyledger_i18n_migrated',
                    'tinyledger_lang'
                ];
                
                // Clear all localStorage settings starting with tinyledger_, but keep the keys defined above
                const keysToRemove = Object.keys(localStorage).filter(k => 
                    k.startsWith('tinyledger_') && !keysToKeep.includes(k)
                );
                keysToRemove.forEach(k => localStorage.removeItem(k));
                
                const keptKeyLabels = {
                    'tinyledger_gmaps_api_key': window.t('logs.settings.keptKeyGmaps'),
                    'tinyledger_gas_settings':  window.t('logs.settings.keptKeyGas'),
                    'tinyledger_i18n_migrated': window.t('logs.settings.keptKeyI18n'),
                    'tinyledger_lang':          window.t('logs.settings.keptKeyLang')
                };
                const keptLabels = keysToKeep.map(k => keptKeyLabels[k] || k).join(', ');
                console.log(window.t('logs.settings.forceClearComplete', { 
                    removed: keysToRemove.length, 
                    kept: keysToKeep.length 
                }) + ` (${keptLabels})`);
            }
        });
    }

    // Initialize System Logs UI
    mountSystemLogsUI({
        containerId: 'system-logs-module',
        description: window.t('ui.settings.systemLogs.desc')
    });

    // =========================================================
    // Category & Target Management logic (Moved from manageModals.js)
    // =========================================================
    const cascadeUpdate = async (field, oldValue, newValue, conditions = {}) => {
        const isConfirmed = await showConfirmModal({
            title: window.t('ui.settings.categories.cascadeUpdateTitle'),
            message: window.t('ui.settings.categories.cascadeUpdateConfirm').replace('{oldValue}', oldValue).replace('{newValue}', newValue),
            confirmText: window.t('ui.settings.categories.confirmUpdate'),
            cancelText: window.t('ui.settings.categories.cancel'),
            icon: '🔄',
            isDanger: true // Large-scale history modification, use danger style alert
        });

        if (!isConfirmed) {
            return false;
        }

        let isUpdated = false;

        // Helper function to check if record matches cascade conditions
        const matchesConditions = (record) => {
            for (const [key, value] of Object.entries(conditions)) {
                if (record[key] !== value) return false;
            }
            return true;
        };

        // Update Transactions
        const txs = await db.getTransactions();
        for (const tx of txs) {
            if (tx[field] === oldValue && matchesConditions(tx)) {
                tx[field] = newValue;
                await db.saveTransaction(tx);
                isUpdated = true;
            }
        }

        // Update Fixed Records
        const fixed = await db.getFixedRecords();
        for (const fx of fixed) {
            if (fx[field] === oldValue && matchesConditions(fx)) {
                fx[field] = newValue;
                await db.saveFixedRecord(fx);
                isUpdated = true;
            }
        }

        if (isUpdated) {
            state.transactions = await db.getTransactions();
            state.fixedRecords = await db.getFixedRecords();
            if (typeof renderApp === 'function') renderApp();
        }
        
        return true;
    };

    function setupDragAndDrop(container, itemSelector, onReorder) {
        let draggedItem = null;
        let scrollDirection = 0;
        let scrollInterval = null;

        const startScroll = (direction, scrollContainer) => {
            if (scrollDirection === direction) return;
            scrollDirection = direction;
            if (scrollInterval) clearInterval(scrollInterval);
            
            if (direction !== 0) {
                scrollInterval = setInterval(() => {
                    scrollContainer.scrollTop += direction * 15;
                }, 20);
            }
        };

        const stopScroll = () => {
            if (scrollInterval) {
                clearInterval(scrollInterval);
                scrollInterval = null;
            }
            scrollDirection = 0;
        };

        container.addEventListener('dragstart', (e) => {
            const target = e.target.closest(itemSelector);
            if (!target) return;
            
            if (e.target.closest('[draggable="true"]') !== target) return;

            draggedItem = target;
            e.dataTransfer.effectAllowed = 'move';
            setTimeout(() => target.classList.add('dragging'), 0);
        });

        container.addEventListener('dragend', (e) => {
            stopScroll();
            if (!draggedItem) return;
            draggedItem.classList.remove('dragging');
            draggedItem = null;
            onReorder();
        });

        container.addEventListener('dragover', (e) => {
            e.preventDefault();
            if (!draggedItem) return;
            if (draggedItem.parentNode !== container) return;

            const afterElement = getDragAfterElement(container, e.clientY, `${itemSelector}:not(.dragging)`);
            if (afterElement == null) {
                container.appendChild(draggedItem);
            } else {
                container.insertBefore(draggedItem, afterElement);
            }

            const scrollContainer = container.closest('.modal-body') || container;
            const scrollThreshold = 60;
            const rect = scrollContainer.getBoundingClientRect();
            
            if (e.clientY < rect.top + scrollThreshold) {
                startScroll(-1, scrollContainer);
            } else if (e.clientY > rect.bottom - scrollThreshold) {
                startScroll(1, scrollContainer);
            } else {
                stopScroll();
            }
        });
    }

    function getDragAfterElement(container, y, selector) {
        const draggableElements = [...container.querySelectorAll(selector)];
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    const renderCatList = (container, cats, type) => {
        container.innerHTML = '';
        container.style.display = 'grid';
        container.style.gridTemplateColumns = 'repeat(auto-fill, minmax(280px, 1fr))';
        container.style.gap = '12px';
        container.style.alignItems = 'start';

        const setupAddMajorBtn = () => {
            const btnAddMajor = document.getElementById('btn-settings-add-cat');
            const txtAddMajor = document.getElementById('txt-settings-add-cat');
            if (!btnAddMajor || !txtAddMajor) return;
            
            txtAddMajor.textContent = type === 'expense' ? (window.t('ui.settings.categories.addExpenseMajor') || 'Add Expense Major') : (window.t('ui.settings.categories.addIncomeMajor') || 'Add Income Major');
            
            btnAddMajor.onclick = async () => {
                const newMajor = prompt(window.t('ui.settings.categories.promptNewMajor'));
                if (newMajor && newMajor.trim() !== '') {
                    const cleanMajor = newMajor.trim();
                    const newCat = { 
                        type: type, 
                        major: cleanMajor, 
                        sub: [], 
                        order: cats.length + 1,
                        catId: 'custom_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5)
                    };
                    const id = await db.saveCategory(newCat);
                    newCat.id = id;
                    cats.push(newCat);
                    renderCatList(container, cats, type);
                }
            };
        };
        
        const updateCatBatchUI = () => {
            const allCheckboxes = container.querySelectorAll('.cat-checkbox:not(:disabled)');
            const checkedCheckboxes = container.querySelectorAll('.cat-checkbox:checked');
            const totalCount = container.querySelectorAll('.cat-checkbox').length;
            const domCheckedCount = checkedCheckboxes.length;

            const btnDeleteSelected = document.getElementById('btn-delete-selected-cats');
            const cbSelectAll = document.getElementById('cb-select-all-cats');

            if (btnDeleteSelected) {
                if (domCheckedCount > 0) {
                    btnDeleteSelected.style.display = 'block';
                    btnDeleteSelected.textContent = window.t('ui.settings.categories.deleteSelected').replace('{count}', domCheckedCount);
                } else {
                    btnDeleteSelected.style.display = 'none';
                }
            }
            if (cbSelectAll) {
                const labelElement = cbSelectAll.closest('label');
                if (totalCount === 0) {
                    if (labelElement) labelElement.style.display = 'none';
                    cbSelectAll.checked = false;
                } else {
                    if (labelElement) labelElement.style.display = 'flex';
                    if (domCheckedCount === 0) {
                        cbSelectAll.checked = false;
                    } else {
                        const isAllSelected = totalCount > 0 && domCheckedCount === totalCount;
                        cbSelectAll.checked = isAllSelected;
                    }
                }
            }
        };
        
        window.updateCatBatchUI = updateCatBatchUI;

        if (!cats || cats.length === 0) {
            const emptyDiv = document.createElement('div');
            emptyDiv.style.textAlign = 'center';
            emptyDiv.style.padding = '2rem';
            emptyDiv.style.color = 'var(--text-color-secondary)';
            emptyDiv.textContent = window.t('ui.settings.categories.noData');
            container.appendChild(emptyDiv);
            appendAddMajorBtn();
            updateCatBatchUI();
            return;
        }

        cats.forEach((c, catIdx) => {
            const block = document.createElement('div');
            block.className = 'major-cat-block';
            block.dataset.major = c.major;
            block.draggable = true;
            block.style.background = 'var(--bg-color)'; 
            block.style.borderRadius = '8px';
            block.style.border = '1px solid var(--border-color)';
            
            const header = document.createElement('div');
            header.className = 'major-cat-header';
            header.style.padding = '0.5rem';
            header.style.display = 'flex';
            header.style.justifyContent = 'space-between';
            header.style.alignItems = 'center';
            header.style.cursor = 'pointer';
            
            const headerLeft = document.createElement('div');
            headerLeft.style.display = 'flex';
            headerLeft.style.alignItems = 'center';
            headerLeft.style.gap = '8px';
            const cbMajor = document.createElement('input');
            cbMajor.type = 'checkbox';
            cbMajor.className = 'cat-checkbox cat-major-checkbox';
            cbMajor.dataset.major = c.major;
            cbMajor.value = c.major;
            cbMajor.style.cursor = 'pointer';
            cbMajor.addEventListener('click', e => e.stopPropagation());
            
            const majorSelect = document.createElement('select');
            majorSelect.className = 'form-control';
            majorSelect.style.width = '45px';
            majorSelect.style.height = '24px';
            majorSelect.style.padding = '0 2px';
            majorSelect.style.fontSize = '12px';
            for (let i = 1; i <= cats.length; i++) {
                const opt = document.createElement('option');
                opt.value = i;
                opt.textContent = i;
                if (i === catIdx + 1) opt.selected = true;
                majorSelect.appendChild(opt);
            }
            majorSelect.addEventListener('click', e => e.stopPropagation());
            majorSelect.addEventListener('change', async (e) => {
                e.stopPropagation();
                const newPos = parseInt(e.target.value) - 1;
                const oldPos = catIdx;
                if (newPos === oldPos) return;
                
                const temp = cats[newPos];
                cats[newPos] = cats[oldPos];
                cats[oldPos] = temp;
                
                cats[newPos].order = newPos + 1;
                cats[oldPos].order = oldPos + 1;
                
                await db.saveCategory(cats[newPos]);
                await db.saveCategory(cats[oldPos]);
                
                renderCatList(container, cats, type);
            });

            const nameSpan = document.createElement('span');
            nameSpan.style.pointerEvents = 'none';
            nameSpan.style.fontWeight = 'bold';
            const unnamed = window.t ? window.t('ui.common.unnamed') : '(Unnamed)';
            const displayName = c.major || (c.i18nKey && window.t ? window.t(c.i18nKey) : null) || unnamed;
            nameSpan.textContent = (displayName.trim() === '') ? unnamed : displayName;

            headerLeft.appendChild(cbMajor);
            headerLeft.appendChild(majorSelect);
            headerLeft.appendChild(nameSpan);
            
            const headerRight = document.createElement('div');
            headerRight.style.display = 'flex';
            headerRight.style.alignItems = 'center';
            headerRight.style.gap = '4px';
            headerRight.innerHTML = `
                <button class="edit-btn edit-major-btn" data-major="${c.major}" style="border:none; background:none; cursor:pointer; padding:6px;">
                    <span class="material-icons" style="font-size: 18px;">edit</span>
                </button>
                <button class="delete-btn delete-major-btn" data-major="${c.major}" style="border:none; background:none; cursor:pointer; padding:6px;">
                    <span class="material-icons" style="font-size: 18px;">close</span>
                </button>
                <span class="material-icons expand-icon" style="font-size: 24px; transition: transform 0.2s; padding: 4px;">expand_more</span>
            `;
            
            header.appendChild(headerLeft);
            header.appendChild(headerRight);
            
            const body = document.createElement('div');
            body.className = 'major-cat-body';
            body.style.display = 'none';
            body.style.padding = '0.5rem';
            body.style.borderTop = '1px dashed var(--border-color)';
            
            header.addEventListener('click', (e) => {
                if (e.target.closest('button') || e.target.closest('input')) return;
                const isHidden = body.style.display === 'none';
                body.style.display = isHidden ? 'block' : 'none';
                const expandIcon = header.querySelector('.expand-icon');
                if (expandIcon) {
                    expandIcon.style.transform = isHidden ? 'rotate(180deg)' : 'rotate(0deg)';
                }
            });
            
            const subs = c.sub || [];
            if (subs.length === 0) {
                const emptyMinorDiv = document.createElement('div');
                emptyMinorDiv.style.textAlign = 'center';
                emptyMinorDiv.style.padding = '1rem';
                emptyMinorDiv.style.color = 'var(--text-color-secondary)';
                emptyMinorDiv.style.fontSize = '14px';
                emptyMinorDiv.textContent = window.t('ui.settings.categories.noData');
                body.appendChild(emptyMinorDiv);
            } else {
                const ul = document.createElement('ul');
                ul.className = 'manage-list minor-cat-list';
                ul.dataset.major = c.major;
                
                subs.forEach((sub, idx) => {
                    const li = document.createElement('li');
                    li.className = 'manage-list-item minor-cat-item';
                    li.draggable = true;
                    li.dataset.sub = sub;
                    const leftDiv = document.createElement('div');
                    leftDiv.style.display = 'flex';
                    leftDiv.style.alignItems = 'center';
                    leftDiv.style.gap = '8px';
                    
                    const cbMinor = document.createElement('input');
                    cbMinor.type = 'checkbox';
                    cbMinor.className = 'cat-checkbox cat-minor-checkbox';
                    cbMinor.dataset.major = c.major;
                    cbMinor.dataset.sub = sub;
                    cbMinor.style.cursor = 'pointer';
                    
                    const minorSelect = document.createElement('select');
                    minorSelect.className = 'form-control';
                    minorSelect.style.width = '45px';
                    minorSelect.style.height = '24px';
                    minorSelect.style.padding = '0 2px';
                    minorSelect.style.fontSize = '12px';
                    for (let i = 1; i <= subs.length; i++) {
                        const opt = document.createElement('option');
                        opt.value = i;
                        opt.textContent = i;
                        if (i === idx + 1) opt.selected = true;
                        minorSelect.appendChild(opt);
                    }
                    minorSelect.addEventListener('change', async (e) => {
                        const newPos = parseInt(e.target.value) - 1;
                        const oldPos = idx;
                        if (newPos === oldPos) return;
                        
                        const temp = c.sub[newPos];
                        c.sub[newPos] = c.sub[oldPos];
                        c.sub[oldPos] = temp;
                        
                        await db.saveCategory(c);
                        renderCatList(container, cats, type);
                    });

                    const nameSpan = document.createElement('span');
                    nameSpan.style.pointerEvents = 'none';
                    nameSpan.textContent = sub;

                    leftDiv.appendChild(cbMinor);
                    leftDiv.appendChild(minorSelect);
                    leftDiv.appendChild(nameSpan);
                    
                    const rightDiv = document.createElement('div');
                    rightDiv.style.display = 'flex';
                    rightDiv.style.alignItems = 'center';
                    rightDiv.style.gap = '4px';
                    rightDiv.innerHTML = `
                        <button class="icon-btn edit-btn" data-major="${c.major}" data-sub="${sub}" title="${window.t('ui.settings.categories.editSub') || 'Edit Minor Category'}">
                            <span class="material-icons" style="font-size: 18px; pointer-events: none;">edit</span>
                        </button>
                        <button class="icon-btn delete-btn" data-major="${c.major}" data-sub="${sub}" title="${window.t('ui.settings.categories.deleteSub') || 'Delete Minor Category'}">
                            <span class="material-icons">close</span>
                        </button>
                    `;
                    
                    li.appendChild(leftDiv);
                    li.appendChild(rightDiv);
                    ul.appendChild(li);
                });
                body.appendChild(ul);
            }

            const btnAdd = document.createElement('button');
            btnAdd.className = 'btn btn-outline';
            btnAdd.style.width = '100%';
            btnAdd.style.marginTop = '8px';
            btnAdd.innerHTML = `<span class="material-icons" style="font-size:18px; vertical-align:middle; margin-right:4px;">add</span>${window.t('ui.settings.categories.addMinor')}`;
            btnAdd.onclick = () => {
                const newSub = prompt(window.t('ui.settings.categories.promptNewMinor'));
                if (newSub && newSub.trim() !== '') {
                    c.sub.push(newSub.trim());
                    db.saveCategory(c).then(() => renderCatList(container, cats, type));
                }
            };

            body.appendChild(btnAdd);
            
            block.appendChild(header);
            block.appendChild(body);
            container.appendChild(block);
        });

        setupAddMajorBtn();

        // Logic for handling major category selection cascading to minor categories
        const majorCheckboxes = container.querySelectorAll('.cat-major-checkbox');
        majorCheckboxes.forEach(majorCb => {
            majorCb.addEventListener('change', (e) => {
                const major = e.target.dataset.major;
                const minorCheckboxes = container.querySelectorAll(`.cat-minor-checkbox[data-major="${major}"]`);
                minorCheckboxes.forEach(minorCb => {
                    if (e.target.checked) {
                        minorCb.checked = true;
                        minorCb.disabled = true; // Force checked, cannot be deselected
                    } else {
                        minorCb.checked = false;
                        minorCb.disabled = false; // Restore selectable state
                    }
                });
                updateCatBatchUI();
            });
        });

        const minorCheckboxes = container.querySelectorAll('.cat-minor-checkbox');
        minorCheckboxes.forEach(minorCb => {
            minorCb.addEventListener('change', updateCatBatchUI);
        });

        window.updateCatBatchUI = updateCatBatchUI;

        // Add delete handlers
        container.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const major = btn.getAttribute('data-major');
                const subName = btn.getAttribute('data-sub');
                const isMajor = !btn.hasAttribute('data-sub');
                const cat = cats.find(c => c.major === major);
                
                if (cat) {
                    try {
                        const txs = await db.getTransactions();
                        const fixed = await db.getFixedRecords();
                        
                        let boundTxs, boundFixed;
                        if (isMajor) {
                            boundTxs = txs.filter(t => t.type === type && t.majorCategory === major);
                            boundFixed = fixed.filter(f => f.type === type && f.majorCategory === major);
                        } else {
                            boundTxs = txs.filter(t => t.type === type && t.majorCategory === major && t.subCategory === subName);
                            boundFixed = fixed.filter(f => f.type === type && f.majorCategory === major && f.subCategory === subName);
                        }
                        
                        if (boundTxs.length > 0 || boundFixed.length > 0) {
                            let msg = window.t('ui.settings.categories.deleteInUseMsg');
                            
                            if (boundTxs.length > 0) {
                                const dates = [...new Set(boundTxs.map(t => t.date))].sort().reverse();
                                const displayDates = dates.slice(0, 5).join(', ');
                                const moreStr = dates.length > 5 ? (window.t('ui.settings.categories.moreDays', { count: dates.length }) || ` and ${dates.length} more days`) : '';
                                msg += window.t('ui.settings.categories.deleteInUseTx').replace('{count}', boundTxs.length).replace('{dates}', displayDates).replace('{more}', moreStr);
                            }
                            
                            if (boundFixed.length > 0) {
                                const names = boundFixed.map(f => f.note || (window.t('ui.record.noNote') || 'No Note')).slice(0, 3).join(', ');
                                const moreStr = boundFixed.length > 3 ? (window.t('ui.settings.categories.etc') || ' etc.') : '';
                                msg += window.t('ui.settings.categories.deleteInUseFixed').replace('{count}', boundFixed.length).replace('{names}', names).replace('{more}', moreStr);
                            }
                            
                            msg += window.t('ui.settings.categories.deleteInUseTail');
                            alert(msg);
                            return;
                        }
                    } catch (err) {
                        console.error(window.t('logs.settings.checkCategoryError'), err);
                    }
                    
                    if (!confirm(window.t('ui.settings.categories.deleteConfirm'))) return;

                    if (isMajor) {
                        await db.deleteCategory(cat.id);
                        // Also remove from state to reflect locally
                        const stateIdx = cats.findIndex(c => c.major === major);
                        if(stateIdx > -1) cats.splice(stateIdx, 1);
                    } else {
                        const currentIdx = cat.sub.indexOf(subName);
                        if (currentIdx > -1) {
                            cat.sub.splice(currentIdx, 1);
                            await db.saveCategory(cat);
                        }
                    }
                    renderCatList(container, cats, type);
                    if (window.updateCatBatchUI) window.updateCatBatchUI();
                }
            });
        });

        // Add edit handlers
        container.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const major = btn.getAttribute('data-major');
                const sub = btn.getAttribute('data-sub');
                const isMajor = !btn.hasAttribute('data-sub');
                const originalName = isMajor ? major : sub;

                const itemContainer = isMajor ? btn.closest('.major-cat-header') : btn.closest('li');
                const leftContainer = itemContainer.children[0];
                const spans = leftContainer.querySelectorAll('span:not(.material-icons)');
                const nameSpan = spans[spans.length - 1]; // The name is always the last span
                const actionContainer = btn.parentElement;

                if (itemContainer.querySelector('.inline-edit-input')) return;

                nameSpan.style.display = 'none';
                actionContainer.style.display = 'none';

                const input = document.createElement('input');
                input.type = 'text';
                input.className = 'form-control inline-edit-input';
                input.value = originalName;
                input.style.width = '130px';
                input.style.height = '28px';
                input.style.padding = '0 8px';
                input.style.fontSize = '14px';
                input.style.margin = '0';
                
                const cancelBtn = document.createElement('button');
                cancelBtn.className = 'icon-btn';
                cancelBtn.innerHTML = '<span class="material-icons" style="font-size: 16px; color: #94a3b8;">close</span>';
                cancelBtn.title = window.t('ui.settings.categories.cancel');
                cancelBtn.onmousedown = (ev) => {
                    ev.preventDefault(); 
                    cancelEdit();
                };

                const editContainer = document.createElement('div');
                editContainer.style.display = 'flex';
                editContainer.style.alignItems = 'center';
                editContainer.style.gap = '4px';
                editContainer.appendChild(input);
                editContainer.appendChild(cancelBtn);

                nameSpan.parentNode.insertBefore(editContainer, nameSpan.nextSibling);
                input.focus();

                let isSaving = false;

                const cancelEdit = () => {
                    editContainer.remove();
                    nameSpan.style.display = '';
                    actionContainer.style.display = 'flex';
                };

                const saveEdit = async () => {
                    if (isSaving) return;
                    const newName = input.value.trim();
                    if (!newName || newName === originalName) {
                        cancelEdit();
                        return;
                    }
                    isSaving = true;
                    input.disabled = true;

                    if (isMajor) {
                        // Major category modification: only restrict to same type (income/expense)
                        const success = await cascadeUpdate('majorCategory', major, newName, { type });
                        if (success) {
                            const cat = cats.find(c => c.major === major);
                            if (cat) {
                                cat.major = newName;
                                await db.saveCategory(cat);
                                renderCatList(container, cats, type);
                            }
                        } else {
                            cancelEdit();
                        }
                    } else {
                        // Minor category modification: restrict to same type and majorCategory
                        const success = await cascadeUpdate('subCategory', sub, newName, { type, majorCategory: major });
                        if (success) {
                            const cat = cats.find(c => c.major === major);
                            if (cat) {
                                const currentIdx = cat.sub.indexOf(sub);
                                if (currentIdx > -1) {
                                    cat.sub[currentIdx] = newName;
                                    await db.saveCategory(cat);
                                }
                                renderCatList(container, cats, type);
                            }
                        } else {
                            cancelEdit();
                        }
                    }
                };

                input.addEventListener('keydown', (ev) => {
                    if (ev.key === 'Enter') saveEdit();
                    else if (ev.key === 'Escape') cancelEdit();
                });
                input.addEventListener('blur', saveEdit);
            });
        });

        // Setup Drag and Drop for Major Categories
        setupDragAndDrop(container, '.major-cat-block', async () => {
            const blocks = [...container.querySelectorAll('.major-cat-block')];
            blocks.forEach((block, index) => {
                const major = block.dataset.major;
                const cat = cats.find(c => c.major === major);
                if (cat) {
                    cat.order = index + 1;
                    db.saveCategory(cat);
                }
            });
            cats.sort((a, b) => (a.order || 0) - (b.order || 0));
        });

        // Setup Drag and Drop for Minor Categories
        container.querySelectorAll('.minor-cat-list').forEach(ul => {
            setupDragAndDrop(ul, '.minor-cat-item', async () => {
                const major = ul.dataset.major;
                const cat = cats.find(c => c.major === major);
                if (cat) {
                    const items = [...ul.querySelectorAll('.minor-cat-item')];
                    cat.sub = items.map(item => item.dataset.sub);
                    
                    // Dynamically update DOM index bindings to avoid operating on wrong items
                    items.forEach((item, newIdx) => {
                        const cb = item.querySelector('.cat-minor-checkbox');
                        const editBtn = item.querySelector('.edit-btn');
                        const delBtn = item.querySelector('.delete-btn');

                    });

                    await db.saveCategory(cat);
                }
            });
        });
    };



    const renderTargetReorderList = (container) => {
        container.innerHTML = '';
        const targets = state.targets;
        targets.sort((a, b) => (a.order || 0) - (b.order || 0));

        const title = document.createElement('h3');
        title.style.marginBottom = '12px';
        title.style.fontSize = '0.9rem';
        title.style.color = 'var(--text-color-secondary)';
        title.textContent = window.t('ui.settings.targets.reorderTitle');
        container.appendChild(title);

        if (!targets || targets.length === 0) {
            const emptyDiv = document.createElement('div');
            emptyDiv.style.textAlign = 'center';
            emptyDiv.style.padding = '2rem';
            emptyDiv.style.color = 'var(--text-color-secondary)';
            emptyDiv.textContent = window.t('ui.settings.targets.noDataSimple');
            container.appendChild(emptyDiv);
            return;
        }

        const gridDiv = document.createElement('div');
        gridDiv.style.display = 'grid';
        gridDiv.style.gridTemplateColumns = 'repeat(auto-fill, minmax(180px, 1fr))';
        gridDiv.style.gap = '8px';
        container.appendChild(gridDiv);

        targets.forEach((t, idx) => {
            const block = document.createElement('div');
            block.style.display = 'flex';
            block.style.alignItems = 'center';
            block.style.justifyContent = 'space-between';
            block.style.padding = '12px';
            block.style.background = 'var(--bg-color)';
            block.style.borderRadius = '8px';

            const nameSpan = document.createElement('span');
            nameSpan.textContent = t.name;
            nameSpan.style.fontWeight = 'bold';
            
            const select = document.createElement('select');
            select.className = 'form-control';
            select.style.width = '70px';
            for (let i = 1; i <= targets.length; i++) {
                const opt = document.createElement('option');
                opt.value = i;
                opt.textContent = i;
                if (i === idx + 1) opt.selected = true;
                select.appendChild(opt);
            }

            select.addEventListener('change', async (e) => {
                const newPos = parseInt(e.target.value) - 1;
                const oldPos = idx;
                if (newPos === oldPos) return;
                
                const temp = targets[newPos];
                targets[newPos] = targets[oldPos];
                targets[oldPos] = temp;
                
                targets[newPos].order = newPos + 1;
                targets[oldPos].order = oldPos + 1;
                
                await db.saveTarget(targets[newPos]);
                await db.saveTarget(targets[oldPos]);
                
                renderTargetReorderList(container);
            });

            block.appendChild(nameSpan);
            block.appendChild(select);
            gridDiv.appendChild(block);
        });
    };

    const catModal = document.getElementById('settings-manage-cat-modal');
    const catContainer = document.getElementById('settings-cat-list-container');
    const catTitle = document.getElementById('settings-cat-modal-title');
    
    document.getElementById('btn-close-settings-cat')?.addEventListener('click', () => {
        catModal.classList.remove('show');
    });
    document.getElementById('btn-save-settings-cat')?.addEventListener('click', () => {
        catModal.classList.remove('show');
    });

    const catModalFooter = document.querySelector('#settings-manage-cat-modal .modal-footer');

    const openCatModal = (type) => {
        catModal.classList.add('show');
        const isExpense = type === 'expense';
        catTitle.textContent = isExpense ? window.t('ui.settings.categories.expenseTitle') : window.t('ui.settings.categories.incomeTitle');
        
        const cats = isExpense ? state.categories.expense : state.categories.income;
        catModalFooter.style.display = 'flex';
        renderCatList(catContainer, cats, type);
        
        const cbSelectAll = document.getElementById('cb-select-all-cats');
        if (cbSelectAll) {
            cbSelectAll.checked = false;
            // Delay execution to prevent browser from forcibly restoring form state
            setTimeout(() => { cbSelectAll.checked = false; }, 10);
        }
        if (window.updateCatBatchUI) window.updateCatBatchUI();
    };

    // Category Batch Delete Events
    const cbSelectAllCats = document.getElementById('cb-select-all-cats');
    if (cbSelectAllCats && !cbSelectAllCats.hasAttribute('data-bound')) {
        cbSelectAllCats.setAttribute('data-bound', 'true');
        cbSelectAllCats.addEventListener('change', (e) => {
            if (!catContainer) return;
            const isChecked = e.target.checked;
            const majorCheckboxes = catContainer.querySelectorAll('.cat-major-checkbox');
            majorCheckboxes.forEach(cb => {
                cb.checked = isChecked;
                // Manually trigger change event to sync minor category
                cb.dispatchEvent(new Event('change'));
            });
            if (window.updateCatBatchUI) window.updateCatBatchUI();
        });
    }

    const btnDeleteSelectedCats = document.getElementById('btn-delete-selected-cats');
    if (btnDeleteSelectedCats && !btnDeleteSelectedCats.hasAttribute('data-bound')) {
        btnDeleteSelectedCats.setAttribute('data-bound', 'true');
        btnDeleteSelectedCats.addEventListener('click', async () => {
            if (!catContainer) return;
            
            const isExpense = catTitle.dataset.type === 'expense';
            const type = isExpense ? 'expense' : 'income';
            let cats = isExpense ? state.categories.expense : state.categories.income;

            const selectedMajors = [...catContainer.querySelectorAll('.cat-major-checkbox:checked')];
            const selectedMinorsIndependent = [...catContainer.querySelectorAll('.cat-minor-checkbox:checked:not(:disabled)')];
            const allSelectedMinors = [...catContainer.querySelectorAll('.cat-minor-checkbox:checked')];

            if (selectedMajors.length === 0 && selectedMinorsIndependent.length === 0) return;

            const totalItems = selectedMajors.length + allSelectedMinors.length;
            let confirmMsg = window.t('ui.settings.categories.deleteBatchConfirm').replace('{majorCount}', selectedMajors.length).replace('{minorCount}', allSelectedMinors.length).replace('{total}', totalItems);
            
            if (selectedMajors.length === 0) {
                confirmMsg = window.t('ui.settings.categories.deleteBatchConfirmMinorOnly').replace('{count}', allSelectedMinors.length);
            } else if (allSelectedMinors.length === 0) {
                confirmMsg = window.t('ui.settings.categories.deleteBatchConfirmMajorOnly').replace('{count}', selectedMajors.length);
            }

            try {
                const txs = await db.getTransactions();
                const fixed = await db.getFixedRecords();
                let hasBound = false;
                let msgBound = window.t('ui.settings.categories.deleteBatchInUseMsg');
                let boundLines = [];

                for (const cb of selectedMinorsIndependent) {
                    const major = cb.getAttribute('data-major');
                    const subName = cb.getAttribute('data-sub');
                    const cat = cats.find(c => c.major === major);
                    if (cat) {
                        const boundTxs = txs.filter(t => t.type === type && t.majorCategory === major && t.subCategory === subName);
                        const boundFixed = fixed.filter(f => f.type === type && f.majorCategory === major && f.subCategory === subName);
                        if (boundTxs.length > 0 || boundFixed.length > 0) {
                            hasBound = true;
                            if (boundLines.length < 5) {
                                let details = [];
                                if (boundTxs.length > 0) {
                                    const d = [...new Set(boundTxs.map(t => t.date))].sort().reverse()[0];
                                    details.push(window.t('ui.settings.categories.deleteBatchInUseTxDetail').replace('{count}', boundTxs.length).replace('{date}', d));
                                }
                                if (boundFixed.length > 0) details.push(window.t('ui.settings.categories.deleteBatchInUseFixedDetail').replace('{count}', boundFixed.length));
                                boundLines.push(window.t('ui.settings.categories.deleteBatchInUseMinorItem').replace('{major}', major).replace('{sub}', subName).replace('{details}', details.join(', ')));
                            }
                        }
                    }
                }

                for (const cb of selectedMajors) {
                    const major = cb.getAttribute('data-major');
                    const boundTxs = txs.filter(t => t.type === type && t.majorCategory === major);
                    const boundFixed = fixed.filter(f => f.type === type && f.majorCategory === major);
                    if (boundTxs.length > 0 || boundFixed.length > 0) {
                        hasBound = true;
                        if (boundLines.length < 5) {
                            let details = [];
                            if (boundTxs.length > 0) {
                                const d = [...new Set(boundTxs.map(t => t.date))].sort().reverse()[0];
                                details.push(window.t('ui.settings.categories.deleteBatchInUseTxDetail').replace('{count}', boundTxs.length).replace('{date}', d));
                            }
                            if (boundFixed.length > 0) details.push(window.t('ui.settings.categories.deleteBatchInUseFixedDetail').replace('{count}', boundFixed.length));
                            boundLines.push(window.t('ui.settings.categories.deleteBatchInUseMajorItem').replace('{major}', major).replace('{details}', details.join(', ')));
                        }
                    }
                }

                if (hasBound) {
                    msgBound += boundLines.join('\n');
                    if (boundLines.length === 5) msgBound += window.t('ui.settings.categories.deleteBatchInUseMore');
                    msgBound += window.t('ui.settings.categories.deleteBatchInUseTail');
                    alert(msgBound);
                    return;
                }
            } catch (err) {
                console.error(window.t('logs.settings.checkCategoryBatchError'), err);
            }

            if (!confirm(confirmMsg)) return;

            // First delete selected independent minor categories
            for (const cb of selectedMinorsIndependent) {
                const major = cb.getAttribute('data-major');
                const subName = cb.getAttribute('data-sub');
                const cat = cats.find(c => c.major === major);
                if (cat) {
                    const currentIdx = cat.sub.indexOf(subName);
                    if (currentIdx !== -1) {
                        cat.sub.splice(currentIdx, 1);
                        await db.saveCategory(cat);
                    }
                }
            }

            // Then delete selected major categories
            for (const cb of selectedMajors) {
                const major = cb.getAttribute('data-major');
                const catIdx = cats.findIndex(c => c.major === major);
                if (catIdx !== -1) {
                    const cat = cats[catIdx];
                    await db.deleteCategory(cat.id);
                    cats.splice(catIdx, 1);
                }
            }

            // type can be inferred from context, but we are inside dom load, so type needs to be inferred
            // actually this is for delete button inside settings, so we can just re-render current state
            const currentType = catTitle.dataset.type || 'expense';
            renderCatList(catContainer, currentType === 'expense' ? state.categories.expense : state.categories.income, currentType);
            if (window.updateCatBatchUI) window.updateCatBatchUI();
        });
    }

    const btnExpense = document.getElementById('btn-open-settings-expense');
    const btnIncome = document.getElementById('btn-open-settings-income');
    
    if (btnExpense) btnExpense.addEventListener('click', () => openCatModal('expense'));
    if (btnIncome) btnIncome.addEventListener('click', () => openCatModal('income'));

    // Targets
    const targetContainer = document.getElementById('settings-target-list-container');
    const btnAddTarget = document.getElementById('btn-settings-add-target');

    const renderTargetList = () => {
        if (!targetContainer) return;
        targetContainer.innerHTML = '';
        
        const updateTargetBatchUI = () => {
            const checkboxes = targetContainer.querySelectorAll('.target-checkbox');
            let selectedCount = 0;
            checkboxes.forEach(cb => {
                if (cb.checked) selectedCount++;
            });

            const btnDeleteSelected = document.getElementById('btn-delete-selected-targets');
            const cbSelectAll = document.getElementById('cb-select-all-targets');

            if (btnDeleteSelected) {
                if (selectedCount > 0) {
                    btnDeleteSelected.style.display = 'block';
                    btnDeleteSelected.textContent = window.t('ui.settings.targets.deleteSelected').replace('{count}', selectedCount);
                } else {
                    btnDeleteSelected.style.display = 'none';
                }
            }
            if (cbSelectAll) {
                const labelElement = cbSelectAll.closest('label');
                if (checkboxes.length === 0) {
                    if (labelElement) labelElement.style.display = 'none';
                    cbSelectAll.checked = false;
                } else {
                    if (labelElement) labelElement.style.display = 'flex';
                    if (selectedCount === 0) {
                        cbSelectAll.checked = false;
                    } else {
                        cbSelectAll.checked = checkboxes.length > 0 && selectedCount === checkboxes.length;
                    }
                }
            }
        };

        window.updateTargetBatchUI = updateTargetBatchUI;

        if (!state.targets || state.targets.length === 0) {
            const emptyDiv = document.createElement('div');
            emptyDiv.style.textAlign = 'center';
            emptyDiv.style.padding = '2rem';
            emptyDiv.style.color = 'var(--text-color-secondary)';
            emptyDiv.textContent = window.t('ui.settings.targets.noData');
            targetContainer.appendChild(emptyDiv);
            updateTargetBatchUI();
            return;
        }

        state.targets.sort((a, b) => a.order - b.order).forEach((t, idx) => {
            const li = document.createElement('li');
            li.className = 'manage-list-item target-item';
            li.draggable = true;
            li.dataset.id = t.id;
            const leftDiv = document.createElement('div');
            leftDiv.style.display = 'flex';
            leftDiv.style.alignItems = 'center';
            leftDiv.style.gap = '8px';

            const cbTarget = document.createElement('input');
            cbTarget.type = 'checkbox';
            cbTarget.className = 'target-checkbox';
            cbTarget.value = t.id;
            cbTarget.style.cursor = 'pointer';

            const targetSelect = document.createElement('select');
            targetSelect.className = 'form-control';
            targetSelect.style.width = '45px';
            targetSelect.style.height = '24px';
            targetSelect.style.padding = '0 2px';
            targetSelect.style.fontSize = '12px';
            for (let i = 1; i <= state.targets.length; i++) {
                const opt = document.createElement('option');
                opt.value = i;
                opt.textContent = i;
                if (i === idx + 1) opt.selected = true;
                targetSelect.appendChild(opt);
            }
            targetSelect.addEventListener('change', async (e) => {
                const newPos = parseInt(e.target.value) - 1;
                const oldPos = idx;
                if (newPos === oldPos) return;
                
                const temp = state.targets[newPos];
                state.targets[newPos] = state.targets[oldPos];
                state.targets[oldPos] = temp;
                
                state.targets.forEach((target, index) => {
                    target.order = index + 1;
                    db.saveTarget(target);
                });
                
                renderTargetList();
            });

            const nameSpan = document.createElement('span');
            nameSpan.style.pointerEvents = 'none';
            nameSpan.textContent = t.name;

            leftDiv.appendChild(cbTarget);
            leftDiv.appendChild(targetSelect);
            leftDiv.appendChild(nameSpan);

            const rightDiv = document.createElement('div');
            rightDiv.style.display = 'flex';
            rightDiv.innerHTML = `
                <button class="edit-btn" data-id="${t.id}" data-name="${t.name}" style="margin-right:4px; border:none; background:none; cursor:pointer;">
                    <span class="material-icons">edit</span>
                </button>
                <button class="delete-btn" data-id="${t.id}">
                    <span class="material-icons">close</span>
                </button>
            `;

            li.appendChild(leftDiv);
            li.appendChild(rightDiv);
            targetContainer.appendChild(li);
        });

        targetContainer.querySelectorAll('.target-checkbox').forEach(cb => {
            cb.addEventListener('change', updateTargetBatchUI);
        });

        targetContainer.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const targetId = parseInt(btn.getAttribute('data-id'));
                const target = state.targets.find(t => t.id === targetId);
                
                if (target) {
                    try {
                        const txs = await db.getTransactions();
                        const fixed = await db.getFixedRecords();
                        
                        const boundTxs = txs.filter(t => t.payee === target.name);
                        const boundFixed = fixed.filter(f => f.payee === target.name);
                        
                        if (boundTxs.length > 0 || boundFixed.length > 0) {
                            let msg = window.t('ui.settings.targets.deleteInUseMsg');
                            
                            if (boundTxs.length > 0) {
                                const dates = [...new Set(boundTxs.map(t => t.date))].sort().reverse();
                                const displayDates = dates.slice(0, 5).join(', ');
                                const moreStr = dates.length > 5 ? (window.t('ui.settings.categories.moreDays', { count: dates.length }) || ` and ${dates.length} more days`) : '';
                                msg += window.t('ui.settings.targets.deleteInUseTx').replace('{count}', boundTxs.length).replace('{dates}', displayDates).replace('{more}', moreStr);
                            }
                            
                            if (boundFixed.length > 0) {
                                const names = boundFixed.map(f => f.note || (window.t('ui.record.noNote') || 'No Note')).slice(0, 3).join(', ');
                                const moreStr = boundFixed.length > 3 ? (window.t('ui.settings.categories.etc') || ' etc.') : '';
                                msg += window.t('ui.settings.targets.deleteInUseFixed').replace('{count}', boundFixed.length).replace('{names}', names).replace('{more}', moreStr);
                            }
                            
                            msg += window.t('ui.settings.targets.deleteInUseTail');
                            alert(msg);
                            return;
                        }
                    } catch (err) {
                        console.error(window.t('logs.settings.checkTargetError'), err);
                    }
                    
                    if (!confirm(window.t('ui.settings.targets.deleteConfirm'))) return;

                    await db.deleteTarget(target.id);
                    const currentIdx = state.targets.findIndex(t => t.id === targetId);
                    if (currentIdx > -1) state.targets.splice(currentIdx, 1);
                    renderTargetList();
                }
            });
        });

        targetContainer.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const targetId = parseInt(btn.getAttribute('data-id'));
                const oldName = btn.getAttribute('data-name');
                
                const li = btn.closest('li');
                const nameSpan = li.querySelector('span:not(.material-icons)');
                const actionContainer = btn.parentElement;

                if (li.querySelector('.inline-edit-input')) return;

                nameSpan.style.display = 'none';
                actionContainer.style.display = 'none';

                const input = document.createElement('input');
                input.type = 'text';
                input.className = 'form-control inline-edit-input';
                input.value = oldName;
                input.style.width = '130px';
                input.style.height = '28px';
                input.style.padding = '0 8px';
                input.style.fontSize = '14px';
                input.style.margin = '0';
                
                const cancelBtn = document.createElement('button');
                cancelBtn.className = 'icon-btn';
                cancelBtn.innerHTML = '<span class="material-icons" style="font-size: 16px; color: #94a3b8;">close</span>';
                cancelBtn.title = window.t('ui.settings.categories.cancel');
                cancelBtn.onmousedown = (ev) => {
                    ev.preventDefault(); 
                    cancelEdit();
                };

                const editContainer = document.createElement('div');
                editContainer.style.display = 'flex';
                editContainer.style.alignItems = 'center';
                editContainer.style.gap = '4px';
                editContainer.appendChild(input);
                editContainer.appendChild(cancelBtn);

                nameSpan.parentNode.insertBefore(editContainer, nameSpan.nextSibling);
                input.focus();

                let isSaving = false;

                const cancelEdit = () => {
                    editContainer.remove();
                    nameSpan.style.display = '';
                    actionContainer.style.display = 'flex';
                };

                const saveEdit = async () => {
                    if (isSaving) return;
                    const newName = input.value.trim();
                    if (!newName || newName === oldName) {
                        cancelEdit();
                        return;
                    }
                    
                    // Fool-proofing: check if target name already exists
                    if (state.targets.some(t => t.name === newName)) {
                        alert(window.t('ui.settings.targets.duplicateAlert').replace('{name}', newName));
                        return;
                    }
                    
                    isSaving = true;
                    input.disabled = true;

                    const success = await cascadeUpdate('payee', oldName, newName);
                    if (success) {
                        const target = state.targets.find(t => t.id === targetId);
                        if (target) {
                            target.name = newName;
                            await db.saveTarget(target);
                        }
                        renderTargetList();
                    } else {
                        cancelEdit();
                    }
                };

                input.addEventListener('keydown', (ev) => {
                    if (ev.key === 'Enter') saveEdit();
                    else if (ev.key === 'Escape') cancelEdit();
                });
                input.addEventListener('blur', saveEdit);
            });
        });

        setupDragAndDrop(targetContainer, '.target-item', async () => {
            const items = [...targetContainer.querySelectorAll('.target-item')];
            items.forEach((item, index) => {
                const id = parseInt(item.dataset.id);
                const target = state.targets.find(t => t.id === id);
                if (target) {
                    target.order = index + 1;
                    db.saveTarget(target);
                }
            });
            state.targets.sort((a, b) => (a.order || 0) - (b.order || 0));

        });
    };

    if (targetContainer) {
        renderTargetList();
    }

    if (btnAddTarget) {
        btnAddTarget.addEventListener('click', async () => {
            const newName = prompt(window.t('ui.settings.targets.promptNewTarget'));
            if (newName && newName.trim()) {
                const trimmedName = newName.trim();
                
                // Fool-proofing: check if target name already exists
                if (state.targets.some(t => t.name === trimmedName)) {
                    alert(window.t('ui.settings.targets.duplicateAlert').replace('{name}', trimmedName));
                    return;
                }
                
                const newTarget = { 
                    name: trimmedName, 
                    order: state.targets.length + 1,
                    tgtId: 'custom_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5)
                };
                const id = await db.saveTarget(newTarget);
                newTarget.id = id;
                state.targets.push(newTarget);
                renderTargetList();
            }
        });
    }

    const targetModal = document.getElementById('settings-manage-target-modal');
    const btnOpenTarget = document.getElementById('btn-open-settings-target');
    const targetModalFooter = document.querySelector('#settings-manage-target-modal .modal-footer');
    
    document.getElementById('btn-close-settings-target')?.addEventListener('click', () => {
        targetModal.classList.remove('show');
    });
    document.getElementById('btn-save-settings-target')?.addEventListener('click', () => {
        targetModal.classList.remove('show');
    });

    if (btnOpenTarget && targetModal) {
        btnOpenTarget.addEventListener('click', () => {
            targetModal.classList.add('show');
            targetModalFooter.style.display = 'flex';
            if (btnAddTarget) btnAddTarget.style.display = 'block';
            renderTargetList();

            const cbSelectAll = document.getElementById('cb-select-all-targets');
            if (cbSelectAll) {
                cbSelectAll.checked = false;
                setTimeout(() => { cbSelectAll.checked = false; }, 10);
            }
            if (window.updateTargetBatchUI) window.updateTargetBatchUI();
        });
    }

    // Target Batch Delete Events
    const cbSelectAllTargets = document.getElementById('cb-select-all-targets');
    if (cbSelectAllTargets && !cbSelectAllTargets.hasAttribute('data-bound')) {
        cbSelectAllTargets.setAttribute('data-bound', 'true');
        cbSelectAllTargets.addEventListener('change', (e) => {
            if (!targetContainer) return;
            const checkboxes = targetContainer.querySelectorAll('.target-checkbox');
            checkboxes.forEach(cb => cb.checked = e.target.checked);
            if (window.updateTargetBatchUI) window.updateTargetBatchUI();
        });
    }

    const btnDeleteSelectedTargets = document.getElementById('btn-delete-selected-targets');
    if (btnDeleteSelectedTargets && !btnDeleteSelectedTargets.hasAttribute('data-bound')) {
        btnDeleteSelectedTargets.setAttribute('data-bound', 'true');
        btnDeleteSelectedTargets.addEventListener('click', async () => {
            if (!targetContainer) return;
            const selectedCbs = [...targetContainer.querySelectorAll('.target-checkbox:checked')];
            if (selectedCbs.length === 0) return;

            try {
                const txs = await db.getTransactions();
                const fixed = await db.getFixedRecords();
                let hasBound = false;
                let msgBound = window.t('ui.settings.targets.deleteBatchInUseMsg');
                let boundLines = [];

                for (const cb of selectedCbs) {
                    const id = parseInt(cb.value);
                    const target = state.targets.find(t => t.id === id);
                    if (target) {
                        const boundTxs = txs.filter(t => t.payee === target.name);
                        const boundFixed = fixed.filter(f => f.payee === target.name);
                        
                        if (boundTxs.length > 0 || boundFixed.length > 0) {
                            hasBound = true;
                            if (boundLines.length < 5) {
                                let details = [];
                                if (boundTxs.length > 0) {
                                    const d = [...new Set(boundTxs.map(t => t.date))].sort().reverse()[0];
                                    details.push(window.t('ui.settings.categories.deleteBatchInUseTxDetail').replace('{count}', boundTxs.length).replace('{date}', d));
                                }
                                if (boundFixed.length > 0) details.push(window.t('ui.settings.categories.deleteBatchInUseFixedDetail').replace('{count}', boundFixed.length));
                                boundLines.push(window.t('ui.settings.targets.deleteBatchInUseItem').replace('{name}', target.name).replace('{details}', details.join(', ')));
                            }
                        }
                    }
                }

                if (hasBound) {
                    msgBound += boundLines.join('\n');
                    if (boundLines.length === 5) msgBound += window.t('ui.settings.targets.deleteBatchInUseMore');
                    msgBound += window.t('ui.settings.targets.deleteBatchInUseTail');
                    alert(msgBound);
                    return;
                }
            } catch (err) {
                console.error(window.t('logs.settings.checkTargetBatchError'), err);
            }

            if (!confirm(window.t('ui.settings.targets.deleteBatchConfirm').replace('{count}', selectedCbs.length))) return;

            for (const cb of selectedCbs) {
                const id = parseInt(cb.value);
                const idx = state.targets.findIndex(t => t.id === id);
                if (idx !== -1) {
                    await db.deleteTarget(id);
                    state.targets.splice(idx, 1);
                }
            }
            renderTargetList();
            if (window.updateTargetBatchUI) window.updateTargetBatchUI();
        });
    }

    // License Expand Events
    const btnOpenLicense = document.getElementById('btn-open-license');
    const licenseContent = document.getElementById('license-content');
    const iconLicenseExpand = document.getElementById('icon-license-arrow');
    
    if (btnOpenLicense && licenseContent && iconLicenseExpand) {
        btnOpenLicense.addEventListener('click', () => {
            const isHidden = licenseContent.classList.contains('hidden');
            if (isHidden) {
                licenseContent.classList.remove('hidden');
                iconLicenseExpand.style.transform = 'rotate(90deg)';
            } else {
                licenseContent.classList.add('hidden');
                iconLicenseExpand.style.transform = 'rotate(0deg)';
            }
        });
    }
}
