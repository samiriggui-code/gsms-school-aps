'use client';

import { FileText, Loader2, Printer, Send } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTranslation } from '@/hooks/useTranslation';

const SESSION_DOCUMENT_TYPES = [
  { path: 'convocation', labelKey: 'vieScolaire.sessions.documents.convocation' },
  { path: 'convention', labelKey: 'vieScolaire.sessions.documents.convention' },
  { path: 'certificate', documentType: 'attestation', labelKey: 'vieScolaire.sessions.documents.certificate' },
] as const;

type DocumentType = 'convocation' | 'convention' | 'attestation';

function openSessionDocument(sessionId: string, path: string) {
  window.open(
    `/api/sections/gestion-academique/vie-scolaire/sessions/${sessionId}/${path}`,
    '_blank',
    'noopener,noreferrer',
  );
}

type SendDocumentResult = { sent: number; skipped: Array<{ participantId: string; reason: string }> };

/** Génère les documents OF de la session (convocation, convention, certificat) — un PDF par participant confirmé. */
export function SessionDocumentsMenuButton({
  sessionId,
  participantCount,
  className,
}: {
  sessionId: string;
  participantCount: number;
  className?: string;
}) {
  const { t } = useTranslation();
  const disabled = participantCount === 0;

  const sendMutation = useMutation({
    mutationFn: async (documentType: DocumentType): Promise<SendDocumentResult> => {
      const res = await apiFetch(
        `/api/sections/gestion-academique/vie-scolaire/sessions/${sessionId}/documents/send`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ documentType }),
        },
      );
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          (body as { error?: { message?: string } }).error?.message ?? 'Envoi impossible.',
        );
      }
      return (body as { data: SendDocumentResult }).data;
    },
    onSuccess: (data) => {
      if (data.sent > 0 && data.skipped.length === 0) {
        toast.success(`${data.sent} ${t('vieScolaire.sessions.documents.sendSuccessSuffix')}`);
      } else if (data.sent > 0 && data.skipped.length > 0) {
        toast.warning(
          `${data.sent} ${t('vieScolaire.sessions.documents.sendSuccessSuffix')} — ${data.skipped.length} ${t(
            'vieScolaire.sessions.documents.sendSkippedSuffix',
          )}`,
        );
      } else {
        toast.error(t('vieScolaire.sessions.documents.sendNoneSent'));
      }
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={className}
          disabled={disabled}
          title={
            disabled
              ? t('vieScolaire.sessions.documents.noParticipant')
              : t('vieScolaire.sessions.documents.menuHint')
          }
        >
          <Printer className="size-4" aria-hidden />
          {t('vieScolaire.sessions.documents.menuLabel')}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        {SESSION_DOCUMENT_TYPES.map((doc, index) => {
          const documentType = ('documentType' in doc ? doc.documentType : doc.path) as DocumentType;
          const isSendingThis = sendMutation.isPending && sendMutation.variables === documentType;
          return (
            <div key={doc.path}>
              {index > 0 ? <DropdownMenuSeparator /> : null}
              <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground">
                {t(doc.labelKey)}
              </DropdownMenuLabel>
              <DropdownMenuItem onClick={() => openSessionDocument(sessionId, doc.path)}>
                <FileText className="size-4 text-muted-foreground" aria-hidden />
                {t('vieScolaire.sessions.documents.openAction')}
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={sendMutation.isPending}
                onClick={() => sendMutation.mutate(documentType)}
              >
                {isSendingThis ? (
                  <Loader2 className="size-4 animate-spin text-muted-foreground" aria-hidden />
                ) : (
                  <Send className="size-4 text-muted-foreground" aria-hidden />
                )}
                {t('vieScolaire.sessions.documents.sendAction')}
              </DropdownMenuItem>
            </div>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
