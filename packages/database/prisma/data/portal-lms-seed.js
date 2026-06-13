/** Contenu LMS portail candidat — 1 Course par Formation, 1 chapitre (UV) + quiz par module programme. */

const PRE_CNAPS_FREE_CHAPTER_COUNT = 2;

function asRecord(v) {
  return v != null && typeof v === 'object' && !Array.isArray(v) ? v : null;
}

function parseProgramModules(formation) {
  const raw = formation.programModules;
  if (Array.isArray(raw) && raw.length > 0) {
    return raw.map((item, i) => {
      if (typeof item === 'string' && item.trim()) {
        return { id: `UV${i + 1}`, title: item.trim(), details: [] };
      }
      const o = asRecord(item);
      if (!o) return { id: `UV${i + 1}`, title: `Module ${i + 1}`, details: [] };
      const id = typeof o.id === 'string' && o.id.trim() ? o.id.trim() : `UV${i + 1}`;
      const title =
        typeof o.title === 'string' && o.title.trim() ? o.title.trim() : `Module ${i + 1}`;
      const details = Array.isArray(o.details)
        ? o.details.filter((d) => typeof d === 'string' && d.trim()).map((d) => d.trim())
        : [];
      return { id, title, details };
    });
  }

  const modules = Array.isArray(formation.modules) ? formation.modules : [];
  return modules.map((title, i) => {
    const label = typeof title === 'string' && title.trim() ? title.trim() : `Module ${i + 1}`;
    return {
      id: `UV${i + 1}`,
      title: label,
      details: [`Approfondissement des objectifs du module « ${label} ».`],
    };
  });
}

function chapterTitle(uv) {
  return `${uv.id} — ${uv.title}`;
}

function markdownForUv(uv, isFree) {
  const lines = [`## ${chapterTitle(uv)}`, ''];
  if (uv.details.length) {
    lines.push('### Contenu du module', '');
    for (const d of uv.details) lines.push(`- ${d}`);
    lines.push('');
  }
  lines.push(
    isFree
      ? '> **Préparation CNAPS** — accessible pendant l’instruction de votre dossier.'
      : '> **Stagiaire** — contenu débloqué après validation administrative.',
    '',
    '### Objectifs',
    '- Comprendre les notions clés avant la session en centre',
    '- Réviser le cadre réglementaire et les bonnes pratiques',
    '- Valider vos acquis via le quiz en fin de leçon',
  );
  return lines.join('\n');
}

function quizContentForUv(formationSlug, uv) {
  const detailPrompt =
    uv.details[0] ?? `Maîtriser les objectifs du module « ${uv.title} »`;
  const altWrong = uv.details[1] ?? 'Ignorer le référentiel réglementaire';

  const questions = [
    {
      id: `${formationSlug}-${uv.id}-q1`,
      prompt: `Concernant « ${uv.title} », quelle affirmation est correcte ?`,
      choices: [detailPrompt, altWrong, 'Aucune réglementation ne s’applique à ce module'],
      correctIndex: 0,
    },
    {
      id: `${formationSlug}-${uv.id}-q2`,
      prompt: `Avant de valider ${uv.id}, vous devez :`,
      choices: [
        'Avoir parcouru la synthèse et réussi le quiz',
        'Ignorer les évaluations en ligne',
        'Refuser toute mise en situation',
      ],
      correctIndex: 0,
    },
  ];

  return {
    content: {
      passScore: 50,
      questions: questions.map(({ id, prompt, choices }) => ({ id, prompt, choices })),
    },
    details: {
      questions: questions.map(({ id, correctIndex }) => ({ id, correctIndex })),
    },
  };
}

async function ensureCourseForFormation(tx, formation, adminId) {
  let courseId = formation.courseId;
  if (!courseId) {
    courseId = `lms-${formation.slug}`;
    await tx.course.upsert({
      where: { id: courseId },
      create: {
        id: courseId,
        title: formation.name,
        description: formation.description ?? formation.longDescription ?? null,
        createdById: adminId,
        isPublished: true,
      },
      update: {
        title: formation.name,
        description: formation.description ?? formation.longDescription ?? null,
        isPublished: true,
      },
    });
    await tx.formation.update({
      where: { id: formation.id },
      data: { courseId },
    });
    return { courseId, linked: true };
  }
  return { courseId, linked: false };
}

