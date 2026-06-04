/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { Card, CardContent } from "@/components/ui/card";
import { TrendingDown, TrendingUp, Calendar, Clock, AlertTriangle, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Absence } from "@/app/models/absence";

export function AbsenceOverviewStats({ absence }: { absence: any }) {
  const stats = absence?.TenantUser?._count || { absences: 0, journalEntries: 0 };
  
  // Calculate presence score (mock for now but more realistic)
  // In a real app, this would come from the backend
  const presenceScore = 95 + Math.floor(Math.random() * 5); 
  const totalRequests = stats.absences || 0;
  const rhAlerts = Math.max(0, stats.journalEntries - 5);

  const items = [
    { 
      total: totalRequests.toString(), 
      label: 'Demandes totales',
      badgeLabel: '15',
      badgeColor: 'success',
      text: 'Sur 12 mois',
      number: '',
      icon: <TrendingUp className="size-3" />,
    }, 
    { 
      total: '4.5', 
      label: 'Moyenne jours',
      badgeLabel: '0.5',
      badgeColor: 'destructive',
      text: 'Vs moyenne site',
      number: ' j',
      icon: <TrendingUp className="size-3" />,
    }, 
    { 
      total: presenceScore.toString(), 
      label: 'Score présence',
      badgeLabel: '1.2',
      badgeColor: 'success',
      text: 'Tendance 30j',
      number: '%',
      icon: <TrendingUp className="size-3" />,
    }, 
    { 
      total: rhAlerts.toString(), 
      label: 'Alertes RH',
      badgeLabel: '0',
      badgeColor: 'success',
      text: 'Conflits planning',
      number: '',
      icon: <TrendingDown className="size-3" />,
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-5">
      {items.map((item, index) => ( 
        <Card key={index} className="shadow-none border border-border bg-background group hover:border-foreground/20 transition-all duration-300">
          <CardContent className="p-5 flex flex-col justify-between h-full">
            <div className="flex justify-between items-start mb-4">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5 group-hover:text-foreground transition-colors">
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
              <div className="p-2 rounded-lg text-foreground/70 bg-background border border-border">
                {item.icon}
              </div>
            </div>

            <div className="flex items-center gap-2 mt-auto">
              <Badge 
                variant={item.badgeColor as any}
                size="sm" 
                appearance="light" 
                className="font-bold uppercase text-[10px] tracking-wider px-1.5 py-0.5"
              >
                {item.icon}
                {item.badgeColor === 'success' ? '+' : '-'}{item.badgeLabel}%
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
