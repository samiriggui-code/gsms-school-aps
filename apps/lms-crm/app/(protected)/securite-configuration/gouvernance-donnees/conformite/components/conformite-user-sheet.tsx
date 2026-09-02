'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ExternalLink, FolderOpen, Mail, ShieldAlert, UserRound } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@repo/ui/badge';
import { Button } from '@repo/ui/button';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@repo/ui/sheet';
import { Textarea } from '@repo/ui/textarea';
import {
  fetchGlobalComplianceUserDetail,
  notifyGlobalComplianceUser,
  type GlobalComplianceUserRow,
} from '@/lib/governance/global-user-compliance-api';
import { SCHOOL_USER_CATEGORY_LABELS } from '@/lib/rh-school-profile-fields';
import { cn } from '@/lib/utils';

function statusBadge(status: string) {
  switch (status) {
    case 'COMPLIANT':
      return <Badge className="bg-success/10 text-success border-success/20">Conforme</Badge>;
    case 'WARNING':
      return <Badge className="bg-warning/10 text-warning border-warning/20">Alerte</Badge>;
    case 'NON_COMPLIANT':
      return <Badge variant="destructive">Non conforme</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function rowStatusLabel(status: string) {
  switch (status) {
    case 'MISSING':
      return 'Manquant';
    case 'EXPIRED':
      return 'Expiré';
    case 'EXPIRING_SOON':
      return 'Expire bientôt';
    case 'WARNING':
      return 'Alerte';
    default:
      return status;
  }
}

type Props = {
  row: GlobalComplianceUserRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ConformiteUserSheet({ row, open, onOpenChange }: Props) {
  const [message, setMessage] = useState('');
  const queryClient = useQueryClient();

  const detailQuery = useQuery({
    queryKey: ['governance-compliance-user', row?.id],
    queryFn: () => fetchGlobalComplianceUserDetail(row!.id),
    enabled: open && Boolean(row?.id),
  });

  const notifyMutation = useMutation({
    mutationFn: () => notifyGlobalComplianceUser({ userId: row!.id, message: message || undefined }),
    onSuccess: (data) => {
      if (data.emailSent) {
        toast.success(`E-mail envoyé à ${data.recipientEmail} (${data.piecesCount} point(s)).`);
      } else {
        toast.warning(
          data.emailError
            ? `E-mail non envoyé : ${data.emailError}`
            : 'E-mail non configuré sur ce serveur.',
        );
      }
      queryClient.invalidateQueries({ queryKey: ['governance-compliance-users'] });
      queryClient.invalidateQueries({ queryKey: ['governance-compliance-user', row?.id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const detail = detailQuery.data;
  const issues = detail?.nonCompliantRows ?? [];
  const canNotify = issues.length > 0 && Boolean(row?.email);

  const categoryLabel =
    row?.userCategory && row.userCategory in SCHOOL_USER_CATEGORY_LABELS
      ? SCHOOL_USER_CATEGORY_LABELS[row.userCategory as keyof typeof SCHOOL_USER_CATEGORY_LABELS]
      : row?.userCategory;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-lg">
        <SheetHeader className="border-b border-border px-5 py-4 text-start">
          <SheetTitle className="flex items-start gap-2 text-base leading-snug">
            <ShieldAlert className="mt-0.5 size-4 shrink-0 text-destructive" />
            {row?.name ?? 'Conformité'}
          </SheetTitle>
          {row ? (
            <div className="flex flex-wrap gap-2 pt-2">
              {statusBadge(row.complianceStatus)}
              <Badge variant="outline" appearance="light" className="text-[10px] uppercase">
                {row.roleName}
              </Badge>
              {categoryLabel ? (
                <Badge variant="secondary" appearance="light" className="text-[10px]">
                  {categoryLabel}
                </Badge>
              ) : null}
            </div>
          ) : null}
        </SheetHeader>

        <SheetBody className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          {detailQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Chargement…</p>
          ) : detail ? (
            <>
              <div className="grid gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">E-mail de relance</p>
                  <p className="font-medium break-all">{detail.user.proEmail || detail.user.email}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Un seul e-mail récapitule toutes les anomalies (manquants, expirés, dossiers
                    gouvernance).
                  </p>
                </div>
                {detail.user.jobFunction ? (
                  <div>
                    <p className="text-xs text-muted-foreground">Fonction</p>
                    <p className="font-medium">{detail.user.jobFunction}</p>
                  </div>
                ) : null}
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Anomalies ({issues.length})
                </p>
                {issues.length === 0 ? (
                  <p className="mt-2 text-sm text-success">Aucune anomalie documentaire détectée.</p>
                ) : (
                  <ul className="mt-2 space-y-1.5">
                    {issues.map((item) => (
                      <li
                        key={item.id}
                        className={cn(
                          'rounded-md border px-3 py-2 text-sm',
                          item.severity === 'CRITICAL'
                            ? 'border-destructive/30 bg-destructive/5'
                            : 'border-warning/30 bg-warning/5',
                        )}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium">{item.label}</span>
                          <Badge variant="outline" className="text-[10px] shrink-0">
                            {rowStatusLabel(item.status)}
                          </Badge>
                        </div>
                        {item.message ? (
                          <p className="mt-1 text-xs text-muted-foreground">{item.message}</p>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {detail.dossiers.some((d) => d.items.length > 0) ? (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Dossiers gouvernance
                  </p>
                  <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                    {detail.dossiers.flatMap((d) =>
                      d.items.map((i) => (
                        <li key={i.id}>
                          • {i.label} ({d.kind})
                        </li>
                      )),
                    )}
                  </ul>
                </div>
              ) : null}

              {canNotify ? (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Message optionnel
                  </p>
                  <Textarea
                    className="mt-2 min-h-[80px]"
                    placeholder="Précision pour le destinataire…"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  />
                </div>
              ) : null}
            </>
          ) : null}
        </SheetBody>

        <SheetFooter className="flex-col gap-2 border-t border-border px-5 py-4 sm:flex-col">
          <div className="flex w-full flex-wrap gap-2">
            {row?.profilePath ? (
              <Button variant="outline" size="sm" className="gap-1.5" asChild>
                <Link href={row.profilePath}>
                  <UserRound className="size-3.5" />
                  Fiche métier
                </Link>
              </Button>
            ) : null}
            {row?.gedPath ? (
              <Button variant="outline" size="sm" className="gap-1.5" asChild>
                <Link href={row.gedPath}>
                  <FolderOpen className="size-3.5" />
                  GED
                </Link>
              </Button>
            ) : null}
          </div>
          <Button
            className="w-full gap-2"
            disabled={!canNotify || notifyMutation.isPending}
            onClick={() => notifyMutation.mutate()}
          >
            <Mail className="size-4" />
            {notifyMutation.isPending ? 'Envoi…' : `Envoyer la relance (${issues.length})`}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
