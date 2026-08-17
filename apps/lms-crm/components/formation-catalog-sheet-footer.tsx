'use client';

import { useEffect, useState } from 'react';
import { ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CentralPreinscriptionSheet } from '@/components/central-preinscription-sheet';
import { FormationQuoteFooter } from '@/components/formation-quote-footer';
import { useTranslation } from '@/hooks/useTranslation';

type Props = {
  catalogSlug: string | null | undefined;
  formationDisplayName: string;
  /** Connu côté parent (API catalogue déjà chargée). Sinon fetch interne. */
  requiresQuote?: boolean | null;
};

/**
 * Pied de fiche catalogue landing :
 * - tarif catalogue absent → demande de devis (entreprise / sur mesure)
 * - tarif catalogue présent → préinscription / onboarding candidat
 */
export function FormationCatalogSheetFooter({
  catalogSlug,
  formationDisplayName,
  requiresQuote: requiresQuoteProp = null,
}: Props) {
  const { t } = useTranslation();
  const [requiresQuote, setRequiresQuote] = useState<boolean | null>(requiresQuoteProp);
  const [checked, setChecked] = useState(requiresQuoteProp != null);
  const [preinscriptionOpen, setPreinscriptionOpen] = useState(false);

  useEffect(() => {
    if (requiresQuoteProp != null) {
      setRequiresQuote(requiresQuoteProp);
      setChecked(true);
      return;
    }
    const slug = catalogSlug?.trim();
    if (!slug) {
      setRequiresQuote(null);
      setChecked(true);
      return;
    }
    let cancelled = false;
    void fetch(`/api/catalog/formation?slug=${encodeURIComponent(slug)}`, { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((json: { requiresQuote?: boolean; catalogInactive?: boolean; formation?: unknown } | null) => {
        if (cancelled) return;
        if (!json?.formation || json.catalogInactive) {
          setRequiresQuote(null);
          return;
        }
        setRequiresQuote(json.requiresQuote === true);
      })
      .catch(() => {
        if (!cancelled) setRequiresQuote(null);
      })
      .finally(() => {
        if (!cancelled) setChecked(true);
      });
    return () => {
      cancelled = true;
    };
  }, [catalogSlug, requiresQuoteProp]);

  if (!catalogSlug?.trim() || !checked) return null;

  if (requiresQuote === true) {
    return (
      <FormationQuoteFooter
        catalogSlug={catalogSlug}
        formationDisplayName={formationDisplayName}
        requiresQuote
      />
    );
  }

  if (requiresQuote === false) {
    return (
      <>
        <Button
          type="button"
          variant="primary"
          className="gap-2"
          onClick={() => setPreinscriptionOpen(true)}
        >
          <ClipboardList className="size-4" />
          {t('landing.ctaBanner.cta')}
        </Button>
        <CentralPreinscriptionSheet
          open={preinscriptionOpen}
          onOpenChange={setPreinscriptionOpen}
          initialFormationSlug={catalogSlug}
        />
      </>
    );
  }

  return null;
}
