import type { DocTypeRegistry } from '@repo/doctype';
import { roleDocType, userDocType } from './doctypes';

export function registerCoreIamDocTypes(registry: DocTypeRegistry): void {
  registry.registerDefinition({ definition: roleDocType });
  registry.registerDefinition({ definition: userDocType });
}
