export function initLocationSearch() {
    const inputLocation = document.getElementById('input-location');
    const btnClearLocation = document.getElementById('btn-clear-location');
    if (!inputLocation) return;

    // 清除按鈕邏輯
    if (btnClearLocation) {
        const toggleClearBtn = () => {
            btnClearLocation.style.display = inputLocation.value ? 'block' : 'none';
        };
        inputLocation.addEventListener('input', toggleClearBtn);
        // 初始化時也檢查一次（例如編輯紀錄時有預設值）
        // 延遲一下讓預設值填入後再檢查
        setTimeout(toggleClearBtn, 50); 
        
        btnClearLocation.addEventListener('click', () => {
            inputLocation.value = '';
            toggleClearBtn();
            inputLocation.focus();
        });
    }

    // 在地圖中開啟按鈕邏輯
    const btnMapLocation = document.getElementById('btn-map-location');
    if (btnMapLocation) {
        btnMapLocation.addEventListener('click', () => {
            const loc = inputLocation.value.trim();
            if (loc) {
                const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(loc)}`;
                const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
                if (isMobile) {
                    // 手機版直接改變 href，由系統攔截開啟 App，避免產生關不掉的空白分頁
                    window.location.href = mapUrl;
                } else {
                    // 電腦版維持開新分頁
                    window.open(mapUrl, '_blank');
                }
            } else {
                alert('請先輸入或選擇一個地點');
            }
        });
    }

    const apiKey = localStorage.getItem('tinyledger_gmaps_api_key');
    if (!apiKey) return;

    // 如果已經載入過，就不重複載入
    if (document.getElementById('google-maps-script')) {
        return;
    }

    // 定義全域回呼函數
    window.initGooglePlaces = () => {
        // Web Component <gmp-place-autocomplete> 會自動實體化
        
        // 共用的地點處理邏輯
        const handlePlaceSelection = async (place) => {
            if (!place) return;

            // 為了安全起見，確保我們需要顯示的資料有被拉取
            try {
                if (typeof place.fetchFields === 'function') {
                    // 同時拉取新舊版可能用到的欄位
                    await place.fetchFields({ fields: ['displayName', 'formattedAddress', 'name', 'formatted_address'] });
                }
            } catch (err) {
                console.warn('[locationSearch] 無法拉取完整地點資訊:', err);
            }

            // 安全地取得地點名稱 (支援字串或物件形式)
            let name = '';
            if (place.displayName) {
                name = typeof place.displayName === 'string' ? place.displayName : place.displayName.text;
            }
            if (!name) name = place.name || '';

            // 安全地取得地址
            let addr = place.formattedAddress || place.formatted_address || '';
            
            let displayStr = '';
            if (name && addr) {
                displayStr = `${name} - ${addr}`;
            } else if (name) {
                displayStr = name;
            } else if (addr) {
                displayStr = addr;
            }
            
            if (displayStr) {
                // Web Component 的更新可能會有自己的生命週期，稍微延遲覆寫可以避免閃爍
                setTimeout(() => {
                    inputLocation.value = displayStr;
                    if (btnClearLocation) btnClearLocation.style.display = 'block';
                }, 50);
            }
        };

        // 綁定舊版事件 (確保相容性)
        inputLocation.addEventListener('gmp-placeselect', (e) => {
            if (e.place) handlePlaceSelection(e.place);
        });

        // 綁定新版事件 (Google 官方建議未來改用這個)
        inputLocation.addEventListener('gmp-select', (e) => {
            if (e.placePrediction && typeof e.placePrediction.toPlace === 'function') {
                handlePlaceSelection(e.placePrediction.toPlace());
            } else if (e.place) {
                handlePlaceSelection(e.place);
            }
        });

        // 避免在下拉選單按 Enter 時觸發其他功能（例如表單送出）
        inputLocation.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
            }
        });
    };

    // 動態載入 Google Maps JavaScript API 腳本
    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initGooglePlaces&loading=async`;
    script.async = true;
    script.defer = true;
    script.onerror = () => {
        console.error('[locationSearch] Google Maps API 載入失敗，請檢查 API Key 是否正確或是否有網路連線。');
    };
    document.head.appendChild(script);
}
