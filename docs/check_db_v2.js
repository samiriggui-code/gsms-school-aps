const { PrismaClient } = require('./packages/database/generated/client');
const prisma = new PrismaClient();
async function run() {
  try {
    console.log('Models:', Object.keys(prisma).filter(k => !k.startsWith('_') && !k.startsWith('$')));
    const eq = await prisma.equipment.findMany({
      take: 5,
      include: { assignedSite: true }
    });
    console.log('EQUIPMENT:', JSON.stringify(eq, null, 2));
  } catch (e) {
    console.error('ERROR:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}
run();
