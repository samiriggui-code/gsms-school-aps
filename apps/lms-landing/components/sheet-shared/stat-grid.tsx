'use client';

import type { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export type SheetStatItem = {
  total: string;
  label: string;
  badgeLabel?: string;
  badgeColor?: 'success' | 'warning' | 'destructive' | 'outline' | 'secondary' | 'mono';
  text?: string;
  number?: string;
  icon?: ReactNode;
};

type Props = {
  items: SheetStatItem[];
  columnsClassName?: string;
  showBadges?: boolean;
};

export function SheetStatGrid({ items, columnsClassName = 'sm:grid-cols-4', showBadges = false }: Props) {
  return (
    <Card className="rounded-md mb-5 bg-accent/70 p-1">
      <CardContent className="rounded-md p-0 bg-background border border-border">
        <div className={`grid lg:gap-5 ${columnsClassName}`}>
          {items.map((item, index) => (
            <div
              key={index}
              className={`flex flex-col ${showBadges ? 'justify-between gap-5 p-4.5 pb-3.5' : 'px-4 py-3'} ${index > 0 ? 'sm:border-s border-border' : ''}`}
            >
              <div className="flex flex-col gap-0.5">
                <span className={`${showBadges ? 'text-xl lg:text-2xl' : 'text-2xl'} font-semibold text-foreground`}>
                  {item.total}
                  {item.number ? (
                    <span className={`${showBadges ? 'text-xl lg:text-2xl' : 'text-2xl'} font-semibold text-secondary-foreground/30`}>
                      {item.number}
                    </span>
                  ) : null}
                </span>
                <span className="text-xs font-normal text-secondary-foreground/70">{item.label}</span>
              </div>

              {showBadges && item.badgeLabel ? (
                <div className="flex items-center flex-wrap gap-1.5">
                  <Badge variant={item.badgeColor ?? 'success'} size="sm" appearance="light" className="w-fit">
                    {item.icon ? <span className="mr-1 inline-flex">{item.icon}</span> : null}
                    {item.badgeLabel}
                  </Badge>
                  {item.text ? (
                    <span className="text-xs font-normal text-secondary-foreground">{item.text}</span>
                  ) : null}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
