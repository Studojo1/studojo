import type { Route } from "./+types/api.blog";
import db from "~/lib/db";
import { sql } from "drizzle-orm";

// GET /api/blog - Public blog list (only published posts)
export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1", 10);
  const limit = parseInt(url.searchParams.get("limit") || "12", 10);
  const category = url.searchParams.get("category");
  const tag = url.searchParams.get("tag");
  const search = url.searchParams.get("search");

  const offset = (page - 1) * limit;

  // Build query with proper parameterization
  let whereConditions: string[] = ["status = 'published'"];
  
  if (category) {
    const escapedCategory = category.replace(/'/g, "''");
    whereConditions.push(`'${escapedCategory}' = ANY(categories)`);
  }

  if (tag) {
    const escapedTag = tag.replace(/'/g, "''");
    whereConditions.push(`'${escapedTag}' = ANY(tags)`);
  }

  if (search) {
    const escapedSearch = search.replace(/'/g, "''");
    whereConditions.push(`(title ILIKE '%${escapedSearch}%' OR excerpt ILIKE '%${escapedSearch}%' OR content ILIKE '%${escapedSearch}%')`);
  }

  const whereClause = whereConditions.join(" AND ");

  const posts = await db.execute(
    sql.raw(`SELECT * FROM blog_posts WHERE ${whereClause} ORDER BY published_at DESC LIMIT ${limit} OFFSET ${offset}`)
  );

  const countResult = await db.execute(
    sql.raw(`SELECT COUNT(*) as total FROM blog_posts WHERE ${whereClause}`)
  );

  const total = parseInt((countResult.rows[0] as any).total, 10);

  return Response.json({
    posts: posts.rows,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
}

