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
import { prisma } from '@/lib/prisma';
import { CreateFundingCaseForm } from './create-funding-case-form';
import { EdofDossierChecklistPanel } from './edof-dossier-checklist-panel';
import { FundingCaseDocumentsPanel } from './funding-case-documents-panel';
import { FundingCaseAgentPanel } from './funding-case-agent-panel';
import { FundingCaseTransitionActions } from './funding-case-transition-actions';
import { OpcoDossierChecklistPanel } from './opco-dossier-checklist-panel';
import { FtKairosChecklistPanel } from './ft-kairos-checklist-panel';
import {
  canCancelFundingCase,
  nextFundingCaseStatus,
} from '@/lib/funding/funding-case-transitions';
import { syncFundingProvidersFromConnectors } from '@/lib/funding/sync-providers-from-matrix';

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
  const candidates = [
    path.join(process.cwd(), '../../docs/regulatory-sources/connector-matrix/connector-capabilities.json'),
    path.join(process.cwd(), 'docs/regulatory-sources/connector-matrix/connector-capabilities.json'),
  ];
  for (const file of candidates) {
    try {
      const raw = await readFile(file, 'utf8');
      return JSON.parse(raw) as CapabilitiesFile;
    } catch {
      /* next */
    }
  }
  return { connectors: [] };
}

