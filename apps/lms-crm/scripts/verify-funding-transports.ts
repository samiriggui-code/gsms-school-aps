import { prisma } from '../lib/prisma';

async function main() {
  const rows = await prisma.fundingProvider.findMany({
    where: {
      code: {
        in: ['FRANCE_TRAVAIL_API_KAIROS', 'OPCO_API_CONVERGENCE_APPRENTISSAGE', 'EDOF_DOSSIER'],
      },
    },
    select: { code: true, transport: true },
  });
  console.log(JSON.stringify(rows, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
