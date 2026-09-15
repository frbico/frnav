import { errorResponse, isAdminAuthenticated, jsonResponse } from '../_middleware';

const SETTING_KEY = 'custom_search_engines';
const MAX_ENGINES = 12;

const DEFAULT_ENGINES = [
  {
    id: 'google',
    name: 'Google',
    url: 'https://www.google.com/search?q={query}',
    enabled: true,
  },
  {
    id: 'bing',
    name: 'Bing',
    url: 'https://www.bing.com/search?q={query}',
    enabled: true,
  },
  {
    id: 'github',
    name: 'Github',
    url: 'https://github.com/search?q={query}',
    enabled: true,
  },
];

function makeEngineId(value, index) {
  const base = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 32);
  return base && base !== 'local' ? base : `engine-${index + 1}`;
}

function normalizeEngines(input) {
  if (!Array.isArray(input)) {
    return { ok: false, message: '搜索引擎配置必须是数组' };
  }
  if (input.length > MAX_ENGINES) {
    return { ok: false, message: `最多支持 ${MAX_ENGINES} 个站外搜索引擎` };
  }

  const usedIds = new Set(['local']);
  const engines = [];

  for (let index = 0; index < input.length; index += 1) {
    const item = input[index] || {};
    const name = String(item.name || '').trim();
    const url = String(item.url || '').trim();

    if (!name) return { ok: false, message: `第 ${index + 1} 个搜索引擎缺少名称` };
    if (name.length > 30) return { ok: false, message: `“${name}”名称过长（最多 30 个字符）` };
    if (!url) return { ok: false, message: `“${name}”缺少搜索 URL` };
    if (url.length > 1000) return { ok: false, message: `“${name}”搜索 URL 过长` };
    if (!url.includes('{query}')) {
      return { ok: false, message: `“${name}”的搜索 URL 必须包含 {query}` };
    }

    try {
      const testUrl = new URL(url.replaceAll('{query}', 'test'));
      if (!['https:', 'http:'].includes(testUrl.protocol)) {
        return { ok: false, message: `“${name}”只支持 HTTP/HTTPS 搜索地址` };
      }
    } catch {
      return { ok: false, message: `“${name}”的搜索 URL 无效` };
    }

    let id = makeEngineId(item.id || name, index);
    let suffix = 2;
    const baseId = id;
    while (usedIds.has(id)) {
      id = `${baseId}-${suffix}`;
      suffix += 1;
    }
    usedIds.add(id);

    engines.push({
      id,
      name,
      url,
      enabled: item.enabled !== false,
    });
  }

  return { ok: true, engines };
}

async function readEngines(env) {
  try {
    const row = await env.NAV_DB
      .prepare('SELECT value FROM settings WHERE key = ?')
      .bind(SETTING_KEY)
      .first();

    if (!row?.value) return DEFAULT_ENGINES;
    const parsed = JSON.parse(row.value);
    const normalized = normalizeEngines(parsed);
    return normalized.ok ? normalized.engines : DEFAULT_ENGINES;
  } catch (error) {
    console.warn('Failed to read custom search engines:', error);
    return DEFAULT_ENGINES;
  }
}

export async function onRequestGet({ env }) {
  const engines = await readEngines(env);
  return jsonResponse({ code: 200, data: { engines } });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  if (!(await isAdminAuthenticated(request, env))) {
    return errorResponse('Unauthorized', 401);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return errorResponse('Invalid JSON body', 400);
  }

  const normalized = normalizeEngines(body?.engines);
  if (!normalized.ok) {
    return errorResponse(normalized.message, 400);
  }

  try {
    await env.NAV_DB
      .prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)')
      .bind(SETTING_KEY, JSON.stringify(normalized.engines))
      .run();

    return jsonResponse({
      code: 200,
      message: 'Search engines saved',
      data: { engines: normalized.engines },
    });
  } catch (error) {
    return errorResponse(`Failed to save search engines: ${error.message}`, 500);
  }
}
