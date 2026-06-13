'use client';

import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

type Props = {
  content: string;
};

export function DocsMarkdown({ content }: Props) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeRaw]}
      components={{
        a: ({ href, children }) => {
          if (!href) return <span>{children}</span>;
          if (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('mailto:')) {
            return (
              <a href={href} target="_blank" rel="noopener noreferrer">
                {children}
              </a>
            );
          }
          return <Link href={href}>{children}</Link>;
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
