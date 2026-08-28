/**
 * Framework maison GSMS (DocType-like) — socle posé 2026-08-24.
 *
 * Une entité = une déclaration dans `lib/framework/registry.ts`.
 * API générique : `/api/entities/[entity]` (+ `/[id]`, `/schema`).
 * UI : `<EntityForm>` / `<EntityTable>`.
 * Permissions fail-closed : `lib/auth/entity-registry.ts` + `protectRoute()`.
 *
 * Lab UI : `/securite-configuration/framework-lab`
 *
 * Protocole de bascule : voir skill agent (inventaire → parité → redirect → test → delete route).
 * Ne jamais contourner le fail-closed (pas de DEFAULT_OPEN).
 */
export {};
