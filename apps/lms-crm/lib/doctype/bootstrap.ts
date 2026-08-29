import { DocTypeRegistry } from '@repo/doctype';
import { registerCoreIamDocTypes } from '@/domains/core/iam/register';
import { registerRhDocTypes } from '@/domains/rh/register';
import { registerLmsDocTypes } from '@/domains/lms/register';
import { registerQualiopiDocTypes } from '@/domains/qualiopi/register';
import { registerCrmDocTypes } from '@/domains/crm/register';
import { registerTrainingDocTypes } from '@/domains/training/register';
import { registerFundingDocTypes } from '@/domains/funding/register';

declare global {
  // eslint-disable-next-line no-var
  var __gsmsDocTypeRegistry: DocTypeRegistry | undefined;
  // eslint-disable-next-line no-var
  var __gsmsDocTypeBootstrap: 'idle' | 'ready' | 'failed' | undefined;
  // eslint-disable-next-line no-var
  var __gsmsDocTypeBootstrapError: string | undefined;
}

function createRegistry(): DocTypeRegistry {
  return new DocTypeRegistry({
    allowHotReload: process.env.NODE_ENV !== 'production',
  });
}

export function getDocTypeRegistry(): DocTypeRegistry {
  if (!globalThis.__gsmsDocTypeRegistry) {
    globalThis.__gsmsDocTypeRegistry = createRegistry();
  }
  return globalThis.__gsmsDocTypeRegistry;
}

export type DocTypeBootstrapStatus = 'idle' | 'ready' | 'failed';

export function getDocTypeBootstrapStatus(): DocTypeBootstrapStatus {
  return globalThis.__gsmsDocTypeBootstrap ?? 'idle';
}

export function getDocTypeBootstrapError(): string | undefined {
  return globalThis.__gsmsDocTypeBootstrapError;
}

/**
 * Non-fatal: failure isolates DocType routes (503), does not crash Next.js.
 */
export function bootstrapDocTypes(): DocTypeRegistry {
  if (globalThis.__gsmsDocTypeBootstrap === 'ready' && globalThis.__gsmsDocTypeRegistry?.isSealed) {
    return globalThis.__gsmsDocTypeRegistry;
  }

  try {
    const registry = getDocTypeRegistry();
    registerCoreIamDocTypes(registry);
    registerCrmDocTypes(registry);
    registerTrainingDocTypes(registry);
    registerRhDocTypes(registry);
    registerLmsDocTypes(registry);
    registerQualiopiDocTypes(registry);
    registerFundingDocTypes(registry);
    registry.assertValid();
    registry.seal();
    globalThis.__gsmsDocTypeBootstrap = 'ready';
    globalThis.__gsmsDocTypeBootstrapError = undefined;
    return registry;
  } catch (err) {
    globalThis.__gsmsDocTypeBootstrap = 'failed';
    globalThis.__gsmsDocTypeBootstrapError =
      err instanceof Error ? err.message : 'DocType bootstrap failed';
    console.error('[doctype] bootstrap FAILED — scoped routes will 503', err);
    return getDocTypeRegistry();
  }
}

export function ensureDocTypeBootstrap(): DocTypeRegistry {
  const status = getDocTypeBootstrapStatus();
  if (status === 'ready') return getDocTypeRegistry();
  if (status === 'failed') return getDocTypeRegistry();
  return bootstrapDocTypes();
}
