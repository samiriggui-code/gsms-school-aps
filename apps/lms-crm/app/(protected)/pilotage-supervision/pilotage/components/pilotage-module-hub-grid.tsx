'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { PilotageLandingSparkline } from '@repo/api-core';
import { Area, AreaChart, ResponsiveContainer } from 'recharts';

type Props = {
  card: PilotageLandingSparkline;
};

/** REUI area-chart-1 — carte module condensée avec sparkline. */
export function PilotageModuleSparklineCard({ card }: Props) {
  return (
    <Card className="overflow-hidden transition-colors hover:border-primary/30">
      <CardContent className="space-y-4 p-5">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{card.title}</p>
            <p className="text-xs text-muted-foreground">{card.period}</p>
          </div>
          <Button variant="ghost" size="sm" className="h-8 shrink-0 px-2" asChild title="Ouvrir la landing module">
            <Link href={card.href}>
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>

        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="text-2xl font-bold tabular-nums">{card.value}</p>
            <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{card.subtitle}</p>
          </div>
          <div className="h-14 w-[120px] shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={card.sparkline} margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
                <defs>
                  <linearGradient id={`spark-${card.key}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={card.color} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={card.color} stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={card.color}
                  fill={`url(#spark-${card.key})`}
                  strokeWidth={2}
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {card.pilotageLinks && card.pilotageLinks.length > 0 ? (
          <div className="flex flex-wrap gap-1 border-t border-border/60 pt-3">
            {card.pilotageLinks.map((link) => (
              <Button key={link.href} variant="outline" size="sm" className="h-7 px-2 text-2xs" asChild>
                <Link href={link.href}>{link.label}</Link>
              </Button>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

type GridProps = {
  sparklines: PilotageLandingSparkline[];
};

export function PilotageModuleHubGrid({ sparklines }: GridProps) {
  if (!sparklines.length) return null;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-foreground">Hub modules CRM</h2>
        <p className="text-sm text-muted-foreground">
          Vue condensée par section — cliquez la flèche pour la landing module, les boutons pour le pilotage détaillé.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 lg:gap-6">
        {sparklines.map((card) => (
          <PilotageModuleSparklineCard key={card.key} card={card} />
        ))}
      </div>
    </div>
  );
}
