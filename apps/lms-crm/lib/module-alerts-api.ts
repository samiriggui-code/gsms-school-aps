import { apiFetch, unwrapSectionApiData } from '@/lib/api';

export type ModuleAlertItem = {
  id: string;
  title: string;
  body: string;
  href: string | null;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  eventType: string | null;
  moduleKey: string | null;
  category: string;
  createdAt: string;
  unread: boolean;
  source: 'notification';
};

export async function fetchModuleAlerts(moduleKey: string, limit = 12) {
  const qs = new URLSearchParams({ module: moduleKey, limit: String(limit) });
  const res = await apiFetch(`/api/common/module-alerts?${qs.toString()}`);
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg =
      (json as { error?: { message?: string } }).error?.message ??
      'Impossible de charger les alertes.';
    throw new Error(msg);
  }
  return unwrapSectionApiData<{ moduleKey: string; items: ModuleAlertItem[] }>(json);
}
