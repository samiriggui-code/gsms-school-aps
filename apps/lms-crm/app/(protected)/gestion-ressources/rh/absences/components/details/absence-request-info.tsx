'use client';

import { Absence } from "@/app/models/absence";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  Clock, 
  FileText, 
  User,
  Info,
  CalendarDays,
  StickyNote
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ABSENCE_TYPES } from "../../constants";

interface AbsenceRequestInfoProps {
  absence: Absence;
}

export function AbsenceRequestInfo({ absence }: AbsenceRequestInfoProps) {
  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return "Non renseigné";
    try {
      return format(new Date(date), "dd MMMM yyyy", { locale: fr });
    } catch (e) {
      return "Format invalide";
    }
  };

  const typeInfo = ABSENCE_TYPES.find(t => t.id === absence.type) || ABSENCE_TYPES[3];
  const start = new Date(absence.startDate);
  const end = new Date(absence.endDate);
  const durationDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  return (
    <Card className="shadow-none border border-border bg-background">
      <CardHeader className="pb-4 pt-6 px-6 border-b border-border bg-background">
        <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2.5 text-foreground/80">
          <div className="p-2 rounded-lg bg-background border border-border">
            <Info className="size-4 text-foreground/70" />
          </div>
          Détails de la demande
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-8 p-6">
        <div className="grid sm:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-1">
                <span className="w-1.5 h-1.5 rounded-full bg-foreground/30" />
                <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Type & Collaborateur</h4>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-2sm pb-2 border-b border-dashed border-border/60">
                <div className="flex items-center gap-2.5 text-muted-foreground">
                    <FileText className="size-3.5" />
                    <span className="font-medium">Nature</span>
                </div>
                <Badge variant="outline" appearance="light" size="sm" className="font-bold border-border bg-background text-foreground/70">
                  {typeInfo.label}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-2sm pb-2 border-b border-dashed border-border/60">
                <div className="flex items-center gap-2.5 text-muted-foreground">
                    <User className="size-3.5" />
                    <span className="font-medium">Demandeur</span>
                </div>
                <span className="font-semibold text-foreground/80">
                  {absence.User?.firstName} {absence.User?.lastName}
                </span>
              </div>
              <div className="flex items-center justify-between text-2sm">
                <div className="flex items-center gap-2.5 text-muted-foreground">
                    <Clock className="size-3.5" />
                    <span className="font-medium">Soumis le</span>
                </div>
                <span className="font-semibold text-foreground/80">{formatDate(absence.createdAt)}</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-1">
                <span className="w-1.5 h-1.5 rounded-full bg-foreground/30" />
                <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Période d'absence</h4>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-2sm pb-2 border-b border-dashed border-border/60">
                <div className="flex items-center gap-2.5 text-muted-foreground">
                    <Calendar className="size-3.5" />
                    <span className="font-medium">Date de début</span>
                </div>
                <span className="font-semibold text-foreground/80">{formatDate(absence.startDate)}</span>
              </div>
              <div className="flex items-center justify-between text-2sm pb-2 border-b border-dashed border-border/60">
                <div className="flex items-center gap-2.5 text-muted-foreground">
                    <Calendar className="size-3.5" />
                    <span className="font-medium">Date de fin</span>
                </div>
                <span className="font-semibold text-foreground/80">{formatDate(absence.endDate)}</span>
              </div>
              <div className="flex items-center justify-between text-2sm">
                <div className="flex items-center gap-2.5 text-muted-foreground">
                    <CalendarDays className="size-3.5" />
                    <span className="font-medium">Durée totale</span>
                </div>
                <Badge variant="outline" size="xs" className="font-bold border-border text-foreground/70 bg-background">
                  {durationDays} jours
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Justification */}
        <div className="pt-6 border-t border-border/60">
          <div className="flex items-center gap-2 mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-foreground/30" />
              <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Justification / Commentaire</h4>
          </div>
          <div className="flex items-start gap-3 p-4 bg-background rounded-xl border border-border">
            <div className="p-2 rounded-lg bg-background border border-border">
                <StickyNote className="size-4 text-foreground/70" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground/70 italic">
                {absence.reason || "Aucune justification fournie."}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
