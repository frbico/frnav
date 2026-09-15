// functions/[[path]].js
// Catch-all for unknown application routes. Without this function Cloudflare Pages may
// fall back to public/index.html for arbitrary paths, exposing the raw SSR template.

function notFoundHeaders(contentType) {
  return {
    'Content-Type': contentType,
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  };
}

export function buildNotFoundResponse(request) {
  const url = new URL(request.url);

  if (url.pathname.startsWith('/api/')) {
    return new Response(JSON.stringify({ code: 404, message: 'Not Found' }), {
      status: 404,
      headers: notFoundHeaders('application/json; charset=utf-8'),
    });
  }

  const html = `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex, nofollow">
  <title>404 · 页面不存在</title>
  <style>
    :root { color-scheme: light dark; }
    body { margin: 0; min-height: 100vh; display: grid; place-items: center; font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #fdf8f3; color: #1f2937; }
    main { max-width: 34rem; padding: 2rem; text-align: center; }
    h1 { margin: 0 0 .75rem; font-size: clamp(3rem, 10vw, 6rem); }
    p { margin: 0 0 1.5rem; color: #6b7280; }
    a { display: inline-block; padding: .7rem 1rem; border-radius: .75rem; background: #059669; color: #fff; text-decoration: none; }
    @media (prefers-color-scheme: dark) { body { background: #111827; color: #f3f4f6; } p { color: #9ca3af; } }
  </style>
</head>
<body>
  <main>
    <h1>404</h1>
    <p>这个地址不存在。返回首页继续逛书签吧。</p>
    <a href="/">返回首页</a>
  </main>
</body>
</html>`;

  return new Response(html, {
    status: 404,
    headers: notFoundHeaders('text/html; charset=utf-8'),
  });
}

export async function onRequest(context) {
  return buildNotFoundResponse(context.request);
}
