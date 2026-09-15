(function () {
  function injectTransparentLogoStyle() {
    if (document.getElementById('iori-custom-logo-style')) return;
    const style = document.createElement('style');
    style.id = 'iori-custom-logo-style';
    style.textContent = `
      .site-card .site-icon img {
        background-color: transparent !important;
        object-fit: contain !important;
      }
    `;
    document.head.appendChild(style);
  }

  function patchBingSearch() {
    const option = document.querySelector('.search-engine-option[data-engine="baidu"], .search-engine-option[data-engine="bing"]');
    if (!option) return;

    const label = option.querySelector('span');
    if (label) label.textContent = 'Bing';

    const searchInputs = Array.from(document.querySelectorAll('.search-input-target'));

    function isBingActive() {
      const active = document.querySelector('.search-engine-option.active');
      return active && (active.dataset.engine === 'baidu' || active.dataset.engine === 'bing');
    }

    function syncPlaceholder() {
      if (!isBingActive()) return;
      searchInputs.forEach(input => {
        input.placeholder = 'Bing 搜索...';
      });
    }

    option.addEventListener('click', () => {
      queueMicrotask(syncPlaceholder);
      setTimeout(syncPlaceholder, 0);
    }, true);

    searchInputs.forEach(input => {
      input.addEventListener('keydown', event => {
        if (event.key !== 'Enter' || !isBingActive()) return;
        const query = input.value.trim();
        if (!query) return;

        event.preventDefault();
        event.stopImmediatePropagation();
        window.open(`https://www.bing.com/search?q=${encodeURIComponent(query)}`, '_blank', 'noopener,noreferrer');
      }, true);
    });

    syncPlaceholder();
  }

  function setFavicon(href) {
    if (!href) return;

    document.querySelectorAll('link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]').forEach(link => link.remove());

    const icon = document.createElement('link');
    icon.rel = 'icon';
    icon.href = href;
    document.head.appendChild(icon);

    const shortcut = document.createElement('link');
    shortcut.rel = 'shortcut icon';
    shortcut.href = href;
    document.head.appendChild(shortcut);

    const apple = document.createElement('link');
    apple.rel = 'apple-touch-icon';
    apple.href = href;
    document.head.appendChild(apple);
  }

  async function loadCustomFavicon() {
    try {
      const response = await fetch('/api/site-icon', { cache: 'no-store' });
      if (!response.ok) return;
      const payload = await response.json();
      if (payload?.data?.iconUrl) setFavicon(payload.data.iconUrl);
    } catch (error) {
      console.warn('Failed to load custom site icon:', error);
    }
  }

  function init() {
    injectTransparentLogoStyle();
    patchBingSearch();
    loadCustomFavicon();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
