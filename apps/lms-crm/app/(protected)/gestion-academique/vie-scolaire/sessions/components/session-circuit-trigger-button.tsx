'use client';

import { useMutation } from '@tanstack/react-query';
import { Loader2, Workflow } from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';
import { Button } from '@repo/ui/button';
import { useTranslation } from '@/hooks/useTranslation';

export function SessionCircuitTriggerButton({
  sessionId,
  participantCount,
  className,
}: {
  sessionId: string;
  participantCount: number;
  className?: string;
}) {
  const { t } = useTranslation();

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await apiFetch(
        `/api/sections/gestion-academique/vie-scolaire/sessions/${sessionId}/trigger-circuit`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        },
      );
      const body = await res.json();
      if (!res.ok) {
        throw new Error(body.error?.message ?? body.error ?? 'Déclenchement impossible');
      }
      return body.data;
    },
    onSuccess: (data: { emailSent?: boolean; emailSkippedReason?: string | null }) => {
      if (data?.emailSent) {
        toast.success(t('vieScolaire.sessions.triggerCircuitEmailSent'));
      } else if (data?.emailSkippedReason) {
        toast.warning(`${t('vieScolaire.sessions.triggerCircuitEmailSkipped')} ${data.emailSkippedReason}`);
      } else {
        toast.success(t('vieScolaire.sessions.triggerCircuitSuccess'));
      }
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const disabled = participantCount === 0 || mutation.isPending;

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={className}
      disabled={disabled}
      title={
        participantCount === 0
          ? t('vieScolaire.sessions.triggerCircuitNoParticipant')
          : t('vieScolaire.sessions.triggerCircuitHint')
      }
      onClick={() => {
        if (participantCount === 0) {
          toast.info(t('vieScolaire.sessions.triggerCircuitNoParticipant'));
          return;
        }
        mutation.mutate();
      }}
    >
      {mutation.isPending ? (
        <Loader2 className="size-4 animate-spin" aria-hidden />
      ) : (
        <Workflow className="size-4" aria-hidden />
      )}
      {mutation.isPending
        ? t('vieScolaire.sessions.triggerCircuitPending')
        : t('vieScolaire.sessions.triggerCircuit')}
    </Button>
  );
}
