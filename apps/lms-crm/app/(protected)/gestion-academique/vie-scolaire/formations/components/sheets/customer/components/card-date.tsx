'use client';

import { Card, CardContent } from "@repo/ui/card";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import { Calendar, MapPin } from "lucide-react";

const sessions = [
  { date: '04 Mai au 12 Juin 2026', location: 'Rueil-Malmaison', label: 'EXAMEN inclus' },
  { date: '18 Mai au 22 Juin 2026', location: 'Rueil-Malmaison', label: 'Initial' },
  { date: '26 Mai au 30 Juin 2026', location: 'Rueil-Malmaison', label: 'Initial' },
  { date: '06 Juil au 11 Août 2026', location: 'Rueil-Malmaison', label: 'EXAMEN inclus' },
  { date: '07 Sep au 09 Oct 2026', location: 'Rueil-Malmaison', label: 'Initial' },
  { date: '21 Sep au 26 Oct 2026', location: 'Rueil-Malmaison', label: 'Initial' },
  { date: '28 Sep au 30 Oct 2026', location: 'Rueil-Malmaison', label: 'Initial' },
  { date: '16 Nov au 21 Déc 2026', location: 'Rueil-Malmaison', label: 'Initial' },
  { date: '16 Nov au 18 Déc 2026', location: 'Rueil-Malmaison', label: 'Initial' },
  { date: '30 Nov 2026 au 18 Jan 2027', location: 'Rueil-Malmaison', label: 'Initial' },
];

export function CardDate() {  
  return (
    <div className="grid lg:grid-cols-2 gap-5 h-[400px] overflow-auto pr-2">
      {sessions.map((session, index) => (
        <Card key={index} className="bg-accent/50 rounded-md shadow-none border border-border">
          <CardContent className="p-0">
            <div className="flex flex-col gap-0.5 py-3 ps-4 bg-accent/30 rounded-t-md border-b border-input">
              <div className="flex items-center gap-2">
                <MapPin className="size-3.5 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">Form'SSI {session.location}</span>
                <Badge variant="success" size="sm" appearance="light" className="ms-auto me-4">
                  {session.label}
                </Badge>
              </div>
            </div>
            <div className="bg-background rounded-b-md m-1 mt-0 p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center rounded-md bg-accent/50 size-10 shrink-0">
                  <Calendar className="size-5 text-primary" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-foreground leading-tight">
                    {session.date}
                  </span>
                  <span className="text-xs text-muted-foreground">Formation TFP APS</span>
                </div>
              </div>
              <Button variant="outline" size="sm">
                Réserver
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>  
  );
}
