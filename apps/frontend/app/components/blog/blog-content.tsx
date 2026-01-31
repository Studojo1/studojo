interface BlogContentProps {
  content: string;
}

export function BlogContent({ content }: BlogContentProps) {
  return (
    <div
      className="prose prose-lg max-w-none font-['Satoshi']"
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}

