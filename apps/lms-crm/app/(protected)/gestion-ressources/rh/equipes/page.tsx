'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useTranslation } from '@/hooks/useTranslation';
import { Container } from '@/components/common/container';
import { CrmWiredLeaf } from '@/components/crm/crm-wired-leaf';
import { Alert, AlertDescription, AlertTitle } from '@repo/ui/alert';
import { DATAGRID_TOOLBAR_ACTIONS } from '@/app/(protected)/securite-configuration/components/datagrid-standards';
import { TeamStats } from './components/team-stats';
import TeamList from './components/team-list';
import { OrgUnitManager } from './components/org-unit-manager';
import { BookOpen, FolderTree, Landmark } from 'lucide-react';
import { DataGridExportMenu } from '@/components/datagrid/datagrid-export-menu';
import { equipesExportConfig } from '@/lib/datagrid/export-presets';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/select';
import type { RhSessionTeamPhase } from '@/lib/rh-team-list-scope';
import { RH_SESSION_TEAM_PHASE_LABELS } from '@/lib/rh-team-list-scope';

export default function Page() {
  const { t } = useTranslation();
  const [mainTab, setMainTab] = useState<'permanent' | 'session' | 'structure'>('permanent');
  const [sessionPhase, setSessionPhase] = useState<RhSessionTeamPhase>('running');

  const statsScope = mainTab === 'session' ? 'session' : 'permanent';

  const exportConfig = useMemo(
    () => equipesExportConfig(statsScope, sessionPhase),
    [statsScope, sessionPhase],
  );

  return (
    <CrmWiredLeaf
      path="/gestion-ressources/rh/equipes"
      actions={
        <div className={DATAGRID_TOOLBAR_ACTIONS}>
          <DataGridExportMenu config={exportConfig} label={t('common.actions.export')} />
        </div>
      }
    >
      <Container className="space-y-5 lg:space-y-7.5 pb-8">
        <TeamStats variant="row" teamScope={statsScope} sessionPhase={sessionPhase} />

        <Tabs
          value={mainTab}
          onValueChange={(v) => setMainTab(v as 'permanent' | 'session' | 'structure')}
          className="w-full"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <TabsList className="bg-muted/50 border border-border/50 p-1 flex-wrap h-auto w-full sm:w-auto">
              <TabsTrigger
                value="permanent"
                className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <Landmark className="size-4" />
                Équipes permanentes
              </TabsTrigger>
              <TabsTrigger
                value="session"
                className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <BookOpen className="size-4" />
                Équipes session
              </TabsTrigger>
              <TabsTrigger
                value="structure"
                className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <FolderTree className="size-4" />
                Organigramme & RH
              </TabsTrigger>
            </TabsList>

            {mainTab === 'session' ? (
              <Select
                value={sessionPhase}
                onValueChange={(v) => setSessionPhase(v as RhSessionTeamPhase)}
              >
                <SelectTrigger className="h-10 w-full sm:w-72">
                  <SelectValue placeholder="Cycle session" />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(RH_SESSION_TEAM_PHASE_LABELS) as RhSessionTeamPhase[]).map((key) => (
                    <SelectItem key={key} value={key}>
                      {RH_SESSION_TEAM_PHASE_LABELS[key]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : null}
          </div>

          <TabsContent value="permanent" className="mt-0">
            <TeamList teamScope="permanent" />
          </TabsContent>

          <TabsContent value="session" className="mt-0">
            <TeamList teamScope="session" sessionPhase={sessionPhase} />
          </TabsContent>

          <TabsContent value="structure" className="mt-0 space-y-6">
            <Alert>
              <FolderTree className="size-4" />
              <AlertTitle>Unités organisationnelles</AlertTitle>
              <AlertDescription>
                Hiérarchie agences / pôles pour rattacher les 4 équipes permanentes. L&apos;organigramme
                détaillé (effectifs, N+1) est dans{' '}
                <Link
                  href="/gestion-ressources/compagnie/structure"
                  className="font-medium text-primary underline"
                >
                  Compagnie → Structure
                </Link>
                .
              </AlertDescription>
            </Alert>
            <OrgUnitManager />
          </TabsContent>
        </Tabs>
      </Container>
    </CrmWiredLeaf>
  );
}
