#!/usr/bin/env node
import {
  pos,
  wf,
  dispatchNode,
  dispatchCandidateNode,
  httpGetNode,
  httpPostJsonNode,
  executeWorkflowTrigger,
  scheduleTrigger,
  waitUntilNode,
  waitDaysNode,
  codeNode,
  splitBatchesNode,
  executeSub,
  switchOnEvent,
  switchOnField,
  unwrapDataNode,
} from './_helpers.mjs';

const FUNDING_MODES = ['CPF', 'OPCO', 'ENTREPRISE', 'PARTICULIER', 'FRANCE_TRAVAIL'];

export function buildSubWorkflows(ctx) {
  const workflows = [];
  const base = ctx.crmBaseUrl;
  const ids = ctx.workflowIds || {};

  // ── 1. Acquisition (Phase A) ─────────────────────────────────────────────
  workflows.push(
    wf('GSMS — Acquisition', [
      executeWorkflowTrigger('acq-trigger'),
      switchOnEvent('acq-switch', pos(240, 0), [
        { event: 'landing.preinscription.created', key: 'preinscription' },
        { event: 'landing.quote.requested', key: 'devis' },
        { event: 'crm.candidature.created', key: 'candidature' },
      ]),
      dispatchNode(
        'acq-ops-preinscription',
        'Notif ops préinscription',
        pos(520, -160),
        ctx,
        '"landing.preinscription.created"',
        '{ ...$json.payload, candidateName: [$json.payload.firstName, $json.payload.lastName].filter(Boolean).join(" ") || "Candidat" }',
      ),
      dispatchCandidateNode(
        'acq-mail-preinscription',
        'Email candidat dossier reçu',
        pos(760, -160),
        ctx,
        '"landing.preinscription.created"',
        '$json.payload',
        '$json.payload.email',
        '"Votre préinscription a bien été reçue"',
        '"Bonjour, nous avons bien reçu votre préinscription. Notre équipe va qualifier votre dossier sous 48h."',
      ),
      dispatchNode(
        'acq-ops-devis',
        'Notif ops devis',
        pos(520, 0),
        ctx,
        '"landing.quote.requested"',
        '$json.payload',
      ),
      httpGetNode(
        'acq-dossier',
        'Dossier candidat',
        pos(520, 160),
        ctx,
        `={{ \`${base}/api/internal/n8n/candidatures/\${$json.payload.candidatureId}/dossier\` }}`,
      ),
      unwrapDataNode('acq-dossier-unwrap', 'Extraire dossier', pos(760, 160)),
      dispatchNode(
        'acq-cnaps',
        'Checklist CNAPS',
        pos(1000, 120),
        ctx,
        '"crm.candidature.created"',
        '{ candidatureId: $json.candidatureId, candidateName: $json.candidateName, statusLabel: "Checklist conformité CNAPS à lancer" }',
      ),
      waitDaysNode('acq-wait-j3', 'Attente J+3', pos(1000, 200), 3),
      httpGetNode(
        'acq-dossier-j3',
        'Re-check dossier J+3',
        pos(1240, 200),
        ctx,
        `={{ \`${base}/api/internal/n8n/candidatures/\${$('Extraire dossier').first().json.candidatureId}/dossier\` }}`,
      ),
      codeNode(
        'acq-j3-filter',
        'Filtrer incomplets',
        pos(1480, 200),
        `const envelope = $input.first().json;
const d = envelope.data ?? envelope;
if (d.dossierComplete) return [];
return [{ json: d }];`,
      ),
      dispatchCandidateNode(
        'acq-relance-j3',
        'Relance J+3 candidat',
        pos(1720, 200),
        ctx,
        '"crm.candidature.dossier.relance"',
        '{ candidatureId: $json.candidatureId, candidateName: $json.candidateName, email: $json.email }',
        '$json.email',
        '"Pièces manquantes — votre dossier de formation"',
        '"Bonjour, votre dossier est incomplet. Merci de compléter vos pièces dans votre espace candidat."',
      ),
    ], {
      'Execute Workflow Trigger': { main: [[{ node: 'Switch event', type: 'main', index: 0 }]] },
      'Switch event': {
        main: [
          [{ node: 'Notif ops préinscription', type: 'main', index: 0 }],
          [{ node: 'Notif ops devis', type: 'main', index: 0 }],
          [{ node: 'Dossier candidat', type: 'main', index: 0 }],
        ],
      },
      'Notif ops préinscription': { main: [[{ node: 'Email candidat dossier reçu', type: 'main', index: 0 }]] },
      'Dossier candidat': { main: [[{ node: 'Extraire dossier', type: 'main', index: 0 }]] },
      'Extraire dossier': { main: [[{ node: 'Checklist CNAPS', type: 'main', index: 0 }]] },
      'Checklist CNAPS': { main: [[{ node: 'Attente J+3', type: 'main', index: 0 }]] },
      'Attente J+3': { main: [[{ node: 'Re-check dossier J+3', type: 'main', index: 0 }]] },
      'Re-check dossier J+3': { main: [[{ node: 'Filtrer incomplets', type: 'main', index: 0 }]] },
      'Filtrer incomplets': { main: [[{ node: 'Relance J+3 candidat', type: 'main', index: 0 }]] },
    }),
  );

  // ── 2. Circuit session (Phase B — Wait Until jalons) ─────────────────────
  workflows.push(
    wf('GSMS — Circuit session', [
      executeWorkflowTrigger('sess-trigger'),
      httpGetNode(
        'sess-timeline',
        'Timeline session',
        pos(240, 0),
        ctx,
        `={{ \`${base}/api/internal/n8n/sessions/\${$json.payload.sessionId}/timeline\` }}`,
      ),
      unwrapDataNode('sess-unwrap', 'Extraire timeline', pos(480, 0)),
      httpPostJsonNode(
        'sess-register',
        'Enregistrer circuit',
        pos(720, 0),
        ctx,
        `${base}/api/internal/n8n/automation/register`,
        '={{ JSON.stringify({ sessionId: $json.sessionId, participantId: $json.triggerPayload.participantId, candidatureId: $json.triggerPayload.candidatureId, n8nExecutionId: $execution.id, milestones: $json.milestones, circuitKey: "default" }) }}',
      ),
      codeNode(
        'sess-milestones',
        'Préparer jalons',
        pos(960, 0),
        `const reg = $input.first().json;
const runId = (reg.data ?? reg).id;
const timeline = $('Extraire timeline').first().json;
const now = Date.now();
const items = (timeline.milestones ?? [])
  .filter((m) => new Date(m.at).getTime() > now - 120000)
  .map((milestone) => ({
    json: {
      runId,
      sessionId: timeline.sessionId,
      sessionLabel: timeline.label,
      milestone,
      triggerPayload: timeline.triggerPayload ?? {},
      participants: timeline.participants ?? [],
    },
  }));
return items.length ? items : [];`,
      ),
      splitBatchesNode('sess-split', 'Boucle jalons', pos(1200, 0)),
      waitUntilNode('sess-wait', 'Wait jalon', pos(1440, 0), '={{ $json.milestone.at }}'),
      dispatchNode(
        'sess-milestone-dispatch',
        'Dispatch jalon',
        pos(1680, -40),
        ctx,
        '"crm.session.milestone.due"',
        '{ sessionId: $json.sessionId, sessionLabel: $json.sessionLabel, milestoneLabel: $json.milestone.label, milestoneKey: $json.milestone.key, candidatureId: $json.triggerPayload.candidatureId, candidateName: $json.triggerPayload.candidateName || "Participant" }',
      ),
      switchOnField(
        'sess-email-switch',
        'Email jalon',
        pos(1680, 120),
        '={{ $json.milestone.key }}',
        [
          { value: 'jMinus5', key: 'j5' },
          { value: 'j0', key: 'j0' },
          { value: 'jPlus45', key: 'j45' },
        ],
      ),
      dispatchCandidateNode(
        'sess-email-j5',
        'Email J-5',
        pos(1920, 40),
        ctx,
        '"crm.session.milestone.due"',
        '{ sessionId: $json.sessionId, sessionLabel: $json.sessionLabel, milestoneKey: "jMinus5", candidatureId: $json.triggerPayload.candidatureId, candidateName: $json.triggerPayload.candidateName || "Participant" }',
        '$json.triggerPayload.email',
        '"Préparation formation — auto-évaluation"',
        '"Bonjour, votre formation approche. Merci de compléter votre auto-évaluation et vos documents dans votre espace candidat."',
      ),
      dispatchCandidateNode(
        'sess-email-j0',
        'Email J0',
        pos(1920, 120),
        ctx,
        '"crm.session.milestone.due"',
        '{ sessionId: $json.sessionId, sessionLabel: $json.sessionLabel, milestoneKey: "j0", candidatureId: $json.triggerPayload.candidatureId, candidateName: $json.triggerPayload.candidateName || "Participant" }',
        '$json.triggerPayload.email',
        '"Rappel — début de formation aujourd\'hui"',
        '"Bonjour, votre session de formation débute aujourd\'hui. Pensez à signer les feuilles d\'émargement et à vous présenter à l\'heure indiquée."',
      ),
      dispatchCandidateNode(
        'sess-email-j45',
        'Email J+45',
        pos(1920, 200),
        ctx,
        '"crm.session.milestone.due"',
        '{ sessionId: $json.sessionId, sessionLabel: $json.sessionLabel, milestoneKey: "jPlus45", candidatureId: $json.triggerPayload.candidatureId, candidateName: $json.triggerPayload.candidateName || "Participant" }',
        '$json.triggerPayload.email',
        '"Questionnaire satisfaction à froid"',
        '"Bonjour, votre formation est terminée depuis quelques semaines. Merci de répondre au questionnaire de satisfaction pour nous aider à améliorer nos parcours."',
      ),
      codeNode(
        'sess-circuit-done',
        'Fin circuit payload',
        pos(1440, 240),
        `const first = $('Préparer jalons').first().json;
return [{
  json: {
    runId: first.runId,
    sessionId: first.sessionId,
    sessionLabel: first.sessionLabel,
    participants: first.participants ?? [],
    triggerPayload: first.triggerPayload ?? {},
  },
}];`,
      ),
      httpPostJsonNode(
        'sess-complete',
        'Clôturer circuit',
        pos(1680, 240),
        ctx,
        `${base}/api/internal/n8n/automation/complete`,
        '={{ JSON.stringify({ runId: $json.runId }) }}',
      ),
      ...(ids['GSMS — Finance multi-financeurs']
        ? [
            executeSub(
              'sess-finance',
              'Finance participants',
              pos(1680, 180),
              ids['GSMS — Finance multi-financeurs'],
            ),
          ]
        : []),
    ], {
      'Execute Workflow Trigger': { main: [[{ node: 'Timeline session', type: 'main', index: 0 }]] },
      'Timeline session': { main: [[{ node: 'Extraire timeline', type: 'main', index: 0 }]] },
      'Extraire timeline': { main: [[{ node: 'Enregistrer circuit', type: 'main', index: 0 }]] },
      'Enregistrer circuit': { main: [[{ node: 'Préparer jalons', type: 'main', index: 0 }]] },
      'Préparer jalons': { main: [[{ node: 'Boucle jalons', type: 'main', index: 0 }]] },
      'Boucle jalons': {
        main: [
          [{ node: 'Wait jalon', type: 'main', index: 0 }],
          [{ node: 'Fin circuit payload', type: 'main', index: 0 }],
        ],
      },
      'Wait jalon': {
        main: [[
          { node: 'Dispatch jalon', type: 'main', index: 0 },
          { node: 'Email jalon', type: 'main', index: 0 },
        ]],
      },
      'Dispatch jalon': { main: [[{ node: 'Boucle jalons', type: 'main', index: 0 }]] },
      'Email jalon': {
        main: [
          [{ node: 'Email J-5', type: 'main', index: 0 }],
          [{ node: 'Email J0', type: 'main', index: 0 }],
          [{ node: 'Email J+45', type: 'main', index: 0 }],
          [{ node: 'Boucle jalons', type: 'main', index: 0 }],
        ],
      },
      'Email J-5': { main: [[{ node: 'Boucle jalons', type: 'main', index: 0 }]] },
      'Email J0': { main: [[{ node: 'Boucle jalons', type: 'main', index: 0 }]] },
      'Email J+45': { main: [[{ node: 'Boucle jalons', type: 'main', index: 0 }]] },
      'Fin circuit payload': {
        main: [[
          { node: 'Clôturer circuit', type: 'main', index: 0 },
          ...(ids['GSMS — Finance multi-financeurs']
            ? [{ node: 'Finance participants', type: 'main', index: 0 }]
            : []),
        ]],
      },
      'Clôturer circuit': { main: [[]] },
    }),
  );

  // ── 5. Finance multi-financeurs (Phase E) ────────────────────────────────
  workflows.push(
    wf('GSMS — Finance multi-financeurs', [
      executeWorkflowTrigger('fin-trigger'),
      codeNode(
        'fin-participants',
        'Participants financeurs',
        pos(240, 0),
        `const input = $input.first().json;
function normFunding(raw) {
  if (!raw) return 'PARTICULIER';
  const upper = String(raw).trim().toUpperCase();
  if (['CPF','OPCO','ENTREPRISE','PARTICULIER','FRANCE_TRAVAIL'].includes(upper)) return upper;
  const key = String(raw).trim().toLowerCase().replace(/[\\s-]+/g, '');
  const map = { cpf:'CPF', transition:'CPF', opco:'OPCO', francetravail:'FRANCE_TRAVAIL', france_travail:'FRANCE_TRAVAIL', apprenticeship:'FRANCE_TRAVAIL', selffunded:'PARTICULIER', particulier:'PARTICULIER', autre:'PARTICULIER', discuss:'PARTICULIER', budgetentreprise:'ENTREPRISE', budget_entreprise:'ENTREPRISE', entreprise:'ENTREPRISE', multi:'ENTREPRISE' };
  return map[key] || 'PARTICULIER';
}
const participants = input.participants ?? input.triggerPayload?.participants ?? [];
const sessionLabel = input.sessionLabel || input.triggerPayload?.sessionLabel || null;
const mapOne = (p) => ({ ...p, fundingMode: normFunding(p.fundingMode) });
if (participants.length) {
  return participants.map((p) => ({ json: { ...input, sessionLabel, participant: mapOne(p) } }));
}
const p = mapOne({
  fundingMode: input.triggerPayload?.fundingMode,
  participantId: input.triggerPayload?.participantId,
  name: input.triggerPayload?.candidateName,
  email: input.triggerPayload?.email || null,
  candidatureId: input.triggerPayload?.candidatureId,
});
return [{ json: { ...input, sessionLabel, participant: p } }];`,
      ),
      splitBatchesNode('fin-split', 'Par financeur', pos(480, 0)),
      switchOnField(
        'fin-switch',
        'Mode financement',
        pos(720, 0),
        '={{ ($json.participant.fundingMode || "PARTICULIER").toUpperCase() }}',
        FUNDING_MODES.map((v) => ({ value: v, key: v.toLowerCase() })),
      ),
      ...FUNDING_MODES.flatMap((mode, i) => [
        dispatchNode(
          `fin-${mode.toLowerCase()}`,
          `Finance ${mode}`,
          pos(960, i * 80 - 160),
          ctx,
          '"crm.finance.funding.branch"',
          `{ fundingMode: "${mode}", candidateName: $json.participant.name, candidatureId: $json.participant.candidatureId, participantId: $json.participant.participantId, sessionLabel: $json.sessionLabel || $json.triggerPayload?.sessionLabel }`,
        ),
      ]),
      dispatchNode(
        'fin-default',
        'Finance défaut',
        pos(960, 320),
        ctx,
        '"crm.finance.funding.branch"',
        '{ fundingMode: $json.participant.fundingMode || "PARTICULIER", candidateName: $json.participant.name, candidatureId: $json.participant.candidatureId, sessionLabel: $json.sessionLabel }',
      ),
    ], {
      'Execute Workflow Trigger': { main: [[{ node: 'Participants financeurs', type: 'main', index: 0 }]] },
      'Participants financeurs': { main: [[{ node: 'Par financeur', type: 'main', index: 0 }]] },
      'Par financeur': {
        main: [
          [{ node: 'Mode financement', type: 'main', index: 0 }],
          [],
        ],
      },
      'Mode financement': {
        main: [
          ...FUNDING_MODES.map((mode) => [{ node: `Finance ${mode}`, type: 'main', index: 0 }]),
          [{ node: 'Finance défaut', type: 'main', index: 0 }],
        ],
      },
      ...Object.fromEntries([
        ...FUNDING_MODES.map((mode) => [`Finance ${mode}`, { main: [[{ node: 'Par financeur', type: 'main', index: 0 }]] }]),
        ['Finance défaut', { main: [[{ node: 'Par financeur', type: 'main', index: 0 }]] }],
      ]),
    }),
  );

  // ── 6. Post-examen (Phase D) ─────────────────────────────────────────────
  workflows.push(
    wf('GSMS — Post-examen', [
      executeWorkflowTrigger('exam-trigger'),
      switchOnField(
        'exam-switch',
        'Résultat examen',
        pos(240, 0),
        '={{ ($json.payload.examOutcome || "").toUpperCase() }}',
        [
          { value: 'PASSED', key: 'admis' },
          { value: 'FAILED', key: 'ajourne' },
          { value: 'ABSENT', key: 'ajourne-absent' },
        ],
      ),
      dispatchNode(
        'exam-admis',
        'ADMIS → attestation + finance',
        pos(520, -80),
        ctx,
        '"crm.candidature.exam.recorded"',
        '{ ...$json.payload, statusLabel: "ADMIS — lancer attestation et solde finance" }',
      ),
      dispatchCandidateNode(
        'exam-admis-mail',
        'Email candidat ADMIS',
        pos(760, -80),
        ctx,
        '"crm.candidature.exam.recorded"',
        '$json.payload',
        '$json.payload.email',
        '"Félicitations — examen réussi"',
        '"Bonjour, nous avons le plaisir de vous informer que vous avez réussi votre examen. Votre attestation sera délivrée prochainement."',
      ),
      dispatchNode(
        'exam-ajourne',
        'AJOURNÉ → replanifier',
        pos(520, 80),
        ctx,
        '"crm.candidature.exam.recorded"',
        '{ ...$json.payload, statusLabel: "AJOURNÉ — replanifier session et informer candidat" }',
      ),
      dispatchCandidateNode(
        'exam-ajourne-mail',
        'Email candidat AJOURNÉ',
        pos(760, 80),
        ctx,
        '"crm.candidature.exam.recorded"',
        '$json.payload',
        '$json.payload.email',
        '"Information examen — session à replanifier"',
        '"Bonjour, votre examen devra être replanifié. Notre équipe va vous recontacter pour une nouvelle session."',
      ),
    ], {
      'Execute Workflow Trigger': { main: [[{ node: 'Résultat examen', type: 'main', index: 0 }]] },
      'Résultat examen': {
        main: [
          [{ node: 'ADMIS → attestation + finance', type: 'main', index: 0 }],
          [{ node: 'AJOURNÉ → replanifier', type: 'main', index: 0 }],
          [{ node: 'AJOURNÉ → replanifier', type: 'main', index: 0 }],
        ],
      },
      'ADMIS → attestation + finance': { main: [[{ node: 'Email candidat ADMIS', type: 'main', index: 0 }]] },
      'AJOURNÉ → replanifier': { main: [[{ node: 'Email candidat AJOURNÉ', type: 'main', index: 0 }]] },
    }),
  );

  // ── Attestation délivrée ─────────────────────────────────────────────────
  workflows.push(
    wf('GSMS — Attestation délivrée', [
      executeWorkflowTrigger('att-trigger'),
      dispatchNode(
        'att-ops',
        'Notif attestation',
        pos(280, 0),
        ctx,
        '"crm.candidature.attestation.issued"',
        '$json.payload',
      ),
      dispatchCandidateNode(
        'att-mail',
        'Email candidat attestation',
        pos(520, 0),
        ctx,
        '"crm.candidature.attestation.issued"',
        '$json.payload',
        '$json.payload.email',
        '"Votre attestation est disponible"',
        '"Bonjour, votre attestation de formation a été délivrée. Consultez votre espace candidat pour la télécharger."',
      ),
    ], {
      'Execute Workflow Trigger': { main: [[{ node: 'Notif attestation', type: 'main', index: 0 }]] },
      'Notif attestation': { main: [[{ node: 'Email candidat attestation', type: 'main', index: 0 }]] },
    }),
  );

  // ── Finance paiement ─────────────────────────────────────────────────────
  workflows.push(
    wf('GSMS — Finance paiement', [
      executeWorkflowTrigger('pay-trigger'),
      dispatchNode('pay-dispatch', 'Notifier finance', pos(280, 0), ctx, '"crm.finance.payment.recorded"', '$json.payload'),
    ], {
      'Execute Workflow Trigger': { main: [[{ node: 'Notifier finance', type: 'main', index: 0 }]] },
    }),
  );

  // ── Finance devis (created / sent / accepted) ────────────────────────────
  workflows.push(
    wf('GSMS — Finance devis', [
      executeWorkflowTrigger('devis-fin-trigger'),
      switchOnEvent('devis-fin-switch', pos(240, 0), [
        { event: 'crm.finance.devis.created', key: 'created' },
        { event: 'crm.finance.devis.sent', key: 'sent' },
        { event: 'crm.finance.devis.accepted', key: 'accepted' },
      ]),
      dispatchNode(
        'devis-fin-ops-created',
        'Notif ops nouveau devis',
        pos(520, -120),
        ctx,
        '"crm.finance.devis.created"',
        '{ devisId: $json.payload.devisId, referenceCode: $json.payload.referenceCode, title: $json.payload.title, statusLabel: "Nouveau devis à traiter" }',
      ),
      dispatchNode(
        'devis-fin-ops-sent',
        'Notif ops devis envoyé',
        pos(520, 0),
        ctx,
        '"crm.finance.devis.sent"',
        '{ devisId: $json.payload.devisId, referenceCode: $json.payload.referenceCode, leadEmail: $json.payload.leadEmail, statusLabel: "Devis envoyé au client" }',
      ),
      dispatchCandidateNode(
        'devis-fin-mail-sent',
        'Email client devis',
        pos(760, 0),
        ctx,
        '"crm.finance.devis.sent"',
        '{ devisId: $json.payload.devisId, referenceCode: $json.payload.referenceCode }',
        '$json.payload.leadEmail',
        '"Votre proposition de formation"',
        '"Bonjour, votre proposition commerciale est disponible. Consultez le lien reçu par e-mail pour la valider en ligne."',
      ),
      dispatchNode(
        'devis-fin-ops-accepted',
        'Notif ops devis accepté',
        pos(520, 120),
        ctx,
        '"crm.finance.devis.accepted"',
        '{ devisId: $json.payload.devisId, referenceCode: $json.payload.referenceCode, statusLabel: "Devis accepté — passer en facturation" }',
      ),
    ], {
      'Execute Workflow Trigger': { main: [[{ node: 'Switch event', type: 'main', index: 0 }]] },
      'Switch event': {
        main: [
          [{ node: 'Notif ops nouveau devis', type: 'main', index: 0 }],
          [{ node: 'Notif ops devis envoyé', type: 'main', index: 0 }],
          [{ node: 'Notif ops devis accepté', type: 'main', index: 0 }],
        ],
      },
      'Notif ops devis envoyé': { main: [[{ node: 'Email client devis', type: 'main', index: 0 }]] },
    }),
  );

  // ── 3. Relance conformité ────────────────────────────────────────────────
  workflows.push(
    wf('GSMS — Relance conformité dossier', [
      scheduleTrigger('comp-cron', 'Cron 08h', pos(0, 0), '0 8 * * *'),
      httpGetNode('comp-fetch', 'Dossiers incomplets', pos(240, 0), ctx, `${base}/api/internal/n8n/cron/compliance-daily`),
      codeNode(
        'comp-list',
        'Liste candidatures',
        pos(480, 0),
        `const data = ($input.first().json.data ?? $input.first().json);
return (data.candidatures ?? []).map((c) => ({ json: c }));`,
      ),
      splitBatchesNode('comp-split', 'Par candidat', pos(720, 0)),
      dispatchNode(
        'comp-ops',
        'Notif ops',
        pos(960, -40),
        ctx,
        '"crm.candidature.dossier.relance"',
        '{ candidatureId: $json.candidatureId, candidateName: $json.candidateName, statusLabel: "Relance conformité dossier" }',
        ['notification'],
      ),
      dispatchCandidateNode(
        'comp-mail',
        'Email candidat',
        pos(960, 40),
        ctx,
        '"crm.candidature.dossier.relance"',
        '{ candidatureId: $json.candidatureId, candidateName: $json.candidateName }',
        '$json.email',
        '"Complétez votre dossier de formation"',
        '"Bonjour, des pièces sont manquantes dans votre dossier. Merci de les déposer rapidement."',
      ),
    ], {
      'Cron 08h': { main: [[{ node: 'Dossiers incomplets', type: 'main', index: 0 }]] },
      'Dossiers incomplets': { main: [[{ node: 'Liste candidatures', type: 'main', index: 0 }]] },
      'Liste candidatures': { main: [[{ node: 'Par candidat', type: 'main', index: 0 }]] },
      'Par candidat': {
        main: [[{ node: 'Notif ops', type: 'main', index: 0 }], []],
      },
      'Notif ops': { main: [[{ node: 'Email candidat', type: 'main', index: 0 }]] },
      'Email candidat': { main: [[{ node: 'Par candidat', type: 'main', index: 0 }]] },
    }),
  );

  // ── 4. Émargements 07h ───────────────────────────────────────────────────
  workflows.push(
    wf('GSMS — Émargements quotidiens', [
      scheduleTrigger('em-cron', 'Cron 07h', pos(0, 0), '0 7 * * *'),
      httpGetNode('em-fetch', 'Alertes pédagogie', pos(240, 0), ctx, `${base}/api/internal/n8n/cron/pedagogy-daily`),
      codeNode(
        'em-list',
        'Sessions du jour',
        pos(480, 0),
        `const data = $input.first().json.data ?? $input.first().json;
return (data.sessions ?? [])
  .filter((s) => (s.unsignedEmargementCount ?? 0) > 0)
  .map((s) => ({ json: { ...s, date: data.date } }));`,
      ),
      splitBatchesNode('em-split', 'Par session', pos(720, 0)),
      dispatchNode(
        'em-dispatch',
        'Alerte émargements',
        pos(960, 0),
        ctx,
        '"crm.session.emargement.missing"',
        '{ sessionId: $json.sessionId, sessionLabel: $json.sessionLabel, unsignedCount: $json.unsignedEmargementCount ?? 0, dayDate: $json.dayDate, date: $json.date }',
        ['notification', 'email'],
      ),
    ], {
      'Cron 07h': { main: [[{ node: 'Alertes pédagogie', type: 'main', index: 0 }]] },
      'Alertes pédagogie': { main: [[{ node: 'Sessions du jour', type: 'main', index: 0 }]] },
      'Sessions du jour': { main: [[{ node: 'Par session', type: 'main', index: 0 }]] },
      'Par session': { main: [[{ node: 'Alerte émargements', type: 'main', index: 0 }], []] },
      'Alerte émargements': { main: [[{ node: 'Par session', type: 'main', index: 0 }]] },
    }),
  );

  // ── Phase C — Absences 18h ───────────────────────────────────────────────
  workflows.push(
    wf('GSMS — Absences soir', [
      scheduleTrigger('abs-cron', 'Cron 18h', pos(0, 0), '0 18 * * *'),
      httpGetNode('abs-fetch', 'Absences jour', pos(240, 0), ctx, `${base}/api/internal/n8n/cron/pedagogy-evening`),
      codeNode(
        'abs-list',
        'Liste absences',
        pos(480, 0),
        `const data = $input.first().json.data ?? $input.first().json;
return (data.absences ?? []).map((a) => ({ json: a }));`,
      ),
      splitBatchesNode('abs-split', 'Par absence', pos(720, 0)),
      dispatchNode(
        'abs-ops',
        'Alerte ops',
        pos(960, 0),
        ctx,
        '"crm.session.absence.unjustified"',
        '{ sessionId: $json.sessionId, sessionLabel: $json.sessionLabel, dayDate: $json.dayDate, candidateName: $json.name, participantId: $json.participantId }',
        ['notification'],
      ),
    ], {
      'Cron 18h': { main: [[{ node: 'Absences jour', type: 'main', index: 0 }]] },
      'Absences jour': { main: [[{ node: 'Liste absences', type: 'main', index: 0 }]] },
      'Liste absences': { main: [[{ node: 'Par absence', type: 'main', index: 0 }]] },
      'Par absence': { main: [[{ node: 'Alerte ops', type: 'main', index: 0 }], []] },
      'Alerte ops': { main: [[{ node: 'Par absence', type: 'main', index: 0 }]] },
    }),
  );

  // ── Relance impayés J+15 ─────────────────────────────────────────────────
  workflows.push(
    wf('GSMS — Relance impayés', [
      scheduleTrigger('ovd-cron', 'Cron 09h', pos(0, 0), '0 9 * * *'),
      httpGetNode('ovd-fetch', 'Impayés', pos(240, 0), ctx, `${base}/api/internal/n8n/cron/invoices-overdue`),
      codeNode(
        'ovd-filter',
        'Filtrer >15j',
        pos(480, 0),
        `const data = $input.first().json.data ?? $input.first().json;
return (data.items ?? []).filter((i) => i.daysOverdue >= 15).map((i) => ({ json: i }));`,
      ),
      splitBatchesNode('ovd-split', 'Par impayé', pos(720, 0)),
      dispatchNode(
        'ovd-dispatch',
        'Relance finance',
        pos(960, 0),
        ctx,
        '"crm.finance.invoice.overdue"',
        '{ devisId: $json.devisId, referenceCode: $json.referenceCode, amountDue: $json.amountDue, currency: $json.currency, candidateName: $json.candidateName, candidatureId: $json.candidatureId }',
      ),
    ], {
      'Cron 09h': { main: [[{ node: 'Impayés', type: 'main', index: 0 }]] },
      'Impayés': { main: [[{ node: 'Filtrer >15j', type: 'main', index: 0 }]] },
      'Filtrer >15j': { main: [[{ node: 'Par impayé', type: 'main', index: 0 }]] },
      'Par impayé': { main: [[{ node: 'Relance finance', type: 'main', index: 0 }], []] },
      'Relance finance': { main: [[{ node: 'Par impayé', type: 'main', index: 0 }]] },
    }),
  );

  // ── 7. Rapport hebdo ops ─────────────────────────────────────────────────
  workflows.push(
    wf('GSMS — Rapport hebdo ops', [
      scheduleTrigger('wk-cron', 'Cron lundi 08h', pos(0, 0), '0 8 * * 1'),
      httpGetNode('wk-fetch', 'Stats ops', pos(240, 0), ctx, `${base}/api/internal/n8n/stats/ops-weekly`),
      dispatchNode(
        'wk-dispatch',
        'Digest hebdo',
        pos(480, 0),
        ctx,
        '"crm.automation.ops.weekly"',
        '{ summary: ($json.data ?? $json).summary, activeSessions: ($json.data ?? $json).activeSessions, candidaturesOpen: ($json.data ?? $json).candidaturesOpen }',
        ['email', 'notification'],
      ),
      httpPostJsonNode(
        'wk-enqueue',
        'PDF ops hebdo',
        pos(480, 160),
        ctx,
        `${base}/api/internal/n8n/reports/enqueue`,
        '={{ JSON.stringify({ templateKey: "pilotage.ops-weekly", format: "PDF", frequency: "WEEKLY", title: "Synthèse ops hebdomadaire", summary: ($("Stats ops").first().json.data ?? $("Stats ops").first().json).summary ?? "" }) }}',
      ),
    ], {
      'Cron lundi 08h': { main: [[{ node: 'Stats ops', type: 'main', index: 0 }]] },
      'Stats ops': {
        main: [
          [
            { node: 'Digest hebdo', type: 'main', index: 0 },
            { node: 'PDF ops hebdo', type: 'main', index: 0 },
          ],
        ],
      },
    }),
  );

  // ── 8. Rapport mensuel finance ───────────────────────────────────────────
  workflows.push(
    wf('GSMS — Rapport mensuel finance', [
      scheduleTrigger('mo-cron', 'Cron 1er 08h', pos(0, 0), '0 8 1 * *'),
      httpGetNode('mo-fetch', 'Stats finance', pos(240, 0), ctx, `${base}/api/internal/n8n/stats/finance-monthly`),
      dispatchNode(
        'mo-dispatch',
        'Digest finance',
        pos(480, 0),
        ctx,
        '"crm.automation.finance.monthly"',
        '{ summary: ($json.data ?? $json).summary, caMonth: ($json.data ?? $json).caMonth, overdueCount: (($json.data ?? $json).overdue ?? {}).count ?? 0 }',
        ['email', 'notification'],
      ),
      httpPostJsonNode(
        'mo-enqueue',
        'PDF finance mensuel',
        pos(480, 160),
        ctx,
        `${base}/api/internal/n8n/reports/enqueue`,
        '={{ JSON.stringify({ templateKey: "finance.monthly-summary", format: "PDF", frequency: "MONTHLY", title: "Synthèse finance mensuelle", summary: ($("Stats finance").first().json.data ?? $("Stats finance").first().json).summary ?? "" }) }}',
      ),
    ], {
      'Cron 1er 08h': { main: [[{ node: 'Stats finance', type: 'main', index: 0 }]] },
      'Stats finance': {
        main: [
          [
            { node: 'Digest finance', type: 'main', index: 0 },
            { node: 'PDF finance mensuel', type: 'main', index: 0 },
          ],
        ],
      },
    }),
  );

  // ── 9. Qualiopi checklist ────────────────────────────────────────────────
  workflows.push(
    wf('GSMS — Qualiopi checklist', [
      scheduleTrigger('ql-cron', 'Cron trimestriel', pos(0, 0), '0 8 1 1,4,7,10 *'),
      httpGetNode('ql-fetch', 'Fetch Qualiopi', pos(240, 0), ctx, `${base}/api/internal/n8n/cron/qualiopi-checklist`),
      dispatchNode(
        'ql-dispatch',
        'Envoyer checklist Qualiopi',
        pos(480, 0),
        ctx,
        '"crm.qualiopi.checklist.due"',
        '{ summary: ($json.data ?? $json).summary, quarter: ($json.data ?? $json).quarter, year: ($json.data ?? $json).year }',
        ['email', 'notification'],
      ),
      httpPostJsonNode(
        'ql-enqueue',
        'PDF Qualiopi',
        pos(480, 160),
        ctx,
        `${base}/api/internal/n8n/reports/enqueue`,
        '={{ JSON.stringify({ templateKey: "qualiopi.checklist", format: "PDF", frequency: "QUARTERLY", title: "Checklist Qualiopi", summary: ($("Fetch Qualiopi").first().json.data ?? $("Fetch Qualiopi").first().json).summary ?? "" }) }}',
      ),
    ], {
      'Cron trimestriel': { main: [[{ node: 'Fetch Qualiopi', type: 'main', index: 0 }]] },
      'Fetch Qualiopi': {
        main: [
          [
            { node: 'Envoyer checklist Qualiopi', type: 'main', index: 0 },
            { node: 'PDF Qualiopi', type: 'main', index: 0 },
          ],
        ],
      },
    }),
  );

  // ── Support contact landing ────────────────────────────────────────────────
  workflows.push(
    wf('GSMS — Support contact', [
      executeWorkflowTrigger('contact-trigger'),
      dispatchNode(
        'contact-ops',
        'Notif ops contact',
        pos(280, 0),
        ctx,
        '"landing.contact.submitted"',
        '$json.payload',
      ),
      dispatchCandidateNode(
        'contact-ack',
        'Accusé visiteur',
        pos(520, 0),
        ctx,
        '"landing.contact.submitted"',
        '$json.payload',
        '$json.payload.email',
        '"Nous avons bien reçu votre message"',
        '"Bonjour, votre demande a été transmise à notre équipe. Nous vous répondrons dans les meilleurs délais."',
      ),
    ], {
      'Execute Workflow Trigger': { main: [[{ node: 'Notif ops contact', type: 'main', index: 0 }]] },
      'Notif ops contact': { main: [[{ node: 'Accusé visiteur', type: 'main', index: 0 }]] },
    }),
  );

  // ── Ticket support CRM ─────────────────────────────────────────────────────
  workflows.push(
    wf('GSMS — Support ticket', [
      executeWorkflowTrigger('ticket-trigger'),
      dispatchNode(
        'ticket-ops',
        'Notif ops ticket',
        pos(280, 0),
        ctx,
        '"crm.support.ticket.created"',
        '$json.payload',
      ),
      dispatchCandidateNode(
        'ticket-ack',
        'Accusé demandeur',
        pos(520, 0),
        ctx,
        '"crm.support.ticket.created"',
        '$json.payload',
        '$json.payload.requesterEmail',
        '"={{ "Ticket " + ($json.payload.referenceCode || "") + " — bien reçu" }}',
        '"Bonjour, votre demande a été enregistrée. Notre équipe support vous répondra rapidement."',
      ),
    ], {
      'Execute Workflow Trigger': { main: [[{ node: 'Notif ops ticket', type: 'main', index: 0 }]] },
      'Notif ops ticket': { main: [[{ node: 'Accusé demandeur', type: 'main', index: 0 }]] },
    }),
  );

  // ── Équipements (alertes maintenance / hors service) ───────────────────────
  workflows.push(
    wf('GSMS — Équipements', [
      executeWorkflowTrigger('equip-trigger'),
      dispatchNode(
        'equip-ops',
        'Alerte équipement',
        pos(280, 0),
        ctx,
        '"crm.equipment.alert"',
        '$json.payload',
        ['notification', 'email'],
      ),
    ], {
      'Execute Workflow Trigger': { main: [[{ node: 'Alerte équipement', type: 'main', index: 0 }]] },
    }),
  );

  // ── Conformité documents ───────────────────────────────────────────────────
  workflows.push(
    wf('GSMS — Conformité documents', [
      executeWorkflowTrigger('compliance-trigger'),
      switchOnEvent('compliance-switch', pos(240, 0), [
        { event: 'crm.compliance.document.expiring', key: 'expiring' },
        { event: 'crm.compliance.document.missing', key: 'missing' },
        { event: 'crm.compliance.document.requested', key: 'requested' },
      ]),
      dispatchNode(
        'compliance-expiring',
        'Alerte expiration',
        pos(520, -80),
        ctx,
        '"crm.compliance.document.expiring"',
        '$json.payload',
        ['notification', 'email'],
      ),
      dispatchNode(
        'compliance-missing',
        'Alerte pièce manquante',
        pos(520, 40),
        ctx,
        '"crm.compliance.document.missing"',
        '$json.payload',
        ['notification'],
      ),
      dispatchNode(
        'compliance-requested',
        'Demande pièce',
        pos(520, 160),
        ctx,
        '"crm.compliance.document.requested"',
        '$json.payload',
        ['notification'],
      ),
    ], {
      'Execute Workflow Trigger': { main: [[{ node: 'Switch event', type: 'main', index: 0 }]] },
      'Switch event': {
        main: [
          [{ node: 'Alerte expiration', type: 'main', index: 0 }],
          [{ node: 'Alerte pièce manquante', type: 'main', index: 0 }],
          [{ node: 'Demande pièce', type: 'main', index: 0 }],
        ],
      },
    }),
  );

  // ── Cron RH conformité 08h30 ─────────────────────────────────────────────
  workflows.push(
    wf('GSMS — RH conformité quotidien', [
      scheduleTrigger('rh-cron', 'Cron 08h30', pos(0, 0), '30 8 * * *'),
      httpGetNode('rh-fetch', 'Alertes RH', pos(240, 0), ctx, `${base}/api/internal/n8n/cron/rh-compliance-daily`),
      dispatchNode(
        'rh-dispatch',
        'Digest RH conformité',
        pos(480, 0),
        ctx,
        '"crm.rh.compliance.due"',
        '{ summary: ($json.data ?? $json).summary, expiringDocs: ($json.data ?? $json).expiringDocs, missingDossiers: ($json.data ?? $json).missingDossiers }',
        ['email', 'notification'],
      ),
    ], {
      'Cron 08h30': { main: [[{ node: 'Alertes RH', type: 'main', index: 0 }]] },
      'Alertes RH': { main: [[{ node: 'Digest RH conformité', type: 'main', index: 0 }]] },
    }),
  );

  // ── Cron équipements 08h45 ─────────────────────────────────────────────────
  workflows.push(
    wf('GSMS — Équipements quotidien', [
      scheduleTrigger('eq-cron', 'Cron 08h45', pos(0, 0), '45 8 * * *'),
      httpGetNode('eq-fetch', 'Alertes équipements', pos(240, 0), ctx, `${base}/api/internal/n8n/cron/equipment-alerts-daily`),
      dispatchNode(
        'eq-dispatch',
        'Digest équipements',
        pos(480, 0),
        ctx,
        '"crm.equipment.alert"',
        '{ summary: ($json.data ?? $json).summary, maintenanceDue: ($json.data ?? $json).maintenanceDue, outOfService: ($json.data ?? $json).outOfService, digest: true }',
        ['notification', 'email'],
      ),
    ], {
      'Cron 08h45': { main: [[{ node: 'Alertes équipements', type: 'main', index: 0 }]] },
      'Alertes équipements': { main: [[{ node: 'Digest équipements', type: 'main', index: 0 }]] },
    }),
  );

  // ── Cron backlog support 09h30 ─────────────────────────────────────────────
  workflows.push(
    wf('GSMS — Backlog support quotidien', [
      scheduleTrigger('sb-cron', 'Cron 09h30', pos(0, 0), '30 9 * * *'),
      httpGetNode('sb-fetch', 'Backlog support', pos(240, 0), ctx, `${base}/api/internal/n8n/cron/support-backlog-daily`),
      dispatchNode(
        'sb-dispatch',
        'Digest support',
        pos(480, 0),
        ctx,
        '"crm.support.backlog.due"',
        '{ summary: ($json.data ?? $json).summary, openCount: ($json.data ?? $json).openCount, staleCount: ($json.data ?? $json).staleCount, highPriority: ($json.data ?? $json).highPriority }',
        ['email', 'notification'],
      ),
    ], {
      'Cron 09h30': { main: [[{ node: 'Backlog support', type: 'main', index: 0 }]] },
      'Backlog support': { main: [[{ node: 'Digest support', type: 'main', index: 0 }]] },
    }),
  );

  // ── Cron satisfaction à froid J+45 (endpoint CRM déjà prêt) ───────────────
  workflows.push(
    wf('GSMS — Satisfaction à froid', [
      scheduleTrigger('sat-cold-cron', 'Cron 10h', pos(0, 0), '0 10 * * *'),
      httpGetNode(
        'sat-cold-fetch',
        'Envois J+45',
        pos(240, 0),
        ctx,
        `${base}/api/internal/n8n/cron/satisfaction-cold-followup`,
      ),
      dispatchNode(
        'sat-cold-dispatch',
        'Digest satisfaction froid',
        pos(480, 0),
        ctx,
        '"crm.satisfaction.cold.followup"',
        '{ candidates: ($json.data ?? $json).candidates ?? 0, invitesSent: ($json.data ?? $json).invitesSent ?? 0, invitesSkipped: ($json.data ?? $json).invitesSkipped ?? 0, summary: "Satisfaction à froid J+45 — " + (($json.data ?? $json).invitesSent ?? 0) + " envoi(s) / " + (($json.data ?? $json).candidates ?? 0) + " candidat(s)" }',
        ['notification', 'email'],
      ),
    ], {
      'Cron 10h': { main: [[{ node: 'Envois J+45', type: 'main', index: 0 }]] },
      'Envois J+45': { main: [[{ node: 'Digest satisfaction froid', type: 'main', index: 0 }]] },
    }),
  );

  // ── Cron satisfaction à chaud (sessions finies hier) ─────────────────────
  workflows.push(
    wf('GSMS — Satisfaction à chaud', [
      scheduleTrigger('sat-hot-cron', 'Cron 10h30', pos(0, 0), '30 10 * * *'),
      httpGetNode(
        'sat-hot-fetch',
        'Envois HOT hier',
        pos(240, 0),
        ctx,
        `${base}/api/internal/n8n/cron/satisfaction-hot-followup`,
      ),
      dispatchNode(
        'sat-hot-dispatch',
        'Digest satisfaction chaud',
        pos(480, 0),
        ctx,
        '"crm.satisfaction.hot.followup"',
        '{ sessionsConsidered: ($json.data ?? $json).sessionsConsidered ?? 0, candidates: ($json.data ?? $json).candidates ?? 0, invitesSent: ($json.data ?? $json).invitesSent ?? 0, invitesSkipped: ($json.data ?? $json).invitesSkipped ?? 0, surveysCreated: ($json.data ?? $json).surveysCreated ?? 0, summary: "Satisfaction à chaud — " + (($json.data ?? $json).invitesSent ?? 0) + " envoi(s) / " + (($json.data ?? $json).sessionsConsidered ?? 0) + " session(s) hier" }',
        ['notification', 'email'],
      ),
    ], {
      'Cron 10h30': { main: [[{ node: 'Envois HOT hier', type: 'main', index: 0 }]] },
      'Envois HOT hier': { main: [[{ node: 'Digest satisfaction chaud', type: 'main', index: 0 }]] },
    }),
  );

  // ── Cron relances convention J+2 / J+5 (WF-08) ────────────────────────────
  workflows.push(
    wf('GSMS — Relances convention', [
      scheduleTrigger('conv-rem-cron', 'Cron 09h15', pos(0, 0), '15 9 * * *'),
      httpGetNode(
        'conv-rem-fetch',
        'Relances convention',
        pos(240, 0),
        ctx,
        `${base}/api/internal/n8n/cron/convention-reminders`,
      ),
      dispatchNode(
        'conv-rem-dispatch',
        'Digest relances convention',
        pos(480, 0),
        ctx,
        '"crm.session.convention.reminder"',
        '{ remindedJ2: ($json.data ?? $json).remindedJ2 ?? 0, remindedJ5: ($json.data ?? $json).remindedJ5 ?? 0, skipped: ($json.data ?? $json).skipped ?? 0, summary: "Relances convention — J+2: " + (($json.data ?? $json).remindedJ2 ?? 0) + " · J+5: " + (($json.data ?? $json).remindedJ5 ?? 0) }',
        ['notification', 'email'],
      ),
    ], {
      'Cron 09h15': { main: [[{ node: 'Relances convention', type: 'main', index: 0 }]] },
      'Relances convention': { main: [[{ node: 'Digest relances convention', type: 'main', index: 0 }]] },
    }),
  );

  // ── Cron J-5 préparation pédagogique (WF-14) ──────────────────────────────
  workflows.push(
    wf('GSMS — J-5 préparation', [
      scheduleTrigger('j5-prep-cron', 'Cron 09h45', pos(0, 0), '45 9 * * *'),
      httpGetNode(
        'j5-prep-fetch',
        'Rappels J-5',
        pos(240, 0),
        ctx,
        `${base}/api/internal/n8n/cron/j5-prep-reminders`,
      ),
      dispatchNode(
        'j5-prep-dispatch',
        'Digest J-5 préparation',
        pos(480, 0),
        ctx,
        '"crm.session.j5.prep.reminder"',
        '{ sessionsConsidered: ($json.data ?? $json).sessionsConsidered ?? 0, remindersSent: ($json.data ?? $json).remindersSent ?? 0, positioningRelanced: ($json.data ?? $json).positioningRelanced ?? 0, adaptationReminded: ($json.data ?? $json).adaptationReminded ?? 0, skipped: ($json.data ?? $json).skipped ?? 0, summary: "J-5 préparation — " + (($json.data ?? $json).remindersSent ?? 0) + " rappel(s) / " + (($json.data ?? $json).sessionsConsidered ?? 0) + " session(s)" }',
        ['notification', 'email'],
      ),
    ], {
      'Cron 09h45': { main: [[{ node: 'Rappels J-5', type: 'main', index: 0 }]] },
      'Rappels J-5': { main: [[{ node: 'Digest J-5 préparation', type: 'main', index: 0 }]] },
    }),
  );

  // ── Cron risque de rupture (WF-19) ─────────────────────────────────────────
  workflows.push(
    wf('GSMS — Risque de rupture', [
      scheduleTrigger('dropout-cron', 'Cron 10h15', pos(0, 0), '15 10 * * *'),
      httpGetNode(
        'dropout-fetch',
        'Scan risque rupture',
        pos(240, 0),
        ctx,
        `${base}/api/internal/n8n/cron/dropout-risk-daily`,
      ),
      dispatchNode(
        'dropout-dispatch',
        'Digest risque rupture',
        pos(480, 0),
        ctx,
        '"crm.session.dropout.risk"',
        '{ flagged: ($json.data ?? $json).flagged ?? 0, skipped: ($json.data ?? $json).skipped ?? 0, notified: ($json.data ?? $json).notified ?? 0, summary: "Risque rupture — " + (($json.data ?? $json).flagged ?? 0) + " flag(s), " + (($json.data ?? $json).notified ?? 0) + " notif(s)" }',
        ['notification', 'email'],
      ),
    ], {
      'Cron 10h15': { main: [[{ node: 'Scan risque rupture', type: 'main', index: 0 }]] },
      'Scan risque rupture': { main: [[{ node: 'Digest risque rupture', type: 'main', index: 0 }]] },
    }),
  );

  // ── Parcours candidat (statut, conversion lead, clôture) ─────────────────
  workflows.push(
    wf('GSMS — Parcours candidat', [
      executeWorkflowTrigger('parcours-trigger'),
      switchOnEvent('parcours-switch', pos(240, 0), [
        { event: 'crm.candidature.status_changed', key: 'status' },
        { event: 'crm.lead.converted', key: 'lead' },
        { event: 'crm.candidature.parcours.completed', key: 'completed' },
        { event: 'crm.candidature.parcours.archived', key: 'archived' },
      ]),
      dispatchNode(
        'parcours-status',
        'Notif changement statut',
        pos(520, -120),
        ctx,
        '"crm.candidature.status_changed"',
        '$json.payload',
      ),
      dispatchNode(
        'parcours-lead',
        'Notif lead converti',
        pos(520, 0),
        ctx,
        '"crm.lead.converted"',
        '{ ...$json.payload, statusLabel: "Lead converti en dossier candidat" }',
      ),
      dispatchNode(
        'parcours-completed',
        'Notif parcours terminé',
        pos(520, 120),
        ctx,
        '"crm.candidature.parcours.completed"',
        '$json.payload',
      ),
      dispatchCandidateNode(
        'parcours-completed-mail',
        'Email parcours terminé',
        pos(760, 120),
        ctx,
        '"crm.candidature.parcours.completed"',
        '$json.payload',
        '$json.payload.email',
        '"Félicitations — parcours terminé"',
        '"Bonjour, votre parcours de formation est terminé. Votre attestation est disponible dans votre espace candidat."',
      ),
      dispatchNode(
        'parcours-archived',
        'Notif dossier archivé',
        pos(520, 240),
        ctx,
        '"crm.candidature.parcours.archived"',
        '$json.payload',
      ),
    ], {
      'Execute Workflow Trigger': { main: [[{ node: 'Switch event', type: 'main', index: 0 }]] },
      'Switch event': {
        main: [
          [{ node: 'Notif changement statut', type: 'main', index: 0 }],
          [{ node: 'Notif lead converti', type: 'main', index: 0 }],
          [{ node: 'Notif parcours terminé', type: 'main', index: 0 }],
          [{ node: 'Notif dossier archivé', type: 'main', index: 0 }],
        ],
      },
      'Notif parcours terminé': { main: [[{ node: 'Email parcours terminé', type: 'main', index: 0 }]] },
    }),
  );

  // ── Salles & réservations ──────────────────────────────────────────────────
  workflows.push(
    wf('GSMS — Salles', [
      executeWorkflowTrigger('room-trigger'),
      dispatchNode(
        'room-ops',
        'Alerte salle',
        pos(280, 0),
        ctx,
        '"crm.room.alert"',
        '$json.payload',
        ['notification', 'email'],
      ),
    ], {
      'Execute Workflow Trigger': { main: [[{ node: 'Alerte salle', type: 'main', index: 0 }]] },
    }),
  );

  // ── Marketing campagnes ────────────────────────────────────────────────────
  workflows.push(
    wf('GSMS — Marketing campagnes', [
      executeWorkflowTrigger('mkt-trigger'),
      switchOnEvent('mkt-switch', pos(240, 0), [
        { event: 'crm.marketing.campaign.created', key: 'created' },
        { event: 'crm.marketing.campaign.activated', key: 'activated' },
      ]),
      dispatchNode(
        'mkt-created',
        'Notif campagne créée',
        pos(520, -40),
        ctx,
        '"crm.marketing.campaign.created"',
        '$json.payload',
        ['notification'],
      ),
      dispatchNode(
        'mkt-activated',
        'Notif campagne active',
        pos(520, 80),
        ctx,
        '"crm.marketing.campaign.activated"',
        '$json.payload',
        ['notification', 'email'],
      ),
    ], {
      'Execute Workflow Trigger': { main: [[{ node: 'Switch event', type: 'main', index: 0 }]] },
      'Switch event': {
        main: [
          [{ node: 'Notif campagne créée', type: 'main', index: 0 }],
          [{ node: 'Notif campagne active', type: 'main', index: 0 }],
        ],
      },
    }),
  );

  // ── CMS publication ────────────────────────────────────────────────────────
  workflows.push(
    wf('GSMS — CMS publication', [
      executeWorkflowTrigger('cms-trigger'),
      switchOnEvent('cms-switch', pos(240, 0), [
        { event: 'crm.cms.catalog.synced', key: 'catalog' },
        { event: 'crm.cms.formation.visibility_changed', key: 'formation' },
        { event: 'crm.cms.landing.updated', key: 'landing' },
        { event: 'crm.cms.team.synced', key: 'team' },
      ]),
      dispatchNode(
        'cms-catalog',
        'Notif sync catalogue',
        pos(520, -120),
        ctx,
        '"crm.cms.catalog.synced"',
        '$json.payload',
        ['notification'],
      ),
      dispatchNode(
        'cms-formation',
        'Notif formation catalogue',
        pos(520, -20),
        ctx,
        '"crm.cms.formation.visibility_changed"',
        '$json.payload',
        ['notification'],
      ),
      dispatchNode(
        'cms-landing',
        'Notif landing config',
        pos(520, 80),
        ctx,
        '"crm.cms.landing.updated"',
        '$json.payload',
        ['notification'],
      ),
      dispatchNode(
        'cms-team',
        'Notif équipe landing',
        pos(520, 180),
        ctx,
        '"crm.cms.team.synced"',
        '$json.payload',
        ['notification'],
      ),
    ], {
      'Execute Workflow Trigger': { main: [[{ node: 'Switch event', type: 'main', index: 0 }]] },
      'Switch event': {
        main: [
          [{ node: 'Notif sync catalogue', type: 'main', index: 0 }],
          [{ node: 'Notif formation catalogue', type: 'main', index: 0 }],
          [{ node: 'Notif landing config', type: 'main', index: 0 }],
          [{ node: 'Notif équipe landing', type: 'main', index: 0 }],
        ],
      },
    }),
  );

  // ── Sécurité IAM ───────────────────────────────────────────────────────────
  workflows.push(
    wf('GSMS — Sécurité IAM', [
      executeWorkflowTrigger('iam-trigger'),
      switchOnEvent('iam-switch', pos(240, 0), [
        { event: 'crm.security.user.created', key: 'user-create' },
        { event: 'crm.security.user.updated', key: 'user-update' },
        { event: 'crm.security.user.deactivated', key: 'user-off' },
        { event: 'crm.security.role.created', key: 'role-create' },
        { event: 'crm.security.role.permissions_changed', key: 'role-perms' },
      ]),
      dispatchNode(
        'iam-user-create',
        'Notif utilisateur créé',
        pos(520, -160),
        ctx,
        '"crm.security.user.created"',
        '$json.payload',
        ['notification', 'email'],
      ),
      dispatchNode(
        'iam-user-update',
        'Notif utilisateur modifié',
        pos(520, -40),
        ctx,
        '"crm.security.user.updated"',
        '$json.payload',
        ['notification', 'email'],
      ),
      dispatchNode(
        'iam-user-off',
        'Notif utilisateur désactivé',
        pos(520, 80),
        ctx,
        '"crm.security.user.deactivated"',
        '$json.payload',
        ['notification', 'email'],
      ),
      dispatchNode(
        'iam-role-create',
        'Notif rôle créé',
        pos(520, 200),
        ctx,
        '"crm.security.role.created"',
        '$json.payload',
        ['notification'],
      ),
      dispatchNode(
        'iam-role-perms',
        'Notif permissions rôle',
        pos(520, 320),
        ctx,
        '"crm.security.role.permissions_changed"',
        '$json.payload',
        ['notification', 'email'],
      ),
    ], {
      'Execute Workflow Trigger': { main: [[{ node: 'Switch event', type: 'main', index: 0 }]] },
      'Switch event': {
        main: [
          [{ node: 'Notif utilisateur créé', type: 'main', index: 0 }],
          [{ node: 'Notif utilisateur modifié', type: 'main', index: 0 }],
          [{ node: 'Notif utilisateur désactivé', type: 'main', index: 0 }],
          [{ node: 'Notif rôle créé', type: 'main', index: 0 }],
          [{ node: 'Notif permissions rôle', type: 'main', index: 0 }],
        ],
      },
    }),
  );

  return workflows;
}

