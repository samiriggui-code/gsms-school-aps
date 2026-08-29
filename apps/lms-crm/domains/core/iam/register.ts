import type { DocTypeRegistry } from '@repo/doctype';
import { roleDocType, userDocType } from './doctypes';
import { roleListController, userListController } from './controllers';

export function registerCoreIamDocTypes(registry: DocTypeRegistry): void {
  registry.registerDefinition({ definition: userDocType, controller: userListController });
  registry.registerDefinition({ definition: roleDocType, controller: roleListController });
}
