import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  getAllIndicatorMappings,
  getIndicatorMapping,
  getIndicatorMode,
  listByMode,
} from './qualiopi-indicator-mapping-registry';

test('getAllIndicatorMappings couvre les 32 indicateurs', () => {
  assert.equal(getAllIndicatorMappings().length, 32);
});

test('I08 est AUTO (couvert par qualiopi-evaluation-rules.ts)', () => {
  assert.equal(getIndicatorMode(8), 'AUTO');
});

test('I32 est MANUAL (exemple explicite du spec)', () => {
  assert.equal(getIndicatorMode(32), 'MANUAL');
});

test('I21 est HYBRID par défaut', () => {
  assert.equal(getIndicatorMode(21), 'HYBRID');
});

test('listByMode(AUTO) retourne exactement les 6 indicateurs à règle déterministe', () => {
  const auto = listByMode('AUTO').map((m) => m.indicator).sort((a, b) => a - b);
  assert.deepEqual(auto, [8, 11, 20, 26, 27, 30]);
});

test('getIndicatorMapping expose les prismaHints comme entities', () => {
  const mapping = getIndicatorMapping(21);
  assert.ok(mapping?.entities.includes('TrainerCompetencyReview'));
});
