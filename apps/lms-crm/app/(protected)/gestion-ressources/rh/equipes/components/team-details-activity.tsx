'use client';

import { ReactNode } from 'react';
import { LucideIcon, Users, Settings, UserPlus, History, Clock } from 'lucide-react';
import { Team } from '@/app/models/team';
import { formatDate } from '@/lib/helpers';

interface TimelineItemProps {
  icon: LucideIcon;
  line: boolean;
  children: ReactNode;
  removeSpace?: boolean;
  className?: string;
}

function TimelineItem({
  line,
  icon: Icon,
  children,
  removeSpace,
  className,
}: TimelineItemProps) {
  return (
    <div className="flex items-start relative">
      {line && (
        <div className="w-10 start-0 top-10.5 absolute bottom-0 rtl:-translate-x-1/2 translate-x-1/2 border-s-2 border-s-input h-[calc(100%-28px)]"></div>
      )}
      <div className="flex items-center justify-center rounded-md bg-background border border-border size-10 shrink-0">
        <div className="flex items-center justify-center bg-accent/70 rounded-md size-[34px]">
          <Icon size={18} className={className || ""} />
        </div>
      </div> 
      <div className={`ps-2.5 ${!removeSpace ? 'mb-5 pt-0.5' : ''} text-base grow`}>
        {children}
      </div>
    </div>
  );
}

export function TeamDetailsActivity({ team }: { team: Team }) {
  return (
    <div className="space-y-4 mt-2">
      <TimelineItem icon={Users} className="text-blue-500" line={true}>
        <div className="flex flex-col gap-1">
          <div className="text-sm font-semibold text-foreground">Mise à jour de la composition</div>
          <div className="text-xs text-muted-foreground">Récemment • 2 nouveaux membres ajoutés</div>
        </div>
      </TimelineItem>

      <TimelineItem icon={Settings} className="text-orange-500" line={true}>
        <div className="flex flex-col gap-1">
          <div className="text-sm font-semibold text-foreground">Modification des paramètres</div>
          <div className="text-xs text-muted-foreground">Il y a 3 heures • Changement du type d'équipe</div>
        </div>
      </TimelineItem>

      <TimelineItem icon={UserPlus} className="text-green-500" line={true}>
        <div className="flex flex-col gap-1">
          <div className="text-sm font-semibold text-foreground">Équipe créée</div>
          <div className="text-xs text-muted-foreground">{formatDate(new Date(team.createdAt))} • Création initiale par le système</div>
        </div>
      </TimelineItem>

      <TimelineItem icon={History} className="text-muted-foreground" line={false}>
        <div className="flex flex-col gap-1">
          <div className="text-sm font-semibold text-foreground">Initialisation de l'équipe</div>
          <div className="text-xs text-muted-foreground">{formatDate(new Date(team.createdAt))} • Configuration par défaut</div>
        </div>
      </TimelineItem>
      
      <div className="py-6 flex flex-col items-center justify-center text-muted-foreground border border-dashed rounded-xl bg-accent/30 mt-4">
        <Clock className="size-8 mb-2 opacity-20" />
        <p className="text-xs font-medium italic text-center px-4">L'historique détaillé des modifications sera disponible après la mise à jour des services de traçabilité.</p>
      </div>
    </div>
  );
}