/** G5 — registre FundingProvider Prisma + matrice connecteurs (référence). */
export default async function FinanceursPage() {
  const data = await loadConnectors();
  const matrixRows = data.connectors ?? [];

  if ((await prisma.fundingProvider.count()) === 0 && matrixRows.length > 0) {
    await syncFundingProvidersFromConnectors(prisma, matrixRows);
  }

  const providers = await prisma.fundingProvider.findMany({
    orderBy: { label: 'asc' },
    include: { _count: { select: { cases: true } } },
  });
  const caseCount = await prisma.fundingCase.count();
  const recentCases = await prisma.fundingCase.findMany({
    orderBy: { updatedAt: 'desc' },
    take: 25,
    include: { provider: { select: { code: true, label: true } } },
  });
  const activeProviders = providers.filter((p) => p.isActive).length;

  return (
    <Container>
      <Toolbar>
        <ToolbarHeading>
          <ToolbarTitle>Financeurs</ToolbarTitle>
          <ToolbarDescription>
            Registre Prisma FundingProvider / FundingCase (G5). Matrice connecteurs en référence
            (dernière vérif : {data.last_verified_at ?? 'n/a'}).
          </ToolbarDescription>
        </ToolbarHeading>
        <Button variant="outline" size="sm" asChild>
          <Link href="/administration-facturation/finance">Retour finance</Link>
        </Button>
      </Toolbar>

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-md border p-3">
          <div className="text-2xl font-semibold">{providers.length}</div>
          <div className="text-muted-foreground text-sm">Financeurs en base</div>
        </div>
        <div className="rounded-md border p-3">
          <div className="text-2xl font-semibold">{activeProviders}</div>
          <div className="text-muted-foreground text-sm">Actifs</div>
        </div>
        <div className="rounded-md border p-3">
          <div className="text-2xl font-semibold">{caseCount}</div>
          <div className="text-muted-foreground text-sm">Dossiers FundingCase</div>
        </div>
      </div>

      <h2 className="mb-2 text-sm font-semibold tracking-wide uppercase">Registre FundingProvider</h2>
      <div className="mb-8 overflow-x-auto rounded-md border">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/40 border-b">
            <tr>
              <th className="p-2 font-medium">Code</th>
              <th className="p-2 font-medium">Libellé</th>
              <th className="p-2 font-medium">Type</th>
              <th className="p-2 font-medium">Transport</th>
              <th className="p-2 font-medium">Actif</th>
              <th className="p-2 font-medium">Dossiers</th>
            </tr>
          </thead>
          <tbody>
            {providers.map((p) => (
              <tr key={p.id} className="border-b last:border-0">
                <td className="p-2 font-mono text-xs">{p.code}</td>
                <td className="p-2">{p.label}</td>
                <td className="p-2 text-xs">{p.funderType}</td>
                <td className="p-2 text-xs">{p.transport}</td>
                <td className="p-2">{p.isActive ? 'oui' : 'non'}</td>
                <td className="p-2">{p._count.cases}</td>
              </tr>
            ))}
            {providers.length === 0 ? (
              <tr>
                <td className="text-muted-foreground p-4" colSpan={6}>
                  Aucun financeur en base — lancer POST /api/sections/…/financeurs pour sync matrix.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <h2 className="mb-2 text-sm font-semibold tracking-wide uppercase">
        Dossiers FundingCase (récents)
      </h2>
      <CreateFundingCaseForm
        providers={providers.map((p) => ({ id: p.id, code: p.code, label: p.label }))}
      />
      <div className="mb-8 overflow-x-auto rounded-md border">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/40 border-b">
            <tr>
              <th className="p-2 font-medium">Réf.</th>
              <th className="p-2 font-medium">Financeur</th>
              <th className="p-2 font-medium">Statut</th>
              <th className="p-2 font-medium">Transport</th>
              <th className="p-2 font-medium">Montant demandé</th>
              <th className="p-2 font-medium">Maj</th>
              <th className="p-2 font-medium">Transition</th>
            </tr>
          </thead>
          <tbody>
            {recentCases.map((c) => (
              <tr key={c.id} className="border-b last:border-0">
                <td className="p-2 font-mono text-xs">{c.reference ?? c.id.slice(0, 8)}</td>
                <td className="p-2 text-xs">
                  {c.provider.label}
                  <span className="text-muted-foreground ml-1">({c.provider.code})</span>
                </td>
                <td className="p-2 text-xs">{c.status}</td>
                <td className="p-2 text-xs">{c.transport}</td>
                <td className="p-2 text-xs">
                  {c.requestedAmount != null ? String(c.requestedAmount) : '—'}
                </td>
                <td className="text-muted-foreground p-2 text-xs">
                  {c.updatedAt.toISOString().slice(0, 10)}
                </td>
                <td className="p-2">
                  <FundingCaseTransitionActions
                    caseId={c.id}
                    nextStatus={nextFundingCaseStatus(c.status)}
                    canCancel={canCancelFundingCase(c.status)}
                  />
                </td>
              </tr>
            ))}
            {recentCases.length === 0 ? (
              <tr>
                <td className="text-muted-foreground p-4" colSpan={7}>
                  Aucun dossier FundingCase — création via Resource API / flux métier à venir.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <FundingCaseDocumentsPanel
        cases={recentCases.map((c) => ({
          id: c.id,
          reference: c.reference,
          status: c.status,
          providerLabel: c.provider.label,
        }))}
      />

      <FundingCaseAgentPanel
        cases={recentCases.map((c) => ({
          id: c.id,
          reference: c.reference,
          status: c.status,
          providerLabel: c.provider.label,
        }))}
      />

      <EdofDossierChecklistPanel
        cases={recentCases.map((c) => ({
          id: c.id,
          reference: c.reference,
          status: c.status,
          funderType: c.funderType,
          providerLabel: c.provider.label,
        }))}
      />

      <OpcoDossierChecklistPanel
        cases={recentCases.map((c) => ({
          id: c.id,
          reference: c.reference,
          status: c.status,
          funderType: c.funderType,
          providerCode: c.provider.code,
          providerLabel: c.provider.label,
        }))}
      />

      <FtKairosChecklistPanel
        cases={recentCases.map((c) => ({
          id: c.id,
          reference: c.reference,
          status: c.status,
          funderType: c.funderType,
          providerLabel: c.provider.label,
        }))}
      />

      <h2 className="mb-2 text-sm font-semibold tracking-wide uppercase">
        Matrice connecteurs (référence)
      </h2>
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
            {matrixRows.map((r) => (
              <tr key={r.connector_id} className="border-b last:border-0">
                <td className="p-2 font-mono text-xs">{r.connector_id}</td>
                <td className="p-2">{r.funder}</td>
                <td className="text-muted-foreground p-2">{r.scope}</td>
                <td className="p-2 text-xs">{(r.transport ?? []).join(', ')}</td>
                <td className="p-2">{r.api_available ? 'oui' : 'non'}</td>
                <td className="p-2">{r.verified ? 'oui' : 'non'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Container>
  );
}
