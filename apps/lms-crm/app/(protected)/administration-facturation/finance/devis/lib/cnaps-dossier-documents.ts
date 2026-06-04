import { apiFetch } from '@/lib/api';

export const CNAPS_DOSSIER_SLOTS = [
  {
    category: 'CNAPS_FORM_OF',
    title: 'Formulaire CNAPS complété',
    description:
      'Version officielle dûment remplie par le candidat et visée par votre organisme avant envoi au CNAPS.',
  },
  {
    category: 'CNAPS_IDENTITY',
    title: 'Pièce d’identité',
    description: 'Document en cours de validité, conformément à la notice CNAPS.',
  },
  {
    category: 'CNAPS_JUSTIFICATIFS',
    title: 'Justificatifs administratifs',
    description: 'Bulletin ou autorisations requis dans le dossier (selon votre délégation / notice).',
  },
  {
    category: 'CNAPS_DIVERS',
    title: 'Autres pièces',
    description: 'Photographie, titre de séjour, ou pièces complémentaires.',
  },
] as const;

export type RhDocRow = {
  id: string;
  type: string;
  number: string;
  fileUrl?: string;
};

export async function fetchUserRhDocuments(userId: string): Promise<RhDocRow[]> {
  const res = await apiFetch(`/api/sections/gestion-ressources/rh/documents?userId=${encodeURIComponent(userId)}`);
  const json = (await res.json()) as { success?: boolean; data?: RhDocRow[] };
  if (!res.ok) return [];
  return Array.isArray(json.data) ? json.data : [];
}

export function hasRhDocForCategory(uploads: RhDocRow[], cat: string): boolean {
  return uploads.some((d) => (d.type || '').toUpperCase().startsWith(cat.toUpperCase()));
}

/** Toutes les catégories pièces du volet dépôt CNAPS ont au moins un document associé. */
export function isCnapsDossierStructurallyComplete(uploads: RhDocRow[]): boolean {
  return CNAPS_DOSSIER_SLOTS.every((slot) => hasRhDocForCategory(uploads, slot.category));
}
