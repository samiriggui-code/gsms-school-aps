import { CrmWiredLeaf } from '@/components/crm/crm-wired-leaf';
import { QualiopiDevStubBody } from '@/components/crm/qualiopi-page-brief';
import { getQualiopiPageEntry } from '@/lib/of/qualiopi-page-referential';
import { buildRegistryBriefForPath } from '@/lib/of/qualiopi-registry-brief';

/**
 * Stub Qualiopi — page vide + résumé indicateurs / preuves / liens + Registry V9.
 * Breadcrumbs = header layout (MENU_SIDEBAR).
 */
export function QualiopiDevStubPage({
  path,
  level = 'leaf',
}: {
  path: string;
  level?: 'section' | 'module' | 'leaf';
}) {
  const entry = getQualiopiPageEntry(path);
  const registryIndicators = buildRegistryBriefForPath(path);
  return (
    <CrmWiredLeaf path={path} level={level}>
      {entry?.title ? (
        <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {entry.title}
        </p>
      ) : null}
      <QualiopiDevStubBody path={path} registryIndicators={registryIndicators} />
    </CrmWiredLeaf>
  );
}
