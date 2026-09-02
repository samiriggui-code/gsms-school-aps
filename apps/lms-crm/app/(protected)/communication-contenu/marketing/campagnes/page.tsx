'use client';

import { Fragment } from 'react';
import { Button } from '@repo/ui/button';
import { SimpleCrudModulePage } from '@/components/crud/simple-crud-module-page';
import { Container } from '@/components/common/container';
import { useTranslation } from '@/hooks/useTranslation';
import { workspaceActionLabel, workspaceStatusLabel } from '@/lib/workspace-labels';
import { apiFetch } from '@/lib/api';
import { toast } from 'sonner';
import { CampagnesScopeCallout } from './components/campagnes-scope-callout';

const WORKSPACE_KEY = 'comm-campagnes';
const STATUS_KEYS = ['DRAFT', 'ACTIVE', 'PAUSED', 'ENDED'] as const;

export default function Page() {
  const { t } = useTranslation();

  return (
    <Fragment>
      <Container className="pb-0">
        <CampagnesScopeCallout />
      </Container>
      <SimpleCrudModulePage
      workspaceKey={WORKSPACE_KEY}
      apiPath="/api/sections/communication-contenu/marketing/campagnes"
      queryKey="marketing-campagnes"
      statLabels={[
        { key: 'total', label: 'Total', subtitle: 'Campagnes' },
        { key: 'active', label: 'Actives', subtitle: 'En cours' },
        { key: 'paused', label: 'En pause', subtitle: 'Suspendues' },
        { key: 'ended', label: 'Terminées', subtitle: 'Campagnes closes' },
        { key: 'draft', label: 'Brouillons', subtitle: 'Non lancées' },
      ]}
      columns={[
        { key: 'name', label: 'Nom' },
        { key: 'channel', label: 'Canal' },
        {
          key: 'status',
          label: 'Statut',
          format: (v) => workspaceStatusLabel(t, WORKSPACE_KEY, String(v), String(v)),
        },
        { key: 'utmSource', label: 'UTM source' },
        { key: 'utmCampaign', label: 'UTM campagne' },
      ]}
      createFields={[
        { name: 'name', label: 'Nom', required: true },
        { name: 'channel', label: 'Canal', defaultValue: 'landing' },
        {
          name: 'status',
          label: 'Statut',
          type: 'select',
          defaultValue: 'DRAFT',
          options: STATUS_KEYS.map((value) => ({
            value,
            label: workspaceStatusLabel(t, WORKSPACE_KEY, value, value),
          })),
        },
        { name: 'utmSource', label: 'UTM source' },
        { name: 'utmMedium', label: 'UTM medium' },
        { name: 'utmCampaign', label: 'UTM campagne' },
        { name: 'notes', label: 'Notes', type: 'textarea' },
      ]}
      rowActions={(row, refresh) => {
        const id = String(row.id);
        const status = String(row.status);
        if (status === 'DRAFT' || status === 'PAUSED') {
          return (
            <Button
              size="sm"
              variant="outline"
              onClick={async () => {
                const res = await apiFetch(`/api/sections/communication-contenu/marketing/campagnes/${id}`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ status: 'ACTIVE' }),
                });
                if (!res.ok) toast.error(workspaceActionLabel(t, WORKSPACE_KEY, 'activateFailed'));
                else refresh();
              }}
            >
              {workspaceActionLabel(t, WORKSPACE_KEY, 'activate')}
            </Button>
          );
        }
        if (status === 'ACTIVE') {
          return (
            <Button
              size="sm"
              variant="outline"
              onClick={async () => {
                const res = await apiFetch(`/api/sections/communication-contenu/marketing/campagnes/${id}`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ status: 'PAUSED' }),
                });
                if (!res.ok) toast.error(workspaceActionLabel(t, WORKSPACE_KEY, 'pauseFailed'));
                else refresh();
              }}
            >
              {workspaceActionLabel(t, WORKSPACE_KEY, 'pause')}
            </Button>
          );
        }
        return null;
      }}
    />
    </Fragment>
  );
}
