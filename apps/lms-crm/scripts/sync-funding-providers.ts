import { readFile } from 'node:fs/promises';
import { prisma } from '../lib/prisma';
import { syncFundingProvidersFromConnectors } from '../lib/funding/sync-providers-from-matrix';

async function main() {
  const raw = await readFile(
    '../../docs/regulatory-sources/connector-matrix/connector-capabilities.json',
    'utf8',
  );
  const data = JSON.parse(raw) as {
    connectors: Array<{
      connector_id: string;
      funder: string;
      transport?: string[];
      api_available?: boolean;
    }>;
  };
  const result = await syncFundingProvidersFromConnectors(prisma, data.connectors);
  const n = await prisma.fundingProvider.count();
  const c = await prisma.fundingCase.count();
  console.log(JSON.stringify({ result, providers: n, cases: c }));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
