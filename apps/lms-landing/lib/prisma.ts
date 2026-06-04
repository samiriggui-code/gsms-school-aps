import { createPrismaClient } from '@repo/database';

export const prisma = createPrismaClient('lms-landing');

export default prisma;
