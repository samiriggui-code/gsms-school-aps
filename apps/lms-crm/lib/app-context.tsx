'use client';

import { useMemo } from 'react';
import { useSession } from 'next-auth/react';

type CompanyInfo = {
  id: string;
  name: string;
  billingPlan: string;
};

type CompanyUserInfo = {
  firstName?: string;
  lastName?: string;
  UserRole?: {
    name?: string;
  };
};

type AppState = {
  company: CompanyInfo | null;
  currentUser: CompanyUserInfo | null;
  isLoading: boolean;
};

type PermissionsState = {
  canAccessPilotage: boolean;
  canAccessRessources: boolean;
  canAccessOperations: boolean;
  canAccessSites: boolean;
  canAccessInterventions: boolean;
  canAccessQualite: boolean;
  canAccessCommunication: boolean;
  canAccessDocuments: boolean;
  canAccessAdminFacturation: boolean;
  canAccessParametres: boolean;
  canAccessSecurite: boolean;
  canAccessSupport: boolean;
};

const SOLO_PERMISSIONS: PermissionsState = {
  canAccessPilotage: true,
  canAccessRessources: true,
  canAccessOperations: true,
  canAccessSites: true,
  canAccessInterventions: true,
  canAccessQualite: true,
  canAccessCommunication: true,
  canAccessDocuments: true,
  canAccessAdminFacturation: true,
  canAccessParametres: true,
  canAccessSecurite: true,
  canAccessSupport: true,
};

export function usePermissions(): PermissionsState {
  return SOLO_PERMISSIONS;
}

export function useAppContext(): AppState {
  const { data: session, status } = useSession();

  return useMemo(() => {
    const fullName = session?.user?.name ?? '';
    const [firstName, ...rest] = fullName.split(' ').filter(Boolean);
    const lastName = rest.join(' ');

    return {
      company: {
        id: 'solo',
        name: 'LMS',
        billingPlan: 'Standard',
      },
      currentUser: {
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        UserRole: {
          name:
            (session?.user as { roleName?: string } | undefined)?.roleName ??
            'Administrateur',
        },
      },
      isLoading: status === 'loading',
    };
  }, [session, status]);
}

