import type { DocTypeRegistry } from '@repo/doctype';
import { lmsCourseDocType, lmsEnrollmentDocType, lmsLessonDocType } from './doctypes';

export function registerLmsDocTypes(registry: DocTypeRegistry): void {
  registry.registerDefinition({ definition: lmsCourseDocType });
  registry.registerDefinition({ definition: lmsLessonDocType });
  registry.registerDefinition({ definition: lmsEnrollmentDocType });
}
