'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';
import {
  DEFAULT_INSTRUCTOR_WORKSPACE_PREFERENCES,
  type InstructorWorkspacePreferences,
} from '@/lib/instructor/instructor-workspace-preferences';

export const INSTRUCTOR_WORKSPACE_PREFERENCES_QUERY_KEY = ['instructor-workspace-preferences'] as const;

async function fetchInstructorWorkspacePreferences(): Promise<InstructorWorkspacePreferences> {
  const res = await apiFetch('/api/instructor/preferences');
  const json = (await res.json()) as {
    success?: boolean;
    data?: { preferences: InstructorWorkspacePreferences };
  };
  if (!res.ok || !json.success || !json.data?.preferences) {
    throw new Error('Préférences indisponibles');
  }
  return json.data.preferences;
}

async function patchInstructorWorkspacePreferences(
  patch: Partial<InstructorWorkspacePreferences>,
): Promise<InstructorWorkspacePreferences> {
  const res = await apiFetch('/api/instructor/preferences', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  });
  const json = (await res.json()) as {
    success?: boolean;
    data?: { preferences: InstructorWorkspacePreferences };
    error?: string;
  };
  if (!res.ok || !json.success || !json.data?.preferences) {
    throw new Error(json.error || 'Mise à jour impossible');
  }
  return json.data.preferences;
}

export function useInstructorWorkspacePreferences() {
  return useQuery({
    queryKey: INSTRUCTOR_WORKSPACE_PREFERENCES_QUERY_KEY,
    queryFn: fetchInstructorWorkspacePreferences,
    staleTime: 60_000,
    placeholderData: DEFAULT_INSTRUCTOR_WORKSPACE_PREFERENCES,
  });
}

export function useUpdateInstructorWorkspacePreference() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: patchInstructorWorkspacePreferences,
    onMutate: async (patch) => {
      await qc.cancelQueries({ queryKey: INSTRUCTOR_WORKSPACE_PREFERENCES_QUERY_KEY });
      const previous = qc.getQueryData<InstructorWorkspacePreferences>(
        INSTRUCTOR_WORKSPACE_PREFERENCES_QUERY_KEY,
      );
      if (previous) {
        qc.setQueryData(INSTRUCTOR_WORKSPACE_PREFERENCES_QUERY_KEY, { ...previous, ...patch });
      }
      return { previous };
    },
    onError: (_err, _patch, context) => {
      if (context?.previous) {
        qc.setQueryData(INSTRUCTOR_WORKSPACE_PREFERENCES_QUERY_KEY, context.previous);
      }
      toast.error('Impossible de mettre à jour ce paramètre.');
    },
    onSuccess: (preferences) => {
      qc.setQueryData(INSTRUCTOR_WORKSPACE_PREFERENCES_QUERY_KEY, preferences);
    },
  });
}
