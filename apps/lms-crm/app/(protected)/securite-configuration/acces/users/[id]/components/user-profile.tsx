'use client';

import { useState } from 'react';
import { formatDateTime } from '@/lib/helpers';
import { Badge, BadgeDot, BadgeProps } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { User, UserStatus } from '@/app/models/user';
import { getUserStatusProps } from '../../constants/status';
import UserProfileEditSheet from './user-profile-edit-sheet';
import { userIamLoginSubtitle, userPersonalMailbox } from '@/lib/user-email-routing';

const UserProfile = ({
  user,
  isLoading,
  onUserUpdated,
}: {
  user: User;
  isLoading: boolean;
  onUserUpdated?: () => void;
}) => {
  const [isEditDialogOpen, setEditDialogOpen] = useState(false);

  const Loading = () => (
    <Card>
      <CardContent>
        <dl className="grid grid-cols-[auto_1fr] text-muted-foreground gap-3 text-sm mb-5">
          <div className="grid grid-cols-subgrid col-span-2 items-baseline">
            <dt className="flex md:w-64">
              <Skeleton className="h-6 w-24" />
            </dt>
            <dd>
              <Skeleton className="h-5 w-36" />
            </dd>
          </div>
          <div className="grid grid-cols-subgrid col-span-2 items-baseline">
            <dt>
              <Skeleton className="h-5 w-36" />
            </dt>
            <dd>
              <Skeleton className="h-5 w-48" />
            </dd>
          </div>
          <div className="grid grid-cols-subgrid col-span-2 items-baseline">
            <dt>
              <Skeleton className="h-5 w-20" />
            </dt>
            <dd>
              <Skeleton className="h-5 w-24" />
            </dd>
          </div>
          <div className="grid grid-cols-subgrid col-span-2 items-baseline">
            <dt>
              <Skeleton className="h-5 w-24" />
            </dt>
            <dd>
              <Skeleton className="h-5 w-20" />
            </dd>
          </div>
          <div className="grid grid-cols-subgrid col-span-2 items-baseline">
            <dt>
              <Skeleton className="h-5 w-36" />
            </dt>
            <dd>
              <Skeleton className="h-5 w-24" />
            </dd>
          </div>
          <div className="grid grid-cols-subgrid col-span-2 items-baseline">
            <dt>
              <Skeleton className="h-5 w-24" />
            </dt>
            <dd>
              <Skeleton className="h-5 w-36" />
            </dd>
          </div>
        </dl>
        <Skeleton className="h-9 w-32" />
      </CardContent>
    </Card>
  );

  const Content = () => {
    const statusPros = getUserStatusProps(user.status as UserStatus);
    const statusVariant = statusPros.variant as keyof BadgeProps['variant'];

    return (
      <Card>
        <CardContent className="p-4 sm:p-6">
          <dl className="mb-5 space-y-4 text-sm sm:space-y-3">
            <div className="flex flex-col gap-1 border-b border-border/40 pb-3 sm:flex-row sm:items-start sm:gap-4 sm:border-0 sm:pb-0">
              <dt className="shrink-0 text-muted-foreground sm:w-56">Nom complet&nbsp;:</dt>
              <dd className="min-w-0 break-words">{user.name || 'Non renseigné'}</dd>
            </div>
            <div className="flex flex-col gap-1 border-b border-border/40 pb-3 sm:flex-row sm:items-start sm:gap-4 sm:border-0 sm:pb-0">
              <dt className="shrink-0 text-muted-foreground sm:w-56">Email professionnel (connexion)&nbsp;:</dt>
              <dd className="min-w-0 break-words">{userIamLoginSubtitle(user)}</dd>
            </div>
            <div className="flex flex-col gap-1 border-b border-border/40 pb-3 sm:flex-row sm:items-start sm:gap-4 sm:border-0 sm:pb-0">
              <dt className="shrink-0 text-muted-foreground sm:w-56">Email personnel&nbsp;:</dt>
              <dd className="flex min-w-0 flex-wrap items-center gap-2.5 break-words">
                <span>{userPersonalMailbox(user) ?? '—'}</span>
                {user.emailVerifiedAt ?
                  <Badge variant="secondary" appearance="light">Vérifié</Badge>
                : <Badge variant="warning" appearance="light">Non vérifié</Badge>}
              </dd>
            </div>
            <div className="flex flex-col gap-1 border-b border-border/40 pb-3 sm:flex-row sm:items-start sm:gap-4 sm:border-0 sm:pb-0">
              <dt className="shrink-0 text-muted-foreground sm:w-56">Rôle IAM&nbsp;:</dt>
              <dd className="min-w-0">
                <span className="inline-flex flex-wrap items-center gap-1">
                  {user.role?.name}
                  {user.role?.isProtected ?
                    <Badge variant="outline">Système</Badge>
                  : null}
                </span>
              </dd>
            </div>
            <div className="flex flex-col gap-1 border-b border-border/40 pb-3 sm:flex-row sm:items-start sm:gap-4 sm:border-0 sm:pb-0">
              <dt className="shrink-0 text-muted-foreground sm:w-56">Statut du compte&nbsp;:</dt>
              <dd>
                <div className="inline-flex flex-wrap gap-2.5">
                  <Badge variant={statusVariant} appearance="ghost">
                    <BadgeDot />
                    {statusPros.label}
                  </Badge>
                  {user.isTrashed ?
                    <Badge variant="destructive" appearance="light">Corbeille</Badge>
                  : null}
                </div>
              </dd>
            </div>
            <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:gap-4">
              <dt className="shrink-0 text-muted-foreground sm:w-56">Dernière connexion&nbsp;:</dt>
              <dd className="min-w-0 break-words">
                {user.lastSignInAt ? formatDateTime(new Date(user.lastSignInAt)) : 'Jamais'}
              </dd>
            </div>
          </dl>
          <Button
            variant="outline"
            disabled={user.role?.isProtected}
            onClick={() => setEditDialogOpen(true)}
          >
            Modifier le compte
          </Button>
        </CardContent>
      </Card>
    );
  };

  return (
    <>
      {isLoading || !user ? <Loading /> : <Content />}

      <UserProfileEditSheet
        open={isEditDialogOpen}
        onOpenChange={setEditDialogOpen}
        user={user}
        onUserUpdated={onUserUpdated}
      />
    </>
  );
};

export default UserProfile;
