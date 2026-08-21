import { setAppBusy } from '../../utils/js/uiBlocker.js';
import { fetchAndPersistHolidays, getHolidayLastUpdated } from '../../utils/js/lunarCalendar.js';
import { generateFixedTransactions, getTxFingerprint, getFixedFingerprint } from '../utils.js';
import { GasBackupModule } from '../../utils/js/gasBackupModule.js';
import { GoogleApiModule } from '../../utils/js/googleApiModule.js';
import { mountDangerZone } from '../../utils/js/dangerZone.js';
import { DataMerger } from '../../utils/js/dataMerger.js';
import { showConfirmModal } from '../../utils/js/uiDialogs.js';

// 取得完整的偏好設定 (含預設值)，確保未主動儲存的設定也能正確備份
function getCompletePreferences() {
    const defaultCalSettings = {
        lunarDate: true, lunarStembranch: true, lunarSolarterm: true, 
        lunarFestival: true, nationalHoliday: true, baziChart: true, calendarValentine: false
    };
    const savedCal = JSON.parse(localStorage.getItem('tinyledger_calendar_settings')) || {};
    
    const defaultGasSettings = {
        backupOverwrite: false, backupVersions: 5, cloudRestoreMode: 'merge', autoSyncDelay: 5, privateGasUrl: ''
    };
    const savedGas = JSON.parse(localStorage.getItem('tinyledger_gas_settings')) || {};

    return {
        theme: localStorage.getItem('tinyledger-theme') || 'light',
        budget: localStorage.getItem('tinyledger_monthly_budget') || '25000',
        calendar: JSON.stringify({ ...defaultCalSettings, ...savedCal }),
        gmapsKey: localStorage.getItem('tinyledger_gmaps_api_key') || '',
        gasSettings: JSON.stringify({ ...defaultGasSettings, ...savedGas }),
        mapLink: localStorage.getItem('tinyledger_list_map_link') || 'false',
        importantFestivalsEnabled: localStorage.getItem('tinyledger_important_festivals_enabled') || 'false',
        importantFestivals: localStorage.getItem('tinyledger_important_festivals') || '[]'
    };
}

