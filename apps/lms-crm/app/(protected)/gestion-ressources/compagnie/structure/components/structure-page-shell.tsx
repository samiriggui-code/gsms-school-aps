'use client';

import { useState } from 'react';
import { LayoutGrid, Layers2, Network, TableProperties, UserPlus } from 'lucide-react';
import { Container } from '@/components/common/container';
import { PageHeroZone } from '@/components/common/page-hero-zone';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui/tabs';
import { Button } from '@repo/ui/button';
import { cn } from '@/lib/utils';
import CollaborateurAddSheet from '@/app/(protected)/gestion-ressources/rh/collaborateurs/components/collaborateur-add-sheet';
import { StructureStats } from './structure-stats';
import { StructureEcoleBlock } from './structure-ecole-block';
import { StructureOrganigramme, StructurePolesEcole } from './structure-organigramme';
import { StructureEffectifsVolet, StructureAnnuaireMetiersVolet } from './structure-equipe-cards';

type StructureVolet = 'effectifs' | 'organigramme' | 'poles' | 'annuaire';

const voletTriggerClass =
  'flex h-auto flex-col items-center gap-1 rounded-lg px-2 py-2.5 text-center text-[11px] font-semibold leading-tight data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm sm:flex-row sm:gap-2 sm:px-3 sm:text-left sm:text-xs md:text-sm';

export function StructurePageShell() {
  const [volet, setVolet] = useState<StructureVolet>('effectifs');
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const openAddMember = () => setAddMemberOpen(true);

  return (
    <>
      <Container>
        <PageHeroZone
          accent="violet-sky"
          eyebrow="Structure de l&apos;école"
          title="Pilotez l&apos;établissement et les équipes par volet"
          description="Indicateurs en tête de page, puis effectifs, organigramme N+1, pôles et annuaire visuel."
          actions={
            <Button type="button" variant="outline" size="sm" className="gap-2" onClick={openAddMember}>
              <UserPlus className="size-4" aria-hidden />
              Ajouter un membre
            </Button>
          }
        />
      </Container>

      <Container className="space-y-5 pt-4 lg:space-y-6">
        <StructureStats variant="row" />
        <StructureEcoleBlock />
      </Container>

      <CollaborateurAddSheet open={addMemberOpen} onOpenChange={setAddMemberOpen} />

      <Container className="space-y-6 pb-8 lg:space-y-8">
        <Tabs
          value={volet}
          onValueChange={(v) => setVolet(v as StructureVolet)}
          className="w-full"
        >
          <TabsList
            className={cn(
              'grid h-auto w-full gap-2 rounded-xl border border-border/70 bg-muted/30 p-2',
              'grid-cols-2 lg:grid-cols-4',
            )}
          >
            <TabsTrigger value="effectifs" className={voletTriggerClass}>
              <TableProperties className="size-4 shrink-0 text-violet-600 dark:text-violet-400" aria-hidden />
              <span className="leading-tight">Effectifs</span>
            </TabsTrigger>
            <TabsTrigger value="organigramme" className={voletTriggerClass}>
              <Network className="size-4 shrink-0 text-sky-600 dark:text-sky-400" aria-hidden />
              <span className="leading-tight">Organigramme</span>
            </TabsTrigger>
            <TabsTrigger value="poles" className={voletTriggerClass}>
              <Layers2 className="size-4 shrink-0 text-sky-700 dark:text-sky-300" aria-hidden />
              <span className="leading-tight">Pôles</span>
            </TabsTrigger>
            <TabsTrigger value="annuaire" className={voletTriggerClass}>
              <LayoutGrid className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />
              <span className="leading-tight">Annuaire visuel</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="effectifs" className="mt-6 focus-visible:outline-none">
            <StructureEffectifsVolet />
          </TabsContent>

          <TabsContent value="organigramme" className="mt-6 space-y-4 focus-visible:outline-none">
            <div className="rounded-lg border border-border/60 bg-muted/15 px-4 py-3 text-sm text-muted-foreground">
              Arbre <strong className="text-foreground">N+1</strong> alimenté par le volet <strong>Effectifs</strong>.
              Les <strong className="text-foreground">pôles</strong> ont leur propre volet. Les formateurs n&apos;ont pas
              de N+1 ici.
            </div>
            <StructureOrganigramme onAddMember={openAddMember} />
          </TabsContent>

          <TabsContent value="poles" className="mt-6 focus-visible:outline-none">
            <div className="mb-4 rounded-lg border border-border/60 bg-muted/15 px-4 py-3 text-sm text-muted-foreground">
              Les cartes regroupent les profils par <strong className="text-foreground">pôle interne</strong> (colonne
              du volet Effectifs, ou rôle par défaut).
            </div>
            <StructurePolesEcole onAddMember={openAddMember} />
          </TabsContent>

          <TabsContent value="annuaire" className="mt-6 focus-visible:outline-none">
            <StructureAnnuaireMetiersVolet onRequestAdd={openAddMember} />
          </TabsContent>
        </Tabs>
      </Container>

    </>
  );
}
