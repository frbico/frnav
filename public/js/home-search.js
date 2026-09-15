(function () {
  const Home = window.IoriHome = window.IoriHome || {};

  // 站点 Logo 默认保持透明背景并完整显示，避免透明 PNG/SVG 被灰白底填充。
  // 用 CSS 覆盖现有 Tailwind bg/object-cover 类，这样 SSR 卡片和前端动态重绘卡片都会生效。
  function ensureTransparentLogoStyle() {
    if (document.getElementById('iori-transparent-logo-style')) return;
    const style = document.createElement('style');
    style.id = 'iori-transparent-logo-style';
    style.textContent = `
      .site-card .site-icon img {
        background-color: transparent !important;
        object-fit: contain !important;
      }
    `;
    document.head.appendChild(style);
  }

  ensureTransparentLogoStyle();

  Home.initSearch = function () {
    const sitesGrid = document.getElementById('sitesGrid');
    const searchInputs = document.querySelectorAll('.search-input-target');

    // 兼容旧模板：服务端目前仍输出 Baidu，这里在前端无侵入替换为 Bing。
    // 后续如果模板改成 data-search-url，也会自动按通用配置工作。
    const legacyBaiduOption = document.querySelector('.search-engine-option[data-engine="baidu"]');
    if (legacyBaiduOption) {
      legacyBaiduOption.dataset.engine = 'bing';
      legacyBaiduOption.dataset.placeholder = 'Bing 搜索...';
      legacyBaiduOption.dataset.searchUrl = 'https://www.bing.com/search?q={query}';
      const label = legacyBaiduOption.querySelector('span');
      if (label) label.textContent = 'Bing';
    }

    const engineOptions = document.querySelectorAll('.search-engine-option');
    let searchCardCache = null;
    let searchDebounceTimer = null;
    let currentSearchEngine = 'local';

    // 默认引擎配置。任何额外的 .search-engine-option 只要提供
    // data-search-url="https://example.com/search?q={query}" 即可自定义搜索引擎。
    const defaultEngineConfig = {
      local: {
        placeholder: '搜索书签...',
        searchUrl: ''
      },
      google: {
        placeholder: 'Google 搜索...',
        searchUrl: 'https://www.google.com/search?q={query}'
      },
      bing: {
        placeholder: 'Bing 搜索...',
        searchUrl: 'https://www.bing.com/search?q={query}'
      },
      github: {
        placeholder: 'Github 搜索...',
        searchUrl: 'https://github.com/search?q={query}'
      }
    };

    function getEngineOption(engine) {
      return Array.from(engineOptions).find(opt => opt.dataset.engine === engine) || null;
    }

    function getEngineConfig(engine) {
      const option = getEngineOption(engine);
      const fallback = defaultEngineConfig[engine] || {};
      return {
        placeholder: option?.dataset.placeholder || fallback.placeholder || `${engine} 搜索...`,
        searchUrl: option?.dataset.searchUrl || fallback.searchUrl || ''
      };
    }

    function clearSearchCardCache() {
      searchCardCache = null;
    }

    // 预缓存卡片搜索数据：从 IORI_SITES 按 data-id 查表，避免把数据再塞进 card 的 data-* 属性
    function getSearchCardCache() {
      if (searchCardCache) return searchCardCache;
      const cards = sitesGrid?.querySelectorAll('.site-card');
      if (!cards) return [];
      const sitesById = new Map();
      (window.IORI_SITES || []).forEach(s => sitesById.set(String(s.id), s));
      searchCardCache = Array.from(cards).map(card => {
        const id = card.getAttribute('data-id');
        const s = sitesById.get(String(id)) || {};
        const text = (s.searchText || [s.nameHtml, s.urlHtml, s.catalogHtml, s.descHtml]
          .map(v => String(v || '').toLowerCase()).join('\0'));
        return { el: card, text };
      });
      return searchCardCache;
    }

    function getCurrentLocalSearchKeyword() {
      if (currentSearchEngine !== 'local') return '';
      for (const input of searchInputs) {
        const keyword = input.value.trim();
        if (keyword) return keyword;
      }
      return '';
    }

    function applyLocalSearchFilter(keyword) {
      const normalizedKeyword = String(keyword || '').toLowerCase().trim();
      const cached = getSearchCardCache();

      cached.forEach(({ el, text }) => {
        if (normalizedKeyword === '' || text.includes(normalizedKeyword)) {
          el.classList.remove('hidden');
        } else {
          el.classList.add('hidden');
        }
      });

      updateHeading(normalizedKeyword);
    }

    function reapplyLocalSearchFilter() {
      applyLocalSearchFilter(getCurrentLocalSearchKeyword());
    }

    function updateSearchEngineUI(engine) {
      engineOptions.forEach(opt => {
        if (opt.dataset.engine === engine) {
          opt.classList.add('active');
        } else {
          opt.classList.remove('active');
        }
      });

      const { placeholder } = getEngineConfig(engine);

      searchInputs.forEach(input => {
        input.placeholder = placeholder;
        if (engine === 'local' && input.value.trim()) {
          input.dispatchEvent(new Event('input'));
        }
      });
    }

    function updateHeading(keyword, activeCatalog, count) {
      const heading = document.querySelector('[data-role="list-heading"]');
      if (!heading) return;

      const visibleCount = (count !== undefined) ? count : (sitesGrid?.querySelectorAll('.site-card:not(.hidden)').length || 0);
      const isMobile = window.innerWidth < 440;

      if (activeCatalog !== undefined) {
        if (activeCatalog) {
          heading.dataset.active = activeCatalog;
        } else {
          delete heading.dataset.active;
        }
      }

      if (keyword) {
        heading.textContent = isMobile ? `${visibleCount} 个书签` : `搜索结果 · ${visibleCount} 个书签`;
      } else {
        const currentActive = heading.dataset.active;
        if (isMobile) {
          heading.textContent = `${visibleCount} 个书签`;
        } else if (currentActive) {
          heading.textContent = `${currentActive} · ${visibleCount} 个书签`;
        } else {
          heading.textContent = `全部收藏 · ${visibleCount} 个书签`;
        }
      }
    }

    Home.clearSearchCardCache = clearSearchCardCache;
    Home.reapplyLocalSearchFilter = reapplyLocalSearchFilter;
    Home.updateHeading = updateHeading;

    if (engineOptions.length > 0) {
      let savedEngine = localStorage.getItem('search_engine') || 'local';

      // 从旧版本迁移：曾经保存为 baidu 的用户自动切换到 bing。
      if (savedEngine === 'baidu') {
        savedEngine = 'bing';
        localStorage.setItem('search_engine', savedEngine);
      }

      const engineExists = Array.from(engineOptions).some(
        opt => opt.dataset.engine === savedEngine
      );

      currentSearchEngine = engineExists ? savedEngine : 'local';
      if (!engineExists) {
        localStorage.setItem('search_engine', currentSearchEngine);
      }

      updateSearchEngineUI(currentSearchEngine);
    } else {
      localStorage.removeItem('search_engine');
    }

    engineOptions.forEach(option => {
      option.addEventListener('click', () => {
        currentSearchEngine = option.dataset.engine;
        localStorage.setItem('search_engine', currentSearchEngine);
        updateSearchEngineUI(currentSearchEngine);

        searchInputs.forEach(input => input.focus());
      });
    });

    searchInputs.forEach(input => {
      input.addEventListener('input', function () {
        if (currentSearchEngine !== 'local') return;

        const value = this.value;
        searchInputs.forEach(otherInput => {
          if (otherInput !== this) otherInput.value = value;
        });

        clearTimeout(searchDebounceTimer);
        searchDebounceTimer = setTimeout(() => {
          applyLocalSearchFilter(value);
        }, 200);
      });

      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && currentSearchEngine !== 'local') {
          e.preventDefault();
          const query = this.value.trim();
          if (query) {
            const { searchUrl } = getEngineConfig(currentSearchEngine);
            if (searchUrl) {
              const url = searchUrl.replace('{query}', encodeURIComponent(query));
              window.open(url, '_blank', 'noopener,noreferrer');
            }
          }
        }
      });
    });

    updateHeading();
  };
})();