export function buildRouter(ctx) {
  const ids = ctx.workflowIds || {};
  const rules = [
    { event: 'landing.contact.submitted', key: 'contact', wf: 'GSMS — Support contact' },
    { event: 'landing.preinscription.created', key: 'preinscription', wf: 'GSMS — Acquisition' },
    { event: 'landing.quote.requested', key: 'devis', wf: 'GSMS — Acquisition' },
    { event: 'crm.candidature.created', key: 'candidature', wf: 'GSMS — Acquisition' },
    { event: 'crm.candidature.status_changed', key: 'status', wf: 'GSMS — Parcours candidat' },
    { event: 'crm.lead.converted', key: 'lead', wf: 'GSMS — Parcours candidat' },
    { event: 'crm.candidature.parcours.completed', key: 'parcours-done', wf: 'GSMS — Parcours candidat' },
    { event: 'crm.candidature.parcours.archived', key: 'parcours-archive', wf: 'GSMS — Parcours candidat' },
    { event: 'crm.candidature.session.enrolled', key: 'session', wf: 'GSMS — Circuit session' },
    { event: 'crm.candidature.exam.recorded', key: 'examen', wf: 'GSMS — Post-examen' },
    { event: 'crm.candidature.attestation.issued', key: 'attestation', wf: 'GSMS — Attestation délivrée' },
    { event: 'crm.finance.payment.recorded', key: 'paiement', wf: 'GSMS — Finance paiement' },
    { event: 'crm.finance.devis.created', key: 'devis-created', wf: 'GSMS — Finance devis' },
    { event: 'crm.finance.devis.sent', key: 'devis-sent', wf: 'GSMS — Finance devis' },
    { event: 'crm.finance.devis.accepted', key: 'devis-accepted', wf: 'GSMS — Finance devis' },
    { event: 'crm.support.ticket.created', key: 'ticket', wf: 'GSMS — Support ticket' },
    { event: 'crm.equipment.alert', key: 'equipment', wf: 'GSMS — Équipements' },
    { event: 'crm.compliance.document.expiring', key: 'compliance-exp', wf: 'GSMS — Conformité documents' },
    { event: 'crm.compliance.document.missing', key: 'compliance-miss', wf: 'GSMS — Conformité documents' },
    { event: 'crm.compliance.document.requested', key: 'compliance-req', wf: 'GSMS — Conformité documents' },
    { event: 'crm.room.alert', key: 'room', wf: 'GSMS — Salles' },
    { event: 'crm.marketing.campaign.created', key: 'mkt-created', wf: 'GSMS — Marketing campagnes' },
    { event: 'crm.marketing.campaign.activated', key: 'mkt-active', wf: 'GSMS — Marketing campagnes' },
    { event: 'crm.cms.catalog.synced', key: 'cms-catalog', wf: 'GSMS — CMS publication' },
    { event: 'crm.cms.formation.visibility_changed', key: 'cms-formation', wf: 'GSMS — CMS publication' },
    { event: 'crm.cms.landing.updated', key: 'cms-landing', wf: 'GSMS — CMS publication' },
    { event: 'crm.cms.team.synced', key: 'cms-team', wf: 'GSMS — CMS publication' },
    { event: 'crm.security.user.created', key: 'iam-user-create', wf: 'GSMS — Sécurité IAM' },
    { event: 'crm.security.user.updated', key: 'iam-user-update', wf: 'GSMS — Sécurité IAM' },
    { event: 'crm.security.user.deactivated', key: 'iam-user-off', wf: 'GSMS — Sécurité IAM' },
    { event: 'crm.security.role.created', key: 'iam-role-create', wf: 'GSMS — Sécurité IAM' },
    { event: 'crm.security.role.permissions_changed', key: 'iam-role-perms', wf: 'GSMS — Sécurité IAM' },
  ];

  const nodes = [
    {
      id: 'router-webhook',
      name: 'Webhook GSMS',
      type: 'n8n-nodes-base.webhook',
      typeVersion: 2,
      position: pos(0, 0),
      webhookId: 'gsms-standard-router',
      parameters: {
        httpMethod: 'POST',
        path: 'gsms/standard',
        responseMode: 'onReceived',
        options: {},
      },
    },
    switchOnEvent('router-switch', pos(280, 0), rules),
    {
      id: 'router-respond',
      name: 'Respond OK',
      type: 'n8n-nodes-base.respondToWebhook',
      typeVersion: 1.1,
      position: pos(900, 240),
      parameters: {
        respondWith: 'json',
        responseBody: '={{ { received: true, event: $json.event } }}',
      },
    },
  ];

  const connections = {
    'Webhook GSMS': { main: [[{ node: 'Switch event', type: 'main', index: 0 }]] },
  };

  const switchConnections = [];
  for (const r of rules) {
    const wfId = ids[r.wf];
    if (!wfId) continue;
    const nodeName = `Exec ${r.key}`;
    nodes.push(executeSub(`router-exec-${r.key}`, nodeName, pos(560, switchConnections.length * 70 - 210), wfId));
    switchConnections.push([{ node: nodeName, type: 'main', index: 0 }]);
  }
  switchConnections.push([{ node: 'Respond OK', type: 'main', index: 0 }]);
  connections['Switch event'] = { main: switchConnections };

  for (const r of rules) {
    const nodeName = `Exec ${r.key}`;
    if (nodes.some((n) => n.name === nodeName)) {
      connections[nodeName] = { main: [[{ node: 'Respond OK', type: 'main', index: 0 }]] };
    }
  }

  return wf('GSMS — Router événements', nodes, connections);
}
