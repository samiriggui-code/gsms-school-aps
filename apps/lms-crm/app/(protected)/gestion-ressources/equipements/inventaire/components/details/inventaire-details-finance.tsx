'use client';

import { useMemo } from 'react';
import { Equipment } from '@/app/models/equipment';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/card';
import { Badge } from '@repo/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/ui/table';
import {
  equipmentAnnualAmortization,
  equipmentTotalCapitalized,
  getEquipmentFinanceCategoryLabel,
  parseEquipmentFinanceMeta,
} from '@/lib/equipment-finance';
import { getEquipmentTypeLabel } from '@/lib/equipment-constants';
import { Wallet, TrendingDown, Wrench, FileText } from 'lucide-react';

function fmtEuro(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);
}

type MaintenanceRow = { status: string; costAmount?: number | null; title?: string | null };

export function InventaireDetailsFinance({
  equipment,
  maintenanceItems = [],
  onTabChange,
}: {
  equipment: Equipment;
  maintenanceItems?: MaintenanceRow[];
  onTabChange?: (tab: string) => void;
}) {
  const finance = useMemo(
    () => parseEquipmentFinanceMeta(equipment.metadata, equipment.type),
    [equipment.metadata, equipment.type],
  );

  const capitalized = equipmentTotalCapitalized(finance);
  const amortAnnual = equipmentAnnualAmortization(finance);

  const maintenanceCompleted = useMemo(() => {
    return maintenanceItems
      .filter((m) => m.status === 'COMPLETED')
      .reduce((s, m) => s + (Number(m.costAmount) || 0), 0);
  }, [maintenanceItems]);

  const kpis = [
    { label: 'Valeur capitalisée', value: fmtEuro(capitalized), icon: Wallet },
    { label: 'Amortissement annuel', value: fmtEuro(amortAnnual), icon: TrendingDown },
    { label: 'Maintenance réalisée', value: fmtEuro(maintenanceCompleted), icon: Wrench },
    {
      label: 'Charge annuelle estimée',
      value: fmtEuro(amortAnnual + maintenanceCompleted),
      icon: FileText,
    },
  ];

  return (
    <div className="space-y-5">
      <p className="text-xs text-muted-foreground">
        Données saisies sur la fiche équipement (achat, installation, facture). Alimentent le budget{' '}
        <strong>EQUIPEMENT</strong> via amortissement + interventions maintenance. Les réservations
        session restent dans <strong>Vie scolaire → Sessions</strong>.
      </p>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <Card key={k.label} className="shadow-none border border-border/60">
            <CardContent className="p-4">
              <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{k.label}</p>
              <p className="mt-1 text-base font-bold tabular-nums">{k.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="shadow-none border border-border/60">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Détail financier</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableBody>
              <TableRow>
                <TableCell className="text-muted-foreground">Type technique</TableCell>
                <TableCell className="font-medium">{getEquipmentTypeLabel(equipment.type)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="text-muted-foreground">Catégorie budget</TableCell>
                <TableCell>
                  <Badge variant="outline">{getEquipmentFinanceCategoryLabel(finance.financialCategory)}</Badge>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="text-muted-foreground">Coût acquisition</TableCell>
                <TableCell className="tabular-nums">{fmtEuro(finance.acquisitionCost)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="text-muted-foreground">Installation / travaux</TableCell>
                <TableCell className="tabular-nums">{fmtEuro(finance.installationCost)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="text-muted-foreground">Réf. facture achat</TableCell>
                <TableCell>{finance.purchaseInvoiceRef || '—'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="text-muted-foreground">Durée amortissement</TableCell>
                <TableCell>{finance.amortizationYears} ans</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="text-muted-foreground">Fournisseur</TableCell>
                <TableCell>{finance.supplier || '—'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="text-muted-foreground">Date d&apos;achat</TableCell>
                <TableCell>{finance.purchaseDate || '—'}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {onTabChange ? (
        <button
          type="button"
          className="text-xs font-bold text-primary hover:underline"
          onClick={() => onTabChange('settings')}
        >
          Modifier les montants → Paramètres
        </button>
      ) : null}
    </div>
  );
}
