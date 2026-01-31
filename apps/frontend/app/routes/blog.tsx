import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { BlogCard } from "~/components/blog/blog-card";
import { Header, Footer } from "~/components";
import type { Route } from "./+types/blog";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Blog – Studojo" },
    {
      name: "description",
      content: "Read our latest blog posts",
    },
  ];
}

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  featured_image?: string;
  author_name: string;
  published_at: string;
  reading_time: number;
  view_count: number;
  categories?: string[];
}

export default function Blog() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(parseInt(searchParams.get("page") || "1", 10));
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState(searchParams.get("search") || "");

  useEffect(() => {
    loadPosts();
  }, [page, search]);

  const loadPosts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "12",
      });

      if (search) {
        params.append("search", search);
      }

      const response = await fetch(`/api/blog?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to load posts");
      }

      const data = await response.json();
      setPosts(data.posts || []);
      setTotalPages(data.totalPages || 1);
      setSearchParams({ page: page.toString(), ...(search && { search }) });
    } catch (error) {
      console.error("Error loading posts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadPosts();
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <div className="mx-auto max-w-[var(--section-max-width)] px-[var(--section-padding-x)] py-[var(--section-padding-y)]">
        <div className="mb-12 text-center md:mb-16">
          <h1 className="font-['Clash_Display'] text-4xl font-medium leading-tight text-neutral-900 md:text-5xl lg:text-6xl">
            Blog
          </h1>
          <p className="mt-4 font-['Satoshi'] text-base font-normal leading-7 text-neutral-700 md:text-lg md:max-w-2xl md:mx-auto">
            Insights, tips, and stories from Studojo
          </p>
        </div>

        <form onSubmit={handleSearch} className="mb-12 md:mb-16">
          <div className="mx-auto flex max-w-md gap-3">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search posts..."
              className="flex-1 rounded-2xl border-2 border-neutral-900 bg-white px-4 py-3 font-['Satoshi'] text-base font-normal text-neutral-900 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
            />
            <button
              type="submit"
              className="rounded-2xl border-2 border-neutral-900 bg-violet-500 px-6 py-3 font-['Satoshi'] text-base font-medium text-white shadow-[4px_4px_0px_0px_rgba(25,26,35,1)] transition-transform hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none"
            >
              Search
            </button>
          </div>
        </form>

        {loading ? (
          <div className="text-center py-16 md:py-24">
            <div className="mb-4 inline-block h-10 w-10 animate-spin rounded-full border-4 border-solid border-violet-500 border-r-transparent"></div>
            <p className="font-['Satoshi'] text-base font-normal text-neutral-600">Loading posts...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16 md:py-24">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-neutral-900 bg-violet-100">
              <svg className="h-8 w-8 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="font-['Satoshi'] text-base font-normal text-neutral-600">No posts found</p>
            {search && (
              <p className="mt-2 font-['Satoshi'] text-sm font-normal text-neutral-500">
                Try a different search term
              </p>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 md:gap-8">
              {posts.map((post) => (
                <BlogCard key={post.id} post={post} />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-12 flex items-center justify-center gap-4 md:mt-16">
                <button
                  onClick={() => {
                    setPage((p) => Math.max(1, p - 1));
                  }}
                  disabled={page === 1}
                  className="rounded-2xl border-2 border-neutral-900 bg-white px-6 py-3 font-['Satoshi'] text-sm font-medium text-neutral-900 shadow-[4px_4px_0px_0px_rgba(25,26,35,1)] transition-transform disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none"
                >
                  Previous
                </button>
                <span className="flex items-center px-6 font-['Satoshi'] text-sm font-medium text-neutral-700">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => {
                    setPage((p) => Math.min(totalPages, p + 1));
                  }}
                  disabled={page === totalPages}
                  className="rounded-2xl border-2 border-neutral-900 bg-white px-6 py-3 font-['Satoshi'] text-sm font-medium text-neutral-900 shadow-[4px_4px_0px_0px_rgba(25,26,35,1)] transition-transform disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
      <Footer />
    </div>
  );
}

