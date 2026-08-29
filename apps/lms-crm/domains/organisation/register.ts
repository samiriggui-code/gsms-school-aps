import type { DocTypeRegistry } from '@repo/doctype';
import { subcontractorRecordDocType } from './doctypes';

export function registerOrganisationDocTypes(registry: DocTypeRegistry): void {
  registry.registerDefinition({ definition: subcontractorRecordDocType });
}
