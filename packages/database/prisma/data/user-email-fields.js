/**
 * email = personnel (contact : accès, reset, infos candidat)
 * proEmail = connexion app (prenom.nom@fqdn) + rapports / workers / workflows
 *   APP_LOGIN_EMAIL_DOMAIN : ecole.local (dev) | fqdn client (prod)
 */

const bcrypt = require('bcrypt');

const LEGACY_APP_LOGIN_SUFFIXES = ['@ecole.local', '@app.lms.local'];

function getAppLoginEmailDomain() {
  const raw = (process.env.APP_LOGIN_EMAIL_DOMAIN || 'ecole.local').trim();
  return raw.startsWith('@') ? raw.slice(1) : raw;
}

function appLoginSuffixes() {
  const domain = `@${getAppLoginEmailDomain()}`;
  return [...new Set([domain, ...LEGACY_APP_LOGIN_SUFFIXES])];
}

const PERSONAL_DOMAINS = ['gmail.com', 'outlook.fr', 'yahoo.fr', 'orange.fr', 'free.fr', 'icloud.com'];

function isAppLoginEmail(value) {
  if (!value || typeof value !== 'string') return false;
  const e = value.trim().toLowerCase();
  return appLoginSuffixes().some((suffix) => e.endsWith(suffix));
}

function slugifyName(input) {
  return String(input || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/(^\.|\.$)/g, '');
}

function slugFromUser(user) {
  const first = user.firstName?.trim();
  const last = user.lastName?.trim();
  if (first && last) return slugifyName(`${first}.${last}`);
  if (user.name?.trim()) return slugifyName(user.name);
  if (user.email?.includes('@')) return slugifyName(user.email.split('@')[0]);
  if (user.proEmail?.includes('@')) return slugifyName(user.proEmail.split('@')[0]);
  return slugifyName(user.id?.slice(0, 8) || 'user');
}

function toAppLoginEmail(slug) {
  return `${slug}@${getAppLoginEmailDomain()}`;
}

function toPersonalEmail(slug, seed = 0) {
  const domain = PERSONAL_DOMAINS[Math.abs(seed) % PERSONAL_DOMAINS.length];
  return `${slug}@${domain}`;
}

/**
 * Deduit la paire correcte a partir de l'etat actuel (seed legacy ou formulaire CRM).
 */
function resolveEmailPair(user, seed = 0) {
  const slug = slugFromUser(user);
  const currentEmail = user.email?.trim() || '';
  const currentPro = user.proEmail?.trim() || '';

  const emailIsApp = isAppLoginEmail(currentEmail);
  const proIsApp = isAppLoginEmail(currentPro);

  // Deja correct : personnel dans email, login dans proEmail
  if (!emailIsApp && proIsApp) {
    return { email: currentEmail, proEmail: currentPro };
  }

  // Inverse classique seed : login dans email, proEmail vide
  if (emailIsApp && !currentPro) {
    return {
      email: toPersonalEmail(slug, seed),
      proEmail: currentEmail,
    };
  }

  // Inverse : login dans email, personnel dans proEmail (ex. superadmin mal seede)
  if (emailIsApp && currentPro && !proIsApp) {
    return {
      email: currentPro,
      proEmail: currentEmail,
    };
  }

  // Personnel seul, pas de login app
  if (!emailIsApp && !currentPro) {
    return {
      email: currentEmail || toPersonalEmail(slug, seed),
      proEmail: toAppLoginEmail(slug),
    };
  }

  // Deux emails non-app (ex. direction) : garder le plus "contact" en personnel, generer login
  if (!emailIsApp && currentPro && !proIsApp) {
    const personal = currentPro.includes('gmail') || currentPro.includes('yahoo') ? currentPro : currentEmail;
    return {
      email: personal,
      proEmail: toAppLoginEmail(slug),
    };
  }

  // Fallback
  return {
    email: toPersonalEmail(slug, seed),
    proEmail: emailIsApp ? currentEmail : toAppLoginEmail(slug),
  };
}

async function emailTaken(prisma, email, excludeId) {
  if (!email) return false;
  const row = await prisma.user.findFirst({
    where: { email, ...(excludeId ? { NOT: { id: excludeId } } : {}) },
    select: { id: true },
  });
  return Boolean(row);
}

async function proEmailTaken(prisma, proEmail, excludeId) {
  if (!proEmail) return false;
  const row = await prisma.user.findFirst({
    where: {
      proEmail: { equals: proEmail, mode: 'insensitive' },
      ...(excludeId ? { NOT: { id: excludeId } } : {}),
    },
    select: { id: true },
  });
  return Boolean(row);
}

async function ensureUniquePersonalEmail(prisma, baseEmail, userId, seed) {
  let candidate = baseEmail;
  let attempt = 0;
  while (await emailTaken(prisma, candidate, userId)) {
    attempt += 1;
    const [local, domain] = baseEmail.split('@');
    candidate = `${local}.${attempt}@${domain || 'gmail.com'}`;
    if (attempt > 20) {
      candidate = toPersonalEmail(slugifyName(userId), seed + attempt);
    }
  }
  return candidate;
}

