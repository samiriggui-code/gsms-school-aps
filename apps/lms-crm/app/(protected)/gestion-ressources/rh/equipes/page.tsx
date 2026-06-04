'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Container } from '@/components/common/container';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Toolbar,
  ToolbarHeading,
  ToolbarTitle,
  ToolbarDescription,
} from '@/components/common/toolbar';
import { usePageToolbarMeta } from '@/components/common/translated-toolbar';
import { TeamStats } from './components/team-stats';
import TeamList from './components/team-list';
import { OrgUnitManager } from './components/org-unit-manager';
import { Button } from '@/components/ui/button';
import { Users, FolderTree, LayoutGrid } from 'lucide-react';
import TeamAddSheet from './components/team-add-sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Page() {
  const { title, description } = usePageToolbarMeta('/gestion-ressources/rh/equipes');
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);

  return (
    <div className="container-fluid mx-auto w-full max-w-full min-w-0 px-4 lg:px-5 py-5 space-y-5 lg:space-y-8">
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <ToolbarTitle>{title}</ToolbarTitle>
            <ToolbarDescription>{description}</ToolbarDescription>
          </ToolbarHeading>
        </Toolbar>
      </Container>

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
          <TeamList onAddClick={() => setIsAddSheetOpen(true)} />
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

      <TeamAddSheet open={isAddSheetOpen} onOpenChange={setIsAddSheetOpen} />
    </div>
  );
}
