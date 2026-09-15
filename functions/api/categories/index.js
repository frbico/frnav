// functions/api/categories/index.js
import { isAdminAuthenticated, isSubmissionEnabled, errorResponse, jsonResponse } from '../../_middleware';
import { parsePagination } from '../../lib/utils';
import { PUBLIC_CATEGORIES_CTE } from '../../lib/privacy';

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const isPublicScope = url.searchParams.get('scope') === 'public';

  const isAuthenticated = await isAdminAuthenticated(request, env);

  if ((!isAuthenticated || isPublicScope) && !isSubmissionEnabled(env)) {
    return errorResponse('Unauthorized', 401);
  }

  const shouldShowPublicOnly = isPublicScope || !isAuthenticated;
  const maxPageSize = shouldShowPublicOnly ? 1000 : 10000;
  const { page, pageSize, offset } = parsePagination(url.searchParams, { maxPageSize });

  try {
    const categoryFilter = shouldShowPublicOnly ? 'WHERE c.id IN (SELECT id FROM public_categories)' : '';
    const countFilter = shouldShowPublicOnly ? 'WHERE c.id IN (SELECT id FROM public_categories)' : '';
    const siteJoin = shouldShowPublicOnly
      ? 'LEFT JOIN sites s ON c.id = s.catelog_id AND s.is_private = 0'
      : 'LEFT JOIN sites s ON c.id = s.catelog_id';
    const cte = shouldShowPublicOnly ? PUBLIC_CATEGORIES_CTE : '';

    const { results } = await env.NAV_DB.prepare(`
        ${cte}
        SELECT c.id, c.catelog, c.sort_order, c.parent_id, c.is_private, COUNT(s.id) AS site_count
        FROM category c
        ${siteJoin}
        ${categoryFilter}
        GROUP BY c.id, c.catelog, c.sort_order, c.parent_id, c.is_private
        ORDER BY c.sort_order ASC, c.create_time DESC
        LIMIT ? OFFSET ?
      `).bind(pageSize, offset).all();
    const countResult = await env.NAV_DB.prepare(`
      ${cte}
      SELECT COUNT(*) as total FROM category c ${countFilter}
    `).first();

    const total = countResult ? countResult.total : 0;

    return jsonResponse({
      code: 200,
      data: results,
      total,
      page,
      pageSize
    });
  } catch (e) {
    return errorResponse(`Failed to fetch categories: ${e.message}`, 500);
  }
}
