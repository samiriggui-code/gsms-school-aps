import { readFile } from 'node:fs/promises';
import path from 'node:path';
import Link from 'next/link';
import { Container } from '@/components/common/container';
import {
  Toolbar,
  ToolbarDescription,
  ToolbarHeading,
  ToolbarTitle,
} from '@/components/common/toolbar';
import { Button } from '@/components/ui/button';

type ConnectorRow = {
  connector_id: string;
  funder: string;
  scope: string;
  api_available: boolean;
  transport: string[];
  verified: boolean;
};

type CapabilitiesFile = {
  last_verified_at?: string;
  connectors: ConnectorRow[];
};

async function loadConnectors(): Promise<CapabilitiesFile> {
  const file = path.join(
    process.cwd(),
    '../../docs/regulatory-sources/connector-matrix/connector-capabilities.json',
  );
  try {
    const raw = await readFile(file, 'utf8');
    return JSON.parse(raw) as CapabilitiesFile;
  } catch {
    const alt = path.join(
      process.cwd(),
      'docs/regulatory-sources/connector-matrix/connector-capabilities.json',
    );
    try {
      const raw = await readFile(alt, 'utf8');
      return JSON.parse(raw) as CapabilitiesFile;
    } catch {
      return { connectors: [] };
    }
  }
}

/** CH-SAFE : lecture matrix connecteurs existante — pas encore FundingCase Prisma. */
export default async function FinanceursPage() {
  const data = await loadConnectors();
  const rows = data.connectors ?? [];
  const verified = rows.filter((r) => r.verified).length;
  const withApi = rows.filter((r) => r.api_available).length;

  return (
    <Container>
      <Toolbar>
        <ToolbarHeading>
          <ToolbarTitle>Financeurs</ToolbarTitle>
          <ToolbarDescription>
            Matrice connecteurs (sources réglementaires) — registre FundingCase Prisma
            en attente du gate post G1-E. Dernière vérif matrix :{' '}
            {data.last_verified_at ?? 'n/a'}.
          </ToolbarDescription>
        </ToolbarHeading>
        <Button variant="outline" size="sm" asChild>
          <Link href="/administration-facturation/finance">Retour finance</Link>
        </Button>
      </Toolbar>

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-md border p-3">
          <div className="text-2xl font-semibold">{rows.length}</div>
          <div className="text-muted-foreground text-sm">Connecteurs listés</div>
        </div>
        <div className="rounded-md border p-3">
          <div className="text-2xl font-semibold">{verified}</div>
          <div className="text-muted-foreground text-sm">Sources vérifiées</div>
        </div>
        <div className="rounded-md border p-3">
          <div className="text-2xl font-semibold">{withApi}</div>
          <div className="text-muted-foreground text-sm">API déclarée disponible</div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/40 border-b">
            <tr>
              <th className="p-2 font-medium">ID</th>
              <th className="p-2 font-medium">Financeur</th>
              <th className="p-2 font-medium">Périmètre</th>
              <th className="p-2 font-medium">Transport</th>
              <th className="p-2 font-medium">API</th>
              <th className="p-2 font-medium">Vérifié</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.connector_id} className="border-b last:border-0">
                <td className="p-2 font-mono text-xs">{r.connector_id}</td>
                <td className="p-2">{r.funder}</td>
                <td className="text-muted-foreground p-2">{r.scope}</td>
                <td className="p-2 text-xs">{(r.transport ?? []).join(', ')}</td>
                <td className="p-2">{r.api_available ? 'oui' : 'non'}</td>
                <td className="p-2">{r.verified ? 'oui' : 'non'}</td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td className="text-muted-foreground p-4" colSpan={6}>
                  Impossible de charger docs/regulatory-sources/connector-matrix/…
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </Container>
  );
}
