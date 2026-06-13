'use client';

import { Badge } from '@/components/ui/badge';
import { useBsBeSheetContent } from '../content';

export function BsBeSessionsGrid() {
  const content = useBsBeSheetContent();
  const sessions = content.t(`${content.path}.sessions`, { returnObjects: true }) as {
    title: string;
    subtitle: string;
    badge: string;
  };

  return (
    <div className="space-y-4 py-10 text-center border border-dashed border-border rounded-lg bg-accent/20">
      <h3 className="text-lg font-semibold text-foreground">{sessions.title}</h3>
      <p className="text-sm text-muted-foreground max-w-md mx-auto">{sessions.subtitle}</p>
      <Badge size="lg" variant="success" appearance="light">
        {sessions.badge}
      </Badge>
    </div>
  );
}
