'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Calendar, TrendingUp, Users } from 'lucide-react';
import type { VenueRoomRow } from '../../types';

export function SalleOverviewStats({ room }: { room: VenueRoomRow }) {
  const items = [
    {
      total: String(room.activeSessionsCount),
      label: 'Sessions en cours',
      badgeLabel: room.activeSessionsCount > 0 ? '100' : '0',
      badgeColor: room.activeSessionsCount > 0 ? 'success' : 'outline',
      text: 'Occupation actuelle',
      icon: <Calendar className="size-3" />,
    },
    {
      total: String(room.upcomingSessionsCount),
      label: 'Sessions à venir',
      badgeLabel: room.upcomingSessionsCount > 0 ? '100' : '0',
      badgeColor: room.upcomingSessionsCount > 0 ? 'success' : 'outline',
      text: 'Planification',
      icon: <TrendingUp className="size-3" />,
    },
    {
      total: room.capacity != null ? String(room.capacity) : '—',
      label: 'Capacité',
      badgeLabel: room.capacity != null && room.capacity > 0 ? '100' : '0',
      badgeColor: room.capacity != null && room.capacity > 0 ? 'success' : 'outline',
      text: 'Places assises',
      icon: <Users className="size-3" />,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-5 mb-5 md:grid-cols-2 lg:grid-cols-2">
      {items.map((item, index) => (
        <Card
          key={index}
          className="shadow-none border border-border/50 bg-background group hover:border-border transition-all duration-300"
        >
          <CardContent className="p-5 flex flex-col justify-between h-full">
            <div className="flex justify-between items-start mb-4">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">
                  {item.label}
                </span>
                <span className="text-2xl font-bold text-foreground tracking-tight">
                  {item.total}
                </span>
              </div>
              <div className="p-2 rounded-lg border border-border/50 bg-background text-foreground/70">
                {item.icon}
              </div>
            </div>
            <div className="flex items-center gap-2 mt-auto">
              <Badge
                variant="outline"
                size="sm"
                className={cn(
                  'font-bold text-[10px] px-1.5 py-0 border-border text-foreground/70',
                  item.badgeColor === 'success' && 'border-emerald-200 text-emerald-700 bg-emerald-50',
                )}
              >
                {item.badgeColor === 'success' ? '+' : ''}
                {item.badgeLabel}%
              </Badge>
              <span className="text-[11px] font-medium text-muted-foreground">{item.text}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
