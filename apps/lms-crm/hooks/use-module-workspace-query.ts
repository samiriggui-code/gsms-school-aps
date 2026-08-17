'use client';

import { useQuery } from '@tanstack/react-query';
import { MODULE_LANDING_DATAGRID_PAGE_SIZE } from '@/app/(protected)/securite-configuration/components/datagrid-standards';
import { apiFetch, unwrapSectionApiData } from '@/lib/api';
import type { WorkspacePayload } from '@repo/api-core';
import type { ModuleWorkspaceViewKey } from '@repo/api-core';

export function moduleWorkspaceQueryKey(
  viewKey: ModuleWorkspaceViewKey,
  page: number,
  limit: number,
  q: string,
) {
  return ['module-workspace', viewKey, page, limit, q] as const;
}

export function useModuleWorkspaceQuery(input: {
  viewKey: ModuleWorkspaceViewKey;
  page?: number;
  limit?: number;
  q?: string;
}) {
  const page = input.page ?? 1;
  const limit = input.limit ?? MODULE_LANDING_DATAGRID_PAGE_SIZE;
  const q = input.q ?? '';

  return useQuery({
    queryKey: moduleWorkspaceQueryKey(input.viewKey, page, limit, q),
    queryFn: async (): Promise<WorkspacePayload | undefined> => {
      const sp = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });
      if (q.trim()) sp.set('q', q.trim());
      const res = await apiFetch(`/api/sections/workspace/${input.viewKey}?${sp.toString()}`);
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = (json as { error?: { message?: string } }).error?.message ?? 'Chargement impossible.';
        throw new Error(msg);
      }
      return unwrapSectionApiData<WorkspacePayload>(json);
    },
    staleTime: 60_000,
  });
}