export function setupSettings(state, db, renderApp) {
    const btnExport = document.getElementById('btn-export-json');
    const inputImport = document.getElementById('input-import-json');
    
    // Update input to accept JSON
    if (inputImport) {
        inputImport.accept = ".json";
    }

    // Setup Theme Switcher UI
    const btnThemeLight = document.getElementById('btn-theme-light');
    const btnThemeDark = document.getElementById('btn-theme-dark');

    if (btnThemeLight && btnThemeDark && window.themeSwitcher) {
        const currentTheme = window.themeSwitcher.getPreference();
        
        const updateThemeUI = (theme) => {
            if (theme === 'dark' || (theme === 'auto' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                btnThemeDark.classList.replace('btn-outline', 'btn-primary');
                btnThemeLight.classList.replace('btn-primary', 'btn-outline');
            } else {
                btnThemeLight.classList.replace('btn-outline', 'btn-primary');
                btnThemeDark.classList.replace('btn-primary', 'btn-outline');
            }
        };

        updateThemeUI(currentTheme);

        btnThemeLight.addEventListener('click', () => {
            window.themeSwitcher.setTheme('light');
            updateThemeUI('light');
        });

        btnThemeDark.addEventListener('click', () => {
            window.themeSwitcher.setTheme('dark');
            updateThemeUI('dark');
        });
    }

    // Setup Budget Setting
    const budgetInput = document.getElementById('settings-budget');
    if (budgetInput) {
        const currentBudget = localStorage.getItem('tinyledger_monthly_budget');
        if (currentBudget) {
            budgetInput.value = currentBudget;
        } else {
            budgetInput.value = 25000;
        }
        
        budgetInput.addEventListener('change', (e) => {
            const val = parseInt(e.target.value, 10);
            if (!isNaN(val) && val >= 0) {
                localStorage.setItem('tinyledger_monthly_budget', val);
                if (typeof renderApp === 'function') {
                    renderApp(); // This calls renderSummary() in app.js
                }
            }
        });
    }

    // Setup Calendar Settings
    const defaultCalSettings = {
        lunarDate: true,
        lunarStembranch: true,
        lunarSolarterm: true,
        lunarFestival: true,
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
        { id: 'toggle-national-holiday', key: 'nationalHoliday' },
        { id: 'toggle-bazi-chart', key: 'baziChart' },
        { id: 'toggle-calendar-valentine', key: 'calendarValentine' }
    ];

    calToggles.forEach(t => {
        const el = document.getElementById(t.id);
        if (el) {
            el.checked = savedCalSettings[t.key] === true;
            el.addEventListener('change', (e) => {
                savedCalSettings[t.key] = e.target.checked;
                localStorage.setItem('tinyledger_calendar_settings', JSON.stringify(savedCalSettings));
                window.dispatchEvent(new CustomEvent('calendarSettingsChanged'));
            });
        }
    });

    // 重要節日提醒設定
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

                const monthOptions = Array.from({length: 12}, (_, i) => {
                    const val = i + 1;
                    return `<option value="${val}" ${m === val ? 'selected' : ''}>${val}月</option>`;
                }).join('');

                const dayOptions = Array.from({length: 31}, (_, i) => {
                    const val = i + 1;
                    return `<option value="${val}" ${d === val ? 'selected' : ''}>${val}日</option>`;
                }).join('');

                item.innerHTML = `
                    <button class="btn-close" style="position: absolute; right: 4px; top: 4px; font-size: 16px; width: 24px; height: 24px; display: flex; justify-content: center; align-items: center;" data-index="${index}">&times;</button>
                    <div style="display: flex; gap: 8px; padding-right: 24px;">
                        <div style="display: flex; gap: 4px; flex: 1.2; align-items: center; min-width: 0;">
                            <select class="form-control festival-month" style="padding: 4px; width: 100%; min-width: 0; appearance: none; -webkit-appearance: none;">
                                <option value="" disabled ${m === '' ? 'selected' : ''}>月</option>
                                ${monthOptions}
                            </select>
                            <span>/</span>
                            <select class="form-control festival-day" style="padding: 4px; width: 100%; min-width: 0; appearance: none; -webkit-appearance: none;">
                                <option value="" disabled ${d === '' ? 'selected' : ''}>日</option>
                                ${dayOptions}
                            </select>
                        </div>
                        <input type="text" class="form-control festival-name" placeholder="節日名稱 (如: 紀念日)" value="${f.name || ''}" style="flex: 2; min-width: 0;">
                    </div>
                    <div style="display: flex; gap: 8px; align-items: center;">
                        <span style="font-size: 0.75rem; color: var(--text-muted); white-space: nowrap;">提醒(天前):</span>
                        <input type="number" class="form-control festival-r1" min="0" placeholder="天數1" value="${f.reminders[0] ?? ''}" style="flex: 1; padding: 4px; min-width: 0;">
                        <input type="number" class="form-control festival-r2" min="0" placeholder="天數2" value="${f.reminders[1] ?? ''}" style="flex: 1; padding: 4px; min-width: 0;">
                        <input type="number" class="form-control festival-r3" min="0" placeholder="天數3" value="${f.reminders[2] ?? ''}" style="flex: 1; padding: 4px; min-width: 0;">
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
                    saveFestivals();
                };

                // 輸入框或選單改變即自動儲存
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

    // 清單地點連結地圖設定
    const toggleListMapLink = document.getElementById('toggle-list-map-link');
    if (toggleListMapLink) {
        // 預設為關閉 (false)
        const isEnabled = localStorage.getItem('tinyledger_list_map_link') === 'true';
        toggleListMapLink.checked = isEnabled;
        toggleListMapLink.addEventListener('change', (e) => {
            localStorage.setItem('tinyledger_list_map_link', e.target.checked ? 'true' : 'false');
            if (renderApp) renderApp();
        });
    }

    const btnUpdateHolidays = document.getElementById('btn-update-holidays');
    const labelHolidayUpdated = document.getElementById('label-holiday-updated');
    // Setup API Key Help Modal and Input (舊版已移除，改用 GoogleApiModule)
    if (!window.googleApiModuleInstance) {
        window.googleApiModuleInstance = new GoogleApiModule({
            containerId: 'google-api-module-container',
            storageKey: 'tinyledger_gmaps_api_key', // 沿用舊版 key 以相容既有設定
            apiName: 'Google Maps API',
            requiredApis: ['Maps JavaScript API', 'Places API', 'Places API (New)']
        });
    }

    // 顯示上次更新時間
    if (labelHolidayUpdated) {
        const lastUpdated = getHolidayLastUpdated();
        labelHolidayUpdated.textContent = lastUpdated ? `上次更新：${lastUpdated}` : '上次更新：無';
    }

    if (btnUpdateHolidays) {
        btnUpdateHolidays.addEventListener('click', async () => {
            btnUpdateHolidays.disabled = true;
            btnUpdateHolidays.textContent = '下載中...';

            try {
                const currentYear = new Date().getFullYear();
                const years = [currentYear, currentYear + 1];
                const result = await fetchAndPersistHolidays(years);

                if (result.success) {
                    if (labelHolidayUpdated) {
                        labelHolidayUpdated.textContent = `上次更新：${getHolidayLastUpdated()}`;
                    }
                    alert(`✅ 國定假日更新完成！\n已下載 ${years.join('、')} 年度共 ${result.count} 筆假日資料。`);
                    // 通知萬年曆重新渲染
                    window.dispatchEvent(new CustomEvent('calendarSettingsChanged'));
                } else {
                    alert(`❌ 下載失敗：${result.error || '未知錯誤'}`);
                }
            } catch (e) {
                alert(`❌ 下載失敗：${e.message}`);
            } finally {
                btnUpdateHolidays.disabled = false;
                btnUpdateHolidays.textContent = '更新國定假日';
            }
        });
    }

    // 初始化專屬私有雲端備份模組 (GasBackupModule)
    const gasContainer = document.getElementById('gas-backup-module');
    if (gasContainer) {
        // 從 LocalStorage 載入現有 GAS 設定
        const gasSettings = JSON.parse(localStorage.getItem('tinyledger_gas_settings')) || {};
        window.gasBackupInstance = new GasBackupModule({
            appName: 'TinyLedger',
            containerId: 'gas-backup-module',
            settingsObj: gasSettings,
            setAppBusy: setAppBusy,
            onSaveSettings: () => {
                localStorage.setItem('tinyledger_gas_settings', JSON.stringify(gasSettings));
            },
            getCleanPayload: async () => {
                // 收集 IndexedDB 中的所有資料
                const txs = (await db.getTransactions())
                    .filter(t => !t.isFixed)
                    .map(t => { const { id, ...rest } = t; return rest; });
                const rawFixed = await db.getFixedRecords();
                
                const cats = (await db.getCategories()).map(c => { const { id, ...rest } = c; return rest; });
                const tgts = (await db.getTargets()).map(t => { const { id, ...rest } = t; return rest; });

                // 收集 LocalStorage 設定 (包含預設值)
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
                return `✅ 備份匯出成功！\n共匯出 ${txCount} 筆一般紀錄、${fixedCount} 筆固定紀錄\n包含 ${catCount} 個大類與 ${tgtCount} 個對象設定`;
            },
            generateRestoreConfirmMessage: async (backupData) => {
                const gasSettings = JSON.parse(localStorage.getItem('tinyledger_gas_settings')) || {};
                const mode = gasSettings.cloudRestoreMode || 'merge';

                const existingTxs = await db.getTransactions();
                const existingFixed = await db.getFixedRecords();
                const isLocalDbEmpty = existingTxs.length === 0 && existingFixed.length === 0;

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
                    if (backupData.transactions && Array.isArray(backupData.transactions)) {
                        const txFingerprints = new Set(existingTxs.map(getTxFingerprint));
                        const importedTxs = backupData.transactions;
                        importedTxs.forEach(tx => { if (typeof tx.amount === 'string') tx.amount = Number(tx.amount); });
                        const txAnalysis = DataMerger.analyze(importedTxs, existingTxs, getTxFingerprint, txFingerprints);
                        txCount = txAnalysis.pendingItems.length;
                        txSkipCount = txAnalysis.skipCount;
                    }
            
                    if (backupData.fixedRecords && Array.isArray(backupData.fixedRecords)) {
                        const fixedFingerprints = new Set(existingFixed.map(getFixedFingerprint));
                        const fixedAnalysis = DataMerger.analyze(backupData.fixedRecords, existingFixed, getFixedFingerprint, fixedFingerprints);
                        fixedCount = fixedAnalysis.pendingItems.length;
                        fixedSkipCount = fixedAnalysis.skipCount;
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
                    warnMsg = '【資料還原】\n確定要將這份雲端資料還原至本機嗎？';
                } else if (mode === 'overwrite') {
                    warnMsg = '【覆蓋模式警告】\n確定要使用這份資料完全覆蓋本機所有紀錄嗎？\n(本機現有的紀錄將被全數刪除！)';
                } else {
                    warnMsg = '【合併模式】\n確定要將這份資料合併至本機嗎？\n(會保留本機紀錄，並自動跳過重複項目)';
                }

                let totalTx = txCount + txSkipCount;
                let totalFixed = fixedCount + fixedSkipCount;
                let totalCat = catCount + catSkipCount;
                let totalTgt = tgtCount + tgtSkipCount;

                let msg = `此備份共包含：\n- 一般紀錄：${totalTx} 筆\n- 固定紀錄：${totalFixed} 筆\n- 類別設定：${totalCat} 個\n- 對象設定：${totalTgt} 個\n`;
                if (txSkipCount > 0 || fixedSkipCount > 0 || catSkipCount > 0 || tgtSkipCount > 0) {
                    msg += `\n(已自動過濾重複)\n`;
                    if (txSkipCount > 0) msg += `- 一般紀錄：${txSkipCount} 筆\n`;
                    if (fixedSkipCount > 0) msg += `- 固定紀錄：${fixedSkipCount} 筆\n`;
                    if (catSkipCount > 0) msg += `- 類別設定：${catSkipCount} 個\n`;
                    if (tgtSkipCount > 0) msg += `- 對象設定：${tgtSkipCount} 個\n`;
                }
                msg += `\n${warnMsg}`;
                return msg;
            },
            onRestoreSuccess: async (payload) => {
                window._disableGasAutoSync = true;
                try {
                    const gasSettings = JSON.parse(localStorage.getItem('tinyledger_gas_settings')) || {};
                    const mode = gasSettings.cloudRestoreMode || 'merge';

                    if (mode === 'overwrite') {
                        // 【覆蓋模式】：先清空本機資料
                        await db.clearTransactions();
                        await db.clearFixedRecords();
                        await db.clearCategories();
                        await db.clearTargets();
                    }

                    // 1. 還原 LocalStorage 設定
                    if (payload.preferences) {
                        if (payload.preferences.theme) localStorage.setItem('tinyledger-theme', payload.preferences.theme);
                        if (payload.preferences.budget) localStorage.setItem('tinyledger_monthly_budget', payload.preferences.budget);
                        if (payload.preferences.calendar) localStorage.setItem('tinyledger_calendar_settings', payload.preferences.calendar);
                        if (payload.preferences.gmapsKey) localStorage.setItem('tinyledger_gmaps_api_key', payload.preferences.gmapsKey);
                        if (payload.preferences.mapLink) localStorage.setItem('tinyledger_list_map_link', payload.preferences.mapLink);
                        if (payload.preferences.importantFestivalsEnabled !== undefined) localStorage.setItem('tinyledger_important_festivals_enabled', payload.preferences.importantFestivalsEnabled);
                        if (payload.preferences.importantFestivals !== undefined) localStorage.setItem('tinyledger_important_festivals', payload.preferences.importantFestivals);
                    }

                    // 2. 還原 IndexedDB 資料庫 (合併邏輯)
                    let importedData = payload;
                    // 將 recurringRules 轉換為 fixedRecords (相容舊格式)
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

                    // 2.5 準備現有資料以進行合併去重
                    const existingCategories = await db.getCategories();
                    const existingTargets = await db.getTargets();

                    // 合併類別與對象 (若不存在才新增或合併子類別)
                    if (importedData.categories && Array.isArray(importedData.categories)) {
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
                                }
                            } else {
                                delete cat.id;
                                await db.saveCategory(cat);
                                existingCategories.push(cat); // 避免同一次匯入中發生重複
                            }
                        }
                    }
                    if (importedData.targets && Array.isArray(importedData.targets)) {
                        const existingTargetNames = new Set(existingTargets.map(t => t.name));
                        for (const tg of importedData.targets) {
                            if (!existingTargetNames.has(tg.name)) {
                                existingTargetNames.add(tg.name);
                                delete tg.id;
                                await db.saveTarget(tg);
                            }
                        }
                    }

                    // 3. 過濾重複紀錄的邏輯
                    let txCount = 0, txSkipCount = 0, fixedCount = 0, fixedSkipCount = 0;
                    const existingTxs = await db.getTransactions();
                    const existingFixed = await db.getFixedRecords();
                    
                    const txFingerprints = new Set(existingTxs.map(getTxFingerprint));
                    const fixedFingerprints = new Set(existingFixed.map(getFixedFingerprint));

                    // (1) Analyze Fixed Records
                    const fixedAnalysis = DataMerger.analyze(importedData.fixedRecords, existingFixed, getFixedFingerprint, fixedFingerprints);
                    fixedCount = fixedAnalysis.pendingItems.length;
                    fixedSkipCount = fixedAnalysis.skipCount;
                    
                    // Execute Fixed Records
                    const savedFixed = await DataMerger.execute(fixedAnalysis.pendingItems, db.saveFixedRecord);

                    // (2) Generate Txs from saved Fixed Records
                    const generatedTxs = savedFixed.flatMap(fr => generateFixedTransactions(fr));
                    const genTxAnalysis = DataMerger.analyze(generatedTxs, existingTxs, getTxFingerprint, txFingerprints);
                    await DataMerger.execute(genTxAnalysis.pendingItems, db.saveTransaction);

                    // (3) Analyze & Execute Imported Txs
                    if (importedData.transactions) {
                        for (const tx of importedData.transactions) {
                            if (typeof tx.amount === 'string') tx.amount = Number(tx.amount);
                        }
                    }
                    const txAnalysis = DataMerger.analyze(importedData.transactions, existingTxs, getTxFingerprint, txFingerprints);
                    txCount = txAnalysis.pendingItems.length;
                    txSkipCount = txAnalysis.skipCount;
                    await DataMerger.execute(txAnalysis.pendingItems, db.saveTransaction);

                    // 解除鎖定，避免觸發瀏覽器的 beforeunload 警告
                    if (typeof setAppBusy === 'function') setAppBusy(false);
                    
                    let adds = [`一般紀錄 ${txCount} 筆`, `固定紀錄 ${fixedCount} 筆`];
                    if (catCount > 0) adds.push(`類別設定 ${catCount} 個`);
                    if (tgtCount > 0) adds.push(`對象設定 ${tgtCount} 個`);
                    
                    let finalMsg = '';
                    const wasEmpty = existingTxs.length === 0 && existingFixed.length === 0;
                    if (wasEmpty) {
                        finalMsg = `✅ 雲端還原完成！\n\n【新增】\n${adds.join('、')}\n\n系統即將重新載入...`;
                    } else if (mode === 'overwrite') {
                        finalMsg = `✅ 雲端還原完成 (覆蓋模式)！\n\n【新增】\n${adds.join('、')}\n\n系統即將重新載入...`;
                    } else {
                        finalMsg = `✅ 雲端還原完成 (合併模式)！\n\n【新增】\n${adds.join('、')}`;
                        if (txSkipCount > 0 || fixedSkipCount > 0 || catSkipCount > 0 || tgtSkipCount > 0) {
                            finalMsg += `\n\n(自動略過重複)\n`;
                            if (txSkipCount > 0) finalMsg += `- 一般紀錄：${txSkipCount} 筆\n`;
                            if (fixedSkipCount > 0) finalMsg += `- 固定紀錄：${fixedSkipCount} 筆\n`;
                            if (catSkipCount > 0) finalMsg += `- 類別設定：${catSkipCount} 個\n`;
                            if (tgtSkipCount > 0) finalMsg += `- 對象設定：${tgtSkipCount} 個`;
                        }
                        finalMsg += `\n\n系統即將重新載入...`;
                    }

                    if (typeof setAppBusy === 'function') {
                        setAppBusy(false, { success: true, message: finalMsg });
                    }
                    setTimeout(() => window.location.reload(), 2500);
                } catch (e) {
                    throw new Error('還原過程中發生錯誤：' + e.message);
                } finally {
                    window._disableGasAutoSync = false;
                }
            },
            customDescriptionHtml: `
                <span class="font-medium text-emerald-600">✅ 完整備份：</span>您的所有記帳紀錄、固定紀錄、類別設定、萬年曆偏好設定。<br>
                <span class="text-slate-400 text-[10px]">(*從私有雲端還原時，將會完全覆蓋目前的本地資料)</span>
            `
        });
    }

    if (btnExport && !btnExport.hasAttribute('data-bound')) {
        btnExport.setAttribute('data-bound', 'true');
        btnExport.addEventListener('click', async () => {
            setAppBusy(true, { title: '正在匯出資料', detail: '準備下載 JSON 備份檔...' });
            try {
                // 匯出時排除由固定紀錄自動產生的明細
                const txs = (await db.getTransactions())
                    .filter(t => !t.isFixed)
                    .map(t => { const { id, ...rest } = t; return rest; });
                
                const rawFixed = await db.getFixedRecords();
                
                const cats = (await db.getCategories()).map(c => { const { id, ...rest } = c; return rest; });
                const tgts = (await db.getTargets()).map(t => { const { id, ...rest } = t; return rest; });
                
                // 收集 LocalStorage 設定 (包含預設值)
                const localPrefs = getCompletePreferences();

                const savedGas = JSON.parse(localStorage.getItem('tinyledger_gas_settings')) || {};
                
                const appData = {
                    config: {
                        appName: 'TinyLedger',
                        overwrite: savedGas.backupOverwrite !== false,
                        versions: savedGas.backupVersions || 5
                    },
                    data: {
                        transactions: txs,
                        fixedRecords: rawFixed,
                        categories: cats,
                        targets: tgts,
                        preferences: localPrefs
                    }
                };
                
                const blob = new Blob([JSON.stringify(appData, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `TinyLedger_Backup_${new Date().toISOString().split('T')[0]}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                
                const exportMsg = `✅ 備份匯出成功！\n共匯出 ${txs.length} 筆一般紀錄、${rawFixed.length} 筆固定紀錄\n包含 ${cats.length} 個大類與 ${tgts.length} 個對象設定`;
                setAppBusy(false, { success: true, message: exportMsg });
            } catch (e) {
                setAppBusy(false, { error: true, message: '匯出失敗：' + e.message });
            }
        });
    }
    
    if (inputImport && !inputImport.hasAttribute('data-bound')) {
        inputImport.setAttribute('data-bound', 'true');
        inputImport.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            window._disableGasAutoSync = true;
            setAppBusy(true, { title: '正在匯入資料', detail: '解析備份檔中...' });
            
            const reader = new FileReader();
            reader.onload = async (evt) => {
                try {
                    const content = evt.target.result;
                    let importedData;
                    try {
                        importedData = JSON.parse(content);
                    } catch (err) {
                        throw new Error("無法解析 JSON，檔案格式錯誤");
                    }
                    
                    // 嚴格要求備份檔必須包含標準的 config 與 data 外殼 (因為舊版相容已全數拔除)
                    if (!importedData || !importedData.data) {
                        throw new Error("不支援的舊版備份格式，請使用最新版本的備份檔");
                    }
                    
                    // 雲端與地端新版外殼拆解完成，直接使用內部資料
                    importedData = importedData.data;

                    // 1. 還原系統設定 (Preferences)
                    if (importedData.preferences) {
                        if (importedData.preferences.theme) localStorage.setItem('tinyledger-theme', importedData.preferences.theme);
                        if (importedData.preferences.budget) localStorage.setItem('tinyledger_monthly_budget', importedData.preferences.budget);
                        if (importedData.preferences.calendar) localStorage.setItem('tinyledger_calendar_settings', importedData.preferences.calendar);
                        if (importedData.preferences.gmapsKey) localStorage.setItem('tinyledger_gmaps_api_key', importedData.preferences.gmapsKey);
                        if (importedData.preferences.mapLink) localStorage.setItem('tinyledger_list_map_link', importedData.preferences.mapLink);
                        if (importedData.preferences.importantFestivalsEnabled !== undefined) localStorage.setItem('tinyledger_important_festivals_enabled', importedData.preferences.importantFestivalsEnabled);
                        if (importedData.preferences.importantFestivals !== undefined) localStorage.setItem('tinyledger_important_festivals', importedData.preferences.importantFestivals);
                        
                        // 【本機 JSON 還原】：解析 gasSettings 檢查網址是否不同，不同則詢問覆蓋
                        if (importedData.preferences.gasSettings) {
                            const newGasStr = importedData.preferences.gasSettings;
                            const oldGasStr = localStorage.getItem('tinyledger_gas_settings');
                            
                            if (newGasStr && oldGasStr && newGasStr !== oldGasStr) {
                                try {
                                    const parsedNew = JSON.parse(newGasStr);
                                    const parsedOld = JSON.parse(oldGasStr);
                                    
                                    if (parsedNew.privateGasUrl && parsedOld.privateGasUrl && parsedNew.privateGasUrl !== parsedOld.privateGasUrl) {
                                        const msg = `⚠️ 發現備份檔中的「專屬備份 GAS 網址」與本機不同！\n\n[備份] ${parsedNew.privateGasUrl}\n[本機] ${parsedOld.privateGasUrl}\n\n是否要使用備份的網址「覆蓋」本機網址？\n\n(按「確定」覆蓋，按「取消」保留本機網址)`;
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
                        
                        // 觸發重新套用主題的事件
                        window.dispatchEvent(new Event('storage'));
                    }

                    let txCount = 0;
                    let txSkipCount = 0;
                    let fixedCount = 0;
                    let fixedSkipCount = 0;
                    
                    const newTxs = [];
                    
                    const existingTxs = await db.getTransactions();
                    const existingFixed = await db.getFixedRecords();
                    
                    const txFingerprints = new Set(existingTxs.map(getTxFingerprint));
                    const fixedFingerprints = new Set(existingFixed.map(getFixedFingerprint));
                    
                    // 1. Analyze Fixed Records
                    const fixedAnalysis = DataMerger.analyze(importedData.fixedRecords, existingFixed, getFixedFingerprint, fixedFingerprints);
                    const pendingFixed = fixedAnalysis.pendingItems;
                    fixedCount = pendingFixed.length;
                    fixedSkipCount = fixedAnalysis.skipCount;
                    
                    // 2. Analyze Imported Txs
                    if (importedData.transactions) {
                        for (const tx of importedData.transactions) {
                            if (typeof tx.amount === 'string') tx.amount = Number(tx.amount);
                        }
                    }
                    const txAnalysis = DataMerger.analyze(importedData.transactions, existingTxs, getTxFingerprint, txFingerprints);
                    const pendingTxs = txAnalysis.pendingItems;
                    txCount = pendingTxs.length;
                    txSkipCount = txAnalysis.skipCount;

                    let catCount = 0;
                    let catSkipCount = 0;
                    let tgtCount = 0;
                    let tgtSkipCount = 0;

                    if (importedData.targets && Array.isArray(importedData.targets)) {
                        const existingTargetNames = new Set(state.targets.map(t => t.name));
                        importedData.targets.forEach(tg => {
                            if (!existingTargetNames.has(tg.name)) tgtCount++;
                            else tgtSkipCount++;
                        });
                    }

                    if (importedData.categories && Array.isArray(importedData.categories)) {
                        importedData.categories.forEach(cat => {
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

                    // 顯示預覽確認視窗
                    setAppBusy(false);
                    let totalTx = txCount + txSkipCount;
                    let totalFixed = fixedCount + fixedSkipCount;
                    let totalCat = catCount + catSkipCount;
                    let totalTgt = tgtCount + tgtSkipCount;

                    let confirmMsg = `此備份共包含：\n- 一般紀錄：${totalTx} 筆\n- 固定紀錄：${totalFixed} 筆\n- 類別設定：${totalCat} 個\n- 對象設定：${totalTgt} 個\n`;
                    if (txSkipCount > 0 || fixedSkipCount > 0 || catSkipCount > 0 || tgtSkipCount > 0) {
                        confirmMsg += `\n(已自動過濾重複)\n`;
                        if (txSkipCount > 0) confirmMsg += `- 一般紀錄：${txSkipCount} 筆\n`;
                        if (fixedSkipCount > 0) confirmMsg += `- 固定紀錄：${fixedSkipCount} 筆\n`;
                        if (catSkipCount > 0) confirmMsg += `- 類別設定：${catSkipCount} 個\n`;
                        if (tgtSkipCount > 0) confirmMsg += `- 對象設定：${tgtSkipCount} 個\n`;
                    }
                    
                    const isConfirmed = await showConfirmModal({
                        title: '備份檔解析完成',
                        message: confirmMsg,
                        confirmText: '開始匯入',
                        cancelText: '取消',
                        icon: '📂'
                    });
                    
                    if (!isConfirmed) {
                        inputImport.value = ''; // reset
                        return;
                    }
                    setAppBusy(true, { title: '地端還原中', detail: '正在將資料寫入資料庫...', progress: 80 });
                    
                    // 執行實際的資料庫寫入
                    const savedFixed = await DataMerger.execute(pendingFixed, db.saveFixedRecord);
                    
                    // 從新寫入的固定紀錄中產生明細並寫入
                    const generatedTxs = savedFixed.flatMap(fr => generateFixedTransactions(fr));
                    const genTxAnalysis = DataMerger.analyze(generatedTxs, existingTxs, getTxFingerprint, txFingerprints);
                    await DataMerger.execute(genTxAnalysis.pendingItems, db.saveTransaction);

                    // 寫入一般紀錄
                    const savedTxs = await DataMerger.execute(pendingTxs, db.saveTransaction);
                    newTxs.push(...savedTxs);


                    
                    // Import Targets directly from backup if available
                    if (importedData.targets && Array.isArray(importedData.targets)) {
                        const existingTargetNames = new Set(state.targets.map(t => t.name));
                        for (const tg of importedData.targets) {
                            if (!existingTargetNames.has(tg.name)) {
                                existingTargetNames.add(tg.name);
                                delete tg.id;
                                const newTarget = { ...tg, order: tg.order !== undefined ? tg.order : state.targets.length + 1 };
                                const id = await db.saveTarget(newTarget);
                                newTarget.id = id;
                                state.targets.push(newTarget);
                            }
                        }
                    }

                    // Import Categories directly from backup if available
                    if (importedData.categories && Array.isArray(importedData.categories)) {
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
                        }
                    }

                    // Add Categories automatically from transactions to ensure no orphans
                    const uniqueTargets = new Set(state.targets.map(t => t.name));
                    
                    // 效率優化：只針對「非重複」的新紀錄進行大小類與對象的提取
                    if (newTxs.length > 0) {
                        for (const tx of newTxs) {
                            // Extract Target (payee)
                            if (tx.payee && !uniqueTargets.has(tx.payee)) {
                                uniqueTargets.add(tx.payee);
                                const newTarget = { name: tx.payee, order: state.targets.length + 1 };
                                const id = await db.saveTarget(newTarget);
                                newTarget.id = id;
                                state.targets.push(newTarget);
                            }
                            
                            // Extract Category
                            const typeCats = tx.type === 'expense' ? state.categories.expense : state.categories.income;
                            let majorCat = typeCats.find(c => c.major === tx.majorCategory);
                            if (!majorCat) {
                                majorCat = { type: tx.type, major: tx.majorCategory, sub: [] };
                                typeCats.push(majorCat);
                            }
                            if (tx.subCategory && !majorCat.sub.includes(tx.subCategory)) {
                                majorCat.sub.push(tx.subCategory);
                            }
                            // Save category to DB
                            const catId = await db.saveCategory(majorCat);
                            if (!majorCat.id) majorCat.id = catId;
                        }
                    }
                    
                    // Refresh app state and UI
                    state.transactions = await db.getTransactions();
                    state.fixedRecords = await db.getFixedRecords();
                    if (typeof renderApp === 'function') renderApp();
                    
                    let adds = [`一般紀錄 ${txCount} 筆`, `固定紀錄 ${fixedCount} 筆`];
                    if (catCount > 0) adds.push(`類別 ${catCount} 個`);
                    if (tgtCount > 0) adds.push(`對象 ${tgtCount} 個`);
                    
                    let msg = `✅ 匯入完成！\n\n【新增】\n${adds.join('、')}`;
                    if (txSkipCount > 0 || fixedSkipCount > 0 || catSkipCount > 0 || tgtSkipCount > 0) {
                        msg += `\n\n(自動略過重複)\n`;
                        if (txSkipCount > 0) msg += `- 一般紀錄：${txSkipCount} 筆\n`;
                        if (fixedSkipCount > 0) msg += `- 固定紀錄：${fixedSkipCount} 筆\n`;
                        if (catSkipCount > 0) msg += `- 類別設定：${catSkipCount} 個\n`;
                        if (tgtSkipCount > 0) msg += `- 對象設定：${tgtSkipCount} 個`;
                    }
                    
                    setAppBusy(false, { success: true, message: msg });
                } catch (error) {
                    setAppBusy(false, { error: true, message: '匯入失敗：' + error.message });
                } finally {
                    inputImport.value = ''; // reset
                    window._disableGasAutoSync = false;
                }
            };
            reader.readAsText(file);
        });
    }

    // 初始化危險區域 (Danger Zone) - 採用共用模組
    mountDangerZone({
        containerId: 'danger-zone-module',
        dbName: 'TinyLedgerDB',
        description: '清空本機的所有記帳紀錄、固定紀錄與類別設定。如果您想重新開始，或清除異常資料，可點擊下方按鈕。(此操作無法復原)',
        preClear: () => db.closeConnection()
    });

    // =========================================================
    // Category & Target Management logic (Moved from manageModals.js)
    // =========================================================
    const cascadeUpdate = async (field, oldValue, newValue) => {
        const isConfirmed = await showConfirmModal({
            title: '連動更新確認',
            message: `這個動作會將所有使用「${oldValue}」的歷史紀錄\n一併修改為「${newValue}」，確定要繼續嗎？`,
            confirmText: '確定修改',
            cancelText: '取消',
            icon: '🔄',
            isDanger: true // 大規模修改歷史紀錄，使用危險樣式提醒
        });

        if (!isConfirmed) {
            return false;
        }

        let isUpdated = false;
        // Update Transactions
        const txs = await db.getTransactions();
        for (const tx of txs) {
            if (tx[field] === oldValue) {
                tx[field] = newValue;
                await db.saveTransaction(tx);
                isUpdated = true;
            }
        }

        // Update Fixed Records
        const fixed = await db.getFixedRecords();
        for (const fx of fixed) {
            if (fx[field] === oldValue) {
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

        const appendAddMajorBtn = () => {
            const btnAddMajor = document.createElement('button');
            btnAddMajor.className = 'btn btn-outline';
            btnAddMajor.style.width = '100%';
            btnAddMajor.style.marginTop = '12px';
            btnAddMajor.innerHTML = `<span class="material-icons" style="font-size:18px; vertical-align:middle; margin-right:4px;">add</span>新增${type === 'expense' ? '支出大類' : '收入大類'}`;
            btnAddMajor.onclick = async () => {
                const newMajor = prompt('輸入新大類名稱:');
                if (newMajor) {
                    const newCat = { type: type, major: newMajor, sub: [], order: cats.length + 1 };
                    const id = await db.saveCategory(newCat);
                    newCat.id = id;
                    cats.push(newCat);
                    renderCatList(container, cats, type);
                }
            };
            container.appendChild(btnAddMajor);
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
                    btnDeleteSelected.textContent = `🗑️ 刪除所選 (${domCheckedCount})`;
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
            emptyDiv.textContent = '沒有資料，請新增';
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
            block.style.marginBottom = '1rem';
            block.style.background = 'var(--bg-color)'; 
            block.style.padding = '0.5rem';
            block.style.borderRadius = '8px';
            block.style.cursor = 'grab';
            
            const ul = document.createElement('ul');
            ul.className = 'manage-list minor-cat-list';
            ul.dataset.major = c.major;
            
            const liMajor = document.createElement('li');
            liMajor.className = 'manage-list-item major-cat-item';
            liMajor.innerHTML = `
                <div style="display:flex; align-items:center; gap: 8px;">
                    <input type="checkbox" class="cat-checkbox cat-major-checkbox" data-major="${c.major}" value="${c.major}" style="cursor:pointer;">
                    <span style="pointer-events: none; font-weight: bold;">${c.major}</span>
                </div>
                <div style="display:flex;">
                    <button class="edit-btn edit-major-btn" data-major="${c.major}" style="margin-right:4px; border:none; background:none; cursor:pointer;">
                        <span class="material-icons" style="font-size: 16px;">edit</span>
                    </button>
                    <button class="delete-btn delete-major-btn" data-major="${c.major}">
                        <span class="material-icons" style="font-size: 16px;">close</span>
                    </button>
                </div>
            `;
            ul.appendChild(liMajor);
            
            c.sub.forEach((sub, idx) => {
                const li = document.createElement('li');
                li.className = 'manage-list-item minor-cat-item';
                li.draggable = true;
                li.dataset.sub = sub;
                li.innerHTML = `
                    <div style="display:flex; align-items:center; gap: 8px;">
                        <input type="checkbox" class="cat-checkbox cat-minor-checkbox" data-major="${c.major}" data-subidx="${idx}" style="cursor:pointer;">
                        <span style="pointer-events: none;">${sub}</span>
                    </div>
                    <div style="display:flex; align-items:center; gap:4px;">
                        <button class="icon-btn edit-btn" data-major="${c.major}" data-subidx="${idx}" data-sub="${sub}" title="編輯小類">
                            <span class="material-icons">edit</span>
                        </button>
                        <button class="icon-btn delete-btn" data-major="${c.major}" data-subidx="${idx}" title="刪除小類">
                            <span class="material-icons">close</span>
                        </button>
                    </div>
                `;
                ul.appendChild(li);
            });

            const btnAdd = document.createElement('button');
            btnAdd.className = 'btn btn-outline';
            btnAdd.style.width = '100%';
            btnAdd.style.marginTop = '8px';
            btnAdd.innerHTML = '<span class="material-icons" style="font-size:18px; vertical-align:middle; margin-right:4px;">add</span>新增小類';
            btnAdd.onclick = () => {
                const newSub = prompt('輸入新的小類名稱:');
                if (newSub) {
                    c.sub.push(newSub);
                    db.saveCategory(c).then(() => renderCatList(container, cats, type));
                }
            };

            block.appendChild(ul);
            block.appendChild(btnAdd);
            container.appendChild(block);
        });

        appendAddMajorBtn();

        // 處理大類選取連動小類的邏輯
        const majorCheckboxes = container.querySelectorAll('.cat-major-checkbox');
        majorCheckboxes.forEach(majorCb => {
            majorCb.addEventListener('change', (e) => {
                const major = e.target.dataset.major;
                const minorCheckboxes = container.querySelectorAll(`.cat-minor-checkbox[data-major="${major}"]`);
                minorCheckboxes.forEach(minorCb => {
                    if (e.target.checked) {
                        minorCb.checked = true;
                        minorCb.disabled = true; // 強制選取無法取消
                    } else {
                        minorCb.checked = false;
                        minorCb.disabled = false; // 恢復可選狀態
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
                if (!confirm('確定要刪除這筆類別嗎？此動作無法復原。')) return;
                
                const major = btn.getAttribute('data-major');
                const idx = btn.getAttribute('data-subidx');
                const cat = cats.find(c => c.major === major);
                if (cat) {
                    if (idx === null || idx === undefined) {
                        await db.deleteCategory(cat.id);
                        // Also remove from state to reflect locally
                        const stateIdx = cats.findIndex(c => c.major === major);
                        if(stateIdx > -1) cats.splice(stateIdx, 1);
                    } else {
                        cat.sub.splice(idx, 1);
                        await db.saveCategory(cat);
                    }
                    renderCatList(container, cats, type);
                }
            });
        });

        // Add edit handlers
        container.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const major = btn.getAttribute('data-major');
                const idx = btn.getAttribute('data-subidx');
                const sub = btn.getAttribute('data-sub');
                const isMajor = (idx === null || idx === undefined || idx === 'null');
                const originalName = isMajor ? major : sub;

                const li = btn.closest('li');
                const nameSpan = li.querySelector('span:not(.material-icons)');
                const actionContainer = btn.parentElement;

                if (li.querySelector('.inline-edit-input')) return;

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
                cancelBtn.title = "取消編輯";
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
                        const success = await cascadeUpdate('majorCategory', major, newName);
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
                        const success = await cascadeUpdate('subCategory', sub, newName);
                        if (success) {
                            const cat = cats.find(c => c.major === major);
                            if (cat) {
                                cat.sub[idx] = newName;
                                await db.saveCategory(cat);
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
                    
                    // 動態更新 DOM 的索引綁定，避免操作到錯誤的項目
                    items.forEach((item, newIdx) => {
                        const cb = item.querySelector('.cat-minor-checkbox');
                        const editBtn = item.querySelector('.edit-btn');
                        const delBtn = item.querySelector('.delete-btn');
                        if (cb) cb.setAttribute('data-subidx', newIdx);
                        if (editBtn) editBtn.setAttribute('data-subidx', newIdx);
                        if (delBtn) delBtn.setAttribute('data-subidx', newIdx);
                    });

                    await db.saveCategory(cat);
                }
            });
        });
    };

    const renderMajorReorderList = (container, cats) => {
        container.innerHTML = '';
        const title = document.createElement('h3');
        title.style.marginBottom = '12px';
        title.style.fontSize = '0.9rem';
        title.style.color = 'var(--text-color-secondary)';
        title.textContent = '請選擇排序號碼 (數字越小越優先)';
        container.appendChild(title);

        if (!cats || cats.length === 0) {
            const emptyDiv = document.createElement('div');
            emptyDiv.style.textAlign = 'center';
            emptyDiv.style.padding = '2rem';
            emptyDiv.style.color = 'var(--text-color-secondary)';
            emptyDiv.textContent = '沒有資料';
            container.appendChild(emptyDiv);
            return;
        }

        const gridDiv = document.createElement('div');
        gridDiv.style.display = 'grid';
        gridDiv.style.gridTemplateColumns = 'repeat(auto-fill, minmax(180px, 1fr))';
        gridDiv.style.gap = '8px';
        container.appendChild(gridDiv);

        cats.forEach((c, idx) => {
            const block = document.createElement('div');
            block.style.display = 'flex';
            block.style.alignItems = 'center';
            block.style.justifyContent = 'space-between';
            block.style.padding = '12px';
            block.style.background = 'var(--bg-color)';
            block.style.borderRadius = '8px';

            const nameSpan = document.createElement('span');
            nameSpan.textContent = c.major;
            nameSpan.style.fontWeight = 'bold';
            
            const select = document.createElement('select');
            select.className = 'form-control';
            select.style.width = '70px';
            for (let i = 1; i <= cats.length; i++) {
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
                
                const temp = cats[newPos];
                cats[newPos] = cats[oldPos];
                cats[oldPos] = temp;
                
                cats[newPos].order = newPos + 1;
                cats[oldPos].order = oldPos + 1;
                
                await db.saveCategory(cats[newPos]);
                await db.saveCategory(cats[oldPos]);
                
                renderMajorReorderList(container, cats);
            });

            block.appendChild(nameSpan);
            block.appendChild(select);
            gridDiv.appendChild(block);
        });
    };

    const renderMinorReorderGroupList = (container, cats) => {
        container.innerHTML = '';
        const title = document.createElement('h3');
        title.style.marginBottom = '12px';
        title.style.fontSize = '0.9rem';
        title.style.color = 'var(--text-color-secondary)';
        title.textContent = '請選擇要調整小類的大類';
        container.appendChild(title);

        const gridDiv = document.createElement('div');
        gridDiv.style.display = 'grid';
        gridDiv.style.gridTemplateColumns = 'repeat(auto-fill, minmax(180px, 1fr))';
        gridDiv.style.gap = '8px';
        container.appendChild(gridDiv);

        cats.forEach((c) => {
            const block = document.createElement('div');
            block.className = 'manage-list-item hover-card';
            block.style.padding = '12px';
            block.style.cursor = 'pointer';
            block.style.display = 'flex';
            block.style.justifyContent = 'space-between';
            
            const nameSpan = document.createElement('span');
            nameSpan.textContent = c.major;
            nameSpan.style.fontWeight = 'bold';
            
            const countSpan = document.createElement('span');
            countSpan.textContent = `(${c.sub.length})`;
            countSpan.style.color = 'var(--text-muted)';
            countSpan.style.fontSize = '0.9rem';

            block.appendChild(nameSpan);
            block.appendChild(countSpan);
            
            block.addEventListener('click', () => {
                renderMinorReorderList(container, c, cats);
            });

            gridDiv.appendChild(block);
        });
    };

    const renderMinorReorderList = (container, cat, allCats) => {
        container.innerHTML = '';
        
        const title = document.createElement('h3');
        title.textContent = `排序「${cat.major}」的小類`;
        title.style.marginBottom = '12px';
        title.style.fontSize = '0.9rem';
        title.style.color = 'var(--text-color-secondary)';
        container.appendChild(title);

        const btnBack = document.getElementById('btn-back-settings-cat');
        if (btnBack) {
            btnBack.style.display = 'block';
            btnBack.onclick = () => {
                btnBack.style.display = 'none';
                renderMinorReorderGroupList(container, allCats);
            };
        }

        if (cat.sub.length === 0) {
            const emptyDiv = document.createElement('div');
            emptyDiv.style.textAlign = 'center';
            emptyDiv.style.padding = '2rem';
            emptyDiv.style.color = 'var(--text-color-secondary)';
            emptyDiv.textContent = '沒有小類資料';
            container.appendChild(emptyDiv);
            return;
        }

        const gridDiv = document.createElement('div');
        gridDiv.style.display = 'grid';
        gridDiv.style.gridTemplateColumns = 'repeat(auto-fill, minmax(180px, 1fr))';
        gridDiv.style.gap = '8px';
        container.appendChild(gridDiv);

        cat.sub.forEach((subName, idx) => {
            const block = document.createElement('div');
            block.style.display = 'flex';
            block.style.alignItems = 'center';
            block.style.justifyContent = 'space-between';
            block.style.padding = '12px';
            block.style.background = 'var(--bg-color)';
            block.style.borderRadius = '8px';

            const nameSpan = document.createElement('span');
            nameSpan.textContent = subName;
            nameSpan.style.fontWeight = 'bold';
            
            const select = document.createElement('select');
            select.className = 'form-control';
            select.style.width = '70px';
            for (let i = 1; i <= cat.sub.length; i++) {
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
                
                const temp = cat.sub[newPos];
                cat.sub[newPos] = cat.sub[oldPos];
                cat.sub[oldPos] = temp;
                
                await db.saveCategory(cat);
                
                renderMinorReorderList(container, cat, allCats);
            });

            block.appendChild(nameSpan);
            block.appendChild(select);
            gridDiv.appendChild(block);
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
        title.textContent = '請選擇排序號碼 (數字越小越優先)';
        container.appendChild(title);

        if (!targets || targets.length === 0) {
            const emptyDiv = document.createElement('div');
            emptyDiv.style.textAlign = 'center';
            emptyDiv.style.padding = '2rem';
            emptyDiv.style.color = 'var(--text-color-secondary)';
            emptyDiv.textContent = '沒有資料';
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

    const btnModeCatManage = document.getElementById('btn-mode-cat-manage');
    const btnModeCatReorderMajor = document.getElementById('btn-mode-cat-reorder-major');
    const btnModeCatReorderMinor = document.getElementById('btn-mode-cat-reorder-minor');
    const catModalFooter = document.querySelector('#settings-manage-cat-modal .modal-footer');

    const openCatModal = (type) => {
        catModal.classList.add('show');
        const isExpense = type === 'expense';
        catTitle.textContent = isExpense ? '支出類別管理' : '收入類別管理';
        
        const renderCurrentCats = () => {
            const cats = isExpense ? state.categories.expense : state.categories.income;
            renderCatList(catContainer, cats, type);
        };
        
        const updateMode = (mode) => {
            const btnBack = document.getElementById('btn-back-settings-cat');
            if (btnBack) btnBack.style.display = 'none';
            
            btnModeCatManage.classList.toggle('btn-primary', mode === 'manage');
            btnModeCatManage.classList.toggle('btn-outline', mode !== 'manage');
            btnModeCatReorderMajor.classList.toggle('btn-primary', mode === 'reorder-major');
            btnModeCatReorderMajor.classList.toggle('btn-outline', mode !== 'reorder-major');
            btnModeCatReorderMinor.classList.toggle('btn-primary', mode === 'reorder-minor');
            btnModeCatReorderMinor.classList.toggle('btn-outline', mode !== 'reorder-minor');
            
            if (mode === 'manage') {
                catModalFooter.style.display = 'flex';
                renderCurrentCats();
            } else if (mode === 'reorder-major') {
                catModalFooter.style.display = 'none';
                renderMajorReorderList(catContainer, isExpense ? state.categories.expense : state.categories.income);
            } else if (mode === 'reorder-minor') {
                catModalFooter.style.display = 'none';
                renderMinorReorderGroupList(catContainer, isExpense ? state.categories.expense : state.categories.income);
            }
        };

        btnModeCatManage.onclick = () => updateMode('manage');
        btnModeCatReorderMajor.onclick = () => updateMode('reorder-major');
        btnModeCatReorderMinor.onclick = () => updateMode('reorder-minor');
        
        updateMode('manage');
        
        const cbSelectAll = document.getElementById('cb-select-all-cats');
        if (cbSelectAll) {
            cbSelectAll.checked = false;
            // 延遲執行以防瀏覽器強行還原表單狀態
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
                // 手動觸發 change 事件以連動小類
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
            
            const isExpense = catTitle.textContent.includes('支出');
            const type = isExpense ? 'expense' : 'income';
            let cats = isExpense ? state.categories.expense : state.categories.income;

            const selectedMajors = [...catContainer.querySelectorAll('.cat-major-checkbox:checked')];
            const selectedMinorsIndependent = [...catContainer.querySelectorAll('.cat-minor-checkbox:checked:not(:disabled)')];
            const allSelectedMinors = [...catContainer.querySelectorAll('.cat-minor-checkbox:checked')];

            if (selectedMajors.length === 0 && selectedMinorsIndependent.length === 0) return;

            const totalItems = selectedMajors.length + allSelectedMinors.length;
            let msg = `確定要刪除這 ${selectedMajors.length} 個大類、${allSelectedMinors.length} 個小類，共計 ${totalItems} 個項目嗎？\n(注意：刪除大類會一併刪除其下的所有小類)`;
            
            if (selectedMajors.length === 0) {
                msg = `確定要刪除這 ${allSelectedMinors.length} 個小類項目嗎？`;
            } else if (allSelectedMinors.length === 0) {
                msg = `確定要刪除這 ${selectedMajors.length} 個大類項目嗎？\n(注意：刪除大類會一併刪除其下的所有小類)`;
            }

            if (!confirm(msg)) return;

            // 先刪除被選中的單獨小類
            for (const cb of selectedMinorsIndependent) {
                const major = cb.getAttribute('data-major');
                const idx = parseInt(cb.getAttribute('data-subidx'));
                const cat = cats.find(c => c.major === major);
                if (cat) {
                    cat.sub.splice(idx, 1);
                    await db.saveCategory(cat);
                }
            }

            // 再刪除被選中的大類
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
            const currentType = catTitle.textContent.includes('支出') ? 'expense' : 'income';
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
                    btnDeleteSelected.textContent = `🗑️ 刪除所選 (${selectedCount})`;
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
            emptyDiv.textContent = '沒有資料，請新增';
            targetContainer.appendChild(emptyDiv);
            updateTargetBatchUI();
            return;
        }

        state.targets.sort((a, b) => a.order - b.order).forEach((t, idx) => {
            const li = document.createElement('li');
            li.className = 'manage-list-item target-item';
            li.draggable = true;
            li.dataset.id = t.id;
            li.innerHTML = `
                <div style="display:flex; align-items:center; gap: 8px;">
                    <input type="checkbox" class="target-checkbox" value="${t.id}" style="cursor:pointer;">
                    <span style="pointer-events: none;">${t.name}</span>
                </div>
                <div style="display:flex;">
                    <button class="edit-btn" data-idx="${idx}" data-name="${t.name}" style="margin-right:4px; border:none; background:none; cursor:pointer;">
                        <span class="material-icons">edit</span>
                    </button>
                    <button class="delete-btn" data-idx="${idx}">
                        <span class="material-icons">close</span>
                    </button>
                </div>
            `;
            targetContainer.appendChild(li);
        });

        targetContainer.querySelectorAll('.target-checkbox').forEach(cb => {
            cb.addEventListener('change', updateTargetBatchUI);
        });

        targetContainer.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                if (!confirm('確定要刪除這個對象嗎？此動作無法復原。')) return;

                const idx = btn.getAttribute('data-idx');
                const target = state.targets[idx];
                await db.deleteTarget(target.id);
                state.targets.splice(idx, 1);
                renderTargetList();
            });
        });

        targetContainer.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const idx = btn.getAttribute('data-idx');
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
                cancelBtn.title = "取消編輯";
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
                    isSaving = true;
                    input.disabled = true;

                    const success = await cascadeUpdate('payee', oldName, newName);
                    if (success) {
                        const target = state.targets[idx];
                        target.name = newName;
                        await db.saveTarget(target);
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
            
            // 動態更新 DOM 的索引綁定，避免操作到錯誤的項目
            items.forEach((item, newIdx) => {
                const editBtn = item.querySelector('.edit-btn');
                const delBtn = item.querySelector('.delete-btn');
                if (editBtn) editBtn.setAttribute('data-idx', newIdx);
                if (delBtn) delBtn.setAttribute('data-idx', newIdx);
            });
        });
    };

    if (targetContainer) {
        renderTargetList();
    }

    if (btnAddTarget) {
        btnAddTarget.addEventListener('click', async () => {
            const newName = prompt('輸入新對象名稱:');
            if (newName) {
                const newTarget = { name: newName, order: state.targets.length + 1 };
                const id = await db.saveTarget(newTarget);
                newTarget.id = id;
                state.targets.push(newTarget);
                renderTargetList();
            }
        });
    }

    const targetModal = document.getElementById('settings-manage-target-modal');
    const btnOpenTarget = document.getElementById('btn-open-settings-target');
    const btnModeTargetManage = document.getElementById('btn-mode-target-manage');
    const btnModeTargetReorder = document.getElementById('btn-mode-target-reorder');
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
            
            const updateMode = (mode) => {
                btnModeTargetManage.classList.toggle('btn-primary', mode === 'manage');
                btnModeTargetManage.classList.toggle('btn-outline', mode !== 'manage');
                btnModeTargetReorder.classList.toggle('btn-primary', mode === 'reorder');
                btnModeTargetReorder.classList.toggle('btn-outline', mode !== 'reorder');
                
                if (mode === 'manage') {
                    targetModalFooter.style.display = 'flex';
                    if (btnAddTarget) btnAddTarget.style.display = 'block';
                    renderTargetList();
                } else if (mode === 'reorder') {
                    targetModalFooter.style.display = 'none';
                    if (btnAddTarget) btnAddTarget.style.display = 'none';
                    renderTargetReorderList(targetContainer);
                }
            };

            btnModeTargetManage.onclick = () => updateMode('manage');
            btnModeTargetReorder.onclick = () => updateMode('reorder');
            
            updateMode('manage');

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

            if (!confirm(`確定要刪除這 ${selectedCbs.length} 個對象嗎？此動作無法復原。`)) return;

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
}
