'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { Button } from '@repo/ui/button';
import { Input } from '@repo/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/ui/table';

type Props = {
  entity: string;
  /** Colonnes à afficher (noms de champs). Si vide → déduit de la 1re ligne. */
  columns?: string[];
  queryParams?: Record<string, string>;
  pageSize?: number;
  onRowClick?: (row: Record<string, unknown>) => void;
};

function cellValue(row: Record<string, unknown>, key: string): string {
  const v = row[key];
  if (v == null) return '—';
  if (typeof v === 'object') {
    const o = v as Record<string, unknown>;
    if (typeof o.name === 'string') return o.name;
    if (typeof o.title === 'string') return o.title;
    if (typeof o.label === 'string') return o.label;
    return JSON.stringify(v);
  }
  if (typeof v === 'boolean') return v ? 'Oui' : 'Non';
  return String(v);
}

/**
 * Table générique : GET `/api/entities/<entity>` avec recherche + pagination.
 */
export function EntityTable({
  entity,
  columns,
  queryParams,
  pageSize = 10,
  onRowClick,
}: Props) {
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(pageSize),
      });
      if (query.trim()) params.set('query', query.trim());
      if (queryParams) {
        for (const [k, v] of Object.entries(queryParams)) {
          if (v) params.set(k, v);
        }
      }
      const res = await apiFetch(`/api/entities/${entity}?${params.toString()}`);
      const json = await res.json();
      if (!res.ok || !json?.success) {
        throw new Error(json?.error?.message || 'Chargement impossible.');
      }
      const payload = json.data as {
        data: Record<string, unknown>[];
        pagination: { total: number };
      };
      setRows(Array.isArray(payload.data) ? payload.data : []);
      setTotal(payload.pagination?.total ?? 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur.');
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [entity, page, pageSize, query, queryParams]);

  useEffect(() => {
    void load();
  }, [load]);

  const resolvedColumns = useMemo(() => {
    if (columns?.length) return columns;
    if (!rows[0]) return ['id'];
    return Object.keys(rows[0]).filter((k) => k !== 'password').slice(0, 8);
  }, [columns, rows]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="Rechercher…"
          value={query}
          onChange={(e) => {
            setPage(1);
            setQuery(e.target.value);
          }}
          className="max-w-xs"
        />
        <Button type="button" variant="outline" onClick={() => void load()}>
          Actualiser
        </Button>
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {resolvedColumns.map((col) => (
                <TableHead key={col}>{col}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={resolvedColumns.length}>Chargement…</TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={resolvedColumns.length}>Aucun résultat</TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow
                  key={String(row.id ?? JSON.stringify(row))}
                  className={onRowClick ? 'cursor-pointer' : undefined}
                  onClick={() => onRowClick?.(row)}
                >
                  {resolvedColumns.map((col) => (
                    <TableCell key={col}>{cellValue(row, col)}</TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {total} résultat{total > 1 ? 's' : ''} — page {page}/{totalPages}
        </span>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Précédent
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Suivant
          </Button>
        </div>
      </div>
    </div>
  );
}
