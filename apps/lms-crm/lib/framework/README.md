/**
 * Framework maison GSMS — pont vers DOCTYPE V2 (Frappe-like).
 *
 * SOURCE DE VÉRITÉ PRODUIT :
 *   docs/GSMS SCHOOL — FRAMEWORK DOCTYPE V2.md
 *   docs/framework/MIGRATION_PLAN.md
 *
 * État actuel = EntityDefinition + /api/entities (socle partiel, drift LMS/Qualiopi documenté).
 * NE PAS ajouter d’entités LMS ici avant Phase 18.
 * NE PAS faire importer le registry par des domaines ; les domaines s’enregistrent auprès du core (cible V2).
 *
 * Fail-closed : entity-registry + protectRoute. Pas de DEFAULT_OPEN. Pas de copie AGPL Frappe.
 */
export {};
