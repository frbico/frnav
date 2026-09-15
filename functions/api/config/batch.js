import { isAdminAuthenticated, errorResponse, jsonResponse, markHomeCacheDirty } from '../../_middleware';
import { PUBLIC_CATEGORIES_CTE, isCategoryPublicToVisitors } from '../../lib/privacy';

export async function onRequestPost(context) {
  const { request, env } = context;
  const REORDER_CHUNK_SIZE = 100;
  
  if (!(await isAdminAuthenticated(request, env))) {
    return errorResponse('Unauthorized', 401);
  }

  // reorder 之外的操作都是单次 env.NAV_DB.batch()（D1 隐式单事务），失败即全无变更，
  // 成功后就地打一次脏标记即可。reorder 分块提交属于多事务写入，改用 finally 打标：
  // KV 对同一个 key 限制每秒一次写入，同一请求内写两次可能被静默丢弃，
  // 而 finally 一次就能覆盖成功与抛错两种出口。
  let dbMayHaveChanged = false;

  try {
    const { action, ids, payload } = await request.json();

    const requiresIds = action !== 'reorder';

    if (requiresIds && (!ids || !Array.isArray(ids) || ids.length === 0)) {
      return errorResponse('未提供 ID', 400);
    }

    // Cloudflare D1 限制单条语句变量数为 100。
    // 在更新操作中，除了 ID 列表（Chunk），还有 SET 部分的参数（如 catelog_id, catelog_name）。
    // 将分块大小设为 50 以确保变量总数绝对不会超过 100。
    const CHUNK_SIZE = 50;
    const chunks = [];
    if (requiresIds) {
      for (let i = 0; i < ids.length; i += CHUNK_SIZE) {
        chunks.push(ids.slice(i, i + CHUNK_SIZE));
      }
    }

    const statements = [];

    if (action === 'delete') {
      chunks.forEach(chunk => {
        const placeholders = chunk.map(() => '?').join(',');
        statements.push(
          env.NAV_DB.prepare(`DELETE FROM sites WHERE id IN (${placeholders})`).bind(...chunk)
        );
      });

      await env.NAV_DB.batch(statements);
      await markHomeCacheDirty(env, 'all');
      
      return jsonResponse({
        code: 200,
        message: `成功删除 ${ids.length} 条项目`
      });

    } else if (action === 'update_category') {
      const { categoryId } = payload;
      if (!categoryId) {
        return errorResponse('分类 ID 是必填项', 400);
      }

      const category = await env.NAV_DB.prepare('SELECT catelog, is_private FROM category WHERE id = ?').bind(categoryId).first();
      if (!category) {
        return errorResponse('找不到分类', 404);
      }

      const categoryIsPublic = await isCategoryPublicToVisitors(env.NAV_DB, categoryId);
      let baseSql = `UPDATE sites SET catelog_id = ?, catelog_name = ?`;
      const baseParams = [categoryId, category.catelog];

      // 目标分类自身或任一祖先私密时，移动过去的书签必须强制私密。
      if (!categoryIsPublic) {
          baseSql += `, is_private = 1`;
      }

      chunks.forEach(chunk => {
        const placeholders = chunk.map(() => '?').join(',');
        statements.push(
          env.NAV_DB.prepare(`${baseSql} WHERE id IN (${placeholders})`).bind(...baseParams, ...chunk)
        );
      });

      await env.NAV_DB.batch(statements);
      await markHomeCacheDirty(env, 'all');

      return jsonResponse({
        code: 200,
        message: `成功更新 ${ids.length} 条项目的分类`
      });

    } else if (action === 'update_privacy') {
      const { isPrivate } = payload || {};
      if (isPrivate === undefined) {
        return errorResponse('隐私状态是必填项', 400);
      }
      
      const isPrivateValue = isPrivate ? 1 : 0;

      // 私密分类是更高一级的隐私边界。书签只有在所属分类以及全部祖先都公开时才能设为公开。
      // 先校验全部分块，再执行任何 UPDATE，避免部分分块已经公开后才发现冲突。
      if (isPrivateValue === 0) {
        for (const chunk of chunks) {
          const placeholders = chunk.map(() => '?').join(',');
          const protectedSite = await env.NAV_DB.prepare(`
            ${PUBLIC_CATEGORIES_CTE}
            SELECT s.id
            FROM sites s
            WHERE s.id IN (${placeholders})
              AND s.catelog_id NOT IN (SELECT id FROM public_categories)
            LIMIT 1
          `).bind(...chunk).first();

          if (protectedSite) {
            return errorResponse('私密分类（或其子分类）中的书签不能单独设为公开，请先公开完整分类链', 409);
          }
        }
      }
      
      chunks.forEach(chunk => {
        const placeholders = chunk.map(() => '?').join(',');
        statements.push(
          env.NAV_DB.prepare(`UPDATE sites SET is_private = ? WHERE id IN (${placeholders})`).bind(isPrivateValue, ...chunk)
        );
      });

      await env.NAV_DB.batch(statements);
      await markHomeCacheDirty(env, 'all');

      return jsonResponse({
        code: 200,
        message: `成功更新 ${ids.length} 条项目的隐私属性`
      });
    } else if (action === 'reorder') {
      const items = payload?.items;

      if (!Array.isArray(items) || items.length === 0) {
        return errorResponse('排序数据不能为空', 400);
      }

      const reorderStatements = [];

      for (const item of items) {
        const id = Number(item.id);
        const sortOrder = Number(item.sort_order);

        if (!Number.isFinite(id) || !Number.isFinite(sortOrder)) {
          return errorResponse('排序数据格式无效', 400);
        }

        reorderStatements.push(
          env.NAV_DB.prepare('UPDATE sites SET sort_order = ?, update_time = CURRENT_TIMESTAMP WHERE id = ?')
            .bind(sortOrder, id)
        );
      }

      dbMayHaveChanged = true;
      for (let i = 0; i < reorderStatements.length; i += REORDER_CHUNK_SIZE) {
        await env.NAV_DB.batch(reorderStatements.slice(i, i + REORDER_CHUNK_SIZE));
      }

      return jsonResponse({
        code: 200,
        message: `成功更新 ${items.length} 条项目的排序`
      });
    } else {
      return errorResponse('无效的操作', 400);
    }

  } catch (e) {
    return errorResponse(`批量操作失败: ${e.message}`, 500);
  } finally {
    if (dbMayHaveChanged) {
      await markHomeCacheDirty(env, 'all');
    }
  }
}