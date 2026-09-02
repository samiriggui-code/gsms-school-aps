'use client';

import Link from 'next/link';
import { CreditCard, FileText, Wallet } from 'lucide-react';
import type { FormationSheetViewModel } from '@/app/(protected)/gestion-academique/vie-scolaire/formations/utils/formation-catalog-sheet-view-model';
import { BillingDetails } from '@/app/(protected)/gestion-academique/vie-scolaire/formations/components/sheets/customer/components/billing-details';
import { PaymentMethods } from '@/app/(protected)/gestion-academique/vie-scolaire/formations/components/sheets/customer/components/payment-methods';
import { portalLabel, portalMuted, portalSectionTitle } from '@/components/portal/layout/portal-ui';
import { Badge } from '@repo/ui/badge';
import { Button } from '@repo/ui/button';
import { cn } from '@/lib/utils';

type DevisRow = {
  referenceCode: string;
  title: string;
  statusLabel: string;
  totalTtc: number;
  currency: string;
  fundingHint: string | null;
};

type Props = {
  fundingMode: string | null;
  sourceLabel: string | null;
  sheetModel: FormationSheetViewModel | null;
  devis: DevisRow[];
};

function formatDevisAmount(totalTtc: number, currency: string) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency }).format(totalTtc);
}

function DevisPanel({ devis }: { devis: DevisRow[] }) {
  if (devis.length === 0) {
    return (
      <div className="flex h-full min-h-[140px] flex-col justify-center rounded-lg border border-dashed bg-muted/15 px-4 py-5 text-center">
        <FileText className="mx-auto size-8 text-muted-foreground/40" />
        <p className={cn('mt-2', portalMuted)}>Aucun devis émis pour le moment.</p>
      </div>
    );
  }

  const primary = devis[0];

  return (
    <div className="space-y-3">
      <div className="rounded-lg border bg-background/80 px-4 py-4">
        <div className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <CreditCard className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className={portalLabel}>Devis</p>
            <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
              {primary.referenceCode}
            </p>
            <p className={cn('mt-1', portalSectionTitle)}>{primary.title}</p>
            <p className="mt-2 text-lg font-bold tracking-tight">
              {formatDevisAmount(primary.totalTtc, primary.currency)}{' '}
              <span className="text-[13px] font-normal text-muted-foreground">TTC</span>
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge variant="outline" size="sm" className="text-[10px]">
                {primary.statusLabel}
              </Badge>
              {primary.fundingHint ? (
                <span className="text-[11px] text-muted-foreground">{primary.fundingHint}</span>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {devis.length > 1 ? (
        <ul className="space-y-2">
          {devis.slice(1).map((d) => (
            <li
              key={d.referenceCode}
              className="flex items-center justify-between gap-2 rounded-md border bg-muted/20 px-3 py-2 text-[12px]"
            >
              <span className="truncate font-mono text-muted-foreground">{d.referenceCode}</span>
              <span className="shrink-0 font-semibold">
                {formatDevisAmount(d.totalTtc, d.currency)}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function PortalFundingSection({ fundingMode, sourceLabel, sheetModel, devis }: Props) {
  const cpfEligible = sheetModel?.presentation.cpfEligible ?? false;
  const hasChosenMode = Boolean(fundingMode?.trim());
  const priceLabel = sheetModel?.billingStrip.price;

  if (!fundingMode && !sheetModel && devis.length === 0) {
    return null;
  }

  return (
    <section className="space-y-4" id="portal-financement">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-[13px] font-medium">Financement</h2>
          <p className={portalMuted}>
            {hasChosenMode
              ? 'Choix enregistré à la préinscription — l’école finalise la prise en charge.'
              : 'Consultez les options ou contactez le secrétariat.'}
          </p>
        </div>
        {sourceLabel ? (
          <Badge variant="outline" size="sm" className="text-[10px]">
            {sourceLabel}
          </Badge>
        ) : null}
      </div>

      <article className="overflow-hidden rounded-xl border bg-card shadow-xs">
        <div className="grid lg:grid-cols-2 lg:divide-x">
          {/* Mode de financement — colonne gauche */}
          <div className="border-b p-5 lg:border-b-0">
            <div className="flex items-start gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Wallet className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <h3 className={portalSectionTitle}>Mode de financement</h3>
                <p className={cn('mt-2', portalLabel)}>
                  {hasChosenMode ? 'Mode choisi' : 'Non renseigné'}
                </p>
                <p className="mt-1 text-[13px] font-semibold leading-snug">
                  {fundingMode ?? 'Contactez le secrétariat'}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {cpfEligible ? (
                    <Badge variant="success" appearance="light" size="sm" className="text-[10px]">
                      Éligible CPF
                    </Badge>
                  ) : null}
                  {hasChosenMode && priceLabel ? (
                    <Badge variant="secondary" size="sm" className="text-[10px]">
                      Tarif indicatif : {priceLabel}
                    </Badge>
                  ) : null}
                </div>
                {hasChosenMode ? (
                  <p className={cn('mt-3', portalMuted)}>
                    Pour modifier ce mode, contactez le secrétariat pédagogique.
                  </p>
                ) : null}
              </div>
            </div>
          </div>

          {/* Devis — colonne droite */}
          <div className="bg-muted/15 p-5">
            <DevisPanel devis={devis} />
          </div>
        </div>
      </article>

      {!hasChosenMode && sheetModel ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <BillingDetails fundingBlocks={sheetModel.fundingBlocks} />
          <PaymentMethods channels={sheetModel.fundingChannels} />
        </div>
      ) : null}

      {!hasChosenMode && !sheetModel ? (
        <div className="rounded-xl border border-dashed px-4 py-3 text-[13px] text-muted-foreground">
          Aucune fiche formation liée.
          <Button asChild variant="primary" mode="link" size="sm" className="ms-1 h-auto p-0 text-[13px]">
            <Link href="/">Voir le catalogue</Link>
          </Button>
        </div>
      ) : null}
    </section>
  );
}
