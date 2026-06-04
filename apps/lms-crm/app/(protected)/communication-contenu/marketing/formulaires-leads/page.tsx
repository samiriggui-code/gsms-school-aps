'use client';

import { useTranslation } from '@/hooks/useTranslation';
import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Download, UserPlus } from 'lucide-react';
import { LeadsAddSheet } from './components/leads-add-sheet';
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
  LeadsDetailSheet,
  type LeadsDetailSheetInitialTab,
} from '@/app/(protected)/communication-contenu/marketing/formulaires-leads/components/leads-detail-sheet';
import { LeadsHubStats } from '@/app/(protected)/communication-contenu/marketing/formulaires-leads/components/leads-hub-stats';
import {
  LeadsHubList,
  type LeadsHubListRow,
} from '@/app/(protected)/communication-contenu/marketing/formulaires-leads/components/leads-hub-list';
import { apiFetch, unwrapSectionApiData } from '@/lib/api';
import { LANDING_PREINSCRIPTION_LEAD_SOURCE } from '@repo/database/browser';
import { companyFromLeadNotes, formationLabelFromLeadNotes } from '@/lib/landing-lead-notes';
import type { LandingLeadRow } from './hooks/use-landing-leads-query';

function isPreinscriptionSource(source: string | null | undefined): boolean {
  if (!source) return false;
  return source === LANDING_PREINSCRIPTION_LEAD_SOURCE || source.toLowerCase().includes('preinscription');
}

function FormulairesLeadsPageInner() {
  const { t } = useTranslation();
  const { title, description } = usePageToolbarMeta(
    '/communication-contenu/marketing/formulaires-leads',
  );
  const sp = useSearchParams();
  const router = useRouter();
  const lastDeepLinkedLead = useRef<string | null>(null);

  const [isAddLeadOpen, setIsAddLeadOpen] = useState(false);

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailUserId, setDetailUserId] = useState<string | null>(null);
  const [detailInitialLeadId, setDetailInitialLeadId] = useState<string | null>(null);
  const [detailLeadRow, setDetailLeadRow] = useState<LeadsHubListRow | null>(null);
  const [detailInitialTab, setDetailInitialTab] =
    useState<LeadsDetailSheetInitialTab>('overview');

  const openLeadSheet = useCallback(
    (row: LeadsHubListRow, tab: LeadsDetailSheetInitialTab = 'overview') => {
      setDetailUserId(row.raw.candidature?.userId ?? null);
      setDetailInitialLeadId(row.candidatureId);
      setDetailLeadRow(row);
      setDetailInitialTab(tab);
      setDetailOpen(true);
    },
    [],
  );

  useEffect(() => {
    const leadId = sp.get('leadId')?.trim();
    if (!leadId) {
      lastDeepLinkedLead.current = null;
      return;
    }
    if (lastDeepLinkedLead.current === leadId) return;

    let cancelled = false;
    (async () => {
      const res = await apiFetch(`/api/sections/communication-contenu/marketing/landing-leads/${leadId}`);
      const json = await res.json().catch(() => ({}));
      if (!res.ok || cancelled) {
        return;
      }
      const payload = unwrapSectionApiData<{ item: LandingLeadRow }>(json);
      const item = payload?.item;
      if (!item || cancelled) {
        return;
      }
      lastDeepLinkedLead.current = leadId;
      const fullName = `${item.firstName} ${item.lastName}`.trim();
      const companyName = companyFromLeadNotes(item.notes);
      const formationLabel = formationLabelFromLeadNotes(item.notes);
      const pre = isPreinscriptionSource(item.source);
      const displayPrimary =
        (companyName?.trim() ? companyName : null) ??
        (pre && formationLabel ? formationLabel : null) ??
        (fullName.trim() || item.email);
      const row: LeadsHubListRow = {
        userId: item.candidature?.userId ?? item.id,
        candidatureId: item.id,
        companyName,
        displayPrimary,
        formationLabel: formationLabel?.trim() || null,
        fullName,
        email: item.email,
        phone: item.phone,
        source: item.source,
        status: item.status,
        createdAt: item.createdAt,
        raw: item,
      };
      openLeadSheet(row);
      router.replace('/communication-contenu/marketing/formulaires-leads', { scroll: false });
    })();

    return () => {
      cancelled = true;
    };
  }, [sp, router, openLeadSheet]);

  const hubHeading = (
    <div className="space-y-1">
      <h3 className="text-base font-semibold text-foreground">Leads reçus</h3>
      <p className="text-muted-foreground text-xs">
        Même pattern de gestion : vue liste/cartes et panneau détail, avec les données réelles des
        formulaires landing (devis + préinscription).
      </p>
    </div>
  );

  return (
    <>
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <ToolbarTitle>{title}</ToolbarTitle>
            <ToolbarDescription>{description}</ToolbarDescription>
          </ToolbarHeading>
          <ToolbarActions className="flex flex-wrap items-center gap-2">
            <Button variant="outline" type="button">
              <Download />{t('common.actions.export')}</Button>
            <Button
              variant="primary"
              type="button"
              className="gap-2"
              onClick={() => setIsAddLeadOpen(true)}
            >
              <UserPlus className="size-4" />
              Ajouter un lead
            </Button>
          </ToolbarActions>
        </Toolbar>
      </Container>

      <Container className="space-y-5 lg:space-y-7.5">
        <LeadsHubStats variant="row" />
        <LeadsHubList leaderSlot={hubHeading} onOpenLead={openLeadSheet} />
      </Container>

      <LeadsAddSheet open={isAddLeadOpen} onOpenChange={setIsAddLeadOpen} />
      <LeadsDetailSheet
        open={detailOpen}
        onOpenChange={(o) => {
          setDetailOpen(o);
          if (!o) {
            setDetailUserId(null);
            setDetailInitialLeadId(null);
            setDetailLeadRow(null);
            setDetailInitialTab('overview');
          }
        }}
        hubUserId={detailOpen ? detailUserId : null}
        initialCandidatureId={detailInitialLeadId}
        initialTab={detailInitialTab}
        leadRow={detailLeadRow}
      />
    </>
  );
}

export default function Page() {
  const { t } = useTranslation();

  const { title, description } = usePageToolbarMeta('/communication-contenu/marketing/formulaires-leads');
  return (
    <Suspense fallback={null}>
      <FormulairesLeadsPageInner />
    </Suspense>
  );
}
