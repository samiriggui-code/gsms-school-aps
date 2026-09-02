'use client';

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { formatDateTime } from "@/lib/helpers";
import { 
    Card, 
    CardContent, 
} from "@repo/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@repo/ui/table";
import { Badge } from "@repo/ui/badge";
import { Skeleton } from "@repo/ui/skeleton";
import { ScrollArea } from "@repo/ui/scroll-area";
import { Terminal, User as UserIcon, Monitor, Clock } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui/avatar";
import { getInitials } from "@/lib/helpers";

export function UserLogs({ user }: { user: any }) {
  const { data, isLoading } = useQuery({
    queryKey: ['user-logs', user.id],
    queryFn: async () => {
      const res = await apiFetch(`/api/sections/securite-configuration/acces/users/${user.id}/logs`);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to fetch logs');
      }
      return res.json();
    }
  });

  const logs = data?.data || [];

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  const getEventBadge = (event: string) => {
    const e = event?.toLowerCase() || '';
    if (e.includes('create')) return <Badge variant="success" className="uppercase text-[9px] px-1.5 py-0">Create</Badge>;
    if (e.includes('update')) return <Badge variant="primary" className="uppercase text-[9px] px-1.5 py-0">Update</Badge>;
    if (e.includes('delete') || e.includes('trash')) return <Badge variant="destructive" className="uppercase text-[9px] px-1.5 py-0">Delete</Badge>;
    return <Badge variant="outline" className="uppercase text-[9px] px-1.5 py-0">{event}</Badge>;
  };

  return (
    <Card className="shadow-none border border-border/60 overflow-hidden">
      <CardContent className="p-0">
        <ScrollArea className="h-[500px]">
          <Table>
            <TableHeader className="bg-muted/30 sticky top-0 z-10 shadow-sm">
              <TableRow className="hover:bg-transparent border-b border-border/50">
                <TableHead className="w-[180px] text-[10px] font-bold uppercase tracking-wider">Date & Heure</TableHead>
                <TableHead className="w-[100px] text-[10px] font-bold uppercase tracking-wider">Événement</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider">Description</TableHead>
                <TableHead className="w-[150px] text-[10px] font-bold uppercase tracking-wider">Acteur</TableHead>
                <TableHead className="w-[120px] text-[10px] font-bold uppercase tracking-wider text-right">IP</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length > 0 ? (
                logs.map((log: any) => (
                  <TableRow key={log.id} className="border-b border-border/40 hover:bg-muted/5 transition-colors">
                    <TableCell className="py-3">
                      <div className="flex items-center gap-2 text-2sm font-medium text-foreground">
                        <Clock className="size-3 text-muted-foreground" />
                        {formatDateTime(new Date(log.createdAt))}
                      </div>
                    </TableCell>
                    <TableCell className="py-3">
                      {getEventBadge(log.event)}
                    </TableCell>
                    <TableCell className="py-3">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-2sm font-semibold text-foreground leading-tight">
                            {log.description || 'Aucune description'}
                        </span>
                        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">
                            {log.entityType} • {log.entityId?.substring(0, 8)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-3">
                      <div className="flex items-center gap-2">
                        <Avatar className="size-6 border border-border">
                          <AvatarImage src={log.user?.avatar || ''} />
                          <AvatarFallback className="text-[10px]">
                            {getInitials(log.user?.name || log.user?.email || '??')}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-2sm font-medium text-foreground truncate max-w-[100px]">
                          {log.user?.name || log.user?.email || 'Système'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5 text-[10px] font-bold text-muted-foreground">
                        <Monitor className="size-3" />
                        {log.ipAddress || '0.0.0.0'}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Terminal className="size-8 text-muted-foreground/30" />
                      <p className="text-sm font-medium text-muted-foreground">Aucun journal d'activité trouvé</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
