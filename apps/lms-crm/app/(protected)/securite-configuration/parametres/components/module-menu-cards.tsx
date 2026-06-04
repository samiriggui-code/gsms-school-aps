import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Settings } from 'lucide-react';

export function ModuleMenuCards() {
  const menuItems = [
    {
      title: 'Paramètres système',
      description: 'Réglages généraux, notifications, réseaux sociaux et intégrations.',
      icon: Settings,
      href: '/securite-configuration/parametres/settings',
      badge: 'Réglages',
      stats: 'Sidebar : Général · Notifications · Social · Intégrations',
    },
    {
      title: 'Santé du système',
      description: 'Monitoring en temps réel de RAM, CPU, Redis et PostgreSQL.',
      icon: Activity,
      href: '/securite-configuration/parametres/sante-systeme',
      badge: 'Diagnostic',
      stats: 'État des ressources',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-2">
      {menuItems.map((item) => {
        const Icon = item.icon;
        return (
          <Link key={item.href} href={item.href} className="group">
            <Card className="transition-all hover:border-primary border-dashed h-full flex flex-col">
              <CardHeader className="flex-grow pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/50 border border-border group-hover:bg-primary/10 group-hover:border-primary/20 transition-colors">
                      <Icon className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <CardTitle className="text-base font-bold text-foreground group-hover:text-primary transition-colors">
                        {item.title}
                      </CardTitle>
                      <Badge appearance="light" className="w-fit font-bold uppercase text-2xs">
                        {item.badge}
                      </Badge>
                    </div>
                  </div>
                </div>
                <CardDescription className="mt-4 text-2sm text-muted-foreground leading-relaxed">
                  {item.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0 pb-6">
                <div className="flex items-center gap-2 text-2xs font-bold uppercase text-muted-foreground bg-muted/30 px-3 py-2 rounded-lg border border-dashed">
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
