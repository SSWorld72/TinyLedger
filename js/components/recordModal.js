import { state } from '../state.js';
import { db } from '../db.js';
import { generateFixedTransactions } from '../utils.js';
import { gregorianToLunar } from '../../utils/js/lunarCalendar.js';

let renderRecordList, renderSummary;

export const initRecordModal = (callbacks = {}) => {
    renderRecordList = callbacks.renderRecordList;
    renderSummary = callbacks.renderSummary;
    const modal = document.getElementById('add-record-modal');
    const btnOpen = document.getElementById('btn-add-record');
    const btnClose = document.getElementById('btn-close-record-modal');
    const btnCancel = document.getElementById('btn-cancel-record');
    const btnSave = document.getElementById('btn-save-record');
    const btnDeleteRecord = document.getElementById('btn-delete-record');
    const btnCopyRecord = document.getElementById('btn-copy-record');

    const modeBtns = document.querySelectorAll('.modal-tab-btn[data-mode]');
    const typeBtns = document.querySelectorAll('.modal-tab-btn[data-type]');
    const ruleBtns = document.querySelectorAll('.modal-tab-btn[data-rule]');

    const dateGroupSingle = document.getElementById('date-group-single');
    const dateGroupsFixed = document.querySelectorAll('.date-group-fixed');
    
    const inputDate = document.getElementById('input-date-single');
    const selectMajorCat = document.getElementById('select-major-cat');
    const selectSubCat = document.getElementById('select-sub-cat');
    const selectTarget = document.getElementById('select-target');
    const inputPhoto = document.getElementById('input-photo');
    const photoPreview = document.getElementById('photo-preview');
    const photoPlaceholder = document.getElementById('photo-placeholder');
    const photoPreviewContainer = document.getElementById('photo-preview-container');
    const btnDeletePhoto = document.getElementById('btn-delete-photo');
    const photoCanvas = document.getElementById('photo-canvas');
    const lunarDisplay = document.getElementById('lunar-display');
    
    // Crop elements
    const cropModal = document.getElementById('crop-modal');
    const cropImageTarget = document.getElementById('crop-image-target');
    const btnCloseCropModal = document.getElementById('btn-close-crop-modal');
    const btnCancelCrop = document.getElementById('btn-cancel-crop');
    const btnConfirmCrop = document.getElementById('btn-confirm-crop');
    let cropperInstance = null;
    
    let currentMode = 'single'; 
    let currentType = 'expense';
    let currentRule = 'yearly';
    let photoBase64 = '';
    let editingId = null;
    let editingIsFixed = false;
    let closeTimeoutId = null;

    const resetRecordForm = () => {
        if (photoPreviewContainer) {
            photoPreviewContainer.style.display = 'none';
        }
        photoPreview.style.display = 'block'; // 確保 img 本身不被隱藏，改由 container 控制
        photoPreview.src = '';
        const isPhotoUploadEnabled = localStorage.getItem('tinyledger_photo_upload_enabled') !== 'false';
        if (photoPlaceholder) {
            photoPlaceholder.style.display = (!isReadOnlyMode && isPhotoUploadEnabled) ? 'flex' : 'none';
        }
        photoBase64 = '';
        inputPhoto.value = '';
        editingId = null;
        editingIsFixed = false;
        delete modal.dataset.editingId;
        delete modal.dataset.editingIsFixed;
        isReadOnlyMode = false;
        btnSave.textContent = '新增';
        btnSave.style.display = 'block';

        // 重新啟用所有表單控制項
        const formControls = document.querySelectorAll('#add-record-modal input, #add-record-modal select, #add-record-modal textarea');
        formControls.forEach(ctrl => ctrl.disabled = false);
        const typeButtons = document.querySelectorAll('#add-record-modal .modal-tab-btn');
        typeButtons.forEach(btn => btn.style.pointerEvents = 'auto');
        const photoBox = document.querySelector('.photo-upload-box');
        if (photoBox) photoBox.style.pointerEvents = 'auto';
        
        const btnCancel = document.getElementById('btn-cancel-record');
        if (btnCancel) btnCancel.textContent = '取消';
        
        // Reset inputs
        document.getElementById('input-amount').value = '';
        const inputLoc = document.getElementById('input-location');
        if (inputLoc) {
            inputLoc.value = '';
            const btnClearLoc = document.getElementById('btn-clear-location');
            if (btnClearLoc) btnClearLoc.style.display = 'none';
        }
        document.getElementById('input-note').value = '';
        document.getElementById('input-date-start').value = '';
        document.getElementById('input-date-end').value = '';
    };

    // Rule Details
    const selectMonth = document.getElementById('select-rule-month');
    const selectDayYearly = document.getElementById('select-rule-day-yearly');
    const selectDayMonthly = document.getElementById('select-rule-day-monthly');
    const selectWeekday = document.getElementById('select-rule-weekday');

    // UI Updates
    const updateModeUI = () => {
        const modeBtn = document.querySelector('.modal-tab-btn[data-mode].active');
        if (!modeBtn) return;
        const mode = modeBtn.getAttribute('data-mode');
        currentMode = mode;

        if (mode === 'single') {
            if (dateGroupSingle) dateGroupSingle.style.display = 'block';
            dateGroupsFixed.forEach(el => el.style.display = 'none');
        } else {
            if (dateGroupSingle) dateGroupSingle.style.display = 'none';
            dateGroupsFixed.forEach(el => {
                el.style.display = el.classList.contains('form-row') ? 'flex' : 'block';
            });
        }
    };
    for (let i = 1; i <= 12; i++) {
        selectMonth.insertAdjacentHTML('beforeend', `<option value="${i}">${i}月</option>`);
    }
    for (let i = 1; i <= 31; i++) {
        const opt = `<option value="${i}">${i}日</option>`;
        selectDayYearly.insertAdjacentHTML('beforeend', opt);
        selectDayMonthly.insertAdjacentHTML('beforeend', opt);
    }

    // Helper: 取得當地時區的 YYYY-MM-DD
    const getLocalDateString = () => {
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // Initialize Date
    inputDate.value = getLocalDateString();

    const updateLunarDisplay = () => {
        if (!inputDate.value || !lunarDisplay) return;
        const [y, m, d] = inputDate.value.split('-').map(Number);
        try {
            const lunar = gregorianToLunar(y, m, d);
            let text = `農曆 ${lunar.yearGanZhi}年 ${lunar.monthName}${lunar.dayName}`;
            if (lunar.solarTerm) text += ` · ${lunar.solarTerm}`;
            if (lunar.festival) text += ` · ${lunar.festival}`;
            if (lunar.nationalHoliday) text += ` · ${lunar.nationalHoliday}`;
            
            // Check important festival
            try {
                const isImportantFestivalsEnabled = localStorage.getItem('tinyledger_important_festivals_enabled') === 'true';
                if (isImportantFestivalsEnabled) {
                    const festivals = JSON.parse(localStorage.getItem('tinyledger_important_festivals') || '[]');
                    const monthDayStr = `${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                    const matchedFestivals = festivals.filter(f => f.date === monthDayStr);
                    if (matchedFestivals.length > 0) {
                        text += ` · ⭐ ${matchedFestivals.map(f => f.name).join('、')}`;
                    }
                }
            } catch (err) {}
            
            lunarDisplay.textContent = text;
        } catch (e) {
            lunarDisplay.textContent = '';
        }
    };

    inputDate.addEventListener('change', updateLunarDisplay);
    
    // 帳戶選單邏輯
    const populateModalAccountSelect = (selectedAccountId) => {
        const select = document.getElementById('modal-account-select');
        if (!select) return;
        select.innerHTML = '';
        let accounts = JSON.parse(localStorage.getItem('tinyledger_accounts'));
        if (!accounts || accounts.length === 0) {
            accounts = [{ id: 'account_default', name: '帳戶 A', color: 'blue', isDefault: true }];
        }
        accounts.forEach(a => {
            const opt = document.createElement('option');
            opt.value = a.id;
            opt.textContent = a.name;
            select.appendChild(opt);
        });
        if (selectedAccountId) {
            select.value = selectedAccountId;
        } else {
            const defaultAcc = accounts.find(a => a.isDefault) || accounts[0];
            // 智慧預選：若僅勾選 1 個帳戶則自動帶入，否則使用預設帳戶
            const autoPickId = (window.selectedAccountIds && window.selectedAccountIds.length === 1) ? window.selectedAccountIds[0] : null;
            select.value = autoPickId || defaultAcc.id;
        }
    };

    // Event Listeners
    btnOpen.addEventListener('click', () => {
        if (closeTimeoutId) clearTimeout(closeTimeoutId);
        resetRecordForm();
        
        btnDeleteRecord.style.display = 'none';
        if (btnCopyRecord) btnCopyRecord.style.display = 'none';
        btnSave.textContent = '新增';
        document.getElementById('modal-title').textContent = '新增紀錄';
        // 智慧預選：若僅勾選 1 個帳戶則自動帶入該帳戶
        const autoPickId = (window.selectedAccountIds && window.selectedAccountIds.length === 1) ? window.selectedAccountIds[0] : null;
        populateModalAccountSelect(autoPickId);
        
        if (currentMode === 'single') {
            inputDate.value = getLocalDateString();
        } else {
            document.getElementById('input-date-start').value = getLocalDateString();
            document.getElementById('input-date-end').value = '';
        }

        populateCategories();
        populateTargets();
        updateLunarDisplay();
        modal.classList.add('show');
        
        // 確保手機版畫面開啟時會自動捲動到最頂部
        const modalContainer = modal.querySelector('.modal-container');
        if (modalContainer) modalContainer.scrollTop = 0;
        const modalBody = modal.querySelector('.modal-body');
        if (modalBody) modalBody.scrollTop = 0;
    });
    const closeModal = () => {
        modal.classList.remove('show');
        
        // 隱藏 Google Maps Autocomplete 殘留選單並移除焦點
        document.querySelectorAll('.pac-container').forEach(el => el.style.display = 'none');
        const inputLocation = document.getElementById('input-location');
        if (inputLocation) inputLocation.blur();
        
        // 提早隱藏儲存按鈕，避免在 300ms 動畫期間閃現「新增」字樣
        if (isReadOnlyMode) {
            btnSave.style.display = 'none';
        }

        // 等待 CSS 動畫結束 (0.3s) 後再重設表單，避免內容突然消失
        if (closeTimeoutId) clearTimeout(closeTimeoutId);
        closeTimeoutId = setTimeout(() => {
            if (!modal.classList.contains('show')) {
                resetRecordForm();
            }
        }, 300);
    };

    btnClose.addEventListener('click', closeModal);
    btnCancel.addEventListener('click', closeModal);
    
    if (btnCopyRecord) {
        btnCopyRecord.addEventListener('click', () => {
            // 隱藏 Google Maps Autocomplete 殘留選單並移除焦點
            document.querySelectorAll('.pac-container').forEach(el => el.style.display = 'none');
            const inputLocation = document.getElementById('input-location');
            if (inputLocation) inputLocation.blur();
            
            editingId = null;
            editingIsFixed = false;
            delete modal.dataset.editingId;
            delete modal.dataset.editingIsFixed;
            btnDeleteRecord.style.display = 'none';
            btnCopyRecord.style.display = 'none';
            btnSave.textContent = '新增';
            document.getElementById('modal-title').textContent = '複製紀錄';
            
            if (currentMode === 'single') {
                inputDate.value = new Date().toISOString().split('T')[0];
                updateLunarDisplay();
            } else {
                document.getElementById('input-date-start').value = new Date().toISOString().split('T')[0];
                document.getElementById('input-date-end').value = '';
            }
        });
    }

    // Toggle Type (Income/Expense)
    typeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            typeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentType = btn.getAttribute('data-type');
            populateCategories();
        });
    });

    // Toggle Mode (Single/Fixed)
    modeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            modeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentMode = btn.getAttribute('data-mode');
            
            if (currentMode === 'single') {
                dateGroupSingle.style.display = 'block';
                dateGroupsFixed.forEach(el => el.style.display = 'none');
            } else {
                dateGroupSingle.style.display = 'none';
                dateGroupsFixed.forEach(el => {
                    el.style.display = el.classList.contains('form-row') ? 'flex' : 'block';
                });
            }
        });
    });

    // Toggle Fixed Rule
    const ruleDetailGroups = {
        yearly: document.getElementById('rule-detail-yearly'),
        monthly: document.getElementById('rule-detail-monthly'),
        weekly: document.getElementById('rule-detail-weekly')
    };

    ruleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            ruleBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const rule = btn.getAttribute('data-rule');
            Object.values(ruleDetailGroups).forEach(el => el.style.display = 'none');
            if (ruleDetailGroups[rule]) {
                ruleDetailGroups[rule].style.display = (rule === 'yearly') ? 'flex' : 'block';
            }
        });
    });

    function populateCategories() {
        selectMajorCat.innerHTML = '<option value="" disabled selected>請選擇...</option>';
        const cats = currentType === 'expense' ? state.categories.expense : state.categories.income;
        
        cats.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.major;
            opt.textContent = c.major;
            selectMajorCat.appendChild(opt);
        });

        populateSubCategories();
    }

    function populateSubCategories() {
        selectSubCat.innerHTML = '<option value="" disabled selected>請選擇...</option>';
        const majorVal = selectMajorCat.value;
        if (!majorVal) return;
        
        const cats = currentType === 'expense' ? state.categories.expense : state.categories.income;
        const selectedCat = cats.find(c => c.major === majorVal);
        
        if (selectedCat && selectedCat.sub) {
            selectedCat.sub.forEach(sub => {
                const opt = document.createElement('option');
                opt.value = sub;
                opt.textContent = sub;
                selectSubCat.appendChild(opt);
            });
        }
    }

    selectMajorCat.addEventListener('change', populateSubCategories);

    function populateTargets() {
        selectTarget.innerHTML = '<option value="" disabled selected>請選擇...</option>';
        
        state.targets.forEach(t => {
            const opt = document.createElement('option');
            opt.value = t.name;
            opt.textContent = t.name;
            selectTarget.appendChild(opt);
        });
    }

    // Export function to re-populate from other modals
    window.refreshRecordModalDropdowns = () => {
        populateCategories();
        populateTargets();
    };

    let isReadOnlyMode = false;

    window.openRecordModalForEdit = (record, isFixed, isReadOnly = false) => {
        if (closeTimeoutId) clearTimeout(closeTimeoutId);
        resetRecordForm();

        editingId = record.id;
        editingIsFixed = isFixed;
        // 同時寫入 DOM dataset 作為可靠的備援來源（避免 closure 變數被不明原因重設）
        modal.dataset.editingId = String(record.id);
        modal.dataset.editingIsFixed = String(isFixed);
        isReadOnlyMode = isReadOnly;
        
        btnDeleteRecord.style.display = isReadOnly ? 'none' : 'block';
        if (btnCopyRecord) btnCopyRecord.style.display = isReadOnly ? 'none' : 'block';
        btnSave.style.display = isReadOnly ? 'none' : 'block';
        btnSave.textContent = '儲存';

        const modalTitle = document.getElementById('modal-title');
        const modeTabsContainer = document.querySelectorAll('#add-record-modal .modal-tabs')[1];
        
        populateModalAccountSelect(record.accountId || 'account_default');

        // 確保表單控制項的狀態正確（避免被唯讀模式影響後未還原）
        const formControls = document.querySelectorAll('#add-record-modal input, #add-record-modal select, #add-record-modal textarea');
        formControls.forEach(ctrl => ctrl.disabled = isReadOnly);
        const typeButtons = document.querySelectorAll('#add-record-modal .modal-tab-btn');
        typeButtons.forEach(btn => btn.style.pointerEvents = isReadOnly ? 'none' : 'auto');
        const photoBox = document.querySelector('.photo-upload-box');
        if (photoBox) photoBox.style.pointerEvents = isReadOnly ? 'none' : 'auto';
        
        const btnCancel = document.getElementById('btn-cancel-record');
        if (btnCancel) btnCancel.textContent = isReadOnly ? '離開' : '取消';

        if (isReadOnly) {
            modalTitle.textContent = '檢視固定紀錄明細';
            modeTabsContainer.style.display = 'none';
            document.getElementById('modal-account-select').disabled = true;
        } else if (isFixed) {
            modalTitle.textContent = '編輯固定規則';
            modeTabsContainer.style.display = 'none';
            // Force fixed mode explicitly
            currentMode = 'fixed';
            dateGroupSingle.style.display = 'none';
            dateGroupsFixed.forEach(el => {
                el.style.display = el.classList.contains('form-row') ? 'flex' : 'block';
            });
        } else {
            modalTitle.textContent = '編輯紀錄';
            modeTabsContainer.style.display = 'flex';
        }

        populateTargets();

        // Set Type
        const typeBtn = Array.from(typeBtns).find(b => b.getAttribute('data-type') === record.type);
        if (typeBtn) typeBtn.click();

        if (!isFixed) {
            const modeBtn = Array.from(modeBtns).find(b => b.getAttribute('data-mode') === 'single');
            if (modeBtn) modeBtn.click();
        }

        selectMajorCat.value = record.majorCategory;
        selectMajorCat.dispatchEvent(new Event('change'));
        selectSubCat.value = record.subCategory;

        // Set Mode
        const modeBtn = Array.from(modeBtns).find(b => b.getAttribute('data-mode') === (isFixed ? 'fixed' : 'single'));
        if (modeBtn) modeBtn.click();

        if (isFixed) {
            document.getElementById('input-date-start').value = record.startDate || '';
            document.getElementById('input-date-end').value = record.endDate || '';
            
            const ruleBtn = Array.from(ruleBtns).find(b => b.getAttribute('data-rule') === record.rule);
            if (ruleBtn) ruleBtn.click();
            
            if (record.rule === 'yearly') {
                document.getElementById('select-rule-month').value = record.ruleDetail.month;
                document.getElementById('select-rule-day-yearly').value = record.ruleDetail.day;
            } else if (record.rule === 'monthly') {
                document.getElementById('select-rule-day-monthly').value = record.ruleDetail.day;
            } else if (record.rule === 'weekly') {
                document.getElementById('select-rule-weekday').value = record.ruleDetail.weekday;
            }
        } else {
            inputDate.value = record.date;
            updateLunarDisplay();
        }

        document.getElementById('input-amount').value = record.amount;
        selectTarget.value = record.payee || '';
        const inputLoc2 = document.getElementById('input-location');
        if (inputLoc2) {
            inputLoc2.value = record.location || '';
            const btnClearLoc = document.getElementById('btn-clear-location');
            if (btnClearLoc) btnClearLoc.style.display = inputLoc2.value ? 'block' : 'none';
        }
        document.getElementById('input-note').value = record.note || '';

        if (record.attachment) {
            photoBase64 = record.attachment;
            photoPreview.src = photoBase64;
            photoPreview.style.display = 'block';
            if (photoPreviewContainer) photoPreviewContainer.style.display = 'block';
            if (photoPlaceholder) photoPlaceholder.style.display = 'none';
        } else {
            if (photoPreviewContainer) photoPreviewContainer.style.display = 'none';
            if (photoPlaceholder) photoPlaceholder.style.display = 'flex';
        }

        const photoUploadBox = document.getElementById('photo-upload-box');
        const photoGroup = photoUploadBox ? photoUploadBox.closest('.form-group') : null;
        const isPhotoUploadEnabled = localStorage.getItem('tinyledger_photo_upload_enabled') !== 'false';
        
        if (isReadOnlyMode) {
            if (btnDeletePhoto) btnDeletePhoto.style.display = 'none';
            if (!record.attachment && photoGroup) {
                photoGroup.style.display = 'none';
            }
        } else {
            if (btnDeletePhoto) btnDeletePhoto.style.display = 'flex';
            if (photoGroup) {
                if (!isPhotoUploadEnabled && !record.attachment) {
                    photoGroup.style.display = 'none';
                } else {
                    photoGroup.style.display = 'block';
                }
            }
        }

        modal.classList.add('show');
        
        // 確保手機版畫面開啟時會自動捲動到最頂部
        const modalContainer = modal.querySelector('.modal-container');
        if (modalContainer) modalContainer.scrollTop = 0;
        const modalBody = modal.querySelector('.modal-body');
        if (modalBody) modalBody.scrollTop = 0;
    };

    // Photo Upload and Crop Initialization
    inputPhoto.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

    const reader = new FileReader();
        reader.onload = (event) => {
            cropImageTarget.src = event.target.result;
            if (cropModal) {
                cropModal.classList.add('show');
                const warningHint = document.getElementById('crop-warning-hint');
                if (warningHint) warningHint.style.display = 'none';
            }
            if (cropperInstance) {
                cropperInstance.destroy();
            }
            // Ensure image is loaded before initializing cropper
            cropImageTarget.onload = () => {
                if (window.Cropper) {
                    cropperInstance = new Cropper(cropImageTarget, {
                        aspectRatio: NaN,
                        viewMode: 1,
                        autoCropArea: 0.8
                    });
                }
            };
            inputPhoto.value = ''; // Reset to allow selecting same file again
        };
        reader.readAsDataURL(file);
    });

    // 讓已存在的預覽照片也能點擊重新裁切
    if (photoPreview) {
        photoPreview.addEventListener('click', () => {
            if (!photoBase64 || isReadOnlyMode) return;
            
            cropImageTarget.src = photoBase64;
            if (cropModal) {
                cropModal.classList.add('show');
                const warningHint = document.getElementById('crop-warning-hint');
                if (warningHint) warningHint.style.display = 'block';
            }
            if (cropperInstance) {
                cropperInstance.destroy();
            }
            
            cropImageTarget.onload = () => {
                if (window.Cropper) {
                    cropperInstance = new Cropper(cropImageTarget, {
                        aspectRatio: NaN,
                        viewMode: 1,
                        autoCropArea: 0.8
                    });
                }
            };
        });
    }

    const closeCropModal = () => {
        if (cropModal) cropModal.classList.remove('show');
        if (cropperInstance) {
            cropperInstance.destroy();
            cropperInstance = null;
        }
        if (cropImageTarget) cropImageTarget.src = '';
    };

    if (btnCloseCropModal) btnCloseCropModal.addEventListener('click', closeCropModal);
    if (btnCancelCrop) btnCancelCrop.addEventListener('click', closeCropModal);

    if (btnConfirmCrop) {
        btnConfirmCrop.addEventListener('click', () => {
            if (!cropperInstance) return;
            const photoSize = parseInt(localStorage.getItem('tinyledger_photo_size') || '640');
            const photoQuality = parseFloat(localStorage.getItem('tinyledger_photo_quality') || '0.7');
            
            const canvas = cropperInstance.getCroppedCanvas({
                maxWidth: photoSize,
                maxHeight: photoSize
            });
            if (canvas) {
                photoBase64 = canvas.toDataURL('image/jpeg', photoQuality);
                photoPreview.src = photoBase64;
                photoPreview.style.display = 'block';
                if (photoPreviewContainer) photoPreviewContainer.style.display = 'block';
                if (photoPlaceholder) photoPlaceholder.style.display = 'none';
            }
            closeCropModal();
        });
    }

    if (btnDeletePhoto) {
        btnDeletePhoto.addEventListener('click', (e) => {
            e.stopPropagation();
            photoBase64 = '';
            photoPreview.src = '';
            inputPhoto.value = '';
            if (photoPreviewContainer) photoPreviewContainer.style.display = 'none';
            if (photoPlaceholder) photoPlaceholder.style.display = 'flex';
        });
    }

    // Delete Record
    btnDeleteRecord.addEventListener('click', async () => {
        const _delEditingId = modal.dataset.editingId ? Number(modal.dataset.editingId) : null;
        const _delIsFixed = modal.dataset.editingIsFixed === 'true';
        if (!_delEditingId) return;

        if (_delIsFixed) {
            const txs = await db.getTransactions();
            const boundTxs = txs.filter(t => t.fixedId === _delEditingId);
            let confirmMsg = '確定要刪除這筆固定規則嗎？此動作無法復原。';
            
            if (boundTxs.length > 0) {
                const dates = [...new Set(boundTxs.map(t => t.date))].sort().reverse();
                const displayDates = dates.slice(0, 5).join(', ');
                const moreStr = dates.length > 5 ? ` 等共 ${dates.length} 天` : '';
                confirmMsg = `【嚴重警告】此固定規則已自動產生了 ${boundTxs.length} 筆歷史紀錄\n(發生於 ${displayDates}${moreStr})。\n\n刪除此規則將會「一併刪除」所有由它產生的紀錄！\n若您只想停止產生未來紀錄，建議您取消刪除，並修改「結束日期」。\n\n確定要強制刪除並銷毀歷史紀錄嗎？`;
            }
            
            if (!confirm(confirmMsg)) return;

            await db.deleteFixedRecord(_delEditingId);
            await db.deleteTransactionsByFixedId(_delEditingId);
        } else {
            if (!confirm('確定要刪除這筆紀錄嗎？此動作無法復原。')) return;
            await db.deleteTransaction(_delEditingId);
        }
        
        state.transactions = await db.getTransactions();
        state.fixedRecords = await db.getFixedRecords();
        renderSummary();
        renderRecordList();
        closeModal();
    });

    // Save Record
    btnSave.addEventListener('click', async () => {
        if (btnSave.disabled) return;
        btnSave.disabled = true;
        const originalText = btnSave.textContent;
        btnSave.textContent = '儲存中...';

        try {
            let targetScrollId = null;
            const amount = document.getElementById('input-amount').value;
            const majorCat = selectMajorCat.value;
            const subCat = selectSubCat.value;
            const target = selectTarget.value;
            const location = document.getElementById('input-location').value;
            const note = document.getElementById('input-note').value;

            if (!majorCat || !subCat) {
                alert('請選擇大類與小類！');
                btnSave.disabled = false;
                btnSave.textContent = originalText;
                return;
            }

            if (currentMode === 'single') {
                const tx = {
                    date: inputDate.value,
                    type: currentType,
                    majorCategory: majorCat,
                    subCategory: subCat,
                    amount: parseFloat(amount) || 0,
                    payee: target,
                    location: location,
                    note: note,
                    attachment: photoBase64,
                    isFixed: false,
                    accountId: document.getElementById('modal-account-select') ? document.getElementById('modal-account-select').value : 'account_default'
                };
                // 優先從 DOM dataset 讀取（closure 變數會被不明原因重設為 null）
                const _saveEditingId = modal.dataset.editingId ? Number(modal.dataset.editingId) : null;
                const _saveIsFixed = modal.dataset.editingIsFixed === 'true';
                if (_saveEditingId && !_saveIsFixed) tx.id = _saveEditingId;
                console.warn('[recordModal] 🔍 DEBUG 儲存單次紀錄:', {
                    closureEditingId: editingId,
                    datasetEditingId: modal.dataset.editingId,
                    _saveEditingId,
                    _saveIsFixed,
                    txId: tx.id, txIdType: typeof tx.id,
                    currentMode
                });
                const savedTxId = await db.saveTransaction(tx);
                targetScrollId = savedTxId || tx.id;

                // 如果是由固定紀錄轉換為單次紀錄，刪除原固定紀錄及其展開明細
                if (_saveEditingId && _saveIsFixed) {
                    await db.deleteFixedRecord(_saveEditingId);
                    await db.deleteTransactionsByFixedId(_saveEditingId);
                }
            } else {
            const sd = document.getElementById('input-date-start').value;
            const ed = document.getElementById('input-date-end').value;
            
            if (!sd) {
                alert('固定紀錄必須設定起始日期！');
                return;
            }
            if (ed && sd > ed) {
                alert('起始日期不能大於結束日期！');
                return;
            }

            const activeRuleBtn = document.querySelector('.modal-tab-btn.active[data-rule]');
            const rule = activeRuleBtn ? activeRuleBtn.getAttribute('data-rule') : 'yearly';
            let ruleDetail = {};
            if (rule === 'yearly') {
                ruleDetail = {
                    month: parseInt(document.getElementById('select-rule-month').value),
                    day: parseInt(document.getElementById('select-rule-day-yearly').value)
                };
            } else if (rule === 'monthly') {
                ruleDetail = {
                    day: parseInt(document.getElementById('select-rule-day-monthly').value)
                };
            } else if (rule === 'weekly') {
                ruleDetail = {
                    weekday: parseInt(document.getElementById('select-rule-weekday').value)
                };
            }

            const fixedRecord = {
                startDate: sd,
                endDate: ed,
                rule,
                ruleDetail,
                type: currentType,
                majorCategory: majorCat,
                subCategory: subCat,
                amount: parseFloat(amount) || 0,
                payee: target,
                location: location,
                note: note,
                attachment: photoBase64,
                accountId: document.getElementById('modal-account-select') ? document.getElementById('modal-account-select').value : 'account_default'
            };
            
            // 優先從 DOM dataset 讀取（與單次紀錄相同策略）
            const _fixedEditingId = modal.dataset.editingId ? Number(modal.dataset.editingId) : null;
            const _fixedIsFixed = modal.dataset.editingIsFixed === 'true';
            if (_fixedEditingId && _fixedIsFixed) {
                fixedRecord.id = _fixedEditingId;
            }
            const savedId = await db.saveFixedRecord(fixedRecord);
            fixedRecord.id = savedId;

            // 如果是由單次紀錄轉換為固定紀錄，刪除原單次紀錄
            if (_fixedEditingId && !_fixedIsFixed) {
                await db.deleteTransaction(_fixedEditingId);
            }

            // Update generated transactions
            await db.deleteTransactionsByFixedId(savedId);
            const generatedTxs = generateFixedTransactions(fixedRecord);
            await Promise.all(generatedTxs.map(tx => db.saveTransaction(tx)));
        }

            // 自動將清單月份切換至剛儲存的紀錄月份
            const newDateStr = currentMode === 'single' ? inputDate.value : document.getElementById('input-date-start').value;
            if (newDateStr) {
                const monthPrefix = newDateStr.substring(0, 7); // 取得 YYYY-MM
                const monthSelector = document.getElementById('month-selector');
                if (monthSelector && monthSelector.value !== monthPrefix) {
                    monthSelector.value = monthPrefix;
                    // 如果有定義 renderSummary，我們稍後會呼叫它
                }
            }

            // Update state and UI
            state.transactions = await db.getTransactions();
            state.fixedRecords = await db.getFixedRecords();
            renderSummary();
            renderRecordList(targetScrollId);

            // --- 重要節日提醒檢查 ---
            try {
                const isImportantFestivalsEnabled = localStorage.getItem('tinyledger_important_festivals_enabled') === 'true';
                if (isImportantFestivalsEnabled) {
                    const festivals = JSON.parse(localStorage.getItem('tinyledger_important_festivals') || '[]');
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    
                    let reminderMessages = [];
                    festivals.forEach(f => {
                        if (!f.date || !f.reminders || f.reminders.length === 0) return;
                        const parts = f.date.split('-');
                        if (parts.length !== 2) return;
                        
                        const fMonth = parseInt(parts[0], 10);
                        const fDay = parseInt(parts[1], 10);
                        
                        const currentYear = today.getFullYear();
                        const festivalDate = new Date(currentYear, fMonth - 1, fDay);
                        
                        // 若今年節日已過，則檢查明年
                        if (festivalDate < today) {
                            festivalDate.setFullYear(currentYear + 1);
                        }

                        f.reminders.forEach(daysBefore => {
                            const remindDate = new Date(festivalDate.getTime());
                            remindDate.setDate(remindDate.getDate() - daysBefore);
                            
                            if (today.getTime() === remindDate.getTime()) {
                                reminderMessages.push(`⚠️ ${f.name} 還有 ${daysBefore} 天就到了！`);
                            }
                        });
                    });

                    if (reminderMessages.length > 0) {
                        alert('【重要節日提醒】\n\n' + reminderMessages.join('\n'));
                    }
                }
            } catch (err) {
                console.error('[重要節日提醒] 發生錯誤:', err);
            }
            // ------------------------

            closeModal();
        } catch (e) {
            console.error('Save failed:', e);
            alert('儲存失敗：' + e.message);
        } finally {
            btnSave.disabled = false;
            btnSave.textContent = originalText;
        }
    });
};
