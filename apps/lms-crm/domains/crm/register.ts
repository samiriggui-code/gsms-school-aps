import type { DocTypeRegistry } from '@repo/doctype';
import { financeDevisDocType, financeInvoiceDocType, leadDocType } from './doctypes';
import { candidatureAssessmentDocType, candidatureDocType } from './candidature.doctype';
import { companyDocType, contactDocType, trainingRequestDocType } from './company-contact.doctypes';

export function registerCrmDocTypes(registry: DocTypeRegistry): void {
  registry.registerDefinition({ definition: companyDocType });
  registry.registerDefinition({ definition: contactDocType });
  registry.registerDefinition({ definition: leadDocType });
  registry.registerDefinition({ definition: financeDevisDocType });
  registry.registerDefinition({ definition: financeInvoiceDocType });
  registry.registerDefinition({ definition: candidatureDocType });
  registry.registerDefinition({ definition: candidatureAssessmentDocType });
  registry.registerDefinition({ definition: trainingRequestDocType });
}
