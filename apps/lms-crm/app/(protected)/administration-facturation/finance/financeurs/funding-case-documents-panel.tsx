'use client';

import { useCallback, useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@repo/ui/button';
import { apiFetch } from '@/lib/api';

type CaseOption = { id: string; reference: string | null; status: string; providerLabel: string };

type FundingDoc = {
  id: string;
  code: string;
  label: string;
  status: string;
  fileAssetId: string | null;
};

const STATUSES = ['MISSING', 'UPLOADED', 'VALIDATED', 'REJECTED'] as const;

function apiError(json: { error?: string | { message?: string } }, status: number): string {
  if (typeof json.error === 'string') return json.error;
  if (json.error?.message) return json.error.message;
  return `HTTP ${status}`;
}

export function FundingCaseDocumentsPanel({ cases }: { cases: CaseOption[] }) {
  const router = useRouter();
  const [caseId, setCaseId] = useState(cases[0]?.id ?? '');
  const [docs, setDocs] = useState<FundingDoc[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [label, setLabel] = useState('');
  const [code, setCode] = useState('');
  const [pending, startTransition] = useTransition();

  const base = `/api/sections/administration-facturation/finance/financeurs/cases/${caseId}/documents`;

  const load = useCallback(async () => {
    if (!caseId) {
      setDocs([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch(base);
      const json = (await res.json()) as {
        success?: boolean;
        data?: FundingDoc[];
        error?: string | { message?: string };
      };
      if (!res.ok || json.success === false) throw new Error(apiError(json, res.status));
      setDocs(json.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chargement impossible');
      setDocs([]);
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

  function addDoc(e: React.FormEvent) {
    e.preventDefault();
    if (!caseId || !label.trim()) return;
    startTransition(async () => {
      setError(null);
      try {
        const res = await apiFetch(base, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            label: label.trim(),
            code: code.trim() || undefined,
          }),
        });
        const json = (await res.json()) as { success?: boolean; error?: string | { message?: string } };
        if (!res.ok || json.success === false) throw new Error(apiError(json, res.status));
        setLabel('');
        setCode('');
        await load();
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Création impossible');
      }
    });
  }

  function patchDoc(docId: string, body: Record<string, unknown>) {
    startTransition(async () => {
      setError(null);
      try {
        const res = await apiFetch(`${base}/${docId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        const json = (await res.json()) as { success?: boolean; error?: string | { message?: string } };
        if (!res.ok || json.success === false) throw new Error(apiError(json, res.status));
        await load();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Mise à jour impossible');
      }
    });
  }

  function removeDoc(docId: string) {
    startTransition(async () => {
      setError(null);
      try {
        const res = await apiFetch(`${base}/${docId}`, { method: 'DELETE' });
        const json = (await res.json()) as { success?: boolean; error?: string | { message?: string } };
        if (!res.ok || json.success === false) throw new Error(apiError(json, res.status));
        await load();
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Suppression impossible');
      }
    });
  }

  async function onUpload(docId: string, file: File | undefined) {
    if (!file || !caseId) return;
    setError(null);
    startTransition(async () => {
      try {
        const fd = new FormData();
        fd.append('file', file);
        fd.append('module', 'administration-facturation');
        fd.append('entityType', 'FundingDocument');
        fd.append('entityId', docId);
        fd.append('visibility', 'PRIVATE');
        const up = await apiFetch('/api/common/files', { method: 'POST', body: fd });
        const upJson = (await up.json()) as { data?: { id: string }; message?: string };
        if (!up.ok || !upJson.data?.id) {
          throw new Error(upJson.message || `Upload HTTP ${up.status}`);
        }
        const res = await apiFetch(`${base}/${docId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileAssetId: upJson.data.id, status: 'UPLOADED' }),
        });
        const json = (await res.json()) as { success?: boolean; error?: string | { message?: string } };
        if (!res.ok || json.success === false) throw new Error(apiError(json, res.status));
        await load();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Upload impossible');
      }
    });
  }

  if (cases.length === 0) return null;

  return (
    <div className="mb-8 rounded-md border p-3">
      <h3 className="mb-3 text-sm font-semibold tracking-wide uppercase">
        Checklist pièces (FundingDocument)
      </h3>
      <div className="mb-3 flex flex-wrap items-end gap-3">
        <div className="flex min-w-[14rem] flex-1 flex-col gap-1">
          <label className="text-muted-foreground text-xs" htmlFor="fd-case">
            Dossier
          </label>
          <select
            id="fd-case"
            className="border-input bg-background h-9 rounded-md border px-2 text-sm"
            value={caseId}
            onChange={(ev) => setCaseId(ev.target.value)}
          >
            {cases.map((c) => (
              <option key={c.id} value={c.id}>
                {(c.reference ?? c.id.slice(0, 8))} — {c.providerLabel} ({c.status})
              </option>
            ))}
          </select>
        </div>
      </div>

      <form onSubmit={addDoc} className="mb-4 flex flex-wrap items-end gap-2">
        <div className="flex min-w-[8rem] flex-col gap-1">
          <label className="text-muted-foreground text-xs" htmlFor="fd-code">
            Code
          </label>
          <input
            id="fd-code"
            className="border-input bg-background h-9 rounded-md border px-2 text-sm"
            value={code}
            onChange={(ev) => setCode(ev.target.value)}
            placeholder="CNI"
          />
        </div>
        <div className="flex min-w-[12rem] flex-1 flex-col gap-1">
          <label className="text-muted-foreground text-xs" htmlFor="fd-label">
            Libellé
          </label>
          <input
            id="fd-label"
            className="border-input bg-background h-9 rounded-md border px-2 text-sm"
            value={label}
            onChange={(ev) => setLabel(ev.target.value)}
            placeholder="Pièce d’identité"
            required
          />
        </div>
        <Button type="submit" size="sm" disabled={pending || !label.trim()}>
          Ajouter
        </Button>
      </form>

      {loading ? <p className="text-muted-foreground text-sm">Chargement…</p> : null}
      {error ? <p className="text-destructive mb-2 text-sm">{error}</p> : null}

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/40 border-b">
            <tr>
              <th className="p-2 font-medium">Code</th>
              <th className="p-2 font-medium">Libellé</th>
              <th className="p-2 font-medium">Statut</th>
              <th className="p-2 font-medium">Fichier</th>
              <th className="p-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {docs.map((d) => (
              <tr key={d.id} className="border-b last:border-0">
                <td className="p-2 font-mono text-xs">{d.code}</td>
                <td className="p-2">{d.label}</td>
                <td className="p-2">
                  <select
                    className="border-input bg-background h-8 rounded-md border px-1 text-xs"
                    value={d.status}
                    disabled={pending}
                    onChange={(ev) => patchDoc(d.id, { status: ev.target.value })}
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="p-2 text-xs">
                  {d.fileAssetId ? (
                    <span className="font-mono">{d.fileAssetId.slice(0, 8)}…</span>
                  ) : (
                    <label className="text-primary cursor-pointer underline">
                      Upload
                      <input
                        type="file"
                        className="hidden"
                        disabled={pending}
                        onChange={(ev) => {
                          void onUpload(d.id, ev.target.files?.[0]);
                          ev.target.value = '';
                        }}
                      />
                    </label>
                  )}
                </td>
                <td className="p-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={pending}
                    onClick={() => removeDoc(d.id)}
                  >
                    Retirer
                  </Button>
                </td>
              </tr>
            ))}
            {!loading && docs.length === 0 ? (
              <tr>
                <td className="text-muted-foreground p-3" colSpan={5}>
                  Aucune pièce — ajouter manuellement (pas de référentiel financeur dans cette passe).
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
