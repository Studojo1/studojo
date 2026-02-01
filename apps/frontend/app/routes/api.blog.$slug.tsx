import type { Route } from "./+types/api.blog.$slug";
import db from "~/lib/db";
import { sql } from "drizzle-orm";

// GET /api/blog/:slug - Get post by slug (public, increments view count)
export async function loader({ params }: Route.LoaderArgs) {
  const { slug } = params;

  // Decode URL-encoded characters and escape for SQL
  const decodedSlug = decodeURIComponent(slug);
  const escapedSlug = decodedSlug.replace(/'/g, "''");
  
  // Try exact match first (case-sensitive)
  let result = await db.execute(
    sql.raw(`SELECT * FROM blog_posts WHERE slug = '${escapedSlug}' AND status = 'published' LIMIT 1`)
  );

  // If not found, try case-insensitive match
  if (result.rows.length === 0) {
    result = await db.execute(
      sql.raw(`SELECT * FROM blog_posts WHERE LOWER(slug) = LOWER('${escapedSlug}') AND status = 'published' LIMIT 1`)
    );
  }

  if (result.rows.length === 0) {
    return Response.json({ error: "Post not found" }, { status: 404 });
  }

  const post = result.rows[0] as any;

  // Increment view count
  await db.execute(
    sql`UPDATE blog_posts SET view_count = view_count + 1 WHERE id = ${post.id}`
  );

  return Response.json({ post });
}

