'use client';

import { useState } from 'react';
import { Container } from '@/components/common/container';
import {
  Toolbar,
  ToolbarHeading,
  ToolbarTitle,
  ToolbarDescription,
} from '@/components/common/toolbar';
import { EntityTable } from '@/components/framework/entity-table';
import { EntityForm } from '@/components/framework/entity-form';
import { Button } from '@/components/ui/button';

const ENTITIES = [
  { id: 'user', label: 'Utilisateurs (IAM)' },
  { id: 'role', label: 'Rôles' },
  { id: 'course', label: 'Cours LMS' },
  { id: 'lesson', label: 'Leçons' },
  { id: 'enrollment', label: 'Inscriptions' },
  { id: 'leaveRequest', label: 'Absences RH' },
] as const;

/**
 * Lab framework DocType-like — valide le socle sans migrer tous les écrans CRM.
 * Accès : /securite-configuration/framework-lab
 */
export default function FrameworkLabPage() {
  const [entity, setEntity] =
    useState<(typeof ENTITIES)[number]['id']>('user');
  const [showForm, setShowForm] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <>
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <ToolbarTitle>Framework entités (lab)</ToolbarTitle>
            <ToolbarDescription>
              Socle DocType-like GSMS — API `/api/entities/*`, fail-closed permissions.
              Les écrans CRM existants restent en place ; ce lab valide le moteur.
            </ToolbarDescription>
          </ToolbarHeading>
        </Toolbar>

        <div className="mb-4 flex flex-wrap gap-2">
          {ENTITIES.map((e) => (
            <Button
              key={e.id}
              type="button"
              variant={entity === e.id ? 'primary' : 'outline'}
              size="sm"
              onClick={() => {
                setEntity(e.id);
                setShowForm(false);
                setRefreshKey((k) => k + 1);
              }}
            >
              {e.label}
            </Button>
          ))}
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setShowForm((v) => !v)}
          >
            {showForm ? 'Masquer formulaire' : 'Nouveau'}
          </Button>
        </div>

        {showForm ? (
          <div className="mb-6 max-w-lg rounded-md border p-4">
            <EntityForm
              entity={entity}
              onSuccess={() => {
                setShowForm(false);
                setRefreshKey((k) => k + 1);
              }}
              onCancel={() => setShowForm(false)}
            />
          </div>
        ) : null}

        <EntityTable
          key={`${entity}-${refreshKey}`}
          entity={entity}
          columns={
            entity === 'user'
              ? ['name', 'email', 'status', 'role', 'createdAt']
              : entity === 'role'
                ? ['name', 'slug', 'isDefault', 'createdAt']
                : entity === 'course'
                  ? ['title', 'isPublished', 'price', 'createdBy', 'createdAt']
                  : entity === 'lesson'
                    ? ['title', 'position', 'isPublished', 'course']
                    : entity === 'enrollment'
                      ? ['user', 'course', 'status', 'createdAt']
                      : ['user', 'type', 'status', 'startDate', 'endDate']
          }
        />
      </Container>
    </>
  );
}
