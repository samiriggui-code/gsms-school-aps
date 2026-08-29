/**
 * Dual-run cutover flag (Vague 1 Phase B–D).
 * Default OFF — legacy ENTITY_REGISTRY + /api/entities engine remain live.
 * Set DOCTYPE_V2_RUNTIME=1 to route entities shim + protectRoute via @repo/doctype.
 */
export function isDocTypeV2Runtime(): boolean {
  const raw = process.env.DOCTYPE_V2_RUNTIME;
  return raw === '1' || raw === 'true' || raw === 'TRUE';
}
