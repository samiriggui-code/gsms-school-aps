import { NextRequest } from 'next/server';
import {
  requireGestionRessourcesEdit,
  requireGestionRessourcesForMethod,
  requireGestionRessourcesView,
} from '../../../_lib/require-gestion-ressources-auth';
import { fail } from '@/app/api/_shared/http/response';
import { patchRhCandidature } from '../../../_lib/rh-candidatures-handlers';

type Params = { params: Promise<{ candidatureId: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  const auth = await requireGestionRessourcesEdit();
  if (!auth.ok) return auth.response;
  const { candidatureId } = await params;
  return patchRhCandidature(candidatureId, request);
}
