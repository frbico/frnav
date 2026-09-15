// functions/admin/index.js

import { buildSessionCookie, isAdminAuthenticated, getSessionToken } from '../_middleware';

const ADMIN_SETTINGS_VERSION = '20260915-footer2';

export function injectFooterSettingsControls(html) {
  if (!html || html.includes('id="homeFooterShowGithub"')) return html;

  const footerFieldPattern = /<div>\s*<label for="homeFooterText"[^>]*>[^<]*<\/label>\s*<input[^>]*id="homeFooterText"[^>]*>\s*<\/div>/i;
  const footerSettingsHtml = `
                <div class="pt-2 border-t border-gray-200">
                  <div class="text-xs font-medium text-gray-600 mb-2">页脚配置</div>
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
                  <input type="url" id="homeFooterGithubUrl" placeholder="https://github.com/owner/repo"
                    class="w-full text-sm p-2 border rounded" autocomplete="off" inputmode="url">
                </div>
                <div>
                  <label for="homeFooterCopyrightText" class="text-xs text-gray-500 block mb-1">版权 / 年份文字</label>
                  <input type="text" id="homeFooterCopyrightText" placeholder="© {year}" class="w-full text-sm p-2 border rounded">
                  <p class="text-[11px] text-gray-400 mt-1">可完全修改；{year} 会自动替换为当前年份，例如：Copyright © {year}</p>
                </div>
                <div>
                  <label for="homeFooterText" class="text-xs text-gray-500 block mb-1">版权后附加文字（可选）</label>
                  <input type="text" id="homeFooterText" placeholder="例如：曾梦想仗剑走天涯" class="w-full text-sm p-2 border rounded">
                </div>`;

  if (!footerFieldPattern.test(html)) {
    console.warn('Footer settings injection skipped: homeFooterText field not found');
    return html;
  }

  return html.replace(footerFieldPattern, footerSettingsHtml);
}

function injectAdminSettingsCacheBust(html) {
  return html.replace(
    /\/js\/admin-settings\.js\?v=[^"']+/g,
    `/js/admin-settings.js?v=${ADMIN_SETTINGS_VERSION}`
  );
}

// GET: 显示管理页面或重定向到登录
export async function onRequestGet(context) {
  const { request, env } = context;

  if (!(await isAdminAuthenticated(request, env))) {
    return new Response(null, {
      status: 302,
      headers: {
        'Location': '/admin/login',
      },
    });
  }

  const sessionToken = getSessionToken(request);

  // 尝试从静态资源读取 HTML 文件
  try {
    const url = new URL(request.url);
    url.pathname = '/admin/index.html';

    const response = await env.ASSETS.fetch(url);

    if (response.ok) {
      // 从 KV 读取 CSRF token 并注入到 HTML
      const csrfToken = await env.NAV_AUTH.get(`csrf_${sessionToken}`);
      if (csrfToken) {
        let html = await response.text();
        // 页脚设置直接在服务端注入到后台 HTML，避免只依赖运行时 JS 动态插入导致缓存/执行顺序下控件消失。
        html = injectFooterSettingsControls(html);
        // admin-settings.js 曾经使用固定 ?v=，这里强制切到新版本，避免浏览器继续命中旧脚本。
        html = injectAdminSettingsCacheBust(html);

        // 后台页与首页共用同一套网站图标。加时间戳避免浏览器继续使用旧 favicon 缓存。
        const adminFaviconUrl = `/api/site-icon?raw=1&v=${Date.now()}`;
        html = html.replace(
          /<link\s+rel=["']icon["'][^>]*>/i,
          `<link rel="icon" href="${adminFaviconUrl}">`
        );
        const adminTypographyStyle = `
<style id="iori-admin-site-info-typography">
  label[for="homeSiteName"],
  label[for="homeSiteDescription"],
  label[for="homeFooterText"],
  label[for="homeFooterShowGithub"],
  label[for="homeFooterGithubUrl"],
  label[for="homeFooterCopyrightText"] {
    color: #6b7280 !important;
    font-size: 12px !important;
    line-height: 18px !important;
    font-weight: 400 !important;
  }

  #homeSiteName,
  #homeSiteDescription,
  #homeFooterText,
  #homeFooterGithubUrl,
  #homeFooterCopyrightText {
    font-size: 14px !important;
    line-height: 20px !important;
    font-weight: 400 !important;
  }

  #homeSiteName::placeholder,
  #homeSiteDescription::placeholder,
  #homeFooterText::placeholder,
  #homeFooterGithubUrl::placeholder,
  #homeFooterCopyrightText::placeholder {
    font-size: 14px !important;
    line-height: 20px !important;
  }
</style>`;
        html = html.replace(
          '</head>',
          `<meta name="csrf-token" content="${csrfToken}">\n${adminTypographyStyle}\n</head>`
        );
        // 自定义增强脚本使用独立文件名与版本号，避免旧缓存干扰。
        html = html.replace('</body>', '<script src="/js/admin-site-icon.js?v=20260915-3"></script>\n</body>');
        const headers = new Headers(response.headers);
        headers.set('Cache-Control', 'no-store');
        return new Response(html, { headers });
      }

      return new Response(null, {
        status: 302,
        headers: {
          'Location': `/admin/login?error=${encodeURIComponent('登录状态已过期，请重新登录')}`,
          'Set-Cookie': buildSessionCookie('', { maxAge: 0 }),
          'Cache-Control': 'no-store',
        },
      });
    } else {
      console.error('Failed to load admin HTML:', response.status);
      return new Response('管理页面加载失败', { status: 500 });
    }
  } catch (e) {
    console.error('Error loading admin page:', e);
    return new Response('管理页面加载失败: ' + e.message, { status: 500 });
  }
}
