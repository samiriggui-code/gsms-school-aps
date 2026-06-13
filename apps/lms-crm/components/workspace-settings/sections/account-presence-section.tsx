'use client';

import type { ComponentProps } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { LucideIcon } from 'lucide-react';
import { Circle, Loader2 } from 'lucide-react';
import { CardNotification } from '@/partials/cards/card-notification';
import {
  presenceDescription,
  presenceDotClass,
  presenceLabel,
  type UserPresenceStatus,
} from '@/components/common/user-presence-ui';
import { patchPresence, useUserPresence } from '@/components/common/user-presence-picker';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { portalMuted } from '@/components/portal/layout/portal-ui';
import { cn } from '@/lib/utils';

const OPTIONS: UserPresenceStatus[] = ['online', 'busy', 'away', 'offline'];

function presenceIcon(status: UserPresenceStatus): LucideIcon {
  function Icon({ className, ...props }: ComponentProps<typeof Circle>) {
    return (
      <Circle
        {...props}
        className={cn('size-3.5 fill-current stroke-none', presenceDotClass(status), className)}
      />
    );
  }
  return Icon as LucideIcon;
}

export function AccountPresenceSection() {
  const qc = useQueryClient();
  const { data: status = 'online', isLoading } = useUserPresence();

  const mutation = useMutation({
    mutationFn: patchPresence,
    onMutate: async (next) => {
      await qc.cancelQueries({ queryKey: ['user-presence'] });
      const previous = qc.getQueryData<UserPresenceStatus>(['user-presence']);
      qc.setQueryData(['user-presence'], next);
      return { previous };
    },
    onError: (_err, _next, context) => {
      if (context?.previous) qc.setQueryData(['user-presence'], context.previous);
    },
    onSuccess: (saved) => {
      qc.setQueryData(['user-presence'], saved);
    },
  });

  const busy = isLoading || mutation.isPending;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Statut & présence</CardTitle>
        <p className={`text-sm ${portalMuted}`}>
          Pastille sur l’avatar · visible par l’équipe et les stagiaires.
        </p>
      </CardHeader>

      <RadioGroup
        value={status}
        onValueChange={(v) => mutation.mutate(v as UserPresenceStatus)}
        disabled={busy}
        className="gap-0"
      >
        {OPTIONS.map((value) => (
          <CardNotification
            key={value}
            icon={presenceIcon(value)}
            title={presenceLabel(value)}
            description={presenceDescription(value)}
            actions={
              <RadioGroupItem
                value={value}
                id={`ws-presence-${value}`}
                aria-label={presenceLabel(value)}
              />
            }
          />
        ))}
      </RadioGroup>

      {busy ? (
        <p className="flex items-center gap-2 border-t border-border px-5 py-2.5 text-xs text-muted-foreground">
          <Loader2 className="size-3 animate-spin" />
          Mise à jour…
        </p>
      ) : null}
    </Card>
  );
}
