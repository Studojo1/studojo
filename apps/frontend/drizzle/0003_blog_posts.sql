-- Blog posts table
CREATE TABLE IF NOT EXISTS "blog_posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL UNIQUE,
	"content" text NOT NULL,
	"excerpt" text NOT NULL,
	"featured_image" text,
	"author_user_id" text NOT NULL,
	"author_name" text NOT NULL,
	"author_email" text NOT NULL,
	"status" text NOT NULL CHECK ("status" IN ('draft', 'published')),
	"published_at" timestamp with time zone,
	"seo_meta_title" text,
	"seo_meta_description" text,
	"seo_keywords" text[],
	"seo_og_image" text,
	"categories" text[],
	"tags" text[],
	"reading_time" integer NOT NULL,
	"view_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Foreign key constraint
ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_author_user_id_user_id_fk" FOREIGN KEY ("author_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;

-- Indexes
CREATE INDEX IF NOT EXISTS "idx_blog_posts_slug" ON "blog_posts"("slug");
CREATE INDEX IF NOT EXISTS "idx_blog_posts_status" ON "blog_posts"("status");
CREATE INDEX IF NOT EXISTS "idx_blog_posts_published_at" ON "blog_posts"("published_at" DESC) WHERE "status" = 'published';
CREATE INDEX IF NOT EXISTS "idx_blog_posts_categories" ON "blog_posts" USING GIN("categories");
CREATE INDEX IF NOT EXISTS "idx_blog_posts_tags" ON "blog_posts" USING GIN("tags");

