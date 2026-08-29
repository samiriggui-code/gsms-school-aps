import type { DocTypeRegistry } from '@repo/doctype';
import {
  complianceDossierDocType,
  qualityIncidentDocType,
  satisfactionSurveyDocType,
} from './doctypes';

export function registerQualityDocTypes(registry: DocTypeRegistry): void {
  registry.registerDefinition({ definition: complianceDossierDocType });
  registry.registerDefinition({ definition: satisfactionSurveyDocType });
  registry.registerDefinition({ definition: qualityIncidentDocType });
}
