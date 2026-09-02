'use client';

import { useEffect, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiFetch, unwrapSectionApiData } from '@/lib/api';
import { useTranslation } from '@/hooks/useTranslation';
import { useFinanceDevisDetailQuery } from '../../../hooks/use-finance-devis-detail-query';
import { useDevisPatchMutation } from '../../../hooks/use-devis-patch-mutation';
import { financeDevisDetailQueryKey, financeDevisListQueryKey } from '../../../constants/query-keys';
import { fetchPublicPlaquetteLink } from '@/lib/devis-plaquette-client-link';
import { resolveDevisClientContact } from '@/lib/finance/resolve-devis-client-contact';
import { useDevisWorkflowSettings } from '@/hooks/use-devis-workflow-settings';

export type DevisDetailInitialTab =
  | 'overview'
  | 'edition'
  | 'suivi'
  | 'edit'
  | 'client'
  | 'lines'
  | 'notes'
  | 'exchanges';

export function normalizeDevisDetailTab(tab: DevisDetailInitialTab | undefined): DevisDetailInitialTab {
  if (!tab || tab === 'overview') return 'overview';
  if (tab === 'edit' || tab === 'client' || tab === 'lines') return 'edition';
  if (tab === 'notes' || tab === 'exchanges') return 'suivi';
  return tab;
}

export function useDevisDetailSheet({
  devisId,
  open,
  initialTab = 'overview',
}: {
  devisId: string | null;
  open: boolean;
  initialTab?: DevisDetailInitialTab;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [detailTab, setDetailTab] = useState<DevisDetailInitialTab>('overview');
  const [plaquetteLinkBusy, setPlaquetteLinkBusy] = useState(false);
  const [sendEmailOpen, setSendEmailOpen] = useState(false);
  const [sendEmailMessage, setSendEmailMessage] = useState('');

  const { data: detail, isLoading } = useFinanceDevisDetailQuery(devisId, open && !!devisId, {
    refetchIntervalMs: open && detailTab === 'suivi' ? 20_000 : false,
  });

  const devisPatch = useDevisPatchMutation(devisId);
  const { settings: workflowSettings } = useDevisWorkflowSettings();

  const tabSyncRef = useRef<{ devisId: string | null; initialTab: DevisDetailInitialTab }>({
    devisId: null,
    initialTab: 'overview',
  });

  useEffect(() => {
    if (!open) {
      setDetailTab('overview');
      tabSyncRef.current = { devisId: null, initialTab: 'overview' };
      setSendEmailOpen(false);
      setSendEmailMessage('');
      return;
    }
    if (!devisId) return;

    const want = normalizeDevisDetailTab(initialTab ?? 'overview');
    const sameIntent =
      tabSyncRef.current.devisId === devisId && tabSyncRef.current.initialTab === want;
    if (sameIntent) return;

    let next: DevisDetailInitialTab = want;
    if (next === 'edition') {
      if (!detail) return;
      if (detail.status !== 'DRAFT') next = 'overview';
    }
    tabSyncRef.current = { devisId, initialTab: want };
    setDetailTab(next);
  }, [open, devisId, initialTab, detail]);

  useEffect(() => {
    if (!open || !detail) return;
    if (detailTab === 'edition' && detail.status !== 'DRAFT') setDetailTab('overview');
  }, [open, detail, detailTab]);

  const clientContact = detail
    ? resolveDevisClientContact({ lead: detail.lead, clientSnapshot: detail.clientSnapshot })
    : null;
  const recipientEmail = clientContact?.email ?? null;
  const canSendEmail =
    !!recipientEmail && (detail?.status === 'DRAFT' || detail?.status === 'SENT') && !!detail?.formation;

  const sendMutation = useMutation({
    mutationFn: async (message: string) => {
      if (!devisId) throw new Error('Devis introuvable.');
      const res = await apiFetch(
        `/api/sections/administration-facturation/finance/devis/${devisId}/send`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: message.trim() || undefined }),
        },
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          (json as { error?: { message?: string } }).error?.message ?? 'Envoi impossible.',
        );
      }
      return unwrapSectionApiData<{ sent?: boolean; resent?: boolean; plaquetteUrl?: string | null }>(
        json,
      );
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: [...financeDevisDetailQueryKey, devisId] });
      void queryClient.invalidateQueries({ queryKey: [...financeDevisListQueryKey] });
      setSendEmailMessage('');
      setSendEmailOpen(false);
      setDetailTab('suivi');
      toast.success(
        data?.resent
          ? 'E-mail renvoyé au client — historique mis à jour dans Suivi client.'
          : 'Devis envoyé par e-mail (plaquette + PDF) — consultez Suivi client pour les réponses.',
      );
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const copyClientPlaquetteLink = async () => {
    if (!devisId) return;
    setPlaquetteLinkBusy(true);
    try {
      const payload = await fetchPublicPlaquetteLink(devisId, 60);
      try {
        await navigator.clipboard.writeText(payload.url);
        toast.success(t('devis.clientLinkCopied'));
      } catch {
        toast.message(t('devis.linkGeneratedTitle'), { description: payload.url });
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('devis.linkGenerateFailed'));
    } finally {
      setPlaquetteLinkBusy(false);
    }
  };

  const openClientPlaquettePage = async () => {
    if (!devisId) return;
    setPlaquetteLinkBusy(true);
    try {
      const payload = await fetchPublicPlaquetteLink(devisId, 60);
      window.open(payload.url, '_blank', 'noopener,noreferrer');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('devis.linkGenerateFailed'));
    } finally {
      setPlaquetteLinkBusy(false);
    }
  };

  const snapshot = (detail?.clientSnapshot ?? {}) as Record<string, unknown>;

  const setDetailTabNormalized = (tab: DevisDetailInitialTab) => {
    setDetailTab(normalizeDevisDetailTab(tab));
  };

  return {
    detail,
    isLoading,
    detailTab,
    setDetailTab: setDetailTabNormalized,
    plaquetteLinkBusy,
    sendEmailOpen,
    setSendEmailOpen,
    sendEmailMessage,
    setSendEmailMessage,
    devisPatch,
    workflowSettings,
    clientContact,
    recipientEmail,
    canSendEmail,
    sendMutation,
    copyClientPlaquetteLink,
    openClientPlaquettePage,
    snapshot,
    normalizeInitialTab: normalizeDevisDetailTab,
  };
}