async function rebuildCourseChapters(tx, { courseId, formation, adminId }) {
  const uvList = parseProgramModules(formation);
  if (uvList.length === 0) return 0;

  const existingCount = await tx.chapter.count({ where: { courseId } });
  if (existingCount > 0 && existingCount !== uvList.length) {
    await tx.chapter.deleteMany({ where: { courseId } });
  } else if (existingCount === uvList.length) {
    return 0;
  }

  let created = 0;
  for (let i = 0; i < uvList.length; i++) {
    const uv = uvList[i];
    const isFree = i < PRE_CNAPS_FREE_CHAPTER_COUNT;

    const chapter = await tx.chapter.create({
      data: {
        title: chapterTitle(uv),
        description: `E-learning — ${uv.title}`,
        position: i + 1,
        isPublished: true,
        isFree,
        courseId,
      },
    });
    created += 1;

    await tx.activity.create({
      data: {
        name: 'Synthèse',
        type: 'DYNAMIC',
        subType: 'DYNAMIC_MARKDOWN',
        position: 1,
        isPublished: true,
        chapterId: chapter.id,
        lastModifiedById: adminId,
        content: { markdown: markdownForUv(uv, isFree) },
      },
    });

    await tx.activity.create({
      data: {
        name: 'Vidéo',
        type: 'VIDEO',
        subType: 'VIDEO_YOUTUBE',
        position: 2,
        isPublished: true,
        chapterId: chapter.id,
        lastModifiedById: adminId,
        content: {
          youtubeId: 'dQw4w9WgXcQ',
          caption: `Vidéo de démonstration — ${uv.id} ${uv.title}.`,
        },
      },
    });

    const quiz = quizContentForUv(formation.slug, uv);

    await tx.activity.create({
      data: {
        name: 'Quiz',
        type: 'QUIZ',
        subType: 'QUIZ_MULTIPLE_CHOICE',
        position: 3,
        isPublished: true,
        chapterId: chapter.id,
        lastModifiedById: adminId,
        content: quiz.content,
        details: quiz.details,
      },
    });
  }

  return created;
}

async function seedPortalLmsEnrollments(tx) {
  const candidatures = await tx.candidature.findMany({
    where: {
      formationId: { not: null },
      status: {
        in: [
          'VALIDATED',
          'COMPLETED',
          'PENDING_CNAPS',
          'CNAPS_APPROVED',
          'SUBMITTED',
          'VALIDATION_PENDING',
          'MISSING_DOCUMENTS',
        ],
      },
    },
    select: {
      id: true,
      userId: true,
      status: true,
      formation: { select: { courseId: true } },
    },
  });

  let enrollments = 0;
  for (const c of candidatures) {
    const courseId = c.formation?.courseId;
    if (!courseId) continue;

    const existing = await tx.enrollment.findFirst({
      where: { userId: c.userId, courseId, sessionId: null },
    });
    if (existing) continue;

    const status =
      c.status === 'VALIDATED' || c.status === 'COMPLETED' ? 'VALIDATED' : 'PENDING';

    await tx.enrollment.create({
      data: {
        userId: c.userId,
        courseId,
        sessionId: null,
        status,
        notes: 'Inscription e-learning portail (seed).',
      },
    });
    enrollments += 1;
  }

  if (enrollments > 0) {
    console.log(`[seed] portal-lms: ${enrollments} inscriptions LMS créées.`);
  }
}

