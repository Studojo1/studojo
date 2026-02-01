interface BlogContentProps {
  content: string;
}

export function BlogContent({ content }: BlogContentProps) {
  return (
    <div
      className="blog-content font-['Satoshi'] text-neutral-900 leading-relaxed"
      dangerouslySetInnerHTML={{ __html: content }}
      style={{
        fontSize: '18px',
        lineHeight: '1.75',
      }}
    />
  );
}

