import Link from 'next/link';
import { Calendar, LayoutGrid, ShieldCheck, UserCog, Users, UsersRound } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const menuItems = [
  {
    title: 'Dashboard RH',
    description: 'Indicateurs, conformité et synthèse du personnel.',
    icon: LayoutGrid,
    href: '/gestion-ressources/rh',
    badge: 'Vue globale',
    stats: 'Tableau de bord RH',
  },
  {
    title: 'Collaborateurs',
    description: 'Employés, profils RH et accès applicatifs.',
    icon: Users,
    href: '/gestion-ressources/rh/collaborateurs',
    badge: 'Effectif',
    stats: 'Liste & dossiers',
  },
  {
    title: 'Équipes',
    description: 'Équipes opérationnelles et rattachement des membres.',
    icon: UsersRound,
    href: '/gestion-ressources/rh/equipes',
    badge: 'Groupes',
    stats: 'Équipes & unités org.',
  },
  {
    title: 'Formateurs',
    description: 'Intervenants externes, missions et disponibilités.',
    icon: UserCog,
    href: '/gestion-ressources/rh/formateurs',
    badge: 'Pédagogie',
    stats: 'Ressources formateurs',
  },
  {
    title: 'Absences',
    description: 'Demandes, validations et suivi des congés.',
    icon: Calendar,
    href: '/gestion-ressources/rh/absences',
    badge: 'Planning',
    stats: 'Absences & congés',
  },
  {
    title: 'Conformité',
    description: 'Contrôles réglementaires et pièces attendues.',
    icon: ShieldCheck,
    href: '/gestion-ressources/rh/conformite',
    badge: 'Qualité RH',
    stats: 'Alertes conformité',
  },
] as const;

export function ModuleMenuCards() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {menuItems.map((item) => {
        const Icon = item.icon;
        return (
          <Link key={item.href} href={item.href} className="group">
            <Card className="flex h-full flex-col border border-dashed transition-all hover:border-primary">
              <CardHeader className="flex-grow pb-2">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-border bg-secondary/50 transition-colors group-hover:border-primary/20 group-hover:bg-primary/10">
                    <Icon className="h-6 w-6 text-muted-foreground transition-colors group-hover:text-primary" />
                  </div>
                  <div className="min-w-0 flex flex-col gap-1">
                    <CardTitle className="text-base font-bold text-foreground transition-colors group-hover:text-primary">
                      {item.title}
                    </CardTitle>
                    <Badge appearance="light" className="w-fit text-2xs font-bold uppercase">
                      {item.badge}
                    </Badge>
                  </div>
                </div>
                <CardDescription className="mt-4 text-2sm leading-relaxed text-muted-foreground">
                  {item.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0 pb-6">
                <div className="flex items-center gap-2 rounded-lg border border-dashed border-border bg-muted/30 px-3 py-2 text-2xs font-bold uppercase text-muted-foreground">
                  <span className="size-1.5 rounded-full bg-primary" />
                  {item.stats}
                </div>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
