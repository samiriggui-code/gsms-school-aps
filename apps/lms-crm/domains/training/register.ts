import type { DocTypeRegistry } from '@repo/doctype';
import {
  formationDocType,
  formationSessionDocType,
  formationSessionParticipantDocType,
  formationVenueRoomDocType,
} from './doctypes';

export function registerTrainingDocTypes(registry: DocTypeRegistry): void {
  registry.registerDefinition({ definition: formationDocType });
  registry.registerDefinition({ definition: formationVenueRoomDocType });
  registry.registerDefinition({ definition: formationSessionDocType });
  registry.registerDefinition({ definition: formationSessionParticipantDocType });
}
