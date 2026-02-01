import { useEffect, useState } from "react";
import { useParams, useLoaderData } from "react-router";
import { BlogContent } from "~/components/blog/blog-content";
import { Header, Footer } from "~/components";
import { FiClock, FiEye, FiCalendar } from "react-icons/fi";
import type { Route } from "./+types/blog.$slug";

export function meta({ data }: Route.MetaArgs) {
  if (!data?.post) {
    return [{ title: "Post Not Found – Studojo" }];
  }

  const post = data.post;
  return [
    {
      title: post.seo_meta_title || post.title,
    },
    {
      name: "description",
      content: post.seo_meta_description || post.excerpt,
    },
    {
      property: "og:title",
      content: post.seo_meta_title || post.title,
    },
    {
      property: "og:description",
      content: post.seo_meta_description || post.excerpt,
    },
    ...(post.seo_og_image || post.featured_image
      ? [
          {
            property: "og:image",
            content: post.seo_og_image || post.featured_image,
          },
        ]
      : []),
  ];
}

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featured_image?: string;
  author_name: string;
  author_email: string;
  published_at: string;
  reading_time: number;
  view_count: number;
  categories?: string[];
  tags?: string[];
  seo_meta_title?: string;
  seo_meta_description?: string;
  seo_keywords?: string[];
  seo_og_image?: string;
}

import db from "~/lib/db";
import { sql } from "drizzle-orm";

export async function loader({ params }: Route.LoaderArgs) {
  try {
    const { slug } = params;

    // Decode URL-encoded characters and escape for SQL
    const decodedSlug = decodeURIComponent(slug);
    const escapedSlug = decodedSlug.replace(/'/g, "''").trim();
    
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

    // If still not found, check if post exists with different status
    if (result.rows.length === 0) {
      const anyStatusResult = await db.execute(
        sql.raw(`SELECT slug, status FROM blog_posts WHERE LOWER(slug) = LOWER('${escapedSlug}') LIMIT 1`)
      );
      
      if (anyStatusResult.rows.length > 0) {
        const postStatus = (anyStatusResult.rows[0] as any).status;
        throw new Response(`Post found but status is '${postStatus}', not 'published'`, { status: 404 });
      }
      
      throw new Response("Post not found", { status: 404 });
    }

    const post = result.rows[0] as any;

    // Increment view count (don't let this fail the request)
    try {
      await db.execute(
        sql`UPDATE blog_posts SET view_count = view_count + 1 WHERE id = ${post.id}`
      );
    } catch (error) {
      // Continue anyway - don't fail the request
    }

    // Ensure all Date objects and other non-serializable data are properly converted
    const serializedPost: BlogPost = {
      id: String(post.id),
      title: String(post.title),
      slug: String(post.slug),
      content: String(post.content),
      excerpt: String(post.excerpt),
      featured_image: post.featured_image ? String(post.featured_image) : undefined,
      author_name: String(post.author_name),
      author_email: String(post.author_email),
      published_at: post.published_at ? new Date(post.published_at).toISOString() : String(post.published_at || ''),
      reading_time: Number(post.reading_time) || 0,
      view_count: Number(post.view_count) || 0,
      categories: Array.isArray(post.categories) ? post.categories.map(String) : undefined,
      tags: Array.isArray(post.tags) ? post.tags.map(String) : undefined,
      seo_meta_title: post.seo_meta_title ? String(post.seo_meta_title) : undefined,
      seo_meta_description: post.seo_meta_description ? String(post.seo_meta_description) : undefined,
      seo_keywords: Array.isArray(post.seo_keywords) ? post.seo_keywords.map(String) : undefined,
      seo_og_image: post.seo_og_image ? String(post.seo_og_image) : undefined,
    };

    return { post: serializedPost };
  } catch (error) {
    if (error instanceof Response) {
      throw error;
    }
    console.error(`[blog.$slug] Loader error:`, error);
    throw new Response("Internal server error", { status: 500 });
  }
}

export default function BlogPost({ data }: Route.ComponentProps) {
  // Try both methods - data prop and useLoaderData hook
  const loaderData = useLoaderData() as { post: BlogPost } | undefined;
  const post = (loaderData?.post || data?.post) as BlogPost | undefined;


  if (!post) {
    return (
      <div className="min-h-screen bg-white p-8">
        <div className="mx-auto max-w-4xl">
          <p className="font-['Satoshi'] text-gray-600">Post not found</p>
          {process.env.NODE_ENV === 'development' && (
            <pre className="mt-4 text-xs">{JSON.stringify({ data: data ? 'exists' : 'undefined', post: post ? 'exists' : 'undefined' }, null, 2)}</pre>
          )}
        </div>
      </div>
    );
  }

  return (
    <article className="min-h-screen bg-white">
      <Header />
      {post.featured_image && (
        <div className="h-64 w-full md:h-96">
          <img
            src={post.featured_image}
            alt={post.title}
            className="h-full w-full object-cover"
          />
        </div>
      )}

      <div className="mx-auto max-w-4xl px-4 py-12 md:px-8">
        <header className="mb-12">
          {post.categories && post.categories.length > 0 && (
            <div className="mb-6 flex flex-wrap gap-2">
              {post.categories.map((cat) => (
                <span
                  key={cat}
                  className="rounded-full bg-violet-100 px-4 py-1.5 text-sm font-['Satoshi'] font-medium text-violet-700"
                >
                  {cat}
                </span>
              ))}
            </div>
          )}

          <h1 className="mb-6 font-['Clash_Display'] text-4xl font-bold text-neutral-900 md:text-5xl leading-tight">
            {post.title}
          </h1>

          <div className="flex flex-wrap items-center gap-6 text-sm font-['Satoshi'] text-gray-500 mb-6">
            <span className="flex items-center gap-2">
              <FiCalendar className="w-4 h-4" />
              {new Date(post.published_at).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
            <span className="flex items-center gap-2">
              <FiClock className="w-4 h-4" />
              {post.reading_time} min read
            </span>
            <span className="flex items-center gap-2">
              <FiEye className="w-4 h-4" />
              {post.view_count} views
            </span>
            <span>By {post.author_name}</span>
          </div>
        </header>

        <div className="mt-8">
          <BlogContent content={post.content} />
        </div>

        {post.tags && post.tags.length > 0 && (
          <div className="mt-12 border-t-2 border-neutral-900 pt-8">
            <h3 className="mb-4 font-['Satoshi'] font-bold text-neutral-900">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-['Satoshi'] text-emerald-700"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
      <Footer />
    </article>
  );
}

