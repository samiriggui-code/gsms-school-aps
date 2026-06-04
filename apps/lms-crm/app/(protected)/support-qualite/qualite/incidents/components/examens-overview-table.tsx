'use client';

import { useState, useEffect } from 'react';
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
import { MoreHorizontal, Eye } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

function normalizeStaff(payload: unknown): any[] {
  if (!payload || typeof payload !== 'object') return [];
  const record = payload as Record<string, unknown>;

  if (Array.isArray(record.data)) return record.data as any[];
  if (record.data && typeof record.data === 'object') {
    const nested = record.data as Record<string, unknown>;
    if (Array.isArray(nested.items)) return nested.items as any[];
  }
  if (Array.isArray(record.items)) return record.items as any[];
  return [];
}

export function ExamensOverviewTable() {
  const [staff, setStaff] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRecentStaff = async () => {
      try {
        const response = await apiFetch('/api/sections/gestion-ressources/rh/collaborateurs/?limit=5&sort=createdAt&dir=desc');
        if (response.ok) {
          const res = await response.json();
          setStaff(normalizeStaff(res));
        }
      } catch (error) {
        console.error("Erreur chargement collaborateurs récents:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecentStaff();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'ACTIVE': return 'success';
      case 'ABSENT': return 'warning';
      case 'INACTIVE': return 'destructive';
      default: return 'secondary';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'ACTIVE': return 'ACTIF';
      case 'ABSENT': return 'ABSENT';
      case 'INACTIVE': return 'INACTIF';
      default: return status || 'INCONNU';
    }
  };

  return (
    <Card className="h-full border-dashed">
      <CardHeader className="flex flex-row items-center justify-between border-b border-dashed">
        <CardTitle className="text-base font-bold uppercase text-foreground">Elements recents</CardTitle>
        <Button variant="outline" size="sm" className="bg-card hover:bg-secondary/50 font-bold text-2xs uppercase" asChild>
          <a href="/evaluations-certification/examens">Voir tout</a>
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow className="hover:bg-transparent border-dashed">
              <TableHead className="w-[100px] text-2xs font-bold uppercase text-muted-foreground">ID</TableHead>
              <TableHead className="text-2xs font-bold uppercase text-muted-foreground">Collaborateur</TableHead>
              <TableHead className="text-2xs font-bold uppercase text-muted-foreground">Poste & Dépt</TableHead>
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
            ) : staff.length > 0 ? (
              staff.map((member) => (
                <TableRow key={member.id} className="border-dashed hover:bg-muted/30 transition-colors">
                  <TableCell className="font-bold text-2sm text-muted-foreground">{member.id.substring(0, 8)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="size-9 border border-border/50">
                        {member.avatar && <AvatarImage src={member.avatar} alt={member.name} />}
                        <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                          {member.name.split(' ').map((n: any) => n[0]).join('').toUpperCase().substring(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-bold text-sm text-foreground">{member.name}</span>
                        <span className="text-2xs text-muted-foreground italic">
                          Inscrit le {format(new Date(member.createdAt), 'dd/MM/yyyy', { locale: fr })}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-foreground/80">{member.jobFunction || 'Agent'}</span>
                      <span className="text-2xs text-muted-foreground uppercase">{member.userCategory || 'Opérations'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      appearance="light"
                      className="font-bold uppercase text-2xs"
                      color={getStatusColor(member.status) as any}
                    >
                      {getStatusLabel(member.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="size-8 hover:bg-primary/10 hover:text-primary"
                        asChild
                      >
                        <a href="/evaluations-certification/examens">
                          <Eye className="size-4" />
                        </a>
                      </Button>
                      <Button variant="ghost" size="icon" className="size-8 hover:bg-secondary">
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground text-xs font-medium">
                  Aucun collaborateur trouvé
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>

    </Card>
  );
}
