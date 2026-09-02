/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { Card, CardContent } from "@repo/ui/card";
import { CalendarDays, FileText } from "lucide-react";

export function AbsenceOverviewStats({ absence }: { absence: any }) {
  const stats = absence?.TenantUser?._count || { absences: 0, journalEntries: 0 };

  const items = [
    {
      total: String(stats.absences || 0),
      label: 'Demandes totales',
      text: 'Toutes périodes confondues',
      icon: <CalendarDays className="size-3" />,
    },
    {
      total: String(stats.journalEntries || 0),
      label: 'Entrées journal',
      text: 'Événements RH enregistrés',
      icon: <FileText className="size-3" />,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-5 mb-5">
      {items.map((item, index) => (
        <Card key={index} className="shadow-none border border-border bg-background group hover:border-foreground/20 transition-all duration-300">
          <CardContent className="p-5 flex flex-col justify-between h-full">
            <div className="flex justify-between items-start mb-4">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5 group-hover:text-foreground transition-colors">
                  {item.label}
                </span>
                <span className="text-2xl font-bold text-foreground tracking-tight">
                  {item.total}
                </span>
              </div>
              <div className="p-2 rounded-lg text-foreground/70 bg-background border border-border">
                {item.icon}
              </div>
            </div>

            <span className="text-[11px] font-medium text-muted-foreground mt-auto">
              {item.text}
            </span>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
