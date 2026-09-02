'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/card';
import type { CrmDashboardHighlight } from '@/lib/crm/crm-dashboard-types';

export function CrmDashboardHighlights({ highlights }: { highlights: CrmDashboardHighlight[] }) {
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">À surveiller</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {highlights.slice(0, 6).map((item) => {
          const row = (
            <div className="flex items-center justify-between rounded-md border border-border/60 px-3 py-2 text-sm">
              <span className="text-muted-foreground">{item.label}</span>
              <span className="font-semibold text-foreground">{item.value}</span>
            </div>
          );
          return item.href ? (
            <Link key={item.id} href={item.href} className="block hover:opacity-90">
              {row}
            </Link>
          ) : (
            <div key={item.id}>{row}</div>
          );
        })}
      </CardContent>
    </Card>
  );
}
