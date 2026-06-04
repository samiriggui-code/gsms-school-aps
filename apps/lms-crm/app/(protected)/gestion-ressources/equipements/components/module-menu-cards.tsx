import Link from 'next/link';
import { LayoutGrid, PackagePlus, Wrench, ArrowLeftRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const menuItems = [
  {
    title: 'Dashboard équipements',
    description: 'Vue parc, alertes et affectations récentes.',
    icon: LayoutGrid,
    href: '/gestion-ressources/equipements',
    badge: 'Parc',
    stats: 'Indicateurs matériel',
  },
  {
    title: 'Inventaire & stock',
    description: 'Catalogue matériel, statuts et entrées stock.',
    icon: PackagePlus,
    href: '/gestion-ressources/equipements/inventaire',
    badge: 'Stock',
    stats: 'Lignes inventaire',
  },
  {
    title: 'Affectations',
    description: 'Réservations par session ou collaborateur.',
    icon: ArrowLeftRight,
    href: '/gestion-ressources/equipements/affectations',
    badge: 'Mobilisation',
    stats: 'Sessions & prêts',
  },
  {
    title: 'Maintenance',
    description: 'Interventions atelier et suivi hors service.',
    icon: Wrench,
    href: '/gestion-ressources/equipements/maintenance',
    badge: 'Atelier',
    stats: 'Fiches maintenance',
  },
] as const;

export function ModuleMenuCards() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
