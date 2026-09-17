import { docsIconSvg } from '@/lib/docs-icon-svg';

const APP_ROUTE_PREFIXES = [
  '/accueil',
  '/signin',
  '/signup',
  '/mon-dossier',
  '/cnaps',
  '/formation',
  '/e-formation',
  '/apprendre',
  '/formateur',
  '/communication-contenu',
  '/gestion-academique',
  '/gestion-ressources',
  '/administration-facturation',
  '/gestion-sites-clients',
  '/support-qualite',
  '/qualiopi',
  '/securite-configuration',
  '/mon-profil',
  '/account',
  '/api',
  '/docs',
  '/brand',
  '/media',
  '/uploads',
];

export type PreparedDocsContent = {
  title?: string;
  description?: string;
  body: string;
};

function normalizeSource(source: string): string {
  return source.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

function parseFrontmatter(source: string): { meta: Record<string, string>; body: string } {
  const normalized = normalizeSource(source);
  if (!normalized.startsWith('---\n')) return { meta: {}, body: normalized };

  const end = normalized.indexOf('\n---\n', 4);
  if (end === -1) return { meta: {}, body: normalized };

  const block = normalized.slice(4, end);
  const body = normalized.slice(end + 5).trimStart();
  const meta: Record<string, string> = {};

  for (const line of block.split('\n')) {
    const match = line.match(/^([\w-]+):\s*(.*)$/);
    if (!match) continue;
    meta[match[1]] = match[2].replace(/^['"]|['"]$/g, '').trim();
  }

  return { meta, body };
}

export function fixDocsHref(href: string): string {
  const trimmed = href.trim();
  if (
    !trimmed ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('mailto:') ||
    trimmed.startsWith('/docs/') ||
    trimmed.startsWith('/#')
  ) {
    return trimmed;
  }
  if (APP_ROUTE_PREFIXES.some((p) => trimmed === p || trimmed.startsWith(`${p}/`))) {
    return trimmed;
  }
  if (trimmed.startsWith('/')) return `/docs${trimmed}`;
  return `/docs/${trimmed}`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function cardHtml(attrs: string, content: string): string {
  const title = attrs.match(/title="([^"]*)"/i)?.[1] ?? 'Voir';
  const href = attrs.match(/href="([^"]*)"/i)?.[1];
  const icon = attrs.match(/icon="([^"]*)"/i)?.[1];
  const desc = escapeHtml(content.trim().replace(/\s+/g, ' '));
  const iconSvg = docsIconSvg(icon);
  const titleHtml = escapeHtml(title);

  if (href) {
    const url = fixDocsHref(href);
    return `<a class="docs-card" href="${escapeHtml(url)}"><span class="docs-card-icon">${iconSvg}</span><span class="docs-card-body"><span class="docs-card-title">${titleHtml}</span><span class="docs-card-desc">${desc}</span></span><span class="docs-card-chevron" aria-hidden="true">›</span></a>`;
  }

  return `<div class="docs-card docs-card-static"><span class="docs-card-icon">${iconSvg}</span><span class="docs-card-body"><span class="docs-card-title">${titleHtml}</span><span class="docs-card-desc">${desc}</span></span></div>`;
}

function convertMintlifyComponents(body: string): string {
  let out = body;

  out = out.replace(/<Card\s+([^>]*?)>([\s\S]*?)<\/Card>/gi, (_, attrs, content) => cardHtml(attrs, content));

  out = out.replace(/<CardGroup\s+cols=\{?(\d+)\}?[^>]*>([\s\S]*?)<\/CardGroup>/gi, (_, cols, inner) => {
    return `\n<div class="docs-card-grid" data-cols="${cols || 2}">${inner.trim()}</div>\n`;
  });
  out = out.replace(/<CardGroup>([\s\S]*?)<\/CardGroup>/gi, (_, inner) => {
    return `\n<div class="docs-card-grid" data-cols="2">${inner.trim()}</div>\n`;
  });

  out = out.replace(/<Step\s+title="([^"]*)">([\s\S]*?)<\/Step>/gi, (_, title, content) => {
    return `<li class="docs-step"><span class="docs-step-title">${escapeHtml(title)}</span><span class="docs-step-body">${content.trim()}</span></li>`;
  });
  out = out.replace(/<Steps>([\s\S]*?)<\/Steps>/gi, (_, inner) => {
    return `\n<ol class="docs-steps">${inner.trim()}</ol>\n`;
  });

  const callout = (type: string, label: string) => (_match: string, content: string) =>
    `\n<aside class="docs-callout docs-callout-${type}"><span class="docs-callout-label">${label}</span><div class="docs-callout-body">${content.trim()}</div></aside>\n`;

  out = out.replace(/<Tip>([\s\S]*?)<\/Tip>/gi, callout('tip', 'Astuce'));
  out = out.replace(/<Note>([\s\S]*?)<\/Note>/gi, callout('note', 'Note'));
  out = out.replace(/<Warning>([\s\S]*?)<\/Warning>/gi, callout('warning', 'Attention'));
  out = out.replace(/<Info>([\s\S]*?)<\/Info>/gi, callout('info', 'Info'));

  out = out.replace(/<Frame[^>]*>([\s\S]*?)<\/Frame>/gi, '<div class="docs-frame">$1</div>');
  out = out.replace(/<AccordionItem[^>]*title="([^"]*)"[^>]*>([\s\S]*?)<\/AccordionItem>/gi, (_, title, content) => {
    return `<details class="docs-accordion"><summary>${escapeHtml(title)}</summary><div>${content.trim()}</div></details>`;
  });
  out = out.replace(/<\/?Accordion>/gi, '');

  out = out.replace(/<([A-Z][A-Za-z0-9]*)\b[^>]*\/>/g, '');
  out = out.replace(/<([A-Z][A-Za-z0-9]*)\b[^>]*>([\s\S]*?)<\/\1>/g, '$2');

  return out;
}

function fixMarkdownLinks(body: string): string {
  return body.replace(/\[([^\]]+)\]\((\/[^)\s]+)\)/g, (_, label: string, href: string) => {
    return `[${label}](${fixDocsHref(href)})`;
  });
}

export function prepareDocsMarkdown(source: string): PreparedDocsContent {
  const { meta, body: rawBody } = parseFrontmatter(source);
  const body = fixMarkdownLinks(convertMintlifyComponents(rawBody)).trim();
  return {
    title: meta.title,
    description: meta.description,
    body,
  };
}
