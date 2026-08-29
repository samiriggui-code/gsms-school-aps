import type { DocTypeRegistry } from '@repo/doctype';
import { financeDevisDocType, leadDocType } from './doctypes';
import { candidatureDocType } from './candidature.doctype';

export function registerCrmDocTypes(registry: DocTypeRegistry): void {
  registry.registerDefinition({ definition: leadDocType });
  registry.registerDefinition({ definition: financeDevisDocType });
  registry.registerDefinition({ definition: candidatureDocType });
}
