import type { DocTypeRegistry } from '@repo/doctype';
import { financeDevisDocType, leadDocType } from './doctypes';

export function registerCrmDocTypes(registry: DocTypeRegistry): void {
  registry.registerDefinition({ definition: leadDocType });
  registry.registerDefinition({ definition: financeDevisDocType });
}
