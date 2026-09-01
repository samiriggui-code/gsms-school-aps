import type { Session } from 'next-auth';
import type { PrismaClient } from '@repo/database';

export const EVE_TARGET_ENTITY_TYPE = 'eve';

export type EveToolContext = {
  prisma: PrismaClient;
  session: Session;
  userId: string;
};

export type EveOrbState = 'IDLE' | 'THINKING' | 'SPEAKING';
