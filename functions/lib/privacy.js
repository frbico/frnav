// functions/lib/privacy.js

/**
 * 访客可见分类不是简单的 `category.is_private = 0`：
 * 当前分类以及从根分类到它的整条祖先链都必须公开。
 *
 * 从公开根分类向下递归，而不是从当前分类向上查找，有两个安全优势：
 * 1. 私密祖先会直接截断整棵子树；
 * 2. 孤儿分类、循环分类和 NULL 隐私标记默认都不会进入公开集合（fail closed）。
 */
export const PUBLIC_CATEGORIES_CTE = `
WITH RECURSIVE public_categories(id) AS (
  SELECT c.id
  FROM category c
  WHERE COALESCE(c.parent_id, 0) = 0
    AND c.is_private = 0

  UNION

  SELECT c.id
  FROM category c
  INNER JOIN public_categories p ON c.parent_id = p.id
  WHERE c.is_private = 0
)
`;

/**
 * 判断指定分类对匿名访客是否有效公开（自身 + 全部祖先均公开）。
 */
export async function isCategoryPublicToVisitors(db, categoryId) {
  if (!db || categoryId === null || categoryId === undefined || categoryId === '') return false;

  const row = await db.prepare(`
    ${PUBLIC_CATEGORIES_CTE}
    SELECT id
    FROM public_categories
    WHERE id = ?
    LIMIT 1
  `).bind(categoryId).first();

  return Boolean(row);
}
