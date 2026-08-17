/**
 * Lieux physiques de l'école (ClientSite) — campus, plateaux, ateliers.
 * Le siège social légal reste dans SystemSetting / Compagnie → Profil.
 */

const SCHOOL_SITES = [
  {
    code: 'CAMPUS-REUIL',
    name: 'Campus Principal Reuil',
    city: 'Reuil-Malmaison',
    country: 'FR',
    address: 'Siège & administration — campus principal',
  },
  {
    code: 'PLATEAU-INC',
    name: 'Plateau Technique Incendie',
    city: 'Reuil-Malmaison',
    country: 'FR',
    address: 'Plateau feu / SSIAP — exercices incendie',
  },
  {
    code: 'ATELIER-EPI',
    name: 'Atelier EPI',
    city: 'Reuil-Malmaison',
    country: 'FR',
    address: 'Stock matériel pédagogique & logistique',
  },
  {
    code: 'PLATEAU-PCS',
    name: 'Plateau PCS examen',
    city: 'Reuil-Malmaison',
    country: 'FR',
    address: 'Poste central de sécurité pédagogique — examens TFP APS',
  },
  {
    code: 'PARCOURS-RONDE',
    name: 'Parcours ronde pédagogique',
    city: 'Reuil-Malmaison',
    country: 'FR',
    address: 'Couloirs, escaliers, parking — ronde ≥ 100 m',
  },
];

/** Code site par défaut (direction, RH, pédagogie). */
const SCHOOL_SITE_CAMPUS = 'CAMPUS-REUIL';

async function seedSchoolSites(tx) {
  const siteByCode = new Map();

  for (const site of SCHOOL_SITES) {
    const existing = await tx.clientSite.findFirst({ where: { code: site.code } });
    if (existing) {
      const updated = await tx.clientSite.update({
        where: { id: existing.id },
        data: {
          name: site.name,
          city: site.city,
          country: site.country,
          address: site.address,
          isActive: true,
        },
      });
      siteByCode.set(site.code, updated.id);
      continue;
    }

    const legacyParis = site.code === 'CAMPUS-REUIL'
      ? await tx.clientSite.findFirst({ where: { code: 'CAMPUS-PARIS' } })
      : null;

    if (legacyParis) {
      const migrated = await tx.clientSite.update({
        where: { id: legacyParis.id },
        data: {
          code: site.code,
          name: site.name,
          city: site.city,
          country: site.country,
          address: site.address,
          isActive: true,
        },
      });
      siteByCode.set(site.code, migrated.id);
      continue;
    }

    const created = await tx.clientSite.create({
      data: {
        code: site.code,
        name: site.name,
        city: site.city,
        country: site.country,
        address: site.address,
        isActive: true,
      },
    });
    siteByCode.set(site.code, created.id);
  }

  console.log(`[seed] Sites école : ${SCHOOL_SITES.map((s) => s.name).join(' · ')}`);
  return siteByCode;
}

/** Affectation site principal dans metadata profil (affichage / exports). */
async function setProfilePrimarySite(tx, userId, siteId, profileKind) {
  const patch = { primarySiteId: siteId };
  if (profileKind === 'formateur') {
    const row = await tx.formateurProfile.findUnique({
      where: { userId },
      select: { metadata: true },
    });
    const meta =
      row?.metadata && typeof row.metadata === 'object' && !Array.isArray(row.metadata)
        ? row.metadata
        : {};
    await tx.formateurProfile.update({
      where: { userId },
      data: { metadata: { ...meta, ...patch } },
    });
    return;
  }
  const row = await tx.collaborateurProfile.findUnique({
    where: { userId },
    select: { metadata: true },
  });
  const meta =
    row?.metadata && typeof row.metadata === 'object' && !Array.isArray(row.metadata)
      ? row.metadata
      : {};
  await tx.collaborateurProfile.upsert({
    where: { userId },
    create: { userId, metadata: patch },
    update: { metadata: { ...meta, ...patch } },
  });
}

function formateurSiteCode(specialties) {
  const list = Array.isArray(specialties) ? specialties.map(String) : [];
  const joined = list.join(' ').toLowerCase();
  if (/ssiap|incendie|évacuation|evacuation|ria|feu/.test(joined)) {
    return 'PLATEAU-INC';
  }
  if (/électri|electri|hauteur|machines|epi|habilitation/.test(joined)) {
    return 'ATELIER-EPI';
  }
  return SCHOOL_SITE_CAMPUS;
}

/**
 * Répartit collaborateurs et formateurs sur les 3 sites (metadata + log seed).
 */
async function dispatchStaffToSchoolSites(tx, siteByCode) {
  const campusId = siteByCode.get(SCHOOL_SITE_CAMPUS);
  const plateauId = siteByCode.get('PLATEAU-INC');
  const atelierId = siteByCode.get('ATELIER-EPI');

  const collaborateurs = await tx.user.findMany({
    where: {
      isTrashed: false,
      status: 'ACTIVE',
      collaborateurProfile: { isNot: null },
    },
    select: {
      id: true,
      name: true,
      collaborateurProfile: { select: { schoolInternalService: true } },
    },
  });

  let colCampus = 0;
  let colAtelier = 0;

  for (const u of collaborateurs) {
    const svc = u.collaborateurProfile?.schoolInternalService;
    let siteId = campusId;
    let siteCode = SCHOOL_SITE_CAMPUS;
    if (svc === 'HR_ADMIN' && colAtelier === 0 && atelierId) {
      siteId = atelierId;
      siteCode = 'ATELIER-EPI';
      colAtelier += 1;
    } else if (svc === 'HR_ADMIN' && colAtelier === 1 && plateauId) {
      siteId = plateauId;
      siteCode = 'PLATEAU-INC';
      colAtelier += 1;
    } else {
      colCampus += 1;
    }
    if (siteId) await setProfilePrimarySite(tx, u.id, siteId, 'collaborateur');
  }

  const formateurs = await tx.user.findMany({
    where: {
      isTrashed: false,
      status: 'ACTIVE',
      formateurProfile: { isNot: null },
    },
    select: {
      id: true,
      name: true,
      formateurProfile: { select: { specialties: true } },
    },
  });

  const counts = { campus: 0, plateau: 0, atelier: 0 };

  for (const u of formateurs) {
    const specs = u.formateurProfile?.specialties;
    const code = formateurSiteCode(specs);
    const siteId = siteByCode.get(code);
    if (siteId) {
      await setProfilePrimarySite(tx, u.id, siteId, 'formateur');
      if (code === 'PLATEAU-INC') counts.plateau += 1;
      else if (code === 'ATELIER-EPI') counts.atelier += 1;
      else counts.campus += 1;
    }
  }

  console.log(
    `[seed] Affectation sites — collaborateurs: ${colCampus} campus, ${colAtelier} plateau/atelier · formateurs: ${counts.campus} campus, ${counts.plateau} plateau, ${counts.atelier} atelier`,
  );
}

module.exports = {
  SCHOOL_SITES,
  SCHOOL_SITE_CAMPUS,
  seedSchoolSites,
  dispatchStaffToSchoolSites,
  formateurSiteCode,
};
