import type { DocControllerHooks, DocTypeRegistry } from '@repo/doctype';
import { lmsCourseDocType, lmsEnrollmentDocType, lmsLessonDocType } from './doctypes';

const lmsCourseController: DocControllerHooks = {
  beforeInsert: async ({ principal, data }) => ({
    ...data,
    createdById: (data.createdById as string) || principal.id,
  }),
};

export function registerLmsDocTypes(registry: DocTypeRegistry): void {
  registry.registerDefinition({ definition: lmsCourseDocType, controller: lmsCourseController });
  registry.registerDefinition({ definition: lmsLessonDocType });
  registry.registerDefinition({ definition: lmsEnrollmentDocType });
}
