import type { DocTypeRegistry } from '@repo/doctype';
import {
  documentRequestDocType,
  documentRequirementTemplateDocType,
  fileAssetDocType,
} from './doctypes';

export function registerDocumentsDocTypes(registry: DocTypeRegistry): void {
  registry.registerDefinition({ definition: fileAssetDocType });
  registry.registerDefinition({ definition: documentRequirementTemplateDocType });
  registry.registerDefinition({ definition: documentRequestDocType });
}
