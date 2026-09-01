'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, MessageCircle, Send, Sparkles, X } from 'lucide-react';
import { apiFetch, unwrapSectionApiData } from '@/lib/api';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import type { EveOrbState } from '@/lib/eve/eve-types';

type ChatMessage = {
  id: string;
  role: 'USER' | 'ASSISTANT';
  content: string;
  createdAt: string;
};

const EVE_QUERY_KEY = ['eve', 'messages'] as const;

export function EveAssistant() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [orbState, setOrbState] = useState<EveOrbState>('IDLE');
  const scrollRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const messagesQuery = useQuery({
    queryKey: EVE_QUERY_KEY,
    queryFn: async () => {
      const res = await apiFetch('/api/eve/messages');
      if (!res.ok) throw new Error('fetch');
      return unwrapSectionApiData<{
        messages: ChatMessage[];
        aiConfigured: boolean;
      }>(await res.json());
    },
    enabled: open,
    staleTime: 10_000,
  });

  const sendMutation = useMutation({
    mutationFn: async (message: string) => {
      const res = await apiFetch('/api/eve/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });
      const json = await res.json();
      if (!res.ok) {
        const err =
          typeof (json as { error?: { message?: string } }).error === 'object'
            ? (json as { error: { message?: string } }).error.message
            : 'Envoi impossible';
        throw new Error(err ?? 'Envoi impossible');
      }
      return unwrapSectionApiData<{ reply: string; toolsUsed: string[] }>(json);
    },
    onMutate: () => setOrbState('THINKING'),
    onSuccess: async () => {
      setOrbState('SPEAKING');
      await queryClient.invalidateQueries({ queryKey: EVE_QUERY_KEY });
      window.setTimeout(() => setOrbState('IDLE'), 1200);
    },
    onError: (e: Error) => {
      setOrbState('IDLE');
      toast.error(e.message);
    },
  });

  const messages = messagesQuery.data?.messages ?? [];
  const aiConfigured = messagesQuery.data?.aiConfigured ?? true;
  const busy = sendMutation.isPending;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, busy]);

  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text || busy) return;
    setInput('');
    sendMutation.mutate(text);
  }, [input, busy, sendMutation]);

  return (
    <>
      <button
        type="button"
        aria-label="Ouvrir EVE"
        onClick={() => setOpen(true)}
        className={cn(
          'fixed bottom-6 right-6 z-50 flex size-14 items-center justify-center rounded-full shadow-lg transition-all',
          'bg-gradient-to-br from-violet-500 to-indigo-600 text-white hover:scale-105 hover:shadow-xl',
          orbState === 'THINKING' && 'animate-pulse ring-4 ring-violet-300/50',
          orbState === 'SPEAKING' && 'ring-2 ring-emerald-300/60',
        )}
      >
        {orbState === 'THINKING' ? (
          <Loader2 className="size-6 animate-spin" aria-hidden />
        ) : (
          <Sparkles className="size-6" aria-hidden />
        )}
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
          <SheetHeader className="border-b px-4 py-3 text-left">
            <SheetTitle className="flex items-center gap-2">
              <MessageCircle className="size-4 text-violet-600" aria-hidden />
              EVE
            </SheetTitle>
            <SheetDescription>
              Assistante CRM — lecture seule, outils métier avec vos permissions.
            </SheetDescription>
          </SheetHeader>

          {!aiConfigured ? (
            <p className="px-4 py-3 text-sm text-destructive">
              ANTHROPIC_API_KEY absente — configurez la clé pour activer EVE.
            </p>
          ) : null}

          <div ref={scrollRef} className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 py-3">
            {messagesQuery.isLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Chargement…
              </div>
            ) : null}

            {messages.length === 0 && !messagesQuery.isLoading ? (
              <p className="text-sm text-muted-foreground">
                Exemples : « Combien de sessions demain ? », « Couverture Qualiopi ? », « Agrégats
                BPF ? »
              </p>
            ) : null}

            {messages.map((m) => (
              <div
                key={m.id}
                className={cn(
                  'max-w-[90%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap',
                  m.role === 'USER'
                    ? 'ml-auto bg-primary text-primary-foreground'
                    : 'mr-auto bg-muted text-foreground',
                )}
              >
                {m.content}
              </div>
            ))}

            {busy ? (
              <div className="mr-auto flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="size-3.5 animate-spin" aria-hidden />
                EVE réfléchit…
              </div>
            ) : null}
          </div>

          <div className="flex gap-2 border-t p-3">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Posez votre question…"
              rows={2}
              className="min-h-0 resize-none"
              disabled={busy || !aiConfigured}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <Button
              type="button"
              size="icon"
              variant="primary"
              disabled={busy || !input.trim() || !aiConfigured}
              onClick={handleSend}
              aria-label="Envoyer"
            >
              {busy ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <Send className="size-4" aria-hidden />
              )}
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() => setOpen(false)}
              aria-label="Fermer"
            >
              <X className="size-4" aria-hidden />
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
