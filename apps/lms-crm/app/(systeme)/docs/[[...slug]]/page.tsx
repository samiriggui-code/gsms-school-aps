import Link from 'next/link';
import { notFound } from 'next/navigation';
import { DocsMarkdown } from '@/components/docs/docs-markdown';
import {
  readPreparedDocs,
  resolveDocsLocale,
  slugToTitle,
  type DocsLocale,
} from '@/lib/docs-content';

type Props = { params: Promise<{ slug?: string[] }> };

function localeHome(locale: DocsLocale) {
  return locale === 'en' ? '/docs/en/introduction' : '/docs/introduction';
}

export default async function DocsPage({ params }: Props) {
  const { slug } = await params;
  const parts = slug ?? ['introduction'];
  const prepared = readPreparedDocs(parts);
  if (!prepared) notFound();

  const locale = resolveDocsLocale(parts);
  const title = prepared.title ?? slugToTitle(parts.join('/'));

  return (
    <article>
      <header className="docs-page-hero">
        <nav className="docs-breadcrumb" aria-label="Fil d'Ariane">
          <Link href={localeHome(locale)}>{locale === 'en' ? 'Documentation' : 'Guide école'}</Link>
          <span aria-hidden>/</span>
          <span>{title}</span>
        </nav>
        <h1 className="docs-page-title">{title}</h1>
        {prepared.description ? <p className="docs-page-desc">{prepared.description}</p> : null}
      </header>

      <div className="docs-article mt-8">
        <DocsMarkdown content={prepared.body} />
      </div>
    </article>
  );
}
