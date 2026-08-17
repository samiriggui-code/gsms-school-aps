'use client';

import Link from 'next/link';
import {
  Activity,
  Building2,
  LayoutDashboard,
  Puzzle,
  Settings,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  SETTINGS_ANCHOR_IDS,
  SETTINGS_BASE_PATH,
  SETTINGS_SCROLLSPY_ITEMS,
} from '../settings/lib/settings-anchors';
import { settingsCatalogAudit } from '@/config/settings-catalog.config';

const audit = settingsCatalogAudit();
const SECTION_COUNT = SETTINGS_SCROLLSPY_ITEMS.length;

const PRIMARY_ITEMS = [
  {
    title: 'Paramètres système',
    description:
      'Établissement, légal, formation, dirigeant, notifications, intégrations — source unique SystemSetting.',
    icon: Settings,
    href: SETTINGS_BASE_PATH,
    badge: `${SECTION_COUNT} sections`,
    foot: 'Plateforme + modules + pages',
  },
  {
    title: 'Layouts dashboard',
    description: 'Widgets CRM, formateur et stagiaire — visibilité des blocs par espace.',
    icon: LayoutDashboard,
    href: `${SETTINGS_BASE_PATH}#${SETTINGS_ANCHOR_IDS.dashboard}`,
    badge: '3 espaces',
    foot: 'ModuleSetting layout',
  },
  {
    title: 'Paramètres métier',
    description: 'SLA support, workflow devis et futurs réglages JSON par module.',
    icon: Puzzle,
    href: `${SETTINGS_BASE_PATH}#${SETTINGS_ANCHOR_IDS.modules}`,
    badge: '2 modules',
    foot: 'ModuleSetting métier',
  },
  {
    title: 'Santé du système',
    description: 'CPU, mémoire, Redis, base de données et état des services en temps réel.',
    icon: Activity,
    href: '/securite-configuration/parametres/sante-systeme',
    badge: 'Monitoring',
    foot: 'Diagnostics infrastructure',
  },
  {
    title: 'Vue compagnie',
    description: 'KPIs école et identité légale en lecture seule (formateurs, sessions, salles).',
    icon: Building2,
    href: '/gestion-ressources/compagnie/profil',
    badge: 'Lecture seule',
    foot: 'Édition → Paramètres système',
  },
] as const;

export function ParametresModuleMenuCards() {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <span>
          Couverture réglages :{' '}
          <strong className="text-foreground">{audit.coveragePct}%</strong> ({audit.implemented}/
          {audit.total})
        </span>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PRIMARY_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} className="group min-w-0">
              <Card className="flex h-full flex-col border-dashed transition-colors hover:border-primary">
                <CardHeader className="flex-grow pb-2">
                  <div className="flex items-start gap-4">
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-border bg-secondary/50 transition-colors group-hover:border-primary/20 group-hover:bg-primary/10">
                      <Icon className="size-6 text-muted-foreground transition-colors group-hover:text-primary" />
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <CardTitle className="text-base group-hover:text-primary">{item.title}</CardTitle>
                        <Badge appearance="light" className="text-2xs font-bold uppercase">
                          {item.badge}
                        </Badge>
                      </div>
                      <CardDescription className="text-sm leading-relaxed">{item.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 pb-5">
                  <div className="flex items-center gap-2 rounded-lg border border-dashed bg-muted/30 px-3 py-2 text-2xs font-bold uppercase text-muted-foreground">
                    <span className="size-1.5 shrink-0 rounded-full bg-primary" />
                    {item.foot}
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
