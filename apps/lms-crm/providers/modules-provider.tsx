'use client';

import { ReactNode } from 'react';

export function ModulesProvider({ children }: { children: ReactNode }) {
  // Store client module has been removed from CRM.
  // Keep this provider as a neutral wrapper to avoid touching app layout.
  return <>{children}</>;
}
