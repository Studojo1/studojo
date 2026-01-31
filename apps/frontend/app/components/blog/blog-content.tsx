interface BlogContentProps {
  content: string;
}

export function BlogContent({ content }: BlogContentProps) {
  return (
    <div
      className="prose prose-lg prose-headings:font-['Clash_Display'] prose-headings:font-bold prose-headings:text-neutral-900 prose-p:font-['Satoshi'] prose-p:text-neutral-700 prose-p:leading-7 prose-a:text-violet-600 prose-a:no-underline hover:prose-a:underline prose-strong:font-['Satoshi'] prose-strong:font-bold prose-strong:text-neutral-900 prose-ul:font-['Satoshi'] prose-ul:text-neutral-700 prose-ol:font-['Satoshi'] prose-ol:text-neutral-700 prose-li:font-['Satoshi'] prose-li:text-neutral-700 prose-img:rounded-2xl prose-img:border-2 prose-img:border-neutral-900 prose-img:shadow-[4px_4px_0px_0px_rgba(25,26,35,1)] prose-blockquote:border-l-4 prose-blockquote:border-violet-500 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-neutral-600 prose-code:bg-violet-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-violet-700 prose-pre:bg-neutral-900 prose-pre:text-neutral-100 max-w-none"
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}

