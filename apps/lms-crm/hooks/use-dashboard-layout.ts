'use client';

import { useModuleLayout } from './use-module-layout';
import type { DashboardModuleKey } from '@/config/dashboard-widgets.config';

export function useDashboardLayout(moduleKey: DashboardModuleKey) {
  return useModuleLayout(moduleKey);
}

export { useModuleLayout } from './use-module-layout';
