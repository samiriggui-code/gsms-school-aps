import Link from 'next/link';
import { Building2, FileText, Network } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const menuItems = [
  {
    title: 'Profil établissement',
    description: 'Identité légale, coordonnées et référents administratifs.',
    icon: Building2,
    href: '/gestion-ressources/compagnie/profil',
    badge: 'Fiche école',
    stats: 'Données légales & contact',
  },
  {
    title: 'Structure',
    description: 'Organigramme, effectifs et pôles de l\'établissement.',
    icon: Network,
    href: '/gestion-ressources/compagnie/structure',
    badge: 'Organisation',
    stats: 'Volets effectifs & N+1',
  },
  {
    title: 'Documents',
    description: 'Pièces officielles, agréments et fichiers du dossier administratif.',
    icon: FileText,
    href: '/gestion-ressources/compagnie/documents',
    badge: 'Dossier',
    stats: 'PDF & références',
  },
] as const;

export function ModuleMenuCards() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {menuItems.map((item) => {
        const Icon = item.icon;
        return (
          <Link key={item.href} href={item.href} className="group">
            <Card className="flex h-full flex-col border border-dashed transition-all hover:border-primary">
              <CardHeader className="flex-grow pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-secondary/50 transition-colors group-hover:border-primary/20 group-hover:bg-primary/10">
                      <Icon className="h-6 w-6 text-muted-foreground transition-colors group-hover:text-primary" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <CardTitle className="text-base font-bold text-foreground transition-colors group-hover:text-primary">
                        {item.title}
                      </CardTitle>
                      <Badge appearance="light" className="w-fit text-2xs font-bold uppercase">
                        {item.badge}
                      </Badge>
                    </div>
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
