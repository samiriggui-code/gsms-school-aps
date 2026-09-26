import { QualiopiPageBrief } from '@/components/crm/qualiopi-page-brief';
import { buildRegistryBriefForPath } from '@/lib/of/qualiopi-registry-brief';

/** RSC — charge le Registry V9 (fs) et nourrit le brief client. */
export function QualiopiPageBriefServer({
  path,
  compact = false,
}: {
  path: string;
  compact?: boolean;
}) {
  const registryIndicators = buildRegistryBriefForPath(path);
  return (
    <QualiopiPageBrief path={path} registryIndicators={registryIndicators} compact={compact} />
  );
}
