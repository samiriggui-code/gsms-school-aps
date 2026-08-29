import { ResourceService } from '@repo/doctype';
import { ensureDocTypeBootstrap } from '@/lib/doctype/bootstrap';
import { getPrismaPersistenceAdapter } from '@/lib/doctype/persistence';

let service: ResourceService | undefined;

export function getResourceService(): ResourceService {
  if (!service) {
    service = new ResourceService({
      registry: ensureDocTypeBootstrap(),
      adapter: getPrismaPersistenceAdapter(),
    });
  }
  return service;
}

export function listParamsFromSearchParams(searchParams: URLSearchParams) {
  const filters: Record<string, string> = {};
  for (const [key, value] of searchParams.entries()) {
    if (['page', 'limit', 'query', 'sort', 'dir', 'trashed'].includes(key)) continue;
    filters[key] = value;
  }
  return {
    page: Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1),
    limit: Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '25', 10) || 25)),
    query: searchParams.get('query') || undefined,
    sort: searchParams.get('sort') || undefined,
    dir: (searchParams.get('dir') === 'desc' ? 'desc' : 'asc') as 'asc' | 'desc',
    trashed: searchParams.get('trashed') === '1',
    filters,
  };
}
