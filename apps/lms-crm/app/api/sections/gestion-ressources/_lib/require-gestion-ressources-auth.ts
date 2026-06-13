import { CRM_PERMISSION } from '@/lib/auth/crm-permissions';
import { requireCrmApiAuth } from '@/lib/auth/require-permission';

const READ_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/** Lecture — listes, fiches, stats section Gestion administrative. */
export async function requireGestionRessourcesView() {
  return requireCrmApiAuth(CRM_PERMISSION.ressourcesView);
}

/** Écriture — CRUD collaborateurs, absences, équipements, dossier compagnie. */
export async function requireGestionRessourcesEdit() {
  return requireCrmApiAuth(CRM_PERMISSION.ressourcesEdit);
}

/** GET/HEAD → view ; POST/PATCH/PUT/DELETE → edit. */
export async function requireGestionRessourcesForMethod(method: string) {
  return READ_METHODS.has(method.toUpperCase())
    ? requireGestionRessourcesView()
    : requireGestionRessourcesEdit();
}
