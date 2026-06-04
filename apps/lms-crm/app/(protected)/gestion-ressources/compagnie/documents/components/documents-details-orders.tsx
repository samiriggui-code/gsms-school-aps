'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDateTime } from '@/lib/helpers';

type ShiftItem = {
  id: string;
  startAt: string;
  endAt: string;
  siteName: string;
  agentName: string;
};

export function DocumentsDetailsOrders({ shifts }: { shifts?: ShiftItem[] }) {
  const items = shifts || [];

  return (
    <Card className="border border-border/60 shadow-none">
      <CardHeader className="px-5 py-4 border-b border-border/60">
        <CardTitle className="text-sm font-semibold">Prochaines vacations</CardTitle>
      </CardHeader>
      <CardContent className="p-0 divide-y divide-border/60">
        {items.length === 0 ? (
          <div className="px-5 py-6 text-sm text-muted-foreground">Aucune vacation planifiée.</div>
        ) : (
          items.map((shift) => (
            <div key={shift.id} className="flex items-center justify-between px-5 py-4">
              <div>
                <div className="text-sm font-semibold text-foreground">{shift.siteName}</div>
                <div className="text-xs text-muted-foreground">
                  {shift.startAt ? formatDateTime(new Date(shift.startAt)) : '-'}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-muted-foreground">{shift.agentName || 'Agent'}</div>
                <Badge variant="outline" appearance="light" className="uppercase text-[10px] font-semibold">
                  Planifiée
                </Badge>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
