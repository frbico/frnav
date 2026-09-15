// functions/admin/index.js

import { buildSessionCookie, isAdminAuthenticated, getSessionToken } from '../_middleware';

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
        const adminTypographyStyle = `
<style id="iori-admin-site-info-typography">
  label[for="homeSiteName"],
  label[for="homeSiteDescription"],
  label[for="homeFooterText"] {
    color: #6b7280 !important;
    font-size: 12px !important;
    line-height: 18px !important;
    font-weight: 400 !important;
  }

  #homeSiteName,
  #homeSiteDescription,
  #homeFooterText {
    font-size: 14px !important;
    line-height: 20px !important;
    font-weight: 400 !important;
  }

  #homeSiteName::placeholder,
  #homeSiteDescription::placeholder,
  #homeFooterText::placeholder {
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
