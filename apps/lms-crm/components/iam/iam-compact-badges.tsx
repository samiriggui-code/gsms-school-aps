'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type IamCompactBadgeItem = {
  id: string;
  label: string;
  title?: string;
};

type Props = {
  items: IamCompactBadgeItem[];
  maxVisible?: number;
  className?: string;
};

/** Aperçu compact pour datatable — 2 lignes max, le reste en +N (détail dans le sheet). */
export function IamCompactBadges({
  items,
  maxVisible = 3,
  className,
}: Props) {
  if (!items.length) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }

  const visible = items.slice(0, maxVisible);
  const rest = items.length - visible.length;
  const fullList = items.map((i) => i.label).join(', ');

  return (
    <div
      className={cn(
        'max-w-[200px] overflow-hidden py-0.5',
        className,
      )}
      title={fullList}
    >
      <div className="flex max-h-[2.6rem] flex-wrap items-center gap-1 overflow-hidden">
        {visible.map((item) => (
          <Badge
            key={item.id}
            variant="success"
            appearance="light"
            className="shrink-0 text-[10px] font-normal leading-tight"
            title={item.title ?? item.label}
          >
            {item.label}
          </Badge>
        ))}
        {rest > 0 ? (
          <Badge
            variant="outline"
            className="shrink-0 text-[10px] font-normal text-muted-foreground"
            title={fullList}
          >
            +{rest}
          </Badge>
        ) : null}
      </div>
    </div>
  );
}
