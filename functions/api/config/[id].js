// functions/api/config/[id].js
import { isAdminAuthenticated, errorResponse, jsonResponse, normalizeSortOrder, markHomeCacheDirty } from '../../_middleware';
import { buildFaviconUrl, getUrlMatchCandidates, normalizeUrlForStorage } from '../../lib/utils';
import { normalizeBookmarkDesc, normalizeBookmarkLogo, normalizeBookmarkName, normalizeBookmarkUrl } from '../../lib/validators';
import { PUBLIC_CATEGORIES_CTE, isCategoryPublicToVisitors } from '../../lib/privacy';


export async function onRequestGet(context) {
  const { request, env, params } = context;
  const id = params.id;
  const { results } = await env.NAV_DB.prepare(`
    ${PUBLIC_CATEGORIES_CTE}
    SELECT s.*,
           CASE WHEN s.catelog_id IN (SELECT id FROM public_categories) THEN 1 ELSE 0 END AS category_is_public
    FROM sites s
    WHERE s.id = ?
  `).bind(id).all();
  if (results.length === 0) {
    return errorResponse('config not found', 404);
  }
  const config = results[0];
  
  // 匿名读取 fail-closed：书签自身和从所属分类到根分类的整条祖先链都必须明确公开。
  // NULL/异常隐私标记、分类缺失、循环或任一祖先私密时，都不允许匿名读取。
  const siteBlocksPublicRead = config.is_private !== 0;
  const categoryBlocksPublicRead = config.category_is_public !== 1;
  if ((siteBlocksPublicRead || categoryBlocksPublicRead) && !(await isAdminAuthenticated(request, env))) {
    return errorResponse('config not found', 404);
  }

  delete config.category_is_public;
  
  return jsonResponse({
    code: 200,
    data: config
  });
}

export async function onRequestPut(context) {
  const { request, env, params } = context;
  const id = params.id;

  if (!(await isAdminAuthenticated(request, env))) {
    return errorResponse('Unauthorized', 401);
  }
  
  try {
    const existing = await env.NAV_DB.prepare('SELECT id, is_private FROM sites WHERE id = ?').bind(id).first();
    if (!existing) {
      return errorResponse('config not found', 404);
    }

    const config = await request.json();
    const { name, url, logo, desc, catelog_id, sort_order, is_private } = config;

    const nameResult = normalizeBookmarkName(name);
    if (!nameResult.ok) return errorResponse(nameResult.message, 400);

    const urlResult = normalizeBookmarkUrl(url);
    if (!urlResult.ok) return errorResponse(urlResult.message, 400);

    const logoResult = normalizeBookmarkLogo(logo, { nullIfEmpty: true });
    if (!logoResult.ok) return errorResponse(logoResult.message, 400);

    const descResult = normalizeBookmarkDesc(desc, { nullIfEmpty: true });
    if (!descResult.ok) return errorResponse(descResult.message, 400);

    const sanitizedName = nameResult.value;
    const rawUrl = urlResult.value;
    const sanitizedUrl = normalizeUrlForStorage(rawUrl);
    let sanitizedLogo = logoResult.value;
    const sanitizedDesc = descResult.value;
    const sortOrderValue = normalizeSortOrder(sort_order);
    const isPrivateValue = is_private ? 1 : 0;

    if (!catelog_id) {
      return errorResponse('Catelog is required', 400);
    }
    if (!sanitizedUrl) {
      return errorResponse('URL must be a valid http or https URL', 400);
    }

    const urlCandidates = getUrlMatchCandidates(rawUrl);
    const placeholders = urlCandidates.map(() => '?').join(',');
    const duplicate = await env.NAV_DB.prepare(`SELECT id FROM sites WHERE url IN (${placeholders}) AND id != ?`)
      .bind(...urlCandidates, id)
      .first();
    if (duplicate) {
      return errorResponse('该 URL 已存在，请勿重复添加', 409);
    }

    const iconAPI = env.ICON_API || 'https://faviconsnap.com/api/favicon?url=';
    sanitizedLogo = buildFaviconUrl(sanitizedUrl, sanitizedLogo, iconAPI);

    // Fetch category name
    const categoryResult = await env.NAV_DB.prepare('SELECT catelog, is_private FROM category WHERE id = ?').bind(catelog_id).first();
    if (!categoryResult) {
      return errorResponse('Category not found.', 400);
    }
    const catelogName = categoryResult.catelog;

    // 分类自身或任一祖先为私密时，书签都必须强制私密。
    const categoryIsPublic = await isCategoryPublicToVisitors(env.NAV_DB, catelog_id);
    const finalIsPrivate = categoryIsPublic ? isPrivateValue : 1;

    const update = await env.NAV_DB.prepare(`
      UPDATE sites
      SET name = ?, url = ?, logo = ?, desc = ?, catelog_id = ?, catelog_name = ?, sort_order = ?, is_private = ?, update_time = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(sanitizedName, sanitizedUrl, sanitizedLogo, sanitizedDesc, catelog_id, catelogName, sortOrderValue, finalIsPrivate, id).run();

    const dirtyScope = (existing.is_private === 1 && finalIsPrivate === 1) ? 'private' : 'all';
    await markHomeCacheDirty(env, dirtyScope);

    return jsonResponse({
      code: 200,
      message: 'Config updated successfully',
      update
    });
  } catch (e) {
    return errorResponse(`Failed to update config: ${e.message}`, 500);
  }
}

export async function onRequestDelete(context) {
  const { request, env, params } = context;
  const id = params.id;

  if (!(await isAdminAuthenticated(request, env))) {
    return errorResponse('Unauthorized', 401);
  }

  try {
    const existing = await env.NAV_DB.prepare('SELECT id, is_private FROM sites WHERE id = ?').bind(id).first();
    if (!existing) {
      return errorResponse('config not found', 404);
    }

    const del = await env.NAV_DB.prepare('DELETE FROM sites WHERE id = ?').bind(id).run();

    await markHomeCacheDirty(env, existing.is_private ? 'private' : 'all');

    return jsonResponse({
      code: 200,
      message: 'Config deleted successfully',
      del
    });
  } catch (e) {
    return errorResponse(`Failed to delete config: ${e.message}`, 500);
  }
}
