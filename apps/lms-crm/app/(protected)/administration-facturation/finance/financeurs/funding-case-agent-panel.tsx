'use client';

import { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import { Button } from '@repo/ui/button';
import { apiFetch } from '@/lib/api';

type CaseOption = { id: string; reference: string | null; status: string; providerLabel: string };

type AgentMessage = { id: string; role: 'USER' | 'ASSISTANT'; content: string };

function apiError(json: { error?: string | { message?: string } }, status: number): string {
  if (typeof json.error === 'string') return json.error;
  if (json.error?.message) return json.error.message;
  return `HTTP ${status}`;
}

export function FundingCaseAgentPanel({ cases }: { cases: CaseOption[] }) {
  const [caseId, setCaseId] = useState(cases[0]?.id ?? '');
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const scrollRef = useRef<HTMLDivElement>(null);

  const base = `/api/sections/administration-facturation/finance/financeurs/cases/${caseId}/agent/messages`;

  const load = useCallback(async () => {
    if (!caseId) {
      setMessages([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch(base);
      const json = (await res.json()) as {
        success?: boolean;
        data?: { messages: AgentMessage[] };
        error?: string | { message?: string };
      };
      if (!res.ok || json.success === false) throw new Error(apiError(json, res.status));
      setMessages(json.data?.messages ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chargement impossible');
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [base, caseId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (cases.length && !cases.some((c) => c.id === caseId)) {
      setCaseId(cases[0]!.id);
    }
  }, [cases, caseId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  function send(e: React.FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text || !caseId || streaming) return;
    setDraft('');
    setError(null);
    setMessages((prev) => [...prev, { id: `local-${prev.length}`, role: 'USER', content: text }]);

    startTransition(async () => {
      setStreaming(true);
      try {
        const res = await apiFetch(base, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: text }),
        });
        if (!res.ok || !res.body) {
          const json = (await res.json().catch(() => ({}))) as { error?: string | { message?: string } };
          throw new Error(apiError(json, res.status));
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let assistantText = '';
        const assistantId = `local-assistant-${Date.now()}`;
        setMessages((prev) => [...prev, { id: assistantId, role: 'ASSISTANT', content: '' }]);

        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          assistantText += decoder.decode(value, { stream: true });
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantId ? { ...m, content: assistantText } : m)),
          );
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Échec de l'envoi");
      } finally {
        setStreaming(false);
      }
    });
  }

  if (cases.length === 0) return null;

  return (
    <div className="mb-8 rounded-md border p-3">
      <h3 className="mb-3 text-sm font-semibold tracking-wide uppercase">Agent — dossier</h3>

      <div className="mb-3 flex flex-wrap items-end gap-3">
        <div className="flex min-w-[14rem] flex-1 flex-col gap-1">
          <label className="text-muted-foreground text-xs" htmlFor="fca-case">
            Dossier
          </label>
          <select
            id="fca-case"
            className="border-input bg-background h-9 rounded-md border px-2 text-sm"
            value={caseId}
            onChange={(ev) => setCaseId(ev.target.value)}
          >
            {cases.map((c) => (
              <option key={c.id} value={c.id}>
                {c.reference ?? c.id.slice(0, 8)} — {c.providerLabel} ({c.status})
              </option>
            ))}
          </select>
        </div>
      </div>

      {error ? <p className="text-destructive mb-2 text-sm">{error}</p> : null}

      <div
        ref={scrollRef}
        className="bg-muted/20 mb-3 h-64 overflow-y-auto rounded-md border p-3 text-sm"
      >
        {loading ? <p className="text-muted-foreground">Chargement…</p> : null}
        {!loading && messages.length === 0 ? (
          <p className="text-muted-foreground">
            Aucun échange — demandez par exemple « qu'est-ce qu'il manque comme document pour ce
            dossier ? ».
          </p>
        ) : null}
        {messages.map((m) => (
          <div key={m.id} className={`mb-2 ${m.role === 'USER' ? 'text-right' : 'text-left'}`}>
            <span
              className={`inline-block max-w-[85%] rounded-md px-2 py-1 whitespace-pre-wrap ${
                m.role === 'USER' ? 'bg-primary text-primary-foreground' : 'bg-background border'
              }`}
            >
              {m.content}
            </span>
          </div>
        ))}
      </div>

      <form onSubmit={send} className="flex items-end gap-2">
        <input
          className="border-input bg-background h-9 flex-1 rounded-md border px-2 text-sm"
          value={draft}
          onChange={(ev) => setDraft(ev.target.value)}
          placeholder="Écrire à l'agent…"
          disabled={streaming}
        />
        <Button type="submit" size="sm" disabled={streaming || !draft.trim()}>
          {streaming ? '…' : 'Envoyer'}
        </Button>
      </form>
    </div>
  );
}
