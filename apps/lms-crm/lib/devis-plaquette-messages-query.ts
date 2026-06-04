import { prisma } from '@/lib/prisma';

export type PlaquetteMessageDbRow = {
  id: string;
  authorKind: string;
  body: string;
  authorLabel: string | null;
  createdAt: Date;
};

/**
 * Messages plaquette sans `include` sur FinanceDevis (évite erreur « Unknown field plaquetteMessages »
 * si le client Prisma en mémoire est obsolète). Retourne [] si delegate / table indisponible.
 */
export async function listPlaquetteMessagesForDevis(
  devisId: string,
  opts?: { order?: 'asc' | 'desc'; take?: number },
): Promise<PlaquetteMessageDbRow[]> {
  const order = opts?.order ?? 'asc';
  const take = opts?.take ?? 200;
  try {
    const delegate = (
      prisma as unknown as {
        financeDevisPlaquetteMessage?: {
          findMany: (args: {
            where: { devisId: string };
            orderBy: { createdAt: 'asc' | 'desc' };
            take: number;
            select: Record<string, boolean>;
          }) => Promise<PlaquetteMessageDbRow[]>;
        };
      }
    ).financeDevisPlaquetteMessage;
    if (!delegate?.findMany) return [];
    return await delegate.findMany({
      where: { devisId },
      orderBy: { createdAt: order },
      take,
      select: { id: true, authorKind: true, body: true, authorLabel: true, createdAt: true },
    });
  } catch {
    return [];
  }
}

export type PlaquetteMessageCreateInput = {
  devisId: string;
  authorKind: string;
  body: string;
  authorLabel: string | null;
};

/** Création si le delegate Prisma existe (après `prisma generate` + migration). Sinon `null`. */
export async function createPlaquetteMessageRow(
  data: PlaquetteMessageCreateInput,
): Promise<PlaquetteMessageDbRow | null> {
  try {
    const delegate = (
      prisma as unknown as {
        financeDevisPlaquetteMessage?: {
          create: (args: {
            data: PlaquetteMessageCreateInput;
            select: Record<string, boolean>;
          }) => Promise<PlaquetteMessageDbRow>;
        };
      }
    ).financeDevisPlaquetteMessage;
    if (!delegate?.create) return null;
    return await delegate.create({
      data,
      select: { id: true, authorKind: true, body: true, authorLabel: true, createdAt: true },
    });
  } catch {
    return null;
  }
}
