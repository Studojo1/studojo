import { marked } from "marked";
import { useEffect, useState } from "react";
import type { Route } from "./+types/docs.$slug";

export async function loader({ params }: Route.LoaderArgs) {
  const { slug } = params;
  try {
    const response = await fetch(`/doc/${slug}.md`);
    if (!response.ok) {
      return { content: null, slug };
    }
    const content = await response.text();
    return { content, slug };
  } catch (error) {
    console.error("Failed to load doc:", error);
    return { content: null, slug };
  }
}

export default function DocSlug({ loaderData }: Route.ComponentProps) {
  const { content, slug } = loaderData;
  const [html, setHtml] = useState("");

  useEffect(() => {
    if (content) {
      marked.setOptions({
        highlight: (code, lang) => {
          // In production, use highlight.js here
          return code;
        },
      });
      marked.parse(content).then((html) => setHtml(html));
    }
  }, [content]);

  if (!content) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold mb-6">Documentation Not Found</h1>
          <p className="text-gray-600">The document "{slug}" could not be found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-8 prose max-w-none">
          <div dangerouslySetInnerHTML={{ __html: html }} />
        </div>
      </div>
    </div>
  );
}

