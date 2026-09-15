export function initLocationSearch() {
    const inputLocation = document.getElementById('input-location');
    const btnClearLocation = document.getElementById('btn-clear-location');
    if (!inputLocation) return;

    // Clear button logic
    if (btnClearLocation) {
        const toggleClearBtn = () => {
            btnClearLocation.style.display = inputLocation.value ? 'block' : 'none';
        };
        inputLocation.addEventListener('input', toggleClearBtn);
        // Also check once during initialization (e.g. when editing a record there might be a default value)
        // Delay a bit to let the default value fill in before checking
        setTimeout(toggleClearBtn, 50); 
        
        btnClearLocation.addEventListener('click', () => {
            inputLocation.value = '';
            toggleClearBtn();
            inputLocation.focus();
        });
    }

    // Open in map button logic
    const btnMapLocation = document.getElementById('btn-map-location');
    if (btnMapLocation) {
        btnMapLocation.addEventListener('click', () => {
            const loc = inputLocation.value.trim();
            if (loc) {
                const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(loc)}`;
                const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
                if (isMobile) {
                    // Mobile version changes href directly, system intercepts to open App, avoiding unclosable blank tabs
                    window.location.href = mapUrl;
                } else {
                    // Desktop version keeps opening new tabs
                    window.open(mapUrl, '_blank');
                }
            } else {
                alert(window.t('ui.record.promptLocation'));
            }
        });
    }

    // Scroll into view on focus to avoid mobile keyboard covering the autocomplete dropdown
    inputLocation.addEventListener('focusin', () => {
        setTimeout(() => {
            inputLocation.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 300); // Wait for keyboard to pop up
    });

    const apiKey = localStorage.getItem('tinyledger_gmaps_api_key');
    if (!apiKey) return;

    // If already loaded, do not load again
    if (document.getElementById('google-maps-script')) {
        return;
    }

    // Define global callback function
    window.initGooglePlaces = () => {
        // Web Component <gmp-place-autocomplete> will be instantiated automatically
        
        // Shared place handling logic
        const handlePlaceSelection = async (place) => {
            if (!place) return;

            // For safety, ensure the data we need to display is fetched
            try {
                if (typeof place.fetchFields === 'function') {
                    // Fetch fields that might be used by both old and new versions
                    await place.fetchFields({ fields: ['displayName', 'formattedAddress', 'name', 'formatted_address'] });
                }
            } catch (err) {
                console.warn(window.t('logs.location.fetchPlaceInfoFail'), err);
            }

            // Safely get place name (supports string or object format)
            let name = '';
            if (place.displayName) {
                name = typeof place.displayName === 'string' ? place.displayName : place.displayName.text;
            }
            if (!name) name = place.name || '';

            // Safely get address
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
                // Web Component updates might have their own lifecycle, slight delay before overriding to prevent flickering
                setTimeout(() => {
                    inputLocation.value = displayStr;
                    if (btnClearLocation) btnClearLocation.style.display = 'block';
                }, 50);
            }
        };

        // Bind old event (ensure compatibility)
        inputLocation.addEventListener('gmp-placeselect', (e) => {
            if (e.place) handlePlaceSelection(e.place);
        });

        // Bind new event (Google officially recommends switching to this in the future)
        inputLocation.addEventListener('gmp-select', (e) => {
            if (e.placePrediction && typeof e.placePrediction.toPlace === 'function') {
                handlePlaceSelection(e.placePrediction.toPlace());
            } else if (e.place) {
                handlePlaceSelection(e.place);
            }
        });

        // Prevent triggering other functions (like form submission) when pressing Enter in dropdown
        inputLocation.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
            }
        });
    };

    // Dynamically load Google Maps JavaScript API script
    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initGooglePlaces&loading=async`;
    script.async = true;
    script.defer = true;
    script.onerror = (e) => {
        console.error(window.t('logs.location.apiLoadFail'), e);
    };
    document.head.appendChild(script);
}
