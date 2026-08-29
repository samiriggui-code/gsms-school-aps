import type { FundingFunderType, FundingTransport, PrismaClient } from '@repo/database';

type ConnectorRow = {
  connector_id: string;
  funder: string;
  transport?: string[];
  api_available?: boolean;
};

function mapFunderType(connectorId: string, funder: string): FundingFunderType {
  const id = connectorId.toUpperCase();
  const label = funder.toUpperCase();
  if (id.includes('EDOF') || label.includes('CPF')) return 'CPF';
  if (id.includes('FRANCE_TRAVAIL') || label.includes('FRANCE TRAVAIL')) return 'FRANCE_TRAVAIL';
  if (label.includes('AGEFIPH')) return 'AGEFIPH';
  if (label.includes('REGION') || label.includes('RÉGION')) return 'REGION';
  if (label.includes('TRANSITIONS')) return 'TRANSITIONS_PRO';
  if (id.includes('OPCO') || label.includes('OPCO')) return 'OPCO';
  if (label.includes('ENTREPRISE')) return 'ENTREPRISE';
  return 'OTHER';
}

function mapTransport(row: ConnectorRow): FundingTransport {
  const transports = (row.transport ?? []).map((t) => t.toUpperCase());
  if (row.api_available && transports.some((t) => t.includes('API'))) return 'VERIFIED_API';
  if (transports.some((t) => t.includes('API'))) return 'PARTIAL_API';
  if (transports.some((t) => t.includes('INTERNAL'))) return 'INTERNAL';
  return 'MANUAL_PORTAL';
}

/** Upsert FundingProvider rows from connector-capabilities.json connectors. */
export async function syncFundingProvidersFromConnectors(
  prisma: PrismaClient,
  connectors: ConnectorRow[],
): Promise<{ upserted: number }> {
  let upserted = 0;
  for (const row of connectors) {
    if (!row.connector_id) continue;
    await prisma.fundingProvider.upsert({
      where: { code: row.connector_id },
      create: {
        code: row.connector_id,
        label: row.funder || row.connector_id,
        funderType: mapFunderType(row.connector_id, row.funder ?? ''),
        transport: mapTransport(row),
        isActive: true,
        metadata: { source: 'connector-capabilities.json' },
      },
      update: {
        label: row.funder || row.connector_id,
        funderType: mapFunderType(row.connector_id, row.funder ?? ''),
        transport: mapTransport(row),
        metadata: { source: 'connector-capabilities.json' },
      },
    });
    upserted += 1;
  }
  return { upserted };
}
