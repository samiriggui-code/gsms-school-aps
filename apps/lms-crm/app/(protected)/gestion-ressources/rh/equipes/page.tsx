'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Container } from '@/components/common/container';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Toolbar,
  ToolbarActions,
  ToolbarHeading,
  ToolbarTitle,
  ToolbarDescription,
} from '@/components/common/toolbar';
import { usePageToolbarMeta } from '@/components/common/translated-toolbar';
import { DATAGRID_TOOLBAR_ACTIONS } from '@/app/(protected)/securite-configuration/components/datagrid-standards';
import { TeamStats } from './components/team-stats';
import TeamList from './components/team-list';
import { OrgUnitManager } from './components/org-unit-manager';
import { Button } from '@/components/ui/button';
import { Download, FolderTree, LayoutGrid, Users } from 'lucide-react';
import TeamAddSheet from './components/team-add-sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTranslation } from '@/hooks/useTranslation';

export default function Page() {
  const { t } = useTranslation();
  const { title, description } = usePageToolbarMeta('/gestion-ressources/rh/equipes');
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);

  return (
    <>
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <ToolbarTitle>{title}</ToolbarTitle>
            <ToolbarDescription>{description}</ToolbarDescription>
          </ToolbarHeading>
          <ToolbarActions className={DATAGRID_TOOLBAR_ACTIONS}>
            <Button variant="outline" type="button">
              <Download className="size-4" />
              {t('common.actions.export')}
            </Button>
            <Button onClick={() => setIsAddSheetOpen(true)} className="gap-2">
              <Users className="size-4" />
              Nouvelle équipe
            </Button>
          </ToolbarActions>
        </Toolbar>
      </Container>

      <Container className="space-y-5 lg:space-y-7.5 pb-8">
        <TeamStats variant="row" />

        <Tabs defaultValue="teams" className="w-full space-y-6">
          <TabsList className="bg-muted/50 border border-border/50 p-1">
            <TabsTrigger value="teams" className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <LayoutGrid className="size-4" />
              Exploitation (Sites & Équipes)
            </TabsTrigger>
            <TabsTrigger value="structure" className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <FolderTree className="size-4" />
              Organigramme & RH
            </TabsTrigger>
          </TabsList>

          <TabsContent value="teams" className="space-y-6">
            <TeamList />
          </TabsContent>

          <TabsContent value="structure" className="space-y-6">
            <Alert>
              <FolderTree className="size-4" />
              <AlertTitle>Unités organisationnelles</AlertTitle>
              <AlertDescription>
                Hiérarchie agences / pôles pour rattacher les équipes. L&apos;organigramme détaillé (effectifs, N+1) est
                dans{' '}
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

      <TeamAddSheet open={isAddSheetOpen} onOpenChange={setIsAddSheetOpen} />
    </>
  );
}
