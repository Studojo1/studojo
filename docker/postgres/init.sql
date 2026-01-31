CREATE EXTENSION IF NOT EXISTS vector;

-- Resumes table for storing user resumes
-- Note: Foreign key constraint to user table is added after user table is created by frontend migrations
CREATE TABLE IF NOT EXISTS "resumes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"resume_data" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- Foreign key constraint will be added after user table exists (via migrations or separate script)
-- ALTER TABLE "resumes" ADD CONSTRAINT "resumes_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;

CREATE INDEX IF NOT EXISTS "resumes_user_created_idx" ON "resumes" USING btree ("user_id","created_at" DESC);
