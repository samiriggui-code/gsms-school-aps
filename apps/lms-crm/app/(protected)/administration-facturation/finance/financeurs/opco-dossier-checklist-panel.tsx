'use client';

import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/api';

type CaseOption = {
  id: string;
  reference: string | null;
  status: string;
  funderType: string;
  providerCode: string;
  providerLabel: string;
};

type Step = {
  code: string;
  label: string;
  portalHint: string;
  state: 'upcoming' | 'due' | 'done';
  documentStatus: string | null;
};

function isEligibleOpcoClient(providerCode: string, providerLabel: string): boolean {
  const code = providerCode.toUpperCase();
  const label = providerLabel.toUpperCase();
  if (code === 'AFDAS' || code === 'ATLAS') return true;
  if (code.includes('AFDAS') || code.includes('ATLAS')) return true;
  if (label.includes('AFDAS') || label.includes('ATLAS')) return true;
  if (code === 'OPCO_HORS_APPRENTISSAGE') return true;
  return false;
}

function apiError(json: { error?: string | { message?: string } }, status: number): string {
  if (typeof json.error === 'string') return json.error;
  if (json.error?.message) return json.error.message;
  return `HTTP ${status}`;
}

const STATE_LABEL: Record<Step['state'], string> = {
  upcoming: 'à venir',
  due: 'à faire sur portail OPCO',
  done: 'fait',
};

/** Checklist OPCO hors-apprentissage — AFDAS / ATLAS seulement. */
export function OpcoDossierChecklistPanel({ cases }: { cases: CaseOption[] }) {
  const eligible = useMemo(
    () =>
      cases.filter(
        (c) => c.funderType === 'OPCO' && isEligibleOpcoClient(c.providerCode, c.providerLabel),
      ),
    [cases],
  );

  const router = useRouter();
  const [caseId, setCaseId] = useState(eligible[0]?.id ?? '');
  const [steps, setSteps] = useState<Step[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const base = caseId
    ? `/api/sections/administration-facturation/finance/financeurs/cases/${caseId}/opco-checklist`
    : '';

  const load = useCallback(async () => {
    if (!caseId || !base) {
      setSteps([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch(base);
      const json = (await res.json()) as {
        success?: boolean;
        data?: { steps?: Step[] };
        error?: string | { message?: string };
      };
      if (!res.ok || json.success === false) throw new Error(apiError(json, res.status));
      setSteps(json.data?.steps ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chargement impossible');
      setSteps([]);
    } finally {
      setLoading(false);
    }
  }, [base, caseId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (eligible.length && !eligible.some((c) => c.id === caseId)) {
      setCaseId(eligible[0]!.id);
    }
  }, [eligible, caseId]);

  function markDone(stepCode: string) {
    if (!base) return;
    startTransition(async () => {
      setError(null);
      try {
        const res = await apiFetch(base, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ stepCode }),
        });
        const json = (await res.json()) as {
          success?: boolean;
          data?: { steps?: Step[] };
          error?: string | { message?: string };
        };
        if (!res.ok || json.success === false) throw new Error(apiError(json, res.status));
        setSteps(json.data?.steps ?? []);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Mise à jour impossible');
      }
    });
  }

  if (eligible.length === 0) {
    return (
      <div className="mb-8 rounded-md border p-4">
        <h2 className="mb-1 text-sm font-semibold tracking-wide uppercase">
          Checklist OPCO (AFDAS / ATLAS)
        </h2>
        <p className="text-muted-foreground text-sm">
          Aucun dossier OPCO éligible — scope vérifié AFDAS/ATLAS uniquement (pas les 9 autres
          OPCO).
        </p>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <h2 className="mb-2 text-sm font-semibold tracking-wide uppercase">
        Checklist OPCO hors-apprentissage (AFDAS / ATLAS)
      </h2>
      <p className="text-muted-foreground mb-3 text-xs">
        MANUAL_PORTAL — cocher « Fait » après l&apos;action sur MyA / myAtlas. Codes FundingDocument
        OPCO_*. Autres OPCO exclus (non vérifiés).
      </p>
      <div className="mb-3 flex flex-wrap items-end gap-3">
        <div className="flex min-w-[14rem] flex-col gap-1">
          <label className="text-muted-foreground text-xs" htmlFor="opco-case">
            Dossier OPCO
          </label>
          <select
            id="opco-case"
            className="border-input bg-background h-9 rounded-md border px-2 text-sm"
            value={caseId}
            onChange={(ev) => setCaseId(ev.target.value)}
          >
            {eligible.map((c) => (
              <option key={c.id} value={c.id}>
                {c.reference ?? c.id.slice(0, 8)} — {c.status} ({c.providerCode})
              </option>
            ))}
          </select>
        </div>
        <Button type="button" size="sm" variant="outline" disabled={loading} onClick={() => void load()}>
          Rafraîchir
        </Button>
      </div>
      {error ? <p className="text-destructive mb-2 text-xs">{error}</p> : null}
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/40 border-b">
            <tr>
              <th className="p-2 font-medium">Étape</th>
              <th className="p-2 font-medium">État</th>
              <th className="p-2 font-medium">Rappel portail</th>
              <th className="p-2 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {steps.map((s) => (
              <tr key={s.code} className="border-b last:border-0">
                <td className="p-2">
                  <div className="font-medium">{s.label}</div>
                  <div className="text-muted-foreground font-mono text-[10px]">{s.code}</div>
                </td>
                <td className="p-2 text-xs">
                  {STATE_LABEL[s.state]}
                  {s.documentStatus ? (
                    <span className="text-muted-foreground"> ({s.documentStatus})</span>
                  ) : null}
                </td>
                <td className="text-muted-foreground p-2 text-xs">{s.portalHint}</td>
                <td className="p-2">
                  {s.state !== 'done' ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={pending || s.state === 'upcoming'}
                      onClick={() => markDone(s.code)}
                    >
                      Marquer fait
                    </Button>
                  ) : (
                    <span className="text-xs">✓</span>
                  )}
                </td>
              </tr>
            ))}
            {loading && steps.length === 0 ? (
              <tr>
                <td className="text-muted-foreground p-4" colSpan={4}>
                  Chargement…
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
