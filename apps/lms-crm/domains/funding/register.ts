import type { DocTypeRegistry } from '@repo/doctype';
import {
  fundingCaseDocType,
  fundingDocumentDocType,
  fundingProviderDocType,
} from './doctypes';

export function registerFundingDocTypes(registry: DocTypeRegistry): void {
  registry.registerDefinition({ definition: fundingProviderDocType });
  registry.registerDefinition({ definition: fundingCaseDocType });
  registry.registerDefinition({ definition: fundingDocumentDocType });
}
