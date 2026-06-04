'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { PrerequisiteTableRow } from '@/app/(protected)/gestion-academique/vie-scolaire/formations/utils/formation-catalog-sheet-view-model';

type Props = {
  rows: PrerequisiteTableRow[];
};

export function DetailsInvoiceTable({ rows }: Props) {
  return (
    <div className="rounded-md border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[150px]">Prérequis</TableHead>
            <TableHead>Détails des conditions d&apos;accès</TableHead>
            <TableHead className="w-[120px]">Niveau</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((invoice, index) => (
            <TableRow key={`${invoice.item}-${index}`}>
              <TableCell className="font-medium">{invoice.item}</TableCell>
              <TableCell className="text-foreground">{invoice.detail}</TableCell>
              <TableCell>{invoice.importance}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
