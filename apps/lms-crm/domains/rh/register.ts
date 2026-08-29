import type { DocTypeRegistry } from '@repo/doctype';
import { leaveRequestDocType } from './leave-request.doctype';

export function registerRhDocTypes(registry: DocTypeRegistry): void {
  registry.registerDefinition({ definition: leaveRequestDocType });
}
