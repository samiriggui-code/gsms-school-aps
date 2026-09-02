'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Circle, Loader2 } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import {
  presenceDotClass,
  presenceLabel,
  type UserPresenceStatus,
} from '@/components/common/user-presence-ui';
import {
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
} from '@repo/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@repo/ui/popover';
import { cn } from '@/lib/utils';

const OPTIONS: UserPresenceStatus[] = ['online', 'busy', 'away', 'offline'];
const QUERY_KEY = ['user-presence'] as const;
const LS_KEY = 'lms-self-presence';

function readLocalPresence(): UserPresenceStatus | null {
  if (typeof window === 'undefined') return null;
  const value = localStorage.getItem(LS_KEY);
  return OPTIONS.includes(value as UserPresenceStatus) ? (value as UserPresenceStatus) : null;
}

function writeLocalPresence(status: UserPresenceStatus) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LS_KEY, status);
}

async function fetchPresence(): Promise<UserPresenceStatus> {
  try {
    const res = await apiFetch('/api/common/presence');
    const json = (await res.json()) as { success?: boolean; data?: { status: UserPresenceStatus } };
    if (!res.ok || !json.success || !json.data?.status) {
      return readLocalPresence() ?? 'online';
    }
    writeLocalPresence(json.data.status);
    return json.data.status;
  } catch {
    return readLocalPresence() ?? 'online';
  }
}

async function patchPresence(status: UserPresenceStatus): Promise<UserPresenceStatus> {
  const res = await apiFetch('/api/common/presence', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  const json = (await res.json()) as {
    success?: boolean;
    data?: { status: UserPresenceStatus };
    error?: { message?: string };
  };
  if (!res.ok || !json.success || !json.data?.status) {
    throw new Error(json.error?.message ?? 'Mise à jour impossible');
  }
  writeLocalPresence(json.data.status);
  return json.data.status;
}

export { patchPresence };

export function useUserPresence() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: fetchPresence,
    staleTime: 30_000,
    initialData: () => readLocalPresence() ?? undefined,
    refetchOnWindowFocus: false,
  });
}

function usePresenceMutation() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: patchPresence,
    onMutate: async (next) => {
      await qc.cancelQueries({ queryKey: QUERY_KEY });
      const previous = qc.getQueryData<UserPresenceStatus>(QUERY_KEY);
      qc.setQueryData(QUERY_KEY, next);
      writeLocalPresence(next);
      return { previous };
    },
    onError: (_err, _next, context) => {
      if (context?.previous) {
        qc.setQueryData(QUERY_KEY, context.previous);
        writeLocalPresence(context.previous);
      }
    },
    onSuccess: (saved) => {
      qc.setQueryData(QUERY_KEY, saved);
      writeLocalPresence(saved);
    },
  });
}

type PickerProps = {
  variant?: 'compact' | 'list';
  className?: string;
};

/** Barre compacte — menu profil (CRM, portail, formateur). */
export function UserPresencePicker({ variant = 'compact', className }: PickerProps) {
  const { data: status = 'online', isLoading } = useUserPresence();
  const mutation = usePresenceMutation();
  const busy = isLoading || mutation.isPending;

  if (variant === 'compact') {
    return (
      <div className={cn('px-3 pb-2', className)}>
        <div
          className="flex items-center rounded-md border bg-muted/40 p-0.5"
          role="radiogroup"
          aria-label="Statut de présence"
        >
          {OPTIONS.map((opt) => {
            const active = status === opt;
            return (
              <button
                key={opt}
                type="button"
                role="radio"
                aria-checked={active}
                title={presenceLabel(opt)}
                disabled={busy}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (opt !== status) mutation.mutate(opt);
                }}
                className={cn(
                  'flex flex-1 flex-col items-center justify-center gap-0.5 rounded-[5px] px-1 py-1.5 transition-colors',
                  active
                    ? 'bg-background shadow-sm ring-1 ring-border/60'
                    : 'text-muted-foreground hover:bg-background/60',
                )}
              >
                <Circle className={cn('size-2 fill-current', presenceDotClass(opt))} />
                <span className="text-[10px] font-medium leading-none">{presenceLabel(opt)}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <>
      <DropdownMenuSeparator />
      <DropdownMenuLabel className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        Statut
      </DropdownMenuLabel>
      <DropdownMenuRadioGroup
        value={status}
        onValueChange={(v) => {
          const next = v as UserPresenceStatus;
          if (next !== status) mutation.mutate(next);
        }}
      >
        {OPTIONS.map((opt) => (
          <DropdownMenuRadioItem
            key={opt}
            value={opt}
            disabled={mutation.isPending}
            onSelect={(e) => e.preventDefault()}
          >
            <span className="flex items-center gap-2">
              <Circle className={cn('size-2.5 fill-current', presenceDotClass(opt))} />
              {presenceLabel(opt)}
            </span>
          </DropdownMenuRadioItem>
        ))}
      </DropdownMenuRadioGroup>
      {busy ? (
        <p className="flex items-center gap-1.5 px-2 py-1 text-[11px] text-muted-foreground">
          <Loader2 className="size-3 animate-spin" />
          Mise à jour…
        </p>
      ) : null}
    </>
  );
}

/** Pastille sur l’avatar — clic ouvre un mini popover (hors menu profil). */
export function UserPresencePopover({ className }: { className?: string }) {
  const { data: status = 'online', isLoading } = useUserPresence();
  const mutation = usePresenceMutation();
  const busy = isLoading || mutation.isPending;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`Statut : ${presenceLabel(status)}. Changer`}
          disabled={busy}
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          className={cn(
            'absolute bottom-0 right-0 size-3 rounded-full border-2 border-background transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            presenceDotClass(status),
            className,
          )}
        />
      </PopoverTrigger>
      <PopoverContent
        className="w-40 p-1.5"
        align="end"
        side="bottom"
        sideOffset={6}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <p className="px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          Statut
        </p>
        {OPTIONS.map((opt) => {
          const active = status === opt;
          return (
            <button
              key={opt}
              type="button"
              disabled={busy}
              onClick={() => {
                if (opt !== status) mutation.mutate(opt);
              }}
              className={cn(
                'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors',
                active ? 'bg-primary/10 text-foreground' : 'hover:bg-muted',
              )}
            >
              <Circle className={cn('size-2.5 shrink-0 fill-current', presenceDotClass(opt))} />
              <span className="flex-1">{presenceLabel(opt)}</span>
              {active ? <Check className="size-3.5 shrink-0 text-primary" /> : null}
            </button>
          );
        })}
        {busy ? (
          <p className="flex items-center gap-1 px-2 py-1 text-[10px] text-muted-foreground">
            <Loader2 className="size-3 animate-spin" />
            …
          </p>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}

export function UserPresenceDot({ className }: { className?: string }) {
  const { data: status = 'online' } = useUserPresence();
  return (
    <span
      className={cn(
        'absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-background',
        presenceDotClass(status),
        className,
      )}
      title={presenceLabel(status)}
    />
  );
}
