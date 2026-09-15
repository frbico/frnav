(function () {
  function patchAdminSearchPreview() {
    // 后台静态预览仍写死为 Baidu；在不改动大体积 HTML 模板的情况下同步为 Bing。
    document.querySelectorAll('.search-engine-option[data-engine="baidu"]').forEach(option => {
      option.dataset.engine = 'bing';
      const label = option.querySelector('span');
      if (label) label.textContent = 'Bing';
    });

    const searchEngineLabel = document.querySelector('label[for="searchEngineSwitch"]');
    if (searchEngineLabel) {
      searchEngineLabel.textContent = searchEngineLabel.textContent.replace(/Baidu/g, 'Bing');
    }

    ['cardStyle1Preview', 'cardStyle2Preview', 'cardStyle3Preview'].forEach(id => {
      const root = document.getElementById(id);
      if (!root) return;

      root.querySelectorAll('img[alt="Baidu"]').forEach(img => {
        img.src = 'https://www.bing.com/favicon.ico';
        img.alt = 'Bing';
        img.classList.remove('object-cover', 'bg-gray-100', 'dark:bg-gray-700');
        img.classList.add('object-contain', 'bg-transparent');
      });

      root.querySelectorAll('.site-title').forEach(title => {
        if (title.textContent.trim() === 'Baidu') title.textContent = 'Bing';
      });
    });
  }

  const initSettings = () => {
    const settingsBtn = document.getElementById('settingsBtn');
    const settingsModal = document.getElementById('settingsModal');
    if (!settingsBtn || !settingsModal) return;

    patchAdminSearchPreview();

    window.AdminSettings = window.AdminSettings || {};
    window.AdminSettings.preview?.init?.();
    window.AdminSettings.wallpaper?.init?.();
    window.AdminSettings.ai?.init?.();
    window.AdminSettings.backup?.init?.();
    window.AdminSettings.core?.init?.();
  };

  initSettings();
})();
