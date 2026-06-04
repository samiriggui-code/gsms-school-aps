/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, Clock, ShieldCheck, Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function UserStatistics({ user }: { user: any }) {
  const items = [
    { 
      total: '94%', 
      label: 'Score Moyen',
      badgeLabel: 'Excellence',
      badgeColor: 'success',
      text: 'Performance globale',
      icon: <ShieldCheck className="size-3" />,
    }, 
    { 
      total: '12', 
      label: 'Certifications',
      badgeLabel: '+2',
      badgeColor: 'primary',
      text: 'Ce trimestre',
      icon: <TrendingUp className="size-3" />,
    }, 
    { 
      total: '28', 
      label: 'Cours terminés',
      badgeLabel: 'Active',
      badgeColor: 'success',
      text: 'Sur 32 assignés',
      icon: <Activity className="size-3" />,
    }, 
    { 
      total: '458h', 
      label: 'Temps de formation',
      badgeLabel: '12h',
      badgeColor: 'primary',
      text: 'Moyenne mensuelle',
      icon: <Clock className="size-3" />,
    }
  ];

  return (
    <Card className="rounded-md mb-5 bg-accent/70 p-1">
      <CardContent className="rounded-md p-0 bg-background border border-border">
        <div className="grid md:grid-cols-4 lg:gap-5">
          {items.map((item, index) => ( 
            <div key={index} className={`flex flex-col justify-between gap-5 p-4.5 pb-3.5 ${index > 0 ? 'md:border-s border-border' : ''}`}>
              <div className="flex flex-col gap-0.5">
                <span className="text-xl lg:text-2xl font-semibold text-foreground">
                  {item.total}
                </span>
                <span className="text-xs font-normal text-secondary-foreground/70">
                  {item.label}
                </span>
              </div>

              <div className="flex items-center flex-wrap gap-1.5">
                <Badge variant={item.badgeColor as any} size="sm" appearance="light" className="w-fit">
                {item.icon} {item.badgeLabel}
                </Badge>
                <span className="text-xs font-normal text-secondary-foreground">
                  {item.text}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
