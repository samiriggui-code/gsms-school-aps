'use client';

import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { Badge } from '@repo/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui/card';
import {
  SETTINGS_CATALOG,
  settingsCatalogByGroup,
  type SettingsCatalogEntry,
} from '@/config/settings-catalog.config';

const STORAGE_LABELS: Record<SettingsCatalogEntry['storage'], string> = {
  SystemSetting: 'SystemSetting',
  ModuleSetting: 'ModuleSetting',
  LandingConfig: 'LandingConfig',
  UserNotificationPreference: 'Préférences compte',
  DedicatedPage: 'Page dédiée',
  ExternalModule: 'Module',
};

function PageEntryRow({ entry }: { entry: SettingsCatalogEntry }) {
  const isExternal = entry.href.startsWith('/') && !entry.href.includes('#settings_');
  return (
    <Link
      href={entry.href}
      className="group flex flex-col gap-1 rounded-lg border border-dashed px-3 py-2.5 transition-colors hover:border-primary hover:bg-muted/20"
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium group-hover:text-primary">{entry.label}</span>
        <Badge
          appearance="light"
          variant={entry.implemented ? 'success' : 'warning'}
          className="text-2xs font-bold uppercase"
        >
          {entry.implemented ? 'Actif' : 'À venir'}
        </Badge>
        <Badge appearance="light" className="text-2xs font-bold uppercase">
          {STORAGE_LABELS[entry.storage]}
        </Badge>
        {isExternal && (
          <ExternalLink className="size-3 text-muted-foreground opacity-0 group-hover:opacity-100" />
        )}
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">{entry.description}</p>
    </Link>
  );
}

export function WorkspacePagesSettings() {
  const moduleEntries = settingsCatalogByGroup('Modules CRM');
  const pageEntries = settingsCatalogByGroup('Pages & espaces de travail');
  const accountEntries = settingsCatalogByGroup('Comptes utilisateurs');

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Modules CRM — accès rapide</CardTitle>
          <CardDescription>
            Liens vers les réglages hébergés dans chaque module ou centralisés ici.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2">
          {moduleEntries.map((entry) => (
            <PageEntryRow key={entry.id} entry={entry} />
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Réglages par page / espace de travail</CardTitle>
          <CardDescription>
            Landing, SEO, finance, support — chaque page a son propre écran de configuration.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2">
          {pageEntries.map((entry) => (
            <PageEntryRow key={entry.id} entry={entry} />
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Comptes utilisateurs</CardTitle>
          <CardDescription>
            Préférences personnelles (session, notifications, affichage) — distinctes des
            paramètres système établissement.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {accountEntries.map((entry) => (
            <PageEntryRow key={entry.id} entry={entry} />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

export function ParametresSettingsAuditSummary() {
  const total = SETTINGS_CATALOG.length;
  const implemented = SETTINGS_CATALOG.filter((e) => e.implemented).length;
  const pending = total - implemented;

  return (
    <div className="flex flex-wrap gap-3 text-sm">
      <span>
        <strong>{implemented}</strong> / {total} réglages exposés
      </span>
      <span className="text-muted-foreground">·</span>
      <span className="text-muted-foreground">{pending} en cours de couverture</span>
    </div>
  );
}
