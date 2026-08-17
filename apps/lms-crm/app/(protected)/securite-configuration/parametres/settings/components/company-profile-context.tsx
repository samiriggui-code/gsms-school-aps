'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import {
  COMPANY_PROFILE_API,
  saveCompanyProfilePayload,
  type CompanyProfileSchemaType,
  type CompanyProfileView,
  type PrimaryAdminContactPayload,
} from '@/lib/company-profile';

type CompanyProfileApiData = {
  companyProfile?: CompanyProfileView;
  primaryAdminContact?: PrimaryAdminContactPayload | null;
};

type CompanyProfileContextValue = {
  profile: CompanyProfileView;
  primaryAdminContact: PrimaryAdminContactPayload | null;
  isLoading: boolean;
  saveProfile: (
    payload: CompanyProfileSchemaType,
    files?: {
      logoFile?: File | null;
      directorAvatarFile?: File | null;
      adminAvatarFile?: File | null;
    },
  ) => Promise<void>;
  isSaving: boolean;
};

const CompanyProfileContext = createContext<CompanyProfileContextValue | undefined>(
  undefined,
);

export function CompanyProfileProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['company-profile'],
    queryFn: async () => {
      const response = await apiFetch(COMPANY_PROFILE_API);
      if (!response.ok) throw new Error('fetch');
      const json = (await response.json()) as { data?: CompanyProfileApiData };
      return json.data;
    },
    staleTime: 30_000,
  });

  const mutation = useMutation({
    mutationFn: async (args: {
      payload: CompanyProfileSchemaType;
      files?: {
        logoFile?: File | null;
        directorAvatarFile?: File | null;
        adminAvatarFile?: File | null;
      };
    }) => {
      const body = await saveCompanyProfilePayload(args.payload, args.files);
      const response = await apiFetch(COMPANY_PROFILE_API, {
        method: 'POST',
        ...(body instanceof FormData
          ? { body }
          : {
              headers: { 'Content-Type': 'application/json' },
              body: body as string,
            }),
      });
      if (!response.ok) {
        const json = await response.json().catch(() => ({}));
        throw new Error((json as { message?: string }).message ?? 'Enregistrement impossible');
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['company-profile'] });
      void queryClient.invalidateQueries({ queryKey: ['system-settings'] });
    },
  });

  const value: CompanyProfileContextValue = {
    profile: data?.companyProfile ?? {},
    primaryAdminContact: data?.primaryAdminContact ?? null,
    isLoading,
    saveProfile: async (payload, files) => {
      await mutation.mutateAsync({ payload, files });
    },
    isSaving: mutation.isPending,
  };

  return (
    <CompanyProfileContext.Provider value={value}>{children}</CompanyProfileContext.Provider>
  );
}

export function useCompanyProfileSettings() {
  const ctx = useContext(CompanyProfileContext);
  if (!ctx) {
    throw new Error('useCompanyProfileSettings must be used within CompanyProfileProvider');
  }
  return ctx;
}
