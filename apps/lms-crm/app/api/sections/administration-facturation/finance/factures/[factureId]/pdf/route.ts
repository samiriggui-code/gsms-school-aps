import { NextRequest } from 'next/server';
import { GET as getDevisPrintableHtml } from '../../../devis/[devisId]/pdf/route';

/** Aperçu imprimable HTML — même rendu que le module Devis, identifiant exposé côté « Facturation ». */

type Ctx = { params: Promise<{ factureId: string }> };

export async function GET(request: NextRequest, context: Ctx) {
  const { factureId } = await context.params;
  return getDevisPrintableHtml(request, { params: Promise.resolve({ devisId: factureId }) });
}