async function seedPortalLmsContent(tx) {
  const admin = await tx.user.findFirst({
    where: { email: 'samir.iggui@ecole.local' },
    select: { id: true },
  });
  if (!admin) {
    console.warn('[seed] portal-lms: superadmin introuvable — ignoré.');
    return;
  }

  const formations = await tx.formation.findMany({
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      longDescription: true,
      modules: true,
      programModules: true,
      courseId: true,
    },
  });

  let coursesLinked = 0;
  let chaptersCreated = 0;

  for (const formation of formations) {
    const uvList = parseProgramModules(formation);
    if (uvList.length === 0) continue;

    const { courseId, linked } = await ensureCourseForFormation(tx, formation, admin.id);
    if (linked) coursesLinked += 1;

    chaptersCreated += await rebuildCourseChapters(tx, {
      courseId,
      formation,
      adminId: admin.id,
    });
  }

  console.log(
    `[seed] portal-lms: ${coursesLinked} cours liés, ${chaptersCreated} chapitres (UV) créés (${formations.length} formations).`,
  );

  await migrateQuizAnswerKeysToDetails(tx);
  await seedMuxDemoPlayback(tx);
  await seedQuizQuestionBank(tx, admin.id);
}

/** Flux HLS public Mux (Big Buck Bunny) — test-streams.mux.dev, pas un asset stream.mux.com. */
const MUX_DEMO_PLAYBACK_ID = 'x36xhzz';
const MUX_DEMO_ASSET_ID = 'demo-big-buck-bunny';

async function seedMuxDemoPlayback(tx) {
  const course = await tx.course.findFirst({
    where: { id: 'lms-tfp-aps' },
    select: {
      chapters: {
        where: { isPublished: true },
        orderBy: { position: 'asc' },
        take: 1,
        select: { id: true, muxData: true },
      },
    },
  });
  const chapter = course?.chapters[0];
  if (!chapter || chapter.muxData) return;

  await tx.muxData.create({
    data: {
      chapterId: chapter.id,
      assetId: MUX_DEMO_ASSET_ID,
      playbackId: MUX_DEMO_PLAYBACK_ID,
    },
  });
  console.log(`[seed] portal-lms: Mux démo (${MUX_DEMO_PLAYBACK_ID}) sur UV1 TFP APS.`);
}

async function seedQuizQuestionBank(tx, adminId) {
  const formation = await tx.formation.findFirst({
    where: { courseId: 'lms-tfp-aps' },
    select: { id: true },
  });
  if (!formation) return;

  const existing = await tx.quizQuestionBank.findFirst({
    where: { formationId: formation.id },
    select: { id: true },
  });
  if (existing) return;

  const bank = await tx.quizQuestionBank.create({
    data: {
      title: 'Banque QCM — TFP APS',
      formationId: formation.id,
      courseId: 'lms-tfp-aps',
      createdById: adminId,
    },
  });

  const items = [
    {
      position: 1,
      prompt: 'Quelle est la mission principale d’un agent de sécurité privée ?',
      choices: ['Prévenir les infractions et protéger les personnes et biens', 'Effectuer des arrestations judiciaires', 'Remplacer les forces de l’ordre', 'Contrôler la fiscalité des entreprises'],
      correctIndex: 0,
      tags: ['fondamentaux'],
    },
    {
      position: 2,
      prompt: 'Le code de déontologie s’applique :',
      choices: ['Uniquement en mission événementielle', 'À toute activité de sécurité privée', 'Seulement la nuit', 'Uniquement pour les SSIAP'],
      correctIndex: 1,
      tags: ['déontologie'],
    },
    {
      position: 3,
      prompt: 'En cas d’incident, la priorité est :',
      choices: ['Filmer pour les réseaux sociaux', 'Sécuriser les personnes puis alerter', 'Quitter les lieux', 'Confrontation directe'],
      correctIndex: 1,
      tags: ['procédure'],
    },
  ];

  for (const item of items) {
    await tx.quizQuestionBankItem.create({
      data: {
        bankId: bank.id,
        position: item.position,
        prompt: item.prompt,
        choices: item.choices,
        correctIndex: item.correctIndex,
        tags: item.tags,
      },
    });
  }

  console.log(`[seed] portal-lms: banque QCM TFP APS (${items.length} questions).`);
}

