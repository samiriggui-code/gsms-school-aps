'use client';

import { Button } from '@/components/ui/button';
import { SimpleCrudModulePage } from '@/components/crud/simple-crud-module-page';
import { useTranslation } from '@/hooks/useTranslation';
import { workspaceActionLabel } from '@/lib/workspace-labels';
import { apiFetch } from '@/lib/api';
import { toast } from 'sonner';

const WORKSPACE_KEY = 'comm-seo-redirections';

export default function Page() {
  const { t } = useTranslation();

  return (
    <SimpleCrudModulePage
      workspaceKey={WORKSPACE_KEY}
      apiPath="/api/sections/communication-contenu/seo/redirections"
      queryKey="seo-redirections"
      statLabels={[
        { key: 'total', label: 'Total', subtitle: 'Règles' },
        { key: 'active', label: 'Actives', subtitle: 'En production' },
        { key: 'inactive', label: 'Inactives', subtitle: 'Désactivées' },
        { key: 'perm301', label: '301', subtitle: 'Permanentes' },
        { key: 'perm302', label: '302', subtitle: 'Temporaires' },
      ]}
      columns={[
        { key: 'sourcePath', label: 'Source' },
        { key: 'targetPath', label: 'Cible' },
        { key: 'redirectType', label: 'Type', format: (v) => `${v}` },
        {
          key: 'active',
          label: 'Actif',
          format: (v) => (v ? t('crud.yes') : t('crud.no')),
        },
      ]}
      createFields={[
        { name: 'sourcePath', label: 'Chemin source (/)', required: true, defaultValue: '/' },
        { name: 'targetPath', label: 'Cible', required: true },
        {
          name: 'redirectType',
          label: 'Type',
          type: 'select',
          defaultValue: '302',
          options: [
            {
              value: '301',
              label: t(`workspace.${WORKSPACE_KEY}.redirectType.301`, { defaultValue: '301 Permanent' }),
            },
            {
              value: '302',
              label: t(`workspace.${WORKSPACE_KEY}.redirectType.302`, { defaultValue: '302 Temporaire' }),
            },
          ],
        },
        { name: 'notes', label: 'Notes', type: 'textarea' },
      ]}
      rowActions={(row, refresh) => {
        const id = String(row.id);
        const active = Boolean(row.active);
        return (
          <Button
            size="sm"
            variant="outline"
            onClick={async () => {
              const res = await apiFetch(`/api/sections/communication-contenu/seo/redirections/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ active: !active }),
              });
              if (!res.ok) toast.error(workspaceActionLabel(t, WORKSPACE_KEY, 'updateFailed'));
              else refresh();
            }}
          >
            {active
              ? workspaceActionLabel(t, WORKSPACE_KEY, 'disable')
              : workspaceActionLabel(t, WORKSPACE_KEY, 'enable')}
          </Button>
        );
      }}
    />
  );
}
