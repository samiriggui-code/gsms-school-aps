import { apiFetch } from '@/lib/api';

export type CnapsDossierSlotDef = {
  category: string;
  title: string;
  description: string;
  /** Déposé par le candidat ou par l’école (formulaire visé / autorisation). */
  uploadBy?: 'candidate' | 'school';
  /** Mise en avant dans l’espace candidat. */
  highlight?: boolean;
};

export const CNAPS_DOSSIER_SLOTS: CnapsDossierSlotDef[] = [
  {
    category: 'CNAPS_FORM_OF',
    title: 'Formulaire CNAPS signé et cacheté',
    description:
      'Formulaire officiel complété, signé par le candidat et visé par l’organisme de formation avant envoi au CNAPS.',
    uploadBy: 'school',
    highlight: true,
  },
  {
    category: 'CNAPS_IDENTITY',
    title: 'Pièce d’identité',
    description: 'Document en cours de validité, conformément à la notice CNAPS.',
    uploadBy: 'candidate',
  },
  {
    category: 'CNAPS_JUSTIFICATIFS',
    title: 'Justificatifs administratifs',
    description: 'Bulletin ou autorisations requis dans le dossier (selon votre délégation / notice).',
    uploadBy: 'candidate',
  },
  {
    category: 'CNAPS_DIVERS',
    title: 'Autres pièces',
    description: 'Photographie, titre de séjour, ou pièces complémentaires.',
    uploadBy: 'candidate',
  },
  {
    category: 'CNAPS_AUTHORIZATION',
    title: 'Autorisation CNAPS délivrée',
    description:
      'Document officiel après décision favorable — disponible au téléchargement une fois validé par l’école.',
    uploadBy: 'school',
    highlight: true,
  },
];

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
