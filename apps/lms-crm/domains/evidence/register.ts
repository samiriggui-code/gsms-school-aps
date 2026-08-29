import type { DocTypeRegistry } from '@repo/doctype';
import { evidenceDocType, evidenceIndicatorLinkDocType } from './doctypes';

export function registerEvidenceDocTypes(registry: DocTypeRegistry): void {
  registry.registerDefinition({ definition: evidenceDocType });
  registry.registerDefinition({ definition: evidenceIndicatorLinkDocType });
}
