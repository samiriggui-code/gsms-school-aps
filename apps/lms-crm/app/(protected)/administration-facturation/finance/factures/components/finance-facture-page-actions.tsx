'use client';

import Link from 'next/link';
import { FileText, ReceiptText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CRM_MARKETING_LEADS_PATH } from '@/app/(protected)/communication-contenu/marketing/formulaires-leads/constants/crm-paths';

export function FinanceFacturePageActions() {
  return (
    <>
      <Button
        variant="outline"
        type="button"
        asChild
        title="Leads issus des formulaires landing (demandes de devis, préinscriptions)."
      >
        <Link href={CRM_MARKETING_LEADS_PATH} className="gap-2">
          <FileText className="size-4" />
          Leads landing
        </Link>
      </Button>
      <Button
        variant="outline"
        type="button"
        asChild
        title="Les devis acceptés apparaissent dans Factures ; créez et validez les propositions ici."
      >
        <Link href="/administration-facturation/finance/devis" className="gap-2">
          <ReceiptText className="size-4" />
          Module Devis (source)
        </Link>
      </Button>
    </>
  );
}
