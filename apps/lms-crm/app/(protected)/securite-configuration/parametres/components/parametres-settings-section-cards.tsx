'use client';

import Link from 'next/link';
import {
  Bell,
  Building2,
  GraduationCap,
  LayoutDashboard,
  Layers,
  Plug,
  Scale,
  Share2,
  SlidersHorizontal,
  UserCircle,
  FileText,
  Puzzle,
  LayoutGrid,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui/card';
import { useTranslation } from '@/hooks/useTranslation';
import {
  SETTINGS_ANCHOR_IDS,
  SETTINGS_BASE_PATH,
  SETTINGS_SCROLLSPY_GROUPS,
} from '../settings/lib/settings-anchors';
import { ParametresSettingsAuditSummary } from './workspace-pages-settings';

const SECTION_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  [SETTINGS_ANCHOR_IDS.general]: SlidersHorizontal,
  [SETTINGS_ANCHOR_IDS.administrativeDossier]: FileText,
  [SETTINGS_ANCHOR_IDS.etablissement]: Building2,
  [SETTINGS_ANCHOR_IDS.legal]: Scale,
  [SETTINGS_ANCHOR_IDS.formation]: GraduationCap,
  [SETTINGS_ANCHOR_IDS.dirigeant]: UserCircle,
  [SETTINGS_ANCHOR_IDS.registre]: FileText,
  [SETTINGS_ANCHOR_IDS.notifications]: Bell,
  [SETTINGS_ANCHOR_IDS.social]: Share2,
  [SETTINGS_ANCHOR_IDS.integrations]: Plug,
  [SETTINGS_ANCHOR_IDS.dashboard]: LayoutDashboard,
  [SETTINGS_ANCHOR_IDS.modules]: Puzzle,
  [SETTINGS_ANCHOR_IDS.workspacePages]: LayoutGrid,
};

const SECTION_HINTS: Partial<Record<string, string>> = {
  [SETTINGS_ANCHOR_IDS.general]: 'Logo, nom, langue, devise, fuseau, maintenance',
  [SETTINGS_ANCHOR_IDS.administrativeDossier]: 'Pièces réglementaires JSON (NDA, assurances…)',
  [SETTINGS_ANCHOR_IDS.etablissement]: 'Identité, adresse, site web, contacts',
  [SETTINGS_ANCHOR_IDS.legal]: 'SIRET, SIREN, CNAPS, TVA, NAF, RCS',
  [SETTINGS_ANCHOR_IDS.formation]: 'NDA, Qualiopi, agréments ADEF / SSIAP',
  [SETTINGS_ANCHOR_IDS.dirigeant]: 'Responsable légal, photo, rôle',
  [SETTINGS_ANCHOR_IDS.registre]: 'INPI, dates RNE, capital social',
  [SETTINGS_ANCHOR_IDS.notifications]: 'Alertes stock, demandes, paiements, erreurs',
  [SETTINGS_ANCHOR_IDS.social]: 'Facebook, LinkedIn, Instagram, YouTube…',
  [SETTINGS_ANCHOR_IDS.integrations]: 'Redis, e-mail, Pusher, landing, Sentry',
  [SETTINGS_ANCHOR_IDS.dashboard]: 'CRM, formateur, mon dossier stagiaire',
  [SETTINGS_ANCHOR_IDS.modules]: 'SLA support, workflow devis, règles métier',
  [SETTINGS_ANCHOR_IDS.workspacePages]: 'Landing, SEO, finance, support, comptes',
};

function translateLabel(
  t: (key: string, options?: { defaultValue?: string }) => string,
  titleKey: string,
  titleFallback: string,
) {
  const translated = t(titleKey, { defaultValue: titleFallback });
  return translated === titleKey ? titleFallback : translated;
}

export function ParametresSettingsSectionCards() {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Centre de réglages</CardTitle>
        <CardDescription className="space-y-2">
          <span className="block">
            Navigation par niveau : établissement, espaces utilisateurs, modules CRM et pages
            métier — même structure que la sidebar des paramètres système.
          </span>
          <ParametresSettingsAuditSummary />
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {SETTINGS_SCROLLSPY_GROUPS.map((group) => (
          <div key={group.titleKey} className="space-y-3">
            <div className="flex items-center gap-2">
              <Layers className="size-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold">
                {translateLabel(t, group.titleKey, group.titleFallback)}
              </h3>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {group.items.map((item) => {
                const Icon = SECTION_ICONS[item.target] ?? SlidersHorizontal;
                const title = translateLabel(t, item.titleKey, item.titleFallback);
                return (
                  <Link
                    key={item.target}
                    href={`${SETTINGS_BASE_PATH}#${item.target}`}
                    className="group flex flex-col gap-2 rounded-lg border border-dashed p-3 transition-colors hover:border-primary hover:bg-muted/20"
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="size-4 shrink-0 text-muted-foreground group-hover:text-primary" />
                      <span className="text-sm font-medium group-hover:text-primary">{title}</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {SECTION_HINTS[item.target] ?? ''}
                    </p>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
