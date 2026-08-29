import type { DocTypeRegistry } from '@repo/doctype';
import { fundingCaseDocType, fundingProviderDocType } from './doctypes';

export function registerFundingDocTypes(registry: DocTypeRegistry): void {
  registry.registerDefinition({ definition: fundingProviderDocType });
  registry.registerDefinition({ definition: fundingCaseDocType });
}
