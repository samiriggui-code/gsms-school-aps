'use client';

import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { exportListCsv } from '@/lib/gestion-ressources/export-list-csv';

type UseRhListExportOptions = {
  apiPath: string;
  filename: string;
  headers: string[];
  mapRow: (item: Record<string, unknown>) => (string | number | null | undefined)[];
  searchParams?: Record<string, string>;
};

export function useRhListExport({
  apiPath,
  filename,
  headers,
  mapRow,
  searchParams,
}: UseRhListExportOptions) {
  const [isExporting, setIsExporting] = useState(false);

  const exportCsv = useCallback(async () => {
    setIsExporting(true);
    try {
      await exportListCsv({ apiPath, filename, headers, mapRow, searchParams });
      toast.success('Export CSV téléchargé.');
    } catch {
      toast.error("Impossible d'exporter la liste.");
    } finally {
      setIsExporting(false);
    }
  }, [apiPath, filename, headers, mapRow, searchParams]);

  return { exportCsv, isExporting };
}

function userLabel(item: Record<string, unknown>) {
  const name = item.name ?? item.fullName;
  if (typeof name === 'string' && name.trim()) return name.trim();
  const first = typeof item.firstName === 'string' ? item.firstName : '';
  const last = typeof item.lastName === 'string' ? item.lastName : '';
  return `${first} ${last}`.trim() || '—';
}

function cell(value: unknown): string | number | null | undefined {
  if (value == null) return value;
  if (typeof value === 'string' || typeof value === 'number') return value;
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

export function useCollaborateursExport(profileSegment: 'collaborateur' | 'interne') {
  return useRhListExport({
    apiPath: '/api/sections/gestion-ressources/rh/collaborateurs',
    filename: `collaborateurs-${profileSegment}`,
    headers: ['Nom', 'E-mail', 'Téléphone', 'Statut', 'Catégorie', 'Dernière connexion'],
    searchParams: { profileType: profileSegment },
    mapRow: (item) => [
      userLabel(item),
      cell(item.email),
      cell(item.phone),
      cell(item.status),
      cell(item.userCategory),
      cell(item.lastSignInAt ?? item.lastLogin),
    ],
  });
}

export function useFormateursExport() {
  return useRhListExport({
    apiPath: '/api/sections/gestion-ressources/rh/collaborateurs',
    filename: 'formateurs',
    headers: ['Nom', 'E-mail', 'Téléphone', 'Statut', 'Qualification'],
    searchParams: { profileType: 'formateur' },
    mapRow: (item) => [
      userLabel(item),
      cell(item.email),
      cell(item.phone),
      cell(item.status),
      cell(item.qualificationMetier ?? item.qualification),
    ],
  });
}

export function useAbsencesExport() {
  return useRhListExport({
    apiPath: '/api/sections/gestion-ressources/rh/absences',
    filename: 'absences',
    headers: ['Collaborateur', 'Type', 'Début', 'Fin', 'Statut'],
    mapRow: (item) => [
      cell(item.userName ?? item.collaboratorName) || userLabel(item),
      cell(item.type),
      cell(item.startDate),
      cell(item.endDate),
      cell(item.status),
    ],
  });
}

export function useConformiteExport() {
  return useRhListExport({
    apiPath: '/api/sections/gestion-ressources/rh/conformite',
    filename: 'conformite',
    headers: ['Nom', 'E-mail', 'Statut conformité', 'Échéance'],
    mapRow: (item) => [
      userLabel(item),
      cell(item.email),
      cell(item.complianceStatus ?? item.status),
      cell(item.expiryDate ?? item.validUntil),
    ],
  });
}

export function useInventaireExport() {
  return useRhListExport({
    apiPath: '/api/sections/gestion-ressources/equipements/inventaire',
    filename: 'inventaire-equipements',
    headers: ['Référence', 'Libellé', 'Catégorie', 'Statut', 'Site'],
    mapRow: (item) => [
      cell(item.reference ?? item.sku),
      cell(item.label ?? item.name),
      cell(item.category),
      cell(item.status),
      cell(item.siteName ?? item.location),
    ],
  });
}
