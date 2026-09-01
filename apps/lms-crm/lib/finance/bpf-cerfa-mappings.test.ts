import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  mapAudienceKey,
  mapFunderTypeToCadreC,
  splitHoursByDeliveryMode,
} from './bpf-cerfa-mappings';
import { buildCerfaSections } from './bpf-cerfa-sections';

test('mapFunderTypeToCadreC maps CPF and OPCO', () => {
  assert.equal(mapFunderTypeToCadreC('CPF'), 'cpf');
  assert.equal(mapFunderTypeToCadreC('OPCO'), 'opco');
  assert.equal(mapFunderTypeToCadreC('FRANCE_TRAVAIL'), 'france_travail');
});

test('mapAudienceKey prefers participant fundingMode', () => {
  assert.equal(mapAudienceKey('OTHER', 'CPF individuel'), 'particuliers');
  assert.equal(mapAudienceKey('OPCO', null), 'salaries');
});

test('buildCerfaSections aggregates cadre C from approved funding', () => {
  const cerfa = buildCerfaSections({
    fundingCases: [
      {
        status: 'APPROVED',
        funderType: 'CPF',
        requestedAmount: 1200,
        approvedAmount: 1200,
        participantId: 'p1',
      },
    ],
    sessions: [
      {
        trainerUserId: 'trainer-1',
        deliveryMode: 'PRESENTIEL',
        participants: [
          {
            id: 'p1',
            userId: 'u1',
            fundingMode: 'CPF',
            attendedSlots: 2,
            catalogHours: 35,
          },
        ],
      },
    ],
    hoursAttendedProxy: 7,
  });

  const cpfLine = cerfa.cadreC.find((r) => r.key === 'cpf');
  assert.equal(cpfLine?.amountHt, 1200);
  assert.equal(cerfa.cadreE.internalTrainers, 1);
  assert.equal(cerfa.cadreF.byAudience.find((r) => r.key === 'particuliers')?.trainees, 1);
});

test('splitHoursByDeliveryMode splits MIXTE 50/50', () => {
  const split = splitHoursByDeliveryMode(100, 'MIXTE');
  assert.equal(split.presentiel, 50);
  assert.equal(split.distanciel, 50);
});
