/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { Card, CardContent } from "@/components/ui/card";
import { TrendingDown, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";


import { User as Formation } from "@/app/models/user";

export function FormationOverviewStats({ Formation }: { Formation: Formation }) {
  const items = [
    { 
      total: Formation._count?.journalEntries?.toString() || '0', 
      label: 'Actions totales',
      badgeLabel: '23.08',
      badgeColor: 'success',
      text: 'Tendance annuelle',
      number: '',
      icon: <TrendingUp className="size-3" />,
    }, 
    { 
      total: Formation._count?.shifts?.toString() || '0', 
      label: 'Missions effectuÃ©es',
      badgeLabel: '3.82',
      badgeColor: 'success',
      text: 'Total planning',
      number: '',
      icon: <TrendingUp className="size-3" />,
    }, 
    { 
      total: Formation.status === 'ACTIVE' ? '92' : '45', 
      label: 'Score fiabilitÃ©',
      badgeLabel: '0.39',
      badgeColor: Formation.status === 'ACTIVE' ? 'success' : 'destructive',
      text: 'BasÃ© sur activitÃ©',
      number: '%',
      icon: Formation.status === 'ACTIVE' ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />,
    }, 
    { 
      total: Formation._count?.absences?.toString() || '0', 
      label: 'Absences totales',
      badgeLabel: '0',
      badgeColor: (Formation._count?.absences || 0) > 2 ? 'destructive' : 'success',
      text: 'Historique RH',
      number: '',
      icon: (Formation._count?.absences || 0) > 2 ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />,
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-5">
      {items.map((item, index) => ( 
        <Card key={index} className="shadow-none border border-border/50 bg-background group hover:border-border transition-all duration-300">
          <CardContent className="p-5 flex flex-col justify-between h-full">
            <div className="flex justify-between items-start mb-4">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">
                  {item.label}
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-foreground tracking-tight">
                    {item.total}
                  </span>
                  {item.number && (
                    <span className="text-sm font-semibold text-muted-foreground/60">
                      {item.number}
                    </span>
                  )}
                </div>
              </div>
              <div className="p-2 rounded-lg border border-border/50 bg-background text-foreground/70">
                {item.icon}
              </div>
            </div>

            <div className="flex items-center gap-2 mt-auto">
              <Badge 
                variant="outline" 
                size="sm" 
                className="font-bold text-[10px] px-1.5 py-0 border-border text-foreground/70"
              >
                {item.badgeColor === 'success' ? '+' : ''}{item.badgeLabel}%
              </Badge>
              <span className="text-[11px] font-medium text-muted-foreground">
                {item.text}
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

