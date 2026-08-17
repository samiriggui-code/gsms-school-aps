'use client';

import { useTranslation } from '@/hooks/useTranslation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { UserPlus } from 'lucide-react';
import { DataGridExportMenu } from '@/components/datagrid/datagrid-export-menu';
import { candidatsHubExportConfig } from '@/lib/datagrid/export-presets';
import { CandidatureAddSheet } from './components/candidature-add-sheet';
import { Container } from '@/components/common/container';
import {
  Toolbar,
  ToolbarActions,
  ToolbarHeading,
  ToolbarTitle,
  ToolbarDescription,
} from '@/components/common/toolbar';
import { usePageToolbarMeta } from '@/components/common/translated-toolbar';
import {
  CandidatureDetailSheet,
  type CandidatureDetailSheetInitialTab,
} from './components/candidature-detail-sheet';
import { CandidatHubStats } from './components/candidat-hub-stats';
import { CandidatHubList, type CandidatHubListRow } from './components/candidat-hub-list';

export default function Page() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const deepLinkUserId = searchParams.get('userId')?.trim() || '';
  const deepLinkCandidatureId = searchParams.get('candidatureId')?.trim() || '';
  const appliedDeepLinkRef = useRef<string>('');

  const { title, description } = usePageToolbarMeta('/gestion-academique/vie-scolaire/etudiants');
  const [isAddCandidatOpen, setIsAddCandidatOpen] = useState(false);

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailUserId, setDetailUserId] = useState<string | null>(null);
  const [detailInitialCandidatureId, setDetailInitialCandidatureId] = useState<string | null>(null);
  const [detailInitialTab, setDetailInitialTab] =
    useState<CandidatureDetailSheetInitialTab>('overview');
  const exportConfig = useMemo(() => candidatsHubExportConfig(), []);

  // Deep-link notifs / n8n : ?userId=&candidatureId= (une seule fois par clé URL)
  useEffect(() => {
    if (!deepLinkUserId) {
      appliedDeepLinkRef.current = '';
      return;
    }
    const key = `${deepLinkUserId}:${deepLinkCandidatureId}`;
    if (appliedDeepLinkRef.current === key) return;
    appliedDeepLinkRef.current = key;
    setDetailUserId(deepLinkUserId);
    setDetailInitialCandidatureId(deepLinkCandidatureId || null);
    setDetailInitialTab('overview');
    setDetailOpen(true);
  }, [deepLinkUserId, deepLinkCandidatureId]);

  const hubHeading = (
    <div className="space-y-1">
      <h3 className="text-base font-semibold text-foreground">Candidatures</h3>
      <p className="text-muted-foreground text-xs">
        Liste des comptes apprenants : état dossier CRM et sessions. Les imports landing alimentent
        les dossiers — un seul panneau ouvre vue, pipeline et archives.
      </p>
    </div>
  );

  const openCandidateSheet = (
    row: CandidatHubListRow,
    tab: CandidatureDetailSheetInitialTab = 'overview',
  ) => {
    setDetailUserId(row.userId);
    setDetailInitialCandidatureId(row.candidatureId);
    setDetailInitialTab(tab);
    setDetailOpen(true);
  };

  return (
    <>
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <ToolbarTitle>{title}</ToolbarTitle>
            <ToolbarDescription>{description}</ToolbarDescription>
          </ToolbarHeading>
          <ToolbarActions className="flex flex-wrap items-center gap-2">
            <DataGridExportMenu config={exportConfig} label={t('common.actions.export')} />
            <Button
              variant="primary"
              type="button"
              className="gap-2"
              onClick={() => setIsAddCandidatOpen(true)}
            >
              <UserPlus className="size-4" />
              Ajouter un candidat
            </Button>
          </ToolbarActions>
        </Toolbar>
      </Container>

      <Container className="space-y-5 lg:space-y-7.5">
        <CandidatHubStats variant="row" />
        <CandidatHubList leaderSlot={hubHeading} onOpenCandidate={openCandidateSheet} />
      </Container>

      <CandidatureAddSheet open={isAddCandidatOpen} onOpenChange={setIsAddCandidatOpen} />
      <CandidatureDetailSheet
        open={detailOpen && !!detailUserId}
        onOpenChange={(o) => {
          setDetailOpen(o);
          if (!o) {
            setDetailUserId(null);
            setDetailInitialCandidatureId(null);
            setDetailInitialTab('overview');
            if (deepLinkUserId || deepLinkCandidatureId) {
              appliedDeepLinkRef.current = '';
              router.replace('/gestion-academique/vie-scolaire/etudiants', { scroll: false });
            }
          }
        }}
        hubUserId={detailOpen ? detailUserId : null}
        initialCandidatureId={detailInitialCandidatureId}
        initialTab={detailInitialTab}
      />
    </>
  );
}
