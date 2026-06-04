'use client';

import { Absence } from '@/app/models/absence';
import { formatDate, formatDateTime } from '@/lib/helpers';
import { 
  CheckCircle2, 
  Clock, 
  Send, 
  UserCheck,
  XCircle,
  MessageSquare
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AbsenceDetailsHistoryProps {
  absence: Absence;
}

const AbsenceDetailsHistory = ({ absence }: AbsenceDetailsHistoryProps) => {
  // Timeline simulation based on status
  const timeline = [
    {
      title: 'Demande soumise',
      description: `La demande d'absence pour ${absence.type} a été créée par le collaborateur.`,
      date: formatDateTime(new Date(absence.createdAt)),
      icon: Send,
      color: 'text-blue-500',
      bg: 'bg-blue-50',
      status: 'completed'
    },
    {
      title: 'En attente de validation',
      description: 'La demande est en cours d\'examen par le service RH.',
      date: formatDate(new Date(absence.createdAt)),
      icon: Clock,
      color: 'text-amber-500',
      bg: 'bg-amber-50',
      status: absence.status === 'PENDING' ? 'current' : 'completed'
    }
  ];

  if (absence.status === 'APPROVED') {
    timeline.push({
      title: 'Demande approuvée',
      description: 'Le service RH a validé la demande d\'absence.',
      date: formatDateTime(new Date(absence.updatedAt || absence.createdAt)),
      icon: CheckCircle2,
      color: 'text-emerald-500',
      bg: 'bg-emerald-50',
      status: 'completed'
    });
  } else if (absence.status === 'REJECTED') {
    timeline.push({
      title: 'Demande refusée',
      description: 'La demande a été rejetée après examen.',
      date: formatDateTime(new Date(absence.updatedAt || absence.createdAt)),
      icon: XCircle,
      color: 'text-rose-500',
      bg: 'bg-rose-50',
      status: 'completed'
    });
  }

  return (
    <div className="py-6 space-y-8">
      <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
        {timeline.map((item, index) => (
          <div key={index} className="relative flex items-start gap-6 group">
            <div className={cn(
              "flex items-center justify-center size-10 rounded-full border-4 border-background shadow-sm shrink-0 z-10 transition-transform group-hover:scale-110",
              item.bg
            )}>
              <item.icon className={cn("size-4", item.color)} />
            </div>
            
            <div className="flex flex-col gap-1.5 pt-1">
              <div className="flex items-center gap-3">
                <h4 className="text-sm font-semibold text-foreground">{item.title}</h4>
                <span className="text-[10px] font-medium text-muted-foreground bg-accent/50 px-2 py-0.5 rounded-full">
                  {item.date}
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-md">
                {item.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Audit Log / Notes Section */}
      <div className="mt-8 p-4 rounded-lg border border-border bg-accent/30 space-y-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="size-4 text-muted-foreground" />
          <h4 className="text-xs font-semibold text-foreground">Notes de validation</h4>
        </div>
        
        <div className="flex items-center justify-center py-6 border border-dashed border-border rounded-md bg-background/50">
          <div className="flex flex-col items-center gap-2 opacity-60">
            <UserCheck className="size-8 text-muted-foreground" />
            <span className="text-xs font-medium italic text-muted-foreground">Aucune note administrative pour le moment</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AbsenceDetailsHistory;
