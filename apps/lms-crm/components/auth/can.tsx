'use client';

import type { ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import { sessionHasAnyPermission, sessionHasPermission } from '@/lib/auth/crm-permissions';

type Props = {
  permission?: string;
  anyOf?: string[];
  children: ReactNode;
  fallback?: ReactNode;
};

/** Affiche `children` uniquement si la session possède la permission demandée. */
export function Can({ permission, anyOf, children, fallback = null }: Props) {
  const { data: session } = useSession();

  if (permission && !sessionHasPermission(session, permission)) {
    return fallback;
  }

  if (anyOf?.length && !sessionHasAnyPermission(session, anyOf)) {
    return fallback;
  }

  if (!permission && !anyOf?.length) {
    return children;
  }

  return children;
}
