(function () {
  const DEFAULT_ENGINES = [
    { id: 'google', name: 'Google', url: 'https://www.google.com/search?q={query}', enabled: true },
    { id: 'bing', name: 'Bing', url: 'https://www.bing.com/search?q={query}', enabled: true },
    { id: 'github', name: 'Github', url: 'https://github.com/search?q={query}', enabled: true },
  ];

  let currentValue = '';
  let pendingUpload = '';
  let cleared = false;
  let engineItems = DEFAULT_ENGINES.map(item => ({ ...item }));

  function getCsrfToken() {
    return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
  }

  function injectAdminCustomStyles() {
    if (document.getElementById('iori-admin-custom-style')) return;
    const style = document.createElement('style');
    style.id = 'iori-admin-custom-style';
    style.textContent = `
      #siteIconSettingBlock,
      #customSearchEngineSettings {
        font-size: 14px !important;
        line-height: 1.5 !important;
      }
      #siteIconSettingBlock > label,
      #customSearchEngineSettings .custom-setting-label {
        display: block;
        margin-bottom: 6px;
        color: #6b7280;
        font-size: 12px !important;
        line-height: 18px !important;
        font-weight: 400 !important;
      }
      #siteIconSettingBlock input,
      #customSearchEngineSettings input[type="text"],
      #customSearchEngineSettings input[type="url"] {
        box-sizing: border-box;
        width: 100%;
        padding: 8px 10px !important;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        background: #fff;
        color: #374151;
        font-size: 14px !important;
        line-height: 20px !important;
      }
      #siteIconHint,
      #siteIconStatus,
      #customSearchEngineSettings .custom-setting-hint,
      #searchEngineStatus {
        font-size: 12px !important;
        line-height: 18px !important;
      }
      #siteIconSettingBlock button,
      #customSearchEngineSettings button {
        font-size: 13px !important;
        line-height: 18px !important;
      }
      #customSearchEngineSettings {
        margin-top: 12px;
        padding: 12px;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        background: #f9fafb;
      }
      #customSearchEngineSettings .custom-search-title {
        margin: 0 0 4px;
        color: #374151;
        font-size: 14px !important;
        line-height: 20px !important;
        font-weight: 600;
      }
      #customSearchEngineSettings .engine-row {
        margin-top: 10px;
        padding: 10px;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        background: #fff;
      }
      #customSearchEngineSettings .engine-row-grid {
        display: grid;
        grid-template-columns: minmax(100px, 0.7fr) minmax(220px, 2fr);
        gap: 8px;
      }
      #customSearchEngineSettings .engine-row-actions {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        margin-top: 8px;
      }
      #customSearchEngineSettings .engine-action-group {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }
      #customSearchEngineSettings .engine-small-btn {
        padding: 5px 9px;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        background: #fff;
        color: #4b5563;
      }
      #customSearchEngineSettings .engine-delete-btn {
        color: #b91c1c;
      }
      #customSearchEngineSettings .engine-primary-btn {
        padding: 6px 11px;
        border: 0;
        border-radius: 6px;
        background: #2563eb;
        color: #fff;
      }
      #customSearchEngineSettings .engine-secondary-btn {
        padding: 6px 11px;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        background: #fff;
        color: #4b5563;
      }
      #customSearchEngineSettings .engine-enabled-label {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        color: #6b7280;
        font-size: 12px !important;
      }
      @media (max-width: 720px) {
        #customSearchEngineSettings .engine-row-grid {
          grid-template-columns: 1fr;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function patchAdminBingPreview() {
    document.querySelectorAll('.search-engine-option[data-engine="baidu"]').forEach(option => {
      option.dataset.engine = 'bing';
      const label = option.querySelector('span');
      if (label) label.textContent = 'Bing';
    });

    const searchEngineLabel = document.querySelector('label[for="searchEngineSwitch"]');
    if (searchEngineLabel) {
      searchEngineLabel.textContent = searchEngineLabel.textContent.replace(/Baidu/g, 'Bing');
    }
  }

  function ensureIconUi() {
    if (document.getElementById('siteIconSettingBlock')) return;

    const anchor = document.getElementById('homeSiteName');
    const container = anchor?.closest('.space-y-3');
    if (!container) return;

    const block = document.createElement('div');
    block.id = 'siteIconSettingBlock';
    block.innerHTML = `
      <label>网站 Logo / 浏览器图标 (Favicon)</label>
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
        <img id="siteIconPreview" src="/favicon.svg" alt="网站图标预览" style="width:40px;height:40px;border-radius:8px;object-fit:contain;border:1px solid #e5e7eb;background:transparent;flex:0 0 auto;">
        <div style="flex:1;min-width:0;">
          <input type="url" id="siteIconUrl" placeholder="https://example.com/icon.png">
          <p id="siteIconHint" style="margin:4px 0 0;color:#9ca3af;">支持 HTTPS 图片地址，或直接上传 PNG/JPG/WebP/GIF/ICO；建议使用正方形图标。</p>
        </div>
      </div>
      <div style="display:flex;flex-wrap:wrap;align-items:center;gap:8px;">
        <button type="button" id="siteIconChooseBtn" style="padding:6px 11px;border:0;border-radius:6px;background:#2563eb;color:#fff;">上传图片</button>
        <button type="button" id="siteIconClearBtn" style="padding:6px 11px;border:1px solid #e5e7eb;border-radius:6px;background:#fff;color:#4b5563;">恢复默认</button>
        <input type="file" id="siteIconFile" accept="image/png,image/jpeg,image/webp,image/gif,image/x-icon,image/vnd.microsoft.icon" style="display:none;">
        <span id="siteIconStatus" style="color:#6b7280;"></span>
      </div>
    `;
    container.appendChild(block);

    const input = document.getElementById('siteIconUrl');
    const fileInput = document.getElementById('siteIconFile');
    const chooseBtn = document.getElementById('siteIconChooseBtn');
    const clearBtn = document.getElementById('siteIconClearBtn');

    input?.addEventListener('input', () => {
      pendingUpload = '';
      cleared = false;
      const value = input.value.trim();
      if (value) updateIconPreview(value);
    });

    chooseBtn?.addEventListener('click', () => fileInput?.click());

    fileInput?.addEventListener('change', event => {
      const file = event.target.files?.[0];
      if (!file) return;

      if (file.size > 200 * 1024) {
        alert('图片过大，请选择 200KB 以内的图标文件。');
        fileInput.value = '';
        return;
      }

      const allowed = new Set([
        'image/png', 'image/jpeg', 'image/webp', 'image/gif',
        'image/x-icon', 'image/vnd.microsoft.icon'
      ]);
      if (!allowed.has(file.type)) {
        alert('仅支持 PNG、JPG、WebP、GIF 或 ICO。');
        fileInput.value = '';
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        pendingUpload = String(reader.result || '');
        cleared = false;
        input.value = '';
        input.placeholder = `已选择：${file.name}`;
        updateIconPreview(pendingUpload);
        setIconStatus('已选择图片，点击底部“保存设置”生效');
      };
      reader.readAsDataURL(file);
    });

    clearBtn?.addEventListener('click', () => {
      pendingUpload = '';
      cleared = true;
      if (input) {
        input.value = '';
        input.placeholder = '将恢复默认 /favicon.svg';
      }
      updateIconPreview('/favicon.svg');
      setIconStatus('将恢复默认图标，点击底部“保存设置”生效');
    });
  }

  function setIconStatus(text, isError = false) {
    const status = document.getElementById('siteIconStatus');
    if (!status) return;
    status.textContent = text || '';
    status.style.color = isError ? '#dc2626' : (text ? '#059669' : '#6b7280');
  }

  function updateIconPreview(src) {
    const preview = document.getElementById('siteIconPreview');
    if (preview && src) preview.src = src;
  }

  async function loadIconSetting() {
    ensureIconUi();
    const input = document.getElementById('siteIconUrl');
    try {
      const response = await fetch('/api/site-icon', { cache: 'no-store' });
      const payload = await response.json();
      const data = payload?.data || {};
      currentValue = data.value || '';
      pendingUpload = '';
      cleared = false;

      if (input) {
        if (currentValue.startsWith('https://')) {
          input.value = currentValue;
          input.placeholder = 'https://example.com/icon.png';
        } else {
          input.value = '';
          input.placeholder = currentValue ? '当前使用已上传图片，可重新上传或恢复默认' : 'https://example.com/icon.png';
        }
      }

      updateIconPreview(data.iconUrl || '/favicon.svg');
    } catch (error) {
      console.error('Failed to load site icon setting:', error);
      setIconStatus('网站图标设置读取失败', true);
    }
  }

  async function saveIconSetting() {
    const input = document.getElementById('siteIconUrl');
    if (!input) return;

    let value = currentValue;
    if (cleared) {
      value = '';
    } else if (pendingUpload) {
      value = pendingUpload;
    } else if (input.value.trim()) {
      value = input.value.trim();
    }

    setIconStatus('正在保存网站图标...');
    try {
      const response = await fetch('/api/site-icon', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': getCsrfToken(),
        },
        body: JSON.stringify({ value }),
      });
      const payload = await response.json();
      if (!response.ok || payload?.code !== 200) {
        throw new Error(payload?.message || '保存失败');
      }

      currentValue = value;
      pendingUpload = '';
      cleared = false;
      setIconStatus(value ? '网站图标已保存' : '已恢复默认网站图标');
      if (payload?.data?.iconUrl) updateIconPreview(payload.data.iconUrl);
    } catch (error) {
      console.error('Failed to save site icon:', error);
      setIconStatus(error.message || '网站图标保存失败', true);
    }
  }

  function ensureSearchEngineUi() {
    if (document.getElementById('customSearchEngineSettings')) return;

    const toggle = document.getElementById('searchEngineSwitch');
    const toggleCard = toggle?.closest('.p-3');
    if (!toggleCard) return;

    const section = document.createElement('div');
    section.id = 'customSearchEngineSettings';
    section.innerHTML = `
      <h5 class="custom-search-title">搜索引擎设置</h5>
      <p class="custom-setting-hint" style="margin:0;color:#9ca3af;">“站内”搜索固定保留；下面的站外搜索可以增删、排序或关闭。搜索 URL 必须用 <code>{query}</code> 表示关键词。</p>
      <div id="searchEngineRows"></div>
      <div style="display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin-top:10px;">
        <button type="button" id="addSearchEngineBtn" class="engine-secondary-btn">+ 添加搜索引擎</button>
        <button type="button" id="resetSearchEnginesBtn" class="engine-secondary-btn">恢复默认</button>
        <button type="button" id="saveSearchEnginesBtn" class="engine-primary-btn">保存搜索引擎</button>
        <span id="searchEngineStatus" style="color:#6b7280;"></span>
      </div>
    `;
    toggleCard.insertAdjacentElement('afterend', section);

    document.getElementById('addSearchEngineBtn')?.addEventListener('click', () => {
      engineItems.push({
        id: `engine-${Date.now().toString(36)}`,
        name: '',
        url: 'https://example.com/search?q={query}',
        enabled: true,
      });
      renderEngineRows();
    });

    document.getElementById('resetSearchEnginesBtn')?.addEventListener('click', () => {
      engineItems = DEFAULT_ENGINES.map(item => ({ ...item }));
      renderEngineRows();
      setSearchStatus('已恢复默认列表，点击“保存搜索引擎”后生效');
    });

    document.getElementById('saveSearchEnginesBtn')?.addEventListener('click', () => {
      void saveSearchEngines();
    });

    renderEngineRows();
  }

  function renderEngineRows() {
    const root = document.getElementById('searchEngineRows');
    if (!root) return;
    root.innerHTML = '';

    engineItems.forEach((engine, index) => {
      const row = document.createElement('div');
      row.className = 'engine-row';
      row.dataset.index = String(index);
      row.innerHTML = `
        <div class="engine-row-grid">
          <div>
            <label class="custom-setting-label">显示名称</label>
            <input type="text" class="engine-name-input" maxlength="30" placeholder="例如：DuckDuckGo">
          </div>
          <div>
            <label class="custom-setting-label">搜索 URL</label>
            <input type="url" class="engine-url-input" placeholder="https://example.com/search?q={query}">
          </div>
        </div>
        <div class="engine-row-actions">
          <label class="engine-enabled-label"><input type="checkbox" class="engine-enabled-input"> 在首页显示</label>
          <div class="engine-action-group">
            <button type="button" class="engine-small-btn engine-up-btn" title="上移">↑ 上移</button>
            <button type="button" class="engine-small-btn engine-down-btn" title="下移">↓ 下移</button>
            <button type="button" class="engine-small-btn engine-delete-btn">删除</button>
          </div>
        </div>
      `;

      const nameInput = row.querySelector('.engine-name-input');
      const urlInput = row.querySelector('.engine-url-input');
      const enabledInput = row.querySelector('.engine-enabled-input');
      nameInput.value = engine.name || '';
      urlInput.value = engine.url || '';
      enabledInput.checked = engine.enabled !== false;

      nameInput.addEventListener('input', () => {
        engineItems[index].name = nameInput.value;
        syncAdminSearchPreview();
      });
      urlInput.addEventListener('input', () => {
        engineItems[index].url = urlInput.value;
      });
      enabledInput.addEventListener('change', () => {
        engineItems[index].enabled = enabledInput.checked;
        syncAdminSearchPreview();
      });

      row.querySelector('.engine-up-btn')?.addEventListener('click', () => {
        if (index <= 0) return;
        [engineItems[index - 1], engineItems[index]] = [engineItems[index], engineItems[index - 1]];
        renderEngineRows();
      });
      row.querySelector('.engine-down-btn')?.addEventListener('click', () => {
        if (index >= engineItems.length - 1) return;
        [engineItems[index + 1], engineItems[index]] = [engineItems[index], engineItems[index + 1]];
        renderEngineRows();
      });
      row.querySelector('.engine-delete-btn')?.addEventListener('click', () => {
        engineItems.splice(index, 1);
        renderEngineRows();
      });

      root.appendChild(row);
    });

    syncAdminSearchPreview();
  }

  function syncAdminSearchPreview() {
    document.querySelectorAll('[data-preview-role="searchEngines"]').forEach(wrapper => {
      wrapper.innerHTML = '';

      const local = document.createElement('label');
      local.className = 'search-engine-option active';
      local.dataset.engine = 'local';
      local.innerHTML = '<span>站内</span>';
      wrapper.appendChild(local);

      engineItems.filter(item => item.enabled !== false && item.name.trim()).forEach((engine, index) => {
        const option = document.createElement('label');
        option.className = 'search-engine-option';
        option.dataset.engine = engine.id || `engine-${index + 1}`;
        const span = document.createElement('span');
        span.textContent = engine.name.trim();
        option.appendChild(span);
        wrapper.appendChild(option);
      });
    });
  }

  function setSearchStatus(text, isError = false) {
    const status = document.getElementById('searchEngineStatus');
    if (!status) return;
    status.textContent = text || '';
    status.style.color = isError ? '#dc2626' : (text ? '#059669' : '#6b7280');
  }

  async function loadSearchEngines() {
    ensureSearchEngineUi();
    try {
      const response = await fetch('/api/search-engines', { cache: 'no-store' });
      const payload = await response.json();
      if (!response.ok || payload?.code !== 200) throw new Error(payload?.message || '读取失败');
      engineItems = (payload?.data?.engines || DEFAULT_ENGINES).map(item => ({ ...item }));
      renderEngineRows();
    } catch (error) {
      console.error('Failed to load search engines:', error);
      engineItems = DEFAULT_ENGINES.map(item => ({ ...item }));
      renderEngineRows();
      setSearchStatus('搜索引擎配置读取失败，当前显示默认列表', true);
    }
  }

  function validateEngineItems() {
    const cleaned = [];
    for (let index = 0; index < engineItems.length; index += 1) {
      const item = engineItems[index];
      const name = String(item.name || '').trim();
      const url = String(item.url || '').trim();

      if (!name && !url) continue;
      if (!name) throw new Error(`第 ${index + 1} 项缺少显示名称`);
      if (!url) throw new Error(`“${name}”缺少搜索 URL`);
      if (!url.includes('{query}')) throw new Error(`“${name}”的搜索 URL 必须包含 {query}`);

      try {
        const parsed = new URL(url.replaceAll('{query}', 'test'));
        if (!['https:', 'http:'].includes(parsed.protocol)) throw new Error('protocol');
      } catch {
        throw new Error(`“${name}”的搜索 URL 无效`);
      }

      cleaned.push({
        id: item.id || `engine-${index + 1}`,
        name,
        url,
        enabled: item.enabled !== false,
      });
    }
    return cleaned;
  }

  async function saveSearchEngines() {
    let cleaned;
    try {
      cleaned = validateEngineItems();
    } catch (error) {
      setSearchStatus(error.message, true);
      return;
    }

    setSearchStatus('正在保存搜索引擎...');
    try {
      const response = await fetch('/api/search-engines', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': getCsrfToken(),
        },
        body: JSON.stringify({ engines: cleaned }),
      });
      const payload = await response.json();
      if (!response.ok || payload?.code !== 200) throw new Error(payload?.message || '保存失败');

      engineItems = (payload?.data?.engines || cleaned).map(item => ({ ...item }));
      renderEngineRows();
      setSearchStatus('搜索引擎已保存，刷新首页即可看到最新配置');
    } catch (error) {
      console.error('Failed to save search engines:', error);
      setSearchStatus(error.message || '搜索引擎保存失败', true);
    }
  }

  function bindMainSaveButton() {
    const saveBtn = document.getElementById('saveSettingsBtn');
    if (!saveBtn || saveBtn.dataset.siteIconBound === '1') return;
    saveBtn.dataset.siteIconBound = '1';
    saveBtn.addEventListener('click', () => {
      void saveIconSetting();
    }, true);
  }

  function init() {
    injectAdminCustomStyles();
    patchAdminBingPreview();
    ensureIconUi();
    ensureSearchEngineUi();
    bindMainSaveButton();
    void loadIconSetting();
    void loadSearchEngines();

    const settingsBtn = document.getElementById('settingsBtn');
    settingsBtn?.addEventListener('click', () => {
      setTimeout(() => {
        void loadIconSetting();
        void loadSearchEngines();
      }, 0);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