async function migrateQuizAnswerKeysToDetails(tx) {
  const rows = await tx.activity.findMany({
    where: { subType: 'QUIZ_MULTIPLE_CHOICE' },
    select: { id: true, content: true, details: true },
  });

  let updated = 0;
  for (const row of rows) {
    const content = row.content && typeof row.content === 'object' ? row.content : {};
    const details =
      row.details && typeof row.details === 'object' && !Array.isArray(row.details)
        ? row.details
        : {};
    const detailQuestions = details.questions;
    if (Array.isArray(detailQuestions) && detailQuestions.length > 0) continue;

    const questions = content.questions;
    if (!Array.isArray(questions) || questions.length === 0) continue;

    const stripped = [];
    const keys = [];
    for (const item of questions) {
      if (!item || typeof item !== 'object') continue;
      const id = typeof item.id === 'string' ? item.id : null;
      const prompt = typeof item.prompt === 'string' ? item.prompt : null;
      const choices = Array.isArray(item.choices)
        ? item.choices.filter((c) => typeof c === 'string')
        : [];
      const correctIndex = typeof item.correctIndex === 'number' ? item.correctIndex : null;
      if (!id || !prompt) continue;
      stripped.push({ id, prompt, choices });
      if (correctIndex != null) keys.push({ id, correctIndex });
    }

    if (keys.length === 0) continue;

    await tx.activity.update({
      where: { id: row.id },
      data: {
        content: { ...content, questions: stripped },
        details: { questions: keys },
      },
    });
    updated += 1;
  }

  if (updated > 0) {
    console.log(`[seed] portal-lms: ${updated} quiz migrés (réponses → details serveur).`);
  }
}

/** Annonces portail candidat (formation entière + session ciblée). */
async function seedPortalAnnouncements(tx) {
  const sessions = await tx.formationSession.findMany({
    take: 5,
    orderBy: { startDate: 'asc' },
    select: { id: true, formationId: true, dateDisplayLabel: true },
  });

  if (sessions.length === 0) {
    console.warn('[seed] portal-announcements: aucune session — ignoré.');
    return;
  }

  const byFormation = new Map();
  for (const s of sessions) {
    if (!byFormation.has(s.formationId)) byFormation.set(s.formationId, s);
  }

  let created = 0;
  for (const [formationId, session] of byFormation) {
    const rows = [
      {
        id: `portal-ann-formation-${formationId.slice(0, 8)}`,
        formationId,
        sessionId: null,
        title: 'Bienvenue sur votre espace e-formation',
        content:
          'Les modules de préparation CNAPS sont accessibles dès validation de votre dossier. Le reste du programme s\'ouvre au démarrage de votre session en centre.',
        publishedAt: new Date(Date.now() - 7 * 86400000),
      },
      {
        id: `portal-ann-session-${session.id.slice(0, 8)}`,
        formationId,
        sessionId: session.id,
        title: `Session ${session.dateDisplayLabel} — informations pratiques`,
        content:
          'Merci de vous présenter 15 minutes avant le début du cours avec votre pièce d\'identité. Tenue professionnelle exigée. Consultez votre parcours en ligne pour réviser les UV 1 et 2 avant l\'entrée en centre.',
        publishedAt: new Date(Date.now() - 2 * 86400000),
      },
    ];

    for (const row of rows) {
      await tx.portalSessionAnnouncement.upsert({
        where: { id: row.id },
        create: { ...row, isPublished: true },
        update: {
          title: row.title,
          content: row.content,
          isPublished: true,
          publishedAt: row.publishedAt,
        },
      });
      created += 1;
    }
  }

  console.log(`[seed] portal-announcements: ${created} annonce(s) portail.`);
}

module.exports = {
  seedPortalLmsContent,
  seedPortalLmsEnrollments,
  seedPortalAnnouncements,
  parseProgramModules,
  PRE_CNAPS_FREE_CHAPTER_COUNT,
};
