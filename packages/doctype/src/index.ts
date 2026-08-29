export * from './types';
export { compileDocMeta } from './meta/compile-doc-meta';
export { DocTypeRegistry, type DocTypeRegistration, type DocController } from './registry/doc-type-registry';
export {
  hasPermission,
  checkPermission,
  effectivePermissions,
  buildMetaResponse,
} from './permissions/permission-engine';
export type { PersistenceAdapter, PersistenceListQuery, PersistenceGetQuery, PersistenceWriteQuery, PersistenceOrderBy } from './persistence/adapter';
export { allocateName, pickWritableFields, validateRequired } from './naming/naming-engine';
export {
  Document,
  type DocControllerHooks,
  type DocLifecycleContext,
  type DocListQueryContext,
  type DocListQueryOverride,
  type DocumentOptions,
} from './document/document';
export {
  ResourceService,
  type ResourceListParams,
  type ResourceListResult,
  type ResourceServiceOptions,
} from './document/resource-service';
