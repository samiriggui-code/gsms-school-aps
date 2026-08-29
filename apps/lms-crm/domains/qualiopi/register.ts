import type { DocTypeRegistry } from '@repo/doctype';
import { complianceDossierItemDocType } from './compliance-dossier-item.doctype';

export function registerQualiopiDocTypes(registry: DocTypeRegistry): void {
  registry.registerDefinition({ definition: complianceDossierItemDocType });
}
