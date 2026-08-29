import type { DocTypeRegistry } from '@repo/doctype';
import { systemLogDocType } from './doctypes';

export function registerAuditDocTypes(registry: DocTypeRegistry): void {
  registry.registerDefinition({ definition: systemLogDocType });
}