/** Évite d’écraser le login d’un superadmin / staff déjà existant (ex. préinscription Samir). */
async function ensureUniqueProEmail(prisma, baseProEmail, userId) {
  if (!baseProEmail) return baseProEmail;
  let candidate = baseProEmail;
  let attempt = 0;
  while (await proEmailTaken(prisma, candidate, userId)) {
    attempt += 1;
    const [local, domain] = baseProEmail.split('@');
    candidate = `${local}.u${attempt}@${domain || 'ecole.local'}`;
    if (attempt > 30) {
      candidate = `user.${slugifyName(userId).slice(0, 12)}@${domain || 'ecole.local'}`;
      break;
    }
  }
  return candidate;
}

async function ensureUserEmailSplit(prisma) {
  const users = await prisma.user.findMany({
    where: { isTrashed: false },
    select: {
      id: true,
      email: true,
      proEmail: true,
      firstName: true,
      lastName: true,
      name: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  let updated = 0;
  let skipped = 0;

  for (let i = 0; i < users.length; i += 1) {
    const user = users[i];
    const target = resolveEmailPair(user, i);
    const personal = await ensureUniquePersonalEmail(prisma, target.email, user.id, i);
    const proEmail = await ensureUniqueProEmail(prisma, target.proEmail, user.id);

    const unchanged =
      user.email === personal &&
      (user.proEmail || '') === (proEmail || '');

    if (unchanged) {
      skipped += 1;
      continue;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        email: personal,
        proEmail,
      },
    });
    updated += 1;
  }

  console.log(
    `[seed] Emails utilisateurs : ${updated} corriges (personnel vs pro), ${skipped} deja OK.`,
  );
  return { updated, skipped, total: users.length };
}

async function findUserByAppLogin(prisma, loginEmail) {
  if (!loginEmail) return null;
  const normalized = loginEmail.trim().toLowerCase();
  return prisma.user.findFirst({
    where: {
      OR: [{ proEmail: normalized }, { email: normalized }],
    },
  });
}

const DIRECTOR_LOGIN_EMAIL = 'yassine.hidjeb@ecole.local';
const DIRECTOR_PERSONAL_EMAIL = 'contact-formssi@gmail.com';
const DIRECTOR_LEGACY_EMAILS = [
  'yassine.hidjeb@form-ssi.fr',
  DIRECTOR_PERSONAL_EMAIL,
  DIRECTOR_LOGIN_EMAIL,
];

/** Fusionne l'ancien compte directeur (form-ssi.fr) vers proEmail @ecole.local. */
async function ensureDirectorAccount(prisma) {
  const hashedPassword = await bcrypt.hash('demo1234', 10);
  const adminRole = await prisma.userRole.findFirst({
    where: { slug: 'admin' },
    select: { id: true },
  });
  if (!adminRole?.id) return null;

  const candidates = await prisma.user.findMany({
    where: {
      isTrashed: false,
      OR: [
        { email: { in: DIRECTOR_LEGACY_EMAILS } },
        { proEmail: DIRECTOR_LOGIN_EMAIL },
        { AND: [{ firstName: 'Yassine' }, { lastName: 'HIDJEB' }] },
        { name: { contains: 'Yassine HIDJEB', mode: 'insensitive' } },
      ],
    },
    orderBy: { createdAt: 'asc' },
  });

  let director = candidates[0] ?? null;

  if (director) {
    director = await prisma.user.update({
      where: { id: director.id },
      data: {
        email: DIRECTOR_PERSONAL_EMAIL,
        proEmail: DIRECTOR_LOGIN_EMAIL,
        password: hashedPassword,
        name: 'Yassine HIDJEB',
        firstName: 'Yassine',
        lastName: 'HIDJEB',
        roleId: adminRole.id,
        status: 'ACTIVE',
        isProtected: true,
        isTrashed: false,
        jobFunction: "Directeur de l'école",
        qualification: 'Gérant · Pilotage stratégique CFA',
        phone: '01 71 11 39 63',
        userCategory: 'INTERNAL',
      },
    });
  } else {
    director = await prisma.user.create({
      data: {
        email: DIRECTOR_PERSONAL_EMAIL,
        proEmail: DIRECTOR_LOGIN_EMAIL,
        password: hashedPassword,
        name: 'Yassine HIDJEB',
        firstName: 'Yassine',
        lastName: 'HIDJEB',
        roleId: adminRole.id,
        status: 'ACTIVE',
        isProtected: true,
        jobFunction: "Directeur de l'école",
        qualification: 'Gérant · Pilotage stratégique CFA',
        phone: '01 71 11 39 63',
        userCategory: 'INTERNAL',
      },
    });
  }

  const duplicateIds = candidates.filter((u) => u.id !== director.id).map((u) => u.id);
  if (duplicateIds.length) {
    await prisma.user.updateMany({
      where: { id: { in: duplicateIds } },
      data: { isTrashed: true },
    });
  }

  console.log(
    `[seed] Directeur Yassine HIDJEB : login=${DIRECTOR_LOGIN_EMAIL} personnel=${DIRECTOR_PERSONAL_EMAIL}`,
  );
  return director;
}

module.exports = {
  LEGACY_APP_LOGIN_SUFFIXES,
  getAppLoginEmailDomain,
  appLoginSuffixes,
  isAppLoginEmail,
  slugifyName,
  slugFromUser,
  toAppLoginEmail,
  toPersonalEmail,
  resolveEmailPair,
  ensureUserEmailSplit,
  findUserByAppLogin,
  ensureUniquePersonalEmail,
  ensureDirectorAccount,
  DIRECTOR_LOGIN_EMAIL,
  DIRECTOR_PERSONAL_EMAIL,
};
