import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  getAllIndicators,
  getApplicableIndicators,
  getCriterion,
  getEvidenceExamples,
  getExpectedLevel,
  getIndicator,
  getNonConformityRules,
} from './qualiopi-reference-registry';

test('getAllIndicators charge les 32 indicateurs V9', () => {
  const indicators = getAllIndicators();
  assert.equal(indicators.length, 32);
  assert.deepEqual(
    indicators.map((i) => i.indicatorNumber),
    Array.from({ length: 32 }, (_, i) => i + 1),
  );
});

test('getIndicator retourne le bon indicateur avec cross-ref business', () => {
  const indicator8 = getIndicator(8);
  assert.ok(indicator8);
  assert.equal(indicator8?.criterionNumber, 2);
  assert.equal(indicator8?.businessRef?.code, 'Q-I08');
});

test('getIndicator(23) retire les paragraphes parasites (editorial_note documentée)', () => {
  const indicator23 = getIndicator(23);
  assert.ok(indicator23?.editorialNote?.includes('parasites'));
});

test('getCriterion regroupe les indicateurs par critère', () => {
  const criterion1 = getCriterion(1);
  assert.ok(criterion1);
  assert.equal(criterion1?.indicators.length, 3);
  assert.deepEqual(
    criterion1?.indicators.map((i) => i.indicatorNumber),
    [1, 2, 3],
  );
});

test('getCriterion(99) retourne undefined pour un critère inexistant', () => {
  assert.equal(getCriterion(99), undefined);
});

test('getEvidenceExamples / getExpectedLevel / getNonConformityRules extraient les bonnes sections', () => {
  assert.ok(getEvidenceExamples(1)?.includes('plaquette'));
  assert.ok(getExpectedLevel(23)?.includes('veille'));
  assert.ok(getNonConformityRules(1)?.includes('non-conformité'.slice(0, 4)));
});

test('getApplicableIndicators exclut les indicateurs nouveaux entrants quand demandé', () => {
  const withoutNewEntrants = getApplicableIndicators({ newEntrant: false });
  assert.ok(withoutNewEntrants.every((i) => !i.nouveauxEntrants));
  assert.ok(withoutNewEntrants.length < getAllIndicators().length);
});
