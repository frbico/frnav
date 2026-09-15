(function () {
  const FALLBACK_ENGINES = [
    { id: 'google', name: 'Google', url: 'https://www.google.com/search?q={query}', enabled: true },
    { id: 'bing', name: 'Bing', url: 'https://www.bing.com/search?q={query}', enabled: true },
    { id: 'github', name: 'Github', url: 'https://github.com/search?q={query}', enabled: true },
  ];

  let configuredEngines = FALLBACK_ENGINES;
  let currentEngine = 'local';

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

  function patchLegacyBaiduTextImmediately() {
    document.querySelectorAll('.search-engine-option[data-engine="baidu"]').forEach(option => {
      const label = option.querySelector('span');
      if (label) label.textContent = 'Bing';
    });

    document.querySelectorAll('.search-engine-option.active[data-engine="baidu"]').forEach(() => {
      document.querySelectorAll('.search-input-target').forEach(input => {
        input.placeholder = 'Bing 搜索...';
      });
    });
  }

  function engineById(id) {
    return configuredEngines.find(engine => engine.id === id && engine.enabled !== false) || null;
  }

  function buildEngineOption(engine, active) {
    const option = document.createElement('label');
    option.className = `search-engine-option${active ? ' active' : ''}`;
    option.dataset.engine = engine.id;
    if (engine.url) option.dataset.searchUrl = engine.url;
    option.dataset.placeholder = engine.id === 'local' ? '搜索书签...' : `${engine.name} 搜索...`;

    const span = document.createElement('span');
    span.textContent = engine.name;
    option.appendChild(span);
    return option;
  }

  function updateSearchUi() {
    const selected = currentEngine === 'local'
      ? { id: 'local', name: '站内' }
      : engineById(currentEngine);

    if (!selected) currentEngine = 'local';

    document.querySelectorAll('.search-engine-option').forEach(option => {
      option.classList.toggle('active', option.dataset.engine === currentEngine);
    });

    const placeholder = currentEngine === 'local'
      ? '搜索书签...'
      : `${engineById(currentEngine)?.name || '搜索'} 搜索...`;

    document.querySelectorAll('.search-input-target').forEach(input => {
      input.placeholder = placeholder;
    });
  }

  function resetLegacyControllerToLocal() {
    // 原项目的 Home.initSearch 已经在 main.js 中执行。先让它停留在“站内”模式，
    // 后续站外搜索由本增强脚本接管，避免旧的 Baidu/Github 逻辑与自定义列表打架。
    const oldLocal = document.querySelector('.search-engine-option[data-engine="local"]');
    if (oldLocal) {
      try { oldLocal.click(); } catch { /* ignore */ }
    }
  }

  function renderSearchEngines(engines) {
    configuredEngines = (Array.isArray(engines) ? engines : FALLBACK_ENGINES)
      .filter(engine => engine && engine.enabled !== false && engine.id && engine.name && engine.url);

    const savedBeforeReset = localStorage.getItem('search_engine') || 'local';
    resetLegacyControllerToLocal();

    let preferred = savedBeforeReset === 'baidu' ? 'bing' : savedBeforeReset;
    if (preferred !== 'local' && !engineById(preferred)) preferred = 'local';
    currentEngine = preferred;
    localStorage.setItem('search_engine', currentEngine);

    document.querySelectorAll('.search-engine-wrapper').forEach(wrapper => {
      wrapper.innerHTML = '';
      wrapper.appendChild(buildEngineOption({ id: 'local', name: '站内', url: '' }, currentEngine === 'local'));
      configuredEngines.forEach(engine => {
        wrapper.appendChild(buildEngineOption(engine, currentEngine === engine.id));
      });
    });

    document.querySelectorAll('.search-engine-option').forEach(option => {
      option.addEventListener('click', event => {
        event.preventDefault();
        const nextEngine = option.dataset.engine || 'local';
        currentEngine = nextEngine === 'local' || engineById(nextEngine) ? nextEngine : 'local';
        localStorage.setItem('search_engine', currentEngine);
        updateSearchUi();

        document.querySelectorAll('.search-input-target').forEach(input => input.focus());

        if (currentEngine === 'local') {
          const input = document.querySelector('.search-input-target');
          if (input) input.dispatchEvent(new Event('input', { bubbles: true }));
        }
      });
    });

    updateSearchUi();
  }

  function bindSearchInputController() {
    document.querySelectorAll('.search-input-target').forEach(input => {
      input.addEventListener('input', event => {
        if (currentEngine === 'local') return;

        // 站外搜索时阻止原脚本把输入当成站内筛选词。
        event.stopImmediatePropagation();
        const value = input.value;
        document.querySelectorAll('.search-input-target').forEach(other => {
          if (other !== input) other.value = value;
        });
      }, true);

      input.addEventListener('keydown', event => {
        if (event.key !== 'Enter' || currentEngine === 'local') return;
        const engine = engineById(currentEngine);
        const query = input.value.trim();
        if (!engine || !query) return;

        event.preventDefault();
        event.stopImmediatePropagation();
        const targetUrl = engine.url.split('{query}').join(encodeURIComponent(query));
        window.open(targetUrl, '_blank', 'noopener,noreferrer');
      }, true);
    });
  }

  async function loadSearchEngines() {
    try {
      const response = await fetch('/api/search-engines', { cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = await response.json();
      renderSearchEngines(payload?.data?.engines || FALLBACK_ENGINES);
    } catch (error) {
      console.warn('Failed to load custom search engines:', error);
      renderSearchEngines(FALLBACK_ENGINES);
    }
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

  function getCurrentFooterDescription(paragraph) {
    const text = String(paragraph?.textContent || '').trim();
    return text.replace(/^©\s*\d{4}\s*/u, '').trim();
  }

  function renderFooterSettings(config) {
    const footer = document.querySelector('footer');
    const row = footer?.querySelector('.flex.justify-center.items-center');
    if (!row) return;

    const githubLink = row.querySelector('a');
    const separator = row.querySelector('span.text-gray-300');
    const paragraph = row.querySelector('p');
    if (!paragraph) return;

    const existingDescription = getCurrentFooterDescription(paragraph);
    const showGithub = config.home_footer_show_github !== false;
    const githubUrl = String(config.home_footer_github_url ?? 'https://slink.661388.xyz/iori-nav').trim();
    const copyrightTemplate = String(config.home_footer_copyright_text ?? '© {year}');
    const copyrightText = copyrightTemplate.replaceAll('{year}', String(new Date().getFullYear())).trim();
    const footerDescription = String(config.home_footer_text || existingDescription).trim();

    if (githubLink) {
      githubLink.style.display = showGithub ? '' : 'none';
      if (githubUrl) {
        githubLink.href = githubUrl;
        githubLink.rel = 'noopener noreferrer';
      } else {
        githubLink.removeAttribute('href');
      }
    }

    const rightText = [copyrightText, footerDescription].filter(Boolean).join(' ');
    paragraph.textContent = rightText;
    paragraph.style.display = rightText ? '' : 'none';
    if (separator) separator.style.display = showGithub && rightText ? '' : 'none';
  }

  async function loadFooterSettings() {
    try {
      const response = await fetch('/api/public-config', { cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const config = await response.json();
      renderFooterSettings(config || {});
    } catch (error) {
      console.warn('Failed to load footer settings:', error);
    }
  }

  function init() {
    injectTransparentLogoStyle();
    patchLegacyBaiduTextImmediately();
    bindSearchInputController();
    void loadSearchEngines();
    void loadCustomFavicon();
    void loadFooterSettings();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
