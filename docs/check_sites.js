const { PrismaClient } = require('./packages/database/generated/client');
const prisma = new PrismaClient();
async function run() {
  try {
    const eq = await prisma.equipment.findMany({
      include: { assignedSite: true }
    });
    console.log('EQUIPMENT WITH SITES:', JSON.stringify(eq.map(e => ({
      id: e.id,
      label: e.label,
      sn: e.serialNumber,
      site: e.assignedSite ? e.assignedSite.name : 'NULL'
    })), null, 2));
  } catch (e) {
    console.error('ERROR:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}
run();
