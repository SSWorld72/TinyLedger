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
        photoPreview.style.display = 'block'; // Ensure img itself is not hidden, controlled by container instead
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
        btnSave.textContent = window.t('ui.record.addBtn');
        btnSave.style.display = 'block';

        // Re-enable all form controls
        const formControls = document.querySelectorAll('#add-record-modal input, #add-record-modal select, #add-record-modal textarea');
        formControls.forEach(ctrl => ctrl.disabled = false);
        const typeButtons = document.querySelectorAll('#add-record-modal .modal-tab-btn');
        typeButtons.forEach(btn => btn.style.pointerEvents = 'auto');
        const photoBox = document.querySelector('.photo-upload-box');
        if (photoBox) photoBox.style.pointerEvents = 'auto';
        
        const btnCancel = document.getElementById('btn-cancel-record');
        if (btnCancel) btnCancel.textContent = window.t('ui.settings.categories.cancel');
        
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
        selectMonth.insertAdjacentHTML('beforeend', `<option value="${i}">${window.t('ui.settings.calendar.month', { m: i }) || i + ' Month'}</option>`);
    }
    for (let i = 1; i <= 31; i++) {
        const opt = `<option value="${i}">${window.t('ui.settings.calendar.day', { d: i }) || i + ' Day'}</option>`;
        selectDayYearly.insertAdjacentHTML('beforeend', opt);
        selectDayMonthly.insertAdjacentHTML('beforeend', opt);
    }

    // Helper: Get YYYY-MM-DD in local timezone
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
            let text = `Lunar ${lunar.yearGanZhi} ${lunar.monthName}${lunar.dayName}`;
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
                        text += ` · ${window.t('ui.record.importantFestivalPrefix')} ${matchedFestivals.map(f => f.name).join(window.t('ui.record.festivalJoin'))}`;
                    }
                }
            } catch (err) {}
            
            lunarDisplay.textContent = text;
        } catch (e) {
            lunarDisplay.textContent = '';
        }
    };

    inputDate.addEventListener('change', updateLunarDisplay);
    
    // Account select logic
    const populateModalAccountSelect = (selectedAccountId) => {
        const select = document.getElementById('modal-account-select');
        if (!select) return;
        select.innerHTML = '';
        let accounts = JSON.parse(localStorage.getItem('tinyledger_accounts'));
        if (!accounts || accounts.length === 0) {
            accounts = [{ id: 'account_default', name: window.t('ui.accounts.defaultName'), color: 'blue', isDefault: true }];
        }
        accounts.forEach(a => {
            const opt = document.createElement('option');
            opt.value = a.id;
            opt.textContent = a.name;
            opt.dataset.color = a.color || 'blue';
            
            let c = a.color || 'blue';
            if (c === 'green') c = 'emerald';
            if (c === 'gray') c = 'slate';
            opt.className = `text-${c}-600 dark:text-${c}-400 font-bold`;
            
            select.appendChild(opt);
        });
        if (selectedAccountId) {
            select.value = selectedAccountId;
        } else {
            const defaultAcc = accounts.find(a => a.isDefault) || accounts[0];
            // Smart pre-select: if only 1 account is checked, auto-select it, otherwise use default
            const autoPickId = (window.selectedAccountIds && window.selectedAccountIds.length === 1) ? window.selectedAccountIds[0] : null;
            select.value = autoPickId || defaultAcc.id;
        }
        
        // Dynamically update text color based on selected account's color
        const updateSelectColor = () => {
            const selectedOpt = select.options[select.selectedIndex];
            if (selectedOpt) {
                let c = selectedOpt.dataset.color || 'blue';
                if (c === 'green') c = 'emerald';
                if (c === 'gray') c = 'slate';
                
                // Clear any existing color classes and inline color overriding
                select.className = select.className.replace(/\b(text|border|ring)-(blue|emerald|red|yellow|purple|slate)-\w+(?:\/\d+)?/g, '').trim();
                select.style.color = '';
                select.style.borderColor = '';
                
                // Add the new color classes to match the account
                select.classList.add(`text-${c}-600`, `dark:text-${c}-400`);
            }
        };
        select.addEventListener('change', updateSelectColor);
        updateSelectColor();
    };

    // Event Listeners
    btnOpen.addEventListener('click', () => {
        if (closeTimeoutId) clearTimeout(closeTimeoutId);
        resetRecordForm();
        
        btnDeleteRecord.style.display = 'none';
        if (btnCopyRecord) btnCopyRecord.style.display = 'none';
        btnSave.textContent = window.t('ui.record.addBtn');
        document.getElementById('modal-title').textContent = window.t('ui.record.addTitle');
        // Smart pre-select: if only 1 account is checked, auto-select it
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
        
        // Ensure modal scrolls to top when opened on mobile
        const modalContainer = modal.querySelector('.modal-container');
        if (modalContainer) modalContainer.scrollTop = 0;
        const modalBody = modal.querySelector('.modal-body');
        if (modalBody) modalBody.scrollTop = 0;
    });
    const closeModal = () => {
        modal.classList.remove('show');
        
        // Hide Google Maps Autocomplete residual menu and remove focus
        document.querySelectorAll('.pac-container').forEach(el => el.style.display = 'none');
        const inputLocation = document.getElementById('input-location');
        if (inputLocation) inputLocation.blur();
        
        // Hide save button early to avoid "Add" text flashing during 300ms animation
        if (isReadOnlyMode) {
            btnSave.style.display = 'none';
        }

        // Reset form after CSS animation ends (0.3s) to prevent sudden content disappearance
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
            // Hide Google Maps Autocomplete residual menu and remove focus
            document.querySelectorAll('.pac-container').forEach(el => el.style.display = 'none');
            const inputLocation = document.getElementById('input-location');
            if (inputLocation) inputLocation.blur();
            
            editingId = null;
            editingIsFixed = false;
            delete modal.dataset.editingId;
            delete modal.dataset.editingIsFixed;
            btnDeleteRecord.style.display = 'none';
            btnCopyRecord.style.display = 'none';
            btnSave.textContent = window.t('ui.record.addBtn');
            document.getElementById('modal-title').textContent = window.t('ui.record.copyTitle');
            
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
        selectMajorCat.innerHTML = `<option value="" disabled selected>${window.t('ui.list.filterAll') || 'Select...'}</option>`;
        const cats = currentType === 'expense' ? state.categories.expense : state.categories.income;
        
        cats.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.catId;
            opt.textContent = c.i18nKey ? window.t(c.i18nKey) : c.major;
            selectMajorCat.appendChild(opt);
        });

        populateSubCategories();
    }

    function populateSubCategories() {
        selectSubCat.innerHTML = `<option value="" disabled selected>${window.t('ui.list.filterAll') || 'Select...'}</option>`;
        const majorVal = selectMajorCat.value;
        if (!majorVal) return;
        
        const cats = currentType === 'expense' ? state.categories.expense : state.categories.income;
        const selectedCat = cats.find(c => c.catId === majorVal);
        
        if (selectedCat && selectedCat.sub) {
            selectedCat.sub.forEach(sub => {
                const opt = document.createElement('option');
                opt.value = sub;
                opt.textContent = window.getSubCategoryName ? window.getSubCategoryName(sub) : sub;
                selectSubCat.appendChild(opt);
            });
        }
    }

    selectMajorCat.addEventListener('change', populateSubCategories);

    function populateTargets() {
        selectTarget.innerHTML = `<option value="" disabled selected>${window.t('ui.list.filterAll') || 'Select...'}</option>`;
        
        state.targets.forEach(t => {
            const opt = document.createElement('option');
            opt.value = t.tgtId;
            opt.textContent = t.i18nKey ? window.t(t.i18nKey) : t.name;
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
        // Simultaneously write to DOM dataset as a reliable backup source (to prevent closure variables from being reset for unknown reasons)
        modal.dataset.editingId = String(record.id);
        modal.dataset.editingIsFixed = String(isFixed);
        isReadOnlyMode = isReadOnly;
        
        btnDeleteRecord.style.display = isReadOnly ? 'none' : 'block';
        if (btnCopyRecord) btnCopyRecord.style.display = isReadOnly ? 'none' : 'block';
        btnSave.style.display = isReadOnly ? 'none' : 'block';
        btnSave.textContent = window.t('ui.modals.record.btnSave') || 'Save';

        const modalTitle = document.getElementById('modal-title');
        const modeTabsContainer = document.querySelectorAll('#add-record-modal .modal-tabs')[1];
        
        populateModalAccountSelect(record.accountId || 'account_default');

        // Ensure form control state is correct (avoid not being restored after read-only mode)
        const formControls = document.querySelectorAll('#add-record-modal input, #add-record-modal select, #add-record-modal textarea');
        formControls.forEach(ctrl => ctrl.disabled = isReadOnly);
        const typeButtons = document.querySelectorAll('#add-record-modal .modal-tab-btn');
        typeButtons.forEach(btn => btn.style.pointerEvents = isReadOnly ? 'none' : 'auto');
        const photoBox = document.querySelector('.photo-upload-box');
        if (photoBox) photoBox.style.pointerEvents = isReadOnly ? 'none' : 'auto';
        
        const btnCancel = document.getElementById('btn-cancel-record');
        if (btnCancel) btnCancel.textContent = isReadOnly ? (window.t('ui.settings.categories.cancel') || 'Leave') : (window.t('ui.settings.categories.cancel') || 'Cancel');

        if (isReadOnly) {
            modalTitle.textContent = window.t('ui.record.viewFixedTitle') || 'View Fixed Record Details';
            modeTabsContainer.style.display = 'none';
            document.getElementById('modal-account-select').disabled = true;
        } else if (isFixed) {
            modalTitle.textContent = window.t('ui.record.editFixedTitle') || 'Edit Fixed Rule';
            modeTabsContainer.style.display = 'none';
            // Force fixed mode explicitly
            currentMode = 'fixed';
            dateGroupSingle.style.display = 'none';
            dateGroupsFixed.forEach(el => {
                el.style.display = el.classList.contains('form-row') ? 'flex' : 'block';
            });
        } else {
            modalTitle.textContent = window.t('ui.modals.record.editTitle') || 'Edit Record';
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
        
        // Ensure modal scrolls to top when opened on mobile
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

    // Allow clicking on existing preview photos to re-crop
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
            let confirmMsg = window.t('ui.batch.confirmDeleteFixed') || 'Are you sure you want to delete this fixed rule? This action cannot be undone.';
            
            if (boundTxs.length > 0) {
                const dates = [...new Set(boundTxs.map(t => t.date))].sort().reverse();
                const displayDates = dates.slice(0, 5).join(', ');
                const moreStr = dates.length > 5 ? (window.t('ui.batch.andOthers') ? ` ${window.t('ui.batch.andOthers')} ${dates.length} days` : ` and ${dates.length} other days`) : '';
                confirmMsg = (window.t('ui.batch.confirmDeleteFixedBound') || `[WARNING] This fixed rule has automatically generated ${boundTxs.length} history records\n(occurred on ${displayDates}${moreStr}).\n\nDeleting this rule will "ALSO DELETE" all records generated by it!\nIf you only want to stop generating future records, it is recommended to cancel deletion and modify the "End Date".\n\nAre you sure you want to force delete and destroy history records?`).replace('{totalBound}', boundTxs.length).replace('{boundLines}', displayDates + moreStr);
            }
            
            if (!confirm(confirmMsg)) return;

            await db.deleteFixedRecord(_delEditingId);
            await db.deleteTransactionsByFixedId(_delEditingId);
        } else {
            if (!confirm(window.t('ui.batch.confirmDeleteGeneral') || 'Are you sure you want to delete this record? This action cannot be undone.')) return;
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
        btnSave.textContent = window.t('ui.settings.categories.saving') || 'Saving...';

        try {
            let targetScrollId = null;
            const amount = document.getElementById('input-amount').value;
            const majorCat = selectMajorCat.value;
            const subCat = selectSubCat.value;
            const target = selectTarget.value;
            const location = document.getElementById('input-location').value;
            const note = document.getElementById('input-note').value;

            if (!majorCat || !subCat) {
                alert(window.t('ui.record.alertSelectCategory') || 'Please select main and sub categories!');
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
                // Prioritize reading from DOM dataset (closure variables can be reset to null for unknown reasons)
                const _saveEditingId = modal.dataset.editingId ? Number(modal.dataset.editingId) : null;
                const _saveIsFixed = modal.dataset.editingIsFixed === 'true';
                if (_saveEditingId && !_saveIsFixed) tx.id = _saveEditingId;

                const savedTxId = await db.saveTransaction(tx);
                targetScrollId = savedTxId || tx.id;

                // If converting from fixed record to single record, delete original fixed record and its expanded details
                if (_saveEditingId && _saveIsFixed) {
                    await db.deleteFixedRecord(_saveEditingId);
                    await db.deleteTransactionsByFixedId(_saveEditingId);
                }
            } else {
            const sd = document.getElementById('input-date-start').value;
            const ed = document.getElementById('input-date-end').value;
            
            if (!sd) {
                alert(window.t('ui.record.alertFixedStartDate') || 'Fixed record must have a start date!');
                return;
            }
            if (ed && sd > ed) {
                alert(window.t('ui.record.alertFixedDateOrder') || 'Start date cannot be greater than end date!');
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
            
            // Prioritize reading from DOM dataset (same strategy as single record)
            const _fixedEditingId = modal.dataset.editingId ? Number(modal.dataset.editingId) : null;
            const _fixedIsFixed = modal.dataset.editingIsFixed === 'true';
            if (_fixedEditingId && _fixedIsFixed) {
                fixedRecord.id = _fixedEditingId;
            }
            const savedId = await db.saveFixedRecord(fixedRecord);
            fixedRecord.id = savedId;

            // If converting from single record to fixed record, delete original single record
            if (_fixedEditingId && !_fixedIsFixed) {
                await db.deleteTransaction(_fixedEditingId);
            }

            // Update generated transactions
            await db.deleteTransactionsByFixedId(savedId);
            const generatedTxs = generateFixedTransactions(fixedRecord);
            await Promise.all(generatedTxs.map(tx => db.saveTransaction(tx)));
        }

            // Automatically switch list month to the month of the newly saved record
            const newDateStr = currentMode === 'single' ? inputDate.value : document.getElementById('input-date-start').value;
            if (newDateStr) {
                const monthPrefix = newDateStr.substring(0, 7); // Get YYYY-MM
                const monthSelector = document.getElementById('month-selector');
                if (monthSelector && monthSelector.value !== monthPrefix) {
                    monthSelector.value = monthPrefix;
                    // If renderSummary is defined, we will call it later
                }
            }

            // Update state and UI
            state.transactions = await db.getTransactions();
            state.fixedRecords = await db.getFixedRecords();
            renderSummary();
            renderRecordList(targetScrollId);

            // --- Important Festival Reminder Check ---
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
                        
                        // If festival has passed this year, check next year
                        if (festivalDate < today) {
                            festivalDate.setFullYear(currentYear + 1);
                        }

                        f.reminders.forEach(daysBefore => {
                            const remindDate = new Date(festivalDate.getTime());
                            remindDate.setDate(remindDate.getDate() - daysBefore);
                            
                            if (today.getTime() === remindDate.getTime()) {
                                reminderMessages.push(`⚠️ ${f.name} ` + (window.t('ui.record.festivalReminderDays', { days: daysBefore }) || `is in ${daysBefore} days!`));
                            }
                        });
                    });

                    if (reminderMessages.length > 0) {
                        alert((window.t('ui.record.festivalReminderTitle') || '【Important Festival Reminder】') + '\n\n' + reminderMessages.join('\n'));
                    }
                }
            } catch (err) {
                console.error(window.t('logs.record.festivalReminderError'), err);
            }
            // ------------------------

            closeModal();
        } catch (e) {
            console.error(window.t('logs.record.saveFail'), e);
            alert((window.t('ui.settings.categories.saveFailed') || 'Save failed: ') + e.message);
        } finally {
            btnSave.disabled = false;
            btnSave.textContent = originalText;
        }
    });
};
