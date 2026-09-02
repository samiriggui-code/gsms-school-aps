'use client';

import { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { Button } from '@repo/ui/button';
import { Input } from '@repo/ui/input';
import { Label } from '@repo/ui/label';

type SchemaField = {
  name: string;
  type: string;
  label: string;
  required?: boolean;
  readOnly?: boolean;
  options?: { value: string; label: string }[];
};

type EntitySchema = {
  name: string;
  label: string;
  fields: SchemaField[];
};

type Props = {
  entity: string;
  recordId?: string;
  initialValues?: Record<string, unknown>;
  onSuccess?: (record: Record<string, unknown>) => void;
  onCancel?: () => void;
};

/**
 * Formulaire générique : lit `/api/entities/<entity>/schema`, valide, POST/PATCH.
 * Type `file` : URL string pour l’instant (upload FileAsset branchable ensuite).
 */
export function EntityForm({
  entity,
  recordId,
  initialValues,
  onSuccess,
  onCancel,
}: Props) {
  const [schema, setSchema] = useState<EntitySchema | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const editableFields = useMemo(
    () => (schema?.fields ?? []).filter((f) => !f.readOnly && f.name !== 'id'),
    [schema],
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await apiFetch(`/api/entities/${entity}/schema`);
        const json = await res.json();
        if (!res.ok || !json?.success) {
          throw new Error(json?.error?.message || 'Schema indisponible.');
        }
        if (cancelled) return;
        const s = json.data as EntitySchema;
        setSchema(s);
        const next: Record<string, string> = {};
        for (const f of s.fields) {
          if (f.readOnly || f.name === 'id') continue;
          const v = initialValues?.[f.name];
          next[f.name] =
            v == null
              ? ''
              : typeof v === 'boolean'
                ? v
                  ? 'true'
                  : 'false'
                : String(v);
        }
        setValues(next);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Erreur chargement schema.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [entity, initialValues]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!schema) return;
    setSaving(true);
    setError(null);
    try {
      const body: Record<string, unknown> = {};
      for (const f of editableFields) {
        const raw = values[f.name] ?? '';
        if (raw === '' && !f.required) {
          body[f.name] = null;
          continue;
        }
        if (f.type === 'number') body[f.name] = Number(raw);
        else if (f.type === 'boolean') body[f.name] = raw === 'true';
        else if (f.type === 'date') body[f.name] = raw;
        else body[f.name] = raw;
      }

      const url = recordId
        ? `/api/entities/${entity}/${recordId}`
        : `/api/entities/${entity}`;
      const res = await apiFetch(url, {
        method: recordId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok || !json?.success) {
        throw new Error(json?.error?.message || 'Enregistrement impossible.');
      }
      onSuccess?.(json.data as Record<string, unknown>);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur sauvegarde.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Chargement du formulaire…</p>;
  }

  if (!schema) {
    return <p className="text-sm text-destructive">{error ?? 'Schema manquant.'}</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="text-sm font-medium">{schema.label}</div>
      {editableFields.map((field) => (
        <div key={field.name} className="flex flex-col gap-1.5">
          <Label htmlFor={`${entity}-${field.name}`}>
            {field.label}
            {field.required ? ' *' : ''}
          </Label>
          {field.type === 'select' && field.options?.length ? (
            <select
              id={`${entity}-${field.name}`}
              className="h-8.5 rounded-md border border-input bg-background px-3 text-sm"
              value={values[field.name] ?? ''}
              required={field.required}
              onChange={(ev) =>
                setValues((prev) => ({ ...prev, [field.name]: ev.target.value }))
              }
            >
              <option value="">—</option>
              {field.options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          ) : field.type === 'boolean' ? (
            <select
              id={`${entity}-${field.name}`}
              className="h-8.5 rounded-md border border-input bg-background px-3 text-sm"
              value={values[field.name] ?? 'false'}
              onChange={(ev) =>
                setValues((prev) => ({ ...prev, [field.name]: ev.target.value }))
              }
            >
              <option value="true">Oui</option>
              <option value="false">Non</option>
            </select>
          ) : field.type === 'text' ? (
            <textarea
              id={`${entity}-${field.name}`}
              className="min-h-20 rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={values[field.name] ?? ''}
              required={field.required}
              onChange={(ev) =>
                setValues((prev) => ({ ...prev, [field.name]: ev.target.value }))
              }
            />
          ) : (
            <Input
              id={`${entity}-${field.name}`}
              type={
                field.type === 'number'
                  ? 'number'
                  : field.type === 'date'
                    ? 'date'
                    : field.type === 'file'
                      ? 'url'
                      : 'text'
              }
              placeholder={
                field.type === 'file' ? 'URL fichier / asset' : undefined
              }
              value={values[field.name] ?? ''}
              required={field.required}
              onChange={(ev) =>
                setValues((prev) => ({ ...prev, [field.name]: ev.target.value }))
              }
            />
          )}
        </div>
      ))}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <div className="flex gap-2">
        <Button type="submit" disabled={saving}>
          {saving ? 'Enregistrement…' : recordId ? 'Mettre à jour' : 'Créer'}
        </Button>
        {onCancel ? (
          <Button type="button" variant="outline" onClick={onCancel}>
            Annuler
          </Button>
        ) : null}
      </div>
    </form>
  );
}
