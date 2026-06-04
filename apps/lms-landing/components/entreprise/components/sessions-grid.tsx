'use client';

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users, Clock } from "lucide-react";
import { EntrepriseType } from "../../entreprise-details-sheet";
import { useEntrepriseSheetContent } from '../content';

export function EntrepriseSessionsGrid({ type }: { type: EntrepriseType }) {
  const content = useEntrepriseSheetContent(type);
  const sessionsCopy = content.t(`${content.path}.sessions`, { returnObjects: true }) as {
    title: string;
    badge: string;
    date: string;
    location: string;
    seats: string;
    time: string;
    seatsLabel: string;
    timeLabel: string;
    status: string;
    hint: string;
  };

  const sessions = [
    {
      date: sessionsCopy.date,
      location: sessionsCopy.location,
      seats: sessionsCopy.seats,
      time: sessionsCopy.time,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-foreground">{sessionsCopy.title}</h3>
        <Badge variant="outline">{sessionsCopy.badge}</Badge>
      </div>
      
      <div className="grid sm:grid-cols-1 gap-4">
        {sessions.map((session, idx) => (
          <Card key={idx} className="border border-border shadow-none bg-accent/30">
            <CardContent className="p-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="bg-background p-2 rounded-md border border-border">
                  <Calendar className="size-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{session.date}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <MapPin className="size-3" /> {session.location}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                    <Users className="size-3" /> {sessionsCopy.seatsLabel}
                  </div>
                  <p className="text-sm font-medium">{session.seats}</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                    <Clock className="size-3" /> {sessionsCopy.timeLabel}
                  </div>
                  <p className="text-sm font-medium">{session.time}</p>
                </div>
              </div>
              
              <Badge variant="success" appearance="light">{sessionsCopy.status}</Badge>
            </CardContent>
          </Card>
        ))}
      </div>
      <p className="text-xs text-muted-foreground italic">
        * {sessionsCopy.hint}
      </p>
    </div>
  );
}
