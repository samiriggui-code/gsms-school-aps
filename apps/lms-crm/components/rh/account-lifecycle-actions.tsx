'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Archive, Loader2, RotateCcw, ShieldOff } from 'lucide-react';
import { toast } from 'sonner';
import { User as CollaborateurModel } from '@/app/models/user';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import type { AccountLifecycleAction } from '@/lib/rh/account-lifecycle';

type Props = {
  user: Pick<CollaborateurModel, 'id' | 'email' | 'status' | 'isTrashed' | 'isProtected'>;
  onSuccess?: () => void;
  queryKeys?: string[][];
};

const COPY: Record<
  AccountLifecycleAction,
  { title: string; description: string; label: string; variant: 'outline' | 'destructive' }
> = {
  suspend: {
    title: 'Suspendre le compte ?',
    description:
      'L’utilisateur ne pourra plus se connecter. La fiche reste visible dans le CRM. Réversible.',
    label: 'Suspendre',
    variant: 'outline',
  },
  archive: {
    title: 'Archiver le compte ?',
    description:
      'Pour un collaborateur ou formateur qui ne travaille plus à l’école. Accès coupé, fiche hors listes actives.',
    label: 'Archiver',
    variant: 'destructive',
  },
  restore: {
    title: 'Réactiver le compte ?',
    description: 'Rétablit la connexion et la visibilité dans les listes actives.',
    label: 'Réactiver',
    variant: 'outline',
  },
};

async function postLifecycle(userId: string, action: AccountLifecycleAction) {
  const res = await apiFetch(
    `/api/sections/gestion-ressources/rh/collaborateurs/${userId}/lifecycle`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    },
  );
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((json as { message?: string }).message ?? 'Action impossible.');
  }
  return json;
}

export function AccountLifecycleActions({ user, onSuccess, queryKeys = [] }: Props) {
  const qc = useQueryClient();
  const [pending, setPending] = useState<AccountLifecycleAction | null>(null);

  const mutation = useMutation({
    mutationFn: (action: AccountLifecycleAction) => postLifecycle(user.id, action),
    onSuccess: (_d, action) => {
      toast.success(
        action === 'restore'
          ? 'Compte réactivé.'
          : action === 'suspend'
            ? 'Compte suspendu.'
            : 'Compte archivé.',
      );
      for (const key of queryKeys) {
        void qc.invalidateQueries({ queryKey: key });
      }
      void qc.invalidateQueries({ queryKey: ['rh-collaborators'] });
      onSuccess?.();
      setPending(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const isArchived = user.isTrashed;
  const isSuspended = !isArchived && user.status === 'BLOCKED';
  const isActive = !isArchived && user.status === 'ACTIVE';

  return (
    <>
      <Card className="border-destructive/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-destructive">
            Accès & cycle de vie du compte
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            {isArchived ? (
              <Badge variant="secondary">Archivé</Badge>
            ) : isSuspended ? (
              <Badge variant="warning">Suspendu</Badge>
            ) : isActive ? (
              <Badge variant="success">Actif</Badge>
            ) : (
              <Badge variant="secondary">{user.status}</Badge>
            )}
            {user.isProtected ? (
              <Badge variant="outline">Compte protégé</Badge>
            ) : null}
          </div>
          <p className="text-xs text-muted-foreground">
            Suspendre coupe l’accès immédiatement. Archiver pour un départ définitif (restauration
            possible). Distinct de la fiche RH éditée dans les onglets ci-dessus.
          </p>
          <div className="flex flex-wrap gap-2">
            {isArchived || isSuspended ? (
              <Button
                size="sm"
                variant="outline"
                disabled={mutation.isPending}
                onClick={() => setPending('restore')}
              >
                <RotateCcw className="me-2 size-4" />
                Réactiver
              </Button>
            ) : (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={mutation.isPending || user.isProtected}
                  onClick={() => setPending('suspend')}
                >
                  <ShieldOff className="me-2 size-4" />
                  Suspendre
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={mutation.isPending || user.isProtected}
                  onClick={() => setPending('archive')}
                >
                  <Archive className="me-2 size-4" />
                  Archiver
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={pending !== null} onOpenChange={(o) => !o && setPending(null)}>
        <AlertDialogContent>
          {pending ? (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle>{COPY[pending].title}</AlertDialogTitle>
                <AlertDialogDescription>{COPY[pending].description}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction
                  variant={COPY[pending].variant}
                  disabled={mutation.isPending}
                  onClick={() => pending && mutation.mutate(pending)}
                >
                  {mutation.isPending ? (
                    <Loader2 className="me-2 size-4 animate-spin" />
                  ) : null}
                  {COPY[pending].label}
                </AlertDialogAction>
              </AlertDialogFooter>
            </>
          ) : null}
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
