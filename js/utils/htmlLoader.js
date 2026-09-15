export async function loadHTMLComponents() {
    const includes = document.querySelectorAll('[data-include]');
    const promises = Array.from(includes).map(async (el) => {
        const file = el.getAttribute('data-include');
        try {
            // Append timestamp or version to prevent caching during dev
            const url = new URL(file, window.location.href);
            url.searchParams.set('v', Date.now()); // Optional cache buster
            const response = await fetch(url);
            if (response.ok) {
                el.innerHTML = await response.text();
            } else {
                console.error(window.t('logs.htmlLoader.loadFail').replace('{file}', file).replace('{status}', response.status));
            }
        } catch (e) {
            console.error(window.t('logs.htmlLoader.fetchFail').replace('{file}', file), e);
        }
    });
    await Promise.all(promises);
}
