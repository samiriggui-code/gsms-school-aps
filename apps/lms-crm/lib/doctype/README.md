/**
 * DocType V2 — app adapters (Vague 1).
 * Package: @repo/doctype
 * Bootstrap: non-fatal (`lib/doctype/bootstrap.ts`)
 * Flag: `DOCTYPE_V2_RUNTIME=1` → entities shim + protectRoute via PermissionEngine
 * Default flag OFF → legacy `lib/framework` + ENTITY_REGISTRY
 * APIs: `/api/meta`, `/api/resource` (always V2), `/api/entities` (shim when flag on)
 * No FundingCase until G1-E. No tenant_id.
 */
export {};
