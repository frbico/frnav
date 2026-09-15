(function () {
  const DEFAULT_GITHUB_URL = 'https://slink.661388.xyz/iori-nav';
  const DEFAULT_COPYRIGHT_TEXT = '© {year}';

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

  function ensureFooterSettingsControls() {
    if (document.getElementById('homeFooterShowGithub')) return;

    const footerTextInput = document.getElementById('homeFooterText');
    const field = footerTextInput?.closest('div');
    if (!field) return;

    field.insertAdjacentHTML('afterend', `
      <div class="pt-2 border-t border-gray-200">
        <div class="flex items-center justify-between gap-3">
          <label for="homeFooterShowGithub" class="text-xs text-gray-500">显示 GitHub 图标和链接</label>
          <label class="switch scale-75 origin-right">
            <input type="checkbox" id="homeFooterShowGithub" checked>
            <span class="slider round"></span>
          </label>
        </div>
      </div>
      <div>
        <label for="homeFooterGithubUrl" class="text-xs text-gray-500 block mb-1">GitHub 链接地址</label>
        <input type="url" id="homeFooterGithubUrl" placeholder="https://github.com/owner/repo" class="w-full text-sm p-2 border rounded" autocomplete="off" inputmode="url">
      </div>
      <div>
        <label for="homeFooterCopyrightText" class="text-xs text-gray-500 block mb-1">版权文字</label>
        <input type="text" id="homeFooterCopyrightText" placeholder="© {year}" class="w-full text-sm p-2 border rounded">
        <p class="text-[11px] text-gray-400 mt-1">可完全修改；使用 <code>{year}</code> 会自动替换为当前年份，例如：© {year}</p>
      </div>
    `);
  }

  function ensureFooterPreviewMarkup() {
    const root = document.getElementById('homeLivePreview');
    const footerInner = root?.querySelector('.live-preview-footer-inner');
    if (!footerInner) return;

    const github = footerInner.querySelector('.live-preview-footer-link');
    if (github) github.dataset.previewRole = 'footerGithub';

    const paragraph = footerInner.querySelector('p');
    if (paragraph && !paragraph.querySelector('[data-preview-role="footerCopyright"]')) {
      paragraph.innerHTML = '<span data-preview-role="footerCopyright"></span> <span data-preview-role="footerText">曾梦想仗剑走天涯</span>';
    }
  }

  function renderCopyrightText(value) {
    const text = String(value ?? DEFAULT_COPYRIGHT_TEXT);
    return text.replaceAll('{year}', String(new Date().getFullYear()));
  }

  function applyFooterPreview() {
    ensureFooterPreviewMarkup();

    const settings = window.AdminSettings?.currentSettings || {};
    const showGithubInput = document.getElementById('homeFooterShowGithub');
    const githubUrlInput = document.getElementById('homeFooterGithubUrl');
    const copyrightInput = document.getElementById('homeFooterCopyrightText');
    const footerTextInput = document.getElementById('homeFooterText');

    const showGithub = showGithubInput ? showGithubInput.checked : settings.home_footer_show_github !== false;
    const githubUrl = githubUrlInput ? githubUrlInput.value.trim() : String(settings.home_footer_github_url || DEFAULT_GITHUB_URL);
    const copyrightTemplate = copyrightInput ? copyrightInput.value : String(settings.home_footer_copyright_text ?? DEFAULT_COPYRIGHT_TEXT);
    const footerText = footerTextInput ? footerTextInput.value : String(settings.home_footer_text || '曾梦想仗剑走天涯');

    const root = document.getElementById('homeLivePreview');
    const github = root?.querySelector('[data-preview-role="footerGithub"]');
    const separator = root?.querySelector('.live-preview-footer-separator');
    const copyright = root?.querySelector('[data-preview-role="footerCopyright"]');
    const footerTextEl = root?.querySelector('[data-preview-role="footerText"]');

    if (github) {
      github.style.display = showGithub ? '' : 'none';
      github.title = githubUrl || 'GitHub';
    }
    if (copyright) copyright.textContent = renderCopyrightText(copyrightTemplate);
    if (footerTextEl) footerTextEl.textContent = footerText;

    const hasRightSide = Boolean(renderCopyrightText(copyrightTemplate).trim() || footerText.trim());
    if (separator) separator.style.display = showGithub && hasRightSide ? '' : 'none';
  }

  function patchFooterSettingsBehavior() {
    const ns = window.AdminSettings = window.AdminSettings || {};
    const settings = ns.currentSettings = ns.currentSettings || {};

    if (settings.home_footer_show_github === undefined) settings.home_footer_show_github = true;
    if (settings.home_footer_github_url === undefined) settings.home_footer_github_url = DEFAULT_GITHUB_URL;
    if (settings.home_footer_copyright_text === undefined) settings.home_footer_copyright_text = DEFAULT_COPYRIGHT_TEXT;

    const originalApplyServerSettings = ns.defaults?.applyServerSettings;
    if (originalApplyServerSettings) {
      ns.defaults.applyServerSettings = function (serverSettings, targetSettings) {
        const target = originalApplyServerSettings(serverSettings, targetSettings);
        if (serverSettings?.home_footer_show_github !== undefined) {
          target.home_footer_show_github = serverSettings.home_footer_show_github === true
            || serverSettings.home_footer_show_github === 'true'
            || serverSettings.home_footer_show_github === '1';
        }
        if (serverSettings?.home_footer_github_url !== undefined) {
          target.home_footer_github_url = String(serverSettings.home_footer_github_url ?? '');
        }
        if (serverSettings?.home_footer_copyright_text !== undefined) {
          target.home_footer_copyright_text = String(serverSettings.home_footer_copyright_text ?? '');
        }
        return target;
      };
    }

    const originalCollect = ns.form?.collectSettingsFromInputs;
    if (originalCollect) {
      ns.form.collectSettingsFromInputs = function () {
        const target = originalCollect();
        target.home_footer_show_github = !!document.getElementById('homeFooterShowGithub')?.checked;
        target.home_footer_github_url = document.getElementById('homeFooterGithubUrl')?.value.trim() || '';
        target.home_footer_copyright_text = document.getElementById('homeFooterCopyrightText')?.value ?? '';
        return target;
      };
    }

    const originalUpdateUi = ns.form?.updateUIFromSettings;
    if (originalUpdateUi) {
      ns.form.updateUIFromSettings = function (options) {
        const result = originalUpdateUi(options);
        const current = ns.currentSettings || {};
        const showGithubInput = document.getElementById('homeFooterShowGithub');
        const githubUrlInput = document.getElementById('homeFooterGithubUrl');
        const copyrightInput = document.getElementById('homeFooterCopyrightText');
        if (showGithubInput) showGithubInput.checked = current.home_footer_show_github !== false;
        if (githubUrlInput) githubUrlInput.value = current.home_footer_github_url ?? DEFAULT_GITHUB_URL;
        if (copyrightInput) copyrightInput.value = current.home_footer_copyright_text ?? DEFAULT_COPYRIGHT_TEXT;
        applyFooterPreview();
        return result;
      };
    }

    ['homeFooterShowGithub', 'homeFooterGithubUrl', 'homeFooterCopyrightText', 'homeFooterText'].forEach(id => {
      const element = document.getElementById(id);
      element?.addEventListener('input', applyFooterPreview);
      element?.addEventListener('change', applyFooterPreview);
    });
  }

  const initSettings = () => {
    const settingsBtn = document.getElementById('settingsBtn');
    const settingsModal = document.getElementById('settingsModal');
    if (!settingsBtn || !settingsModal) return;

    patchAdminSearchPreview();
    ensureFooterSettingsControls();
    ensureFooterPreviewMarkup();

    window.AdminSettings = window.AdminSettings || {};
    patchFooterSettingsBehavior();
    window.AdminSettings.preview?.init?.();
    window.AdminSettings.wallpaper?.init?.();
    window.AdminSettings.ai?.init?.();
    window.AdminSettings.backup?.init?.();
    window.AdminSettings.core?.init?.();
    applyFooterPreview();
  };

  initSettings();
})();
