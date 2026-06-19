import type { OfficialDocumentAuthor } from '@/lib/reports/official-document-types';

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase();
}

export function OfficialDocumentAuthorBadge({ author }: { author: OfficialDocumentAuthor }) {
  const initials = initialsFromName(author.name);

  return (
    <div className="flex items-center justify-end gap-2">
      {author.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={author.avatarUrl}
          alt=""
          className="size-8 shrink-0 rounded-full border border-slate-200 object-cover"
        />
      ) : (
        <div
          className="flex size-8 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-[10px] font-bold text-slate-600"
          aria-hidden
        >
          {initials}
        </div>
      )}
      <div className="text-right">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Édité par</p>
        <p className="text-xs font-semibold text-slate-900">{author.name}</p>
        {author.email ? <p className="text-[10px] text-slate-500">{author.email}</p> : null}
      </div>
    </div>
  );
}
