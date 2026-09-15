(function () {
  let currentValue = '';
  let pendingUpload = '';
  let cleared = false;

  function patchAdminBingPreview() {
    document.querySelectorAll('.search-engine-option[data-engine="baidu"]').forEach(option => {
      const label = option.querySelector('span');
      if (label) label.textContent = 'Bing';
    });

    const searchEngineLabel = document.querySelector('label[for="searchEngineSwitch"]');
    if (searchEngineLabel) {
      searchEngineLabel.textContent = searchEngineLabel.textContent.replace(/Baidu/g, 'Bing');
    }
  }

  function ensureUi() {
    if (document.getElementById('siteIconSettingBlock')) return;

    const anchor = document.getElementById('homeSiteName');
    const container = anchor?.closest('.space-y-3');
    if (!container) return;

    const block = document.createElement('div');
    block.id = 'siteIconSettingBlock';
    block.innerHTML = `
      <label class="text-xs text-gray-500 block mb-1">网站 Logo / 浏览器图标 (Favicon)</label>
      <div class="flex items-center gap-2 mb-2">
        <img id="siteIconPreview" src="/favicon.svg" alt="网站图标预览" class="w-10 h-10 rounded-lg object-contain border border-gray-200 bg-transparent">
        <div class="flex-1 min-w-0">
          <input type="url" id="siteIconUrl" placeholder="https://example.com/icon.png" class="w-full text-sm p-2 border rounded">
          <p id="siteIconHint" class="text-[11px] text-gray-400 mt-1">支持 HTTPS 图片地址，或直接上传 PNG/JPG/WebP/GIF/ICO；建议使用正方形图标。</p>
        </div>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <button type="button" id="siteIconChooseBtn" class="px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700">上传图片</button>
        <button type="button" id="siteIconClearBtn" class="px-3 py-1.5 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200">恢复默认</button>
        <input type="file" id="siteIconFile" accept="image/png,image/jpeg,image/webp,image/gif,image/x-icon,image/vnd.microsoft.icon" class="hidden">
        <span id="siteIconStatus" class="text-xs text-gray-500"></span>
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
      if (value) updatePreview(value);
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
        updatePreview(pendingUpload);
        setStatus('已选择图片，点击底部“保存设置”生效');
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
      updatePreview('/favicon.svg');
      setStatus('将恢复默认图标，点击底部“保存设置”生效');
    });
  }

  function setStatus(text, isError = false) {
    const status = document.getElementById('siteIconStatus');
    if (!status) return;
    status.textContent = text || '';
    status.classList.toggle('text-red-600', !!isError);
    status.classList.toggle('text-green-600', !isError && !!text);
  }

  function updatePreview(src) {
    const preview = document.getElementById('siteIconPreview');
    if (preview && src) preview.src = src;
  }

  async function loadSetting() {
    ensureUi();
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

      updatePreview(data.iconUrl || '/favicon.svg');
    } catch (error) {
      console.error('Failed to load site icon setting:', error);
      setStatus('网站图标设置读取失败', true);
    }
  }

  async function saveSetting() {
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

    setStatus('正在保存网站图标...');
    try {
      const response = await fetch('/api/site-icon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value }),
      });
      const payload = await response.json();
      if (!response.ok || payload?.code !== 200) {
        throw new Error(payload?.message || '保存失败');
      }

      currentValue = value;
      pendingUpload = '';
      cleared = false;
      setStatus(value ? '网站图标已保存' : '已恢复默认网站图标');
      if (payload?.data?.iconUrl) updatePreview(payload.data.iconUrl);
    } catch (error) {
      console.error('Failed to save site icon:', error);
      setStatus(error.message || '网站图标保存失败', true);
    }
  }

  function bindSaveButton() {
    const saveBtn = document.getElementById('saveSettingsBtn');
    if (!saveBtn || saveBtn.dataset.siteIconBound === '1') return;
    saveBtn.dataset.siteIconBound = '1';
    saveBtn.addEventListener('click', () => {
      void saveSetting();
    }, true);
  }

  function init() {
    patchAdminBingPreview();
    ensureUi();
    bindSaveButton();
    void loadSetting();

    const settingsBtn = document.getElementById('settingsBtn');
    settingsBtn?.addEventListener('click', () => {
      setTimeout(() => void loadSetting(), 0);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
