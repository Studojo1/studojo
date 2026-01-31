import { Link } from "react-router";
import { FiClock, FiEye } from "react-icons/fi";

interface BlogCardProps {
  post: {
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
  };
}

export function BlogCard({ post }: BlogCardProps) {
  return (
    <Link
      to={`/blog/${post.slug}`}
      className="group block rounded-2xl border-2 border-neutral-900 bg-white overflow-hidden shadow-[4px_4px_0px_0px_rgba(25,26,35,1)] transition-transform hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none"
    >
      {post.featured_image && (
        <div className="relative h-48 w-full overflow-hidden bg-neutral-100">
          <img
            src={post.featured_image}
            alt={post.title}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        </div>
      )}
      <div className="p-6 md:p-8">
        {post.categories && post.categories.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {post.categories.slice(0, 2).map((cat) => (
              <span
                key={cat}
                className="rounded-full border border-neutral-900 bg-violet-100 px-3 py-1 text-xs font-['Satoshi'] font-medium text-violet-700"
              >
                {cat}
              </span>
            ))}
          </div>
        )}
        <h3 className="mb-3 font-['Clash_Display'] text-xl font-medium leading-tight text-neutral-900 line-clamp-2 md:text-2xl group-hover:text-violet-600 transition-colors">
          {post.title}
        </h3>
        <p className="mb-4 font-['Satoshi'] text-sm font-normal leading-6 text-neutral-600 line-clamp-2 md:text-base">
          {post.excerpt}
        </p>
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-['Satoshi'] font-normal text-neutral-500 md:text-sm">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <FiClock className="w-4 h-4" />
              {post.reading_time} min
            </span>
            <span className="flex items-center gap-1.5">
              <FiEye className="w-4 h-4" />
              {post.view_count}
            </span>
          </div>
          <span className="text-neutral-600">
            {new Date(post.published_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        </div>
      </div>
    </Link>
  );
}

