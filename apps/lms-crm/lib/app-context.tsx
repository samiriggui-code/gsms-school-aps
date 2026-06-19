'use client';

import { useMemo } from 'react';
import { useSession } from 'next-auth/react';
import {
  CRM_PERMISSION,
  sessionHasPermission,
} from '@/lib/auth/crm-permissions';

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

export type PermissionsState = {
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

function buildPermissions(session: ReturnType<typeof useSession>['data']): PermissionsState {
  const check = (slug: string) => sessionHasPermission(session, slug);

  return {
    canAccessPilotage: check(CRM_PERMISSION.pilotageView),
    canAccessRessources: check(CRM_PERMISSION.ressourcesView),
    canAccessOperations: check(CRM_PERMISSION.academiqueView),
    canAccessSites: check(CRM_PERMISSION.academiqueView),
    canAccessInterventions: check(CRM_PERMISSION.academiqueView),
    canAccessQualite: check(CRM_PERMISSION.pilotageView),
    canAccessCommunication: check(CRM_PERMISSION.communicationView),
    canAccessDocuments: check(CRM_PERMISSION.securiteView),
    canAccessAdminFacturation: check(CRM_PERMISSION.financeView),
    canAccessParametres: check(CRM_PERMISSION.securiteView),
    canAccessSecurite: check(CRM_PERMISSION.securiteView),
    canAccessSupport: check(CRM_PERMISSION.supportView),
  };
}

export function usePermissions(): PermissionsState {
  const { data: session } = useSession();
  return useMemo(() => buildPermissions(session), [session]);
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
