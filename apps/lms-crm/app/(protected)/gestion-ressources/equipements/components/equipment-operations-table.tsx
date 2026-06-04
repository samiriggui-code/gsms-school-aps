'use client';

import { useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Package } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useEquipments } from '@/lib/hooks/equipment';
import Link from 'next/link';
import { getEquipmentStatusLabel } from './equipment-status-labels';

export function EquipmentOperationsTable() {
  const { data, isLoading } = useEquipments();
  const rows = useMemo(
    () => (Array.isArray(data?.data) ? data.data.slice(0, 5) : []),
    [data],
  );

  return (
    <Card className="h-full border-dashed">
      <CardHeader className="flex flex-row items-center justify-between border-b border-dashed">
        <CardTitle className="text-base font-bold uppercase text-foreground">Équipements récents</CardTitle>
        <Button variant="outline" size="sm" className="bg-card hover:bg-secondary/50 font-bold text-2xs uppercase" asChild>
          <Link href="/gestion-ressources/equipements/inventaire">Voir tout</Link>
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow className="hover:bg-transparent border-dashed">
              <TableHead className="w-[100px] text-2xs font-bold uppercase text-muted-foreground">ID</TableHead>
              <TableHead className="text-2xs font-bold uppercase text-muted-foreground">Équipement</TableHead>
              <TableHead className="text-2xs font-bold uppercase text-muted-foreground">Type & Site</TableHead>
              <TableHead className="text-2xs font-bold uppercase text-muted-foreground">Statut</TableHead>
              <TableHead className="text-right text-2xs font-bold uppercase text-muted-foreground">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [1, 2, 3, 4, 5].map((i) => (
                <TableRow key={i} className="border-dashed">
                  <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Skeleton className="size-9 rounded-full" />
                      <div className="flex flex-col gap-1">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </TableCell>
                  <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : rows.length > 0 ? (
              rows.map((item: any) => (
                <TableRow key={item.id} className="border-dashed hover:bg-muted/30 transition-colors">
                  <TableCell className="font-bold text-2sm text-muted-foreground">{item.serialNumber || item.id.substring(0, 8)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="size-9 rounded-md border border-border/50 bg-primary/10 flex items-center justify-center">
                        <Package className="size-4 text-primary" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-sm text-foreground">{item.label || 'Équipement'}</span>
                        <span className="text-2xs text-muted-foreground italic">{item.serialNumber || 'N/A'}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-foreground/80">{item.type || 'Équipement'}</span>
                      <span className="text-2xs text-muted-foreground uppercase">{item.ClientSite?.name || 'Sans site'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                  <Badge appearance="light" className="font-bold uppercase text-2xs">
                      {getEquipmentStatusLabel(String(item.status || 'UNKNOWN')).toUpperCase()}
                  </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="size-8 hover:bg-primary/10 hover:text-primary" asChild>
                        <Link href="/gestion-ressources/equipements/inventaire">
                          <Eye className="size-4" />
                        </Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground text-xs font-medium">
                  Aucun équipement trouvé
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
