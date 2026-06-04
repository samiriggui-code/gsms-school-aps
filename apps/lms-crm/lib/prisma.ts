import { createPrismaClient } from '@repo/database';

export const prisma = createPrismaClient('lms-crm');

export default prisma;
