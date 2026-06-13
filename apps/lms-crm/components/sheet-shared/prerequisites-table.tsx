'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { SheetPrerequisiteRow } from '@/lib/sheet-content-types';

type Props = {
  rows: SheetPrerequisiteRow[];
  headers: {
    item: string;
    detail: string;
    importance: string;
  };
};

export function SheetPrerequisitesTable({ rows, headers }: Props) {
  return (
    <div className="rounded-md border border-border">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-[150px]">{headers.item}</TableHead>
            <TableHead>{headers.detail}</TableHead>
            <TableHead className="w-[120px]">{headers.importance}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, index) => (
            <TableRow key={index}>
              <TableCell className="font-medium text-2sm">{row.item}</TableCell>
              <TableCell className="text-foreground text-2sm">{row.detail}</TableCell>
              <TableCell className="text-2sm">{row.importance}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
