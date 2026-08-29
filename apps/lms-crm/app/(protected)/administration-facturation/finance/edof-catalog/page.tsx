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
import { buildEdofCatalogXml } from '@/lib/connectors/edof/build-catalog-xml';

/** EDOF — export catalogue LHEO (XML_FILE, upload manuel portail). */
export default async function EdofCatalogPage() {
  const result = await buildEdofCatalogXml(prisma);
  const blocking = result.gaps.filter((g) => g.severity === 'blocking');
  const defaulted = result.gaps.filter((g) => g.severity === 'defaulted');

  return (
    <Container>
      <Toolbar>
        <ToolbarHeading>
          <ToolbarTitle>Export EDOF (catalogue LHEO)</ToolbarTitle>
          <ToolbarDescription>
            Connecteur EDOF_CATALOG — génération XML ISO-8859-1 (XSD LHEO), puis import manuel sur
            le portail EDOF (pas d&apos;API). Formations ACTIVE + cpfEligible uniquement.
          </ToolbarDescription>
        </ToolbarHeading>
        <div className="flex gap-2">
          <Button variant="primary" size="sm" asChild>
            <a href="/api/sections/administration-facturation/finance/edof-catalog?format=xml">
              Télécharger le XML
            </a>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/administration-facturation/finance/financeurs">Financeurs</Link>
          </Button>
        </div>
      </Toolbar>

      <div className="mb-6 grid gap-3 sm:grid-cols-4">
        <div className="rounded-md border p-3">
          <div className="text-2xl font-semibold">{result.formationCount}</div>
          <div className="text-muted-foreground text-sm">Formations exportées</div>
        </div>
        <div className="rounded-md border p-3">
          <div className="text-2xl font-semibold">{result.sessionCount}</div>
          <div className="text-muted-foreground text-sm">Sessions</div>
        </div>
        <div className="rounded-md border p-3">
          <div className="text-2xl font-semibold">{result.skippedFormations}</div>
          <div className="text-muted-foreground text-sm">Exclues (gaps bloquants)</div>
        </div>
        <div className="rounded-md border p-3">
          <div className="text-2xl font-semibold">{blocking.length}</div>
          <div className="text-muted-foreground text-sm">Gaps bloquants</div>
        </div>
      </div>

      <p className="text-muted-foreground mb-4 text-sm">
        Les gaps <strong>defaulted</strong> utilisent des codes LHEO documentés (parcours,
        objectif-général, etc.) faute de champs GSMS — à confirmer métier avant import production.
        Pas de nouveau modèle Prisma.
      </p>

      <h2 className="mb-2 text-sm font-semibold tracking-wide uppercase">
        Gaps bloquants ({blocking.length})
      </h2>
      <div className="mb-8 overflow-x-auto rounded-md border">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/40 border-b">
            <tr>
              <th className="p-2 font-medium">Champ GSMS</th>
              <th className="p-2 font-medium">Chemin LHEO</th>
              <th className="p-2 font-medium">Message</th>
            </tr>
          </thead>
          <tbody>
            {blocking.map((g, i) => (
              <tr key={`b-${i}`} className="border-b last:border-0">
                <td className="p-2 font-mono text-xs">{g.field}</td>
                <td className="p-2 font-mono text-xs">{g.lheoPath}</td>
                <td className="p-2 text-xs">{g.message}</td>
              </tr>
            ))}
            {blocking.length === 0 ? (
              <tr>
                <td className="text-muted-foreground p-4" colSpan={3}>
                  Aucun gap bloquant global — vérifier quand même les défauts ci-dessous.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <h2 className="mb-2 text-sm font-semibold tracking-wide uppercase">
        Défauts LHEO appliqués ({defaulted.length})
      </h2>
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/40 border-b">
            <tr>
              <th className="p-2 font-medium">Formation</th>
              <th className="p-2 font-medium">LHEO</th>
              <th className="p-2 font-medium">Défaut</th>
              <th className="p-2 font-medium">Note</th>
            </tr>
          </thead>
          <tbody>
            {defaulted.slice(0, 80).map((g, i) => (
              <tr key={`d-${i}`} className="border-b last:border-0">
                <td className="p-2 text-xs">{g.formationSlug ?? '—'}</td>
                <td className="p-2 font-mono text-xs">{g.lheoPath}</td>
                <td className="p-2 font-mono text-xs">{g.defaultUsed ?? '—'}</td>
                <td className="p-2 text-xs">{g.message}</td>
              </tr>
            ))}
            {defaulted.length > 80 ? (
              <tr>
                <td className="text-muted-foreground p-2 text-xs" colSpan={4}>
                  … {defaulted.length - 80} autres (voir API ?format=json)
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <p className="text-muted-foreground mt-4 text-xs">
        API :{' '}
        <code className="font-mono">
          GET /api/sections/administration-facturation/finance/edof-catalog?format=xml|json
        </code>
      </p>
    </Container>
  );
}
