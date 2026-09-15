import { errorResponse, isAdminAuthenticated, jsonResponse } from '../_middleware';

const ICON_KEY = 'site_icon_url';
const VERSION_KEY = 'site_icon_version';
const MAX_DATA_URL_LENGTH = 350000;
const DATA_URL_RE = /^data:image\/(png|jpeg|jpg|webp|gif|x-icon|vnd\.microsoft\.icon);base64,([A-Za-z0-9+/=\s]+)$/i;

function normalizeIconValue(value) {
  const text = String(value ?? '').trim();
  if (!text) return { ok: true, value: '' };

  if (text.length > MAX_DATA_URL_LENGTH) {
    return { ok: false, message: '图标文件过大，请使用 200KB 以内的图片' };
  }

  if (DATA_URL_RE.test(text)) {
    return { ok: true, value: text };
  }

  try {
    const parsed = new URL(text);
    if (parsed.protocol !== 'https:' || parsed.username || parsed.password) {
      return { ok: false, message: '图标 URL 必须使用 HTTPS，且不能包含账号密码' };
    }
    return { ok: true, value: parsed.href };
  } catch {
    return { ok: false, message: '无效的网站图标 URL' };
  }
}

async function readIconSettings(env) {
  try {
    const { results = [] } = await env.NAV_DB
      .prepare('SELECT key, value FROM settings WHERE key IN (?, ?)')
      .bind(ICON_KEY, VERSION_KEY)
      .all();
    const map = new Map(results.map(row => [row.key, row.value]));
    return {
      value: map.get(ICON_KEY) || '',
      version: map.get(VERSION_KEY) || '0',
    };
  } catch (e) {
    if (String(e?.message || '').includes('no such table')) {
      return { value: '', version: '0' };
    }
    throw e;
  }
}

function decodeDataUrl(dataUrl) {
  const match = String(dataUrl || '').match(DATA_URL_RE);
  if (!match) return null;

  const subtype = match[1].toLowerCase();
  const typeMap = {
    png: 'image/png',
    jpeg: 'image/jpeg',
    jpg: 'image/jpeg',
    webp: 'image/webp',
    gif: 'image/gif',
    'x-icon': 'image/x-icon',
    'vnd.microsoft.icon': 'image/vnd.microsoft.icon',
  };

  const binary = atob(match[2].replace(/\s+/g, ''));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return { bytes, contentType: typeMap[subtype] || 'application/octet-stream' };
}

export async function onRequestGet(context) {
  const { request, env } = context;

  try {
    const { value, version } = await readIconSettings(env);
    const url = new URL(request.url);

    if (url.searchParams.get('raw') === '1') {
      if (!value) {
        return Response.redirect(new URL(`/favicon.svg?v=${encodeURIComponent(version)}`, url.origin), 302);
      }

      if (value.startsWith('data:image/')) {
        const decoded = decodeDataUrl(value);
        if (!decoded) return errorResponse('Invalid stored icon data', 500);
        return new Response(decoded.bytes, {
          headers: {
            'Content-Type': decoded.contentType,
            'Cache-Control': 'public, max-age=3600',
          },
        });
      }

      return new Response(null, {
        status: 302,
        headers: {
          Location: value,
          'Cache-Control': 'no-store',
        },
      });
    }

    return jsonResponse({
      code: 200,
      data: {
        configured: Boolean(value),
        value,
        version,
        iconUrl: `/api/site-icon?raw=1&v=${encodeURIComponent(version)}`,
      },
    });
  } catch (e) {
    return errorResponse(`Failed to load site icon: ${e.message}`, 500);
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;

  if (!(await isAdminAuthenticated(request, env))) {
    return errorResponse('Unauthorized', 401);
  }

  try {
    const body = await request.json();
    const normalized = normalizeIconValue(body?.value);
    if (!normalized.ok) return errorResponse(normalized.message, 400);

    const version = String(Date.now());
    const stmt = env.NAV_DB.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
    await env.NAV_DB.batch([
      stmt.bind(ICON_KEY, normalized.value),
      stmt.bind(VERSION_KEY, version),
    ]);

    return jsonResponse({
      code: 200,
      message: normalized.value ? '网站图标已保存' : '已恢复默认网站图标',
      data: {
        configured: Boolean(normalized.value),
        version,
        iconUrl: `/api/site-icon?raw=1&v=${encodeURIComponent(version)}`,
      },
    });
  } catch (e) {
    return errorResponse(`Failed to save site icon: ${e.message}`, 500);
  }
}
