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
        const autocomplete = new google.maps.places.Autocomplete(inputLocation, {
            fields: ['name', 'formatted_address'],
            types: ['establishment', 'geocode']
        });
        
        // 綁定選擇事件
        autocomplete.addListener('place_changed', () => {
            const place = autocomplete.getPlace();
            if (place) {
                let displayStr = '';
                if (place.name && place.formatted_address) {
                    displayStr = `${place.name} - ${place.formatted_address}`;
                } else if (place.name) {
                    displayStr = place.name;
                } else if (place.formatted_address) {
                    displayStr = place.formatted_address;
                }
                
                if (displayStr) {
                    inputLocation.value = displayStr;
                    if (btnClearLocation) btnClearLocation.style.display = 'block';
                }
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
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initGooglePlaces`;
    script.async = true;
    script.defer = true;
    script.onerror = () => {
        console.error('[locationSearch] Google Maps API 載入失敗，請檢查 API Key 是否正確或是否有網路連線。');
    };
    document.head.appendChild(script);
}
