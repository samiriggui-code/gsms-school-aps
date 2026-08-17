/**
 * Référentiel postes & qualifications CFA — source unique pour le seed.
 * Aligné sur SchoolInternalService (Direction, Pédagogie, RH, Formateurs).
 */

const RH_POSITIONS = [
  // ——— Direction ———
  { code: 'DIR_DIRECTEUR', label: "Directeur de l'école", schoolInternalService: 'DIRECTION', sortOrder: 10 },
  { code: 'DIR_GERANT', label: 'Gérant', schoolInternalService: 'DIRECTION', sortOrder: 11 },
  { code: 'DIR_ADJ', label: 'Directeur adjoint', schoolInternalService: 'DIRECTION', sortOrder: 20 },
  { code: 'DIR_RAF', label: 'Responsable administratif et financier (RAF)', schoolInternalService: 'DIRECTION', sortOrder: 30 },
  { code: 'DIR_COORD', label: 'Chargé(e) de coordination direction', schoolInternalService: 'DIRECTION', sortOrder: 40 },
  { code: 'DIR_ASSIST', label: 'Assistant(e) de direction', schoolInternalService: 'DIRECTION', sortOrder: 50 },

  // ——— Pédagogie ———
  { code: 'PED_REF', label: 'Référent pédagogique', schoolInternalService: 'PEDAGOGICAL', sortOrder: 110 },
  { code: 'PED_COORD', label: 'Coordinateur pédagogique', schoolInternalService: 'PEDAGOGICAL', sortOrder: 120 },
  { code: 'PED_QUAL', label: 'Responsable qualité & conformité', schoolInternalService: 'PEDAGOGICAL', sortOrder: 130 },
  { code: 'PED_REF_ALTERN', label: 'Référent alternance & entreprises', schoolInternalService: 'PEDAGOGICAL', sortOrder: 140 },
  { code: 'PED_CHARG_SUIVI', label: 'Chargé(e) de suivi des apprenants', schoolInternalService: 'PEDAGOGICAL', sortOrder: 150 },
  { code: 'PED_CHARG_EXAM', label: 'Chargé(e) examens & certifications', schoolInternalService: 'PEDAGOGICAL', sortOrder: 160 },

  // ——— RH & administration ———
  { code: 'ADM_SECRETARIAT', label: 'Secrétariat & accueil', schoolInternalService: 'HR_ADMIN', sortOrder: 210 },
  { code: 'ADM_COMPTA', label: 'Comptabilité & finance', schoolInternalService: 'HR_ADMIN', sortOrder: 220 },
  { code: 'ADM_RH', label: 'Chargé(e) ressources humaines', schoolInternalService: 'HR_ADMIN', sortOrder: 230 },
  { code: 'ADM_GENERAL', label: 'Administration générale', schoolInternalService: 'HR_ADMIN', sortOrder: 240 },
  { code: 'ADM_MARKETING', label: 'Marketing & communication', schoolInternalService: 'HR_ADMIN', sortOrder: 250 },
  { code: 'ADM_IT', label: 'IT & systèmes d\'information', schoolInternalService: 'HR_ADMIN', sortOrder: 260 },
  { code: 'ADM_MAINT', label: 'Maintenance & logistique', schoolInternalService: 'HR_ADMIN', sortOrder: 270 },
  { code: 'ADM_JURIDIQUE', label: 'Juridique & veille réglementaire', schoolInternalService: 'HR_ADMIN', sortOrder: 280 },

  // ——— Pool formateurs & intervenants ———
  { code: 'FORM_PRINCIPAL', label: 'Formateur principal', schoolInternalService: 'TRAINER_POOL', sortOrder: 310 },
  { code: 'FORM_EXPERT', label: 'Formateur expert métier', schoolInternalService: 'TRAINER_POOL', sortOrder: 320 },
  { code: 'FORM_VACATAIRE', label: 'Formateur vacataire', schoolInternalService: 'TRAINER_POOL', sortOrder: 330 },
  { code: 'FORM_INTERV_PART', label: 'Intervenant partenaire / sous-traitance', schoolInternalService: 'TRAINER_POOL', sortOrder: 340 },
  { code: 'FORM_REF_TECHNIQUE', label: 'Référent technique formation', schoolInternalService: 'TRAINER_POOL', sortOrder: 350 },
];

const RH_QUALIFICATIONS = [
  // Direction
  { code: 'DIR_PILOTAGE', label: 'Pilotage stratégique CFA', schoolInternalService: 'DIRECTION', sortOrder: 10 },
  { code: 'DIR_QUALIOPI', label: 'Conformité Qualiopi & audit', schoolInternalService: 'DIRECTION', sortOrder: 20 },
  { code: 'DIR_GOUV', label: 'Gouvernance & relations institutionnelles', schoolInternalService: 'DIRECTION', sortOrder: 30 },
  { code: 'DIR_FINANCE', label: 'Pilotage financier & OPCO', schoolInternalService: 'DIRECTION', sortOrder: 40 },
  { code: 'DIR_COORD_OPS', label: 'Coordination opérationnelle', schoolInternalService: 'DIRECTION', sortOrder: 50 },
  { code: 'DIR_PROJET', label: 'Gestion de projets transverses', schoolInternalService: 'DIRECTION', sortOrder: 60 },

  // Pédagogie
  { code: 'PED_CONCEPTION', label: 'Conception de parcours & programmes', schoolInternalService: 'PEDAGOGICAL', sortOrder: 10 },
  { code: 'PED_SUIVI', label: 'Suivi pédagogique des apprenants', schoolInternalService: 'PEDAGOGICAL', sortOrder: 20 },
  { code: 'PED_QUALITE', label: 'Qualité & indicateurs pédagogiques', schoolInternalService: 'PEDAGOGICAL', sortOrder: 30 },
  { code: 'PED_EXAM', label: 'Organisation examens & certifications', schoolInternalService: 'PEDAGOGICAL', sortOrder: 40 },
  { code: 'PED_ALTERN', label: 'Relations entreprises & alternance', schoolInternalService: 'PEDAGOGICAL', sortOrder: 50 },
  { code: 'PED_HANDICAP', label: 'Référent handicap & inclusion', schoolInternalService: 'PEDAGOGICAL', sortOrder: 60 },
  { code: 'PED_NUMERIQUE', label: 'Ingénierie pédagogique numérique', schoolInternalService: 'PEDAGOGICAL', sortOrder: 70 },

  // RH & administration
  { code: 'ADM_ACCUEIL', label: 'Accueil & standard téléphonique', schoolInternalService: 'HR_ADMIN', sortOrder: 10 },
  { code: 'ADM_SCOLARITE', label: 'Administration scolaire & dossiers', schoolInternalService: 'HR_ADMIN', sortOrder: 20 },
  { code: 'ADM_COMPTA', label: 'Comptabilité & facturation', schoolInternalService: 'HR_ADMIN', sortOrder: 30 },
  { code: 'ADM_PAIE', label: 'Paie & charges sociales', schoolInternalService: 'HR_ADMIN', sortOrder: 40 },
  { code: 'ADM_RH', label: 'Recrutement & administration du personnel', schoolInternalService: 'HR_ADMIN', sortOrder: 50 },
  { code: 'ADM_IT', label: 'Support informatique & SI', schoolInternalService: 'HR_ADMIN', sortOrder: 60 },
  { code: 'ADM_COM', label: 'Communication & relations publiques', schoolInternalService: 'HR_ADMIN', sortOrder: 70 },
  { code: 'ADM_MARKET', label: 'Marketing & développement commercial', schoolInternalService: 'HR_ADMIN', sortOrder: 80 },
  { code: 'ADM_LOG', label: 'Logistique & moyens généraux', schoolInternalService: 'HR_ADMIN', sortOrder: 90 },
  { code: 'ADM_JUR', label: 'Veille juridique & conformité interne', schoolInternalService: 'HR_ADMIN', sortOrder: 100 },

  // Formateurs — domaines catalogue
  { code: 'F_SST', label: 'SST', schoolInternalService: 'TRAINER_POOL', sortOrder: 10 },
  { code: 'F_TFPAPS', label: 'TFPAPS', schoolInternalService: 'TRAINER_POOL', sortOrder: 20 },
  { code: 'F_GESTES', label: 'Gestes et postures', schoolInternalService: 'TRAINER_POOL', sortOrder: 30 },
  { code: 'F_SSIAP1', label: 'SSIAP 1', schoolInternalService: 'TRAINER_POOL', sortOrder: 40 },
  { code: 'F_SSIAP2', label: 'SSIAP 2', schoolInternalService: 'TRAINER_POOL', sortOrder: 50 },
  { code: 'F_SSIAP3', label: 'SSIAP 3', schoolInternalService: 'TRAINER_POOL', sortOrder: 60 },
  { code: 'F_INCENDIE', label: 'Incendie & évacuation', schoolInternalService: 'TRAINER_POOL', sortOrder: 70 },
  { code: 'F_EAD', label: 'EAD / AED', schoolInternalService: 'TRAINER_POOL', sortOrder: 80 },
  { code: 'F_SECST', label: 'Sauvetage équipes de travail (SECST)', schoolInternalService: 'TRAINER_POOL', sortOrder: 90 },
  { code: 'F_ELEC', label: 'Habilitations électriques', schoolInternalService: 'TRAINER_POOL', sortOrder: 100 },
  { code: 'F_HAUT', label: 'Travail en hauteur', schoolInternalService: 'TRAINER_POOL', sortOrder: 110 },
  { code: 'F_MACHINES', label: 'Machines mobiles', schoolInternalService: 'TRAINER_POOL', sortOrder: 120 },
  { code: 'F_PREV', label: 'Prévention des risques', schoolInternalService: 'TRAINER_POOL', sortOrder: 130 },
  { code: 'F_PARTENAIRE', label: 'Intervention sous-traitance / partenaire', schoolInternalService: 'TRAINER_POOL', sortOrder: 140 },
];

/** Assignations démo équipe direction (ordre après le directeur). */
const DIRECTION_TEAM_ASSIGNMENTS = [
  { positionCode: 'DIR_DIRECTEUR', qualificationCodes: ['DIR_PILOTAGE', 'DIR_QUALIOPI', 'DIR_GOUV'] },
  { positionCode: 'DIR_ADJ', qualificationCodes: ['DIR_COORD_OPS', 'DIR_PROJET'] },
  { positionCode: 'DIR_RAF', qualificationCodes: ['DIR_FINANCE', 'DIR_COORD_OPS'] },
  { positionCode: 'DIR_COORD', qualificationCodes: ['DIR_COORD_OPS', 'DIR_PROJET'] },
  { positionCode: 'DIR_ASSIST', qualificationCodes: ['DIR_COORD_OPS'] },
];

/** Assignations démo formateurs internes (rotation par index). */
const FORMATEUR_DEMO_ASSIGNMENTS = [
  {
    positionCode: 'FORM_PRINCIPAL',
    qualificationCodes: ['F_SST', 'F_GESTES', 'F_PREV'],
    specialties: ['SST', 'Gestes et postures', 'Prévention des risques'],
  },
  {
    positionCode: 'FORM_EXPERT',
    qualificationCodes: ['F_SSIAP1', 'F_SSIAP2', 'F_INCENDIE'],
    specialties: ['SSIAP 1', 'SSIAP 2', 'Incendie & évacuation'],
  },
  {
    positionCode: 'FORM_EXPERT',
    qualificationCodes: ['F_TFPAPS', 'F_EAD', 'F_SECST'],
    specialties: ['TFPAPS', 'EAD / AED', 'Sauvetage équipes de travail (SECST)'],
  },
  {
    positionCode: 'FORM_VACATAIRE',
    qualificationCodes: ['F_ELEC', 'F_HAUT'],
    specialties: ['Habilitations électriques', 'Travail en hauteur'],
  },
  {
    positionCode: 'FORM_REF_TECHNIQUE',
    qualificationCodes: ['F_MACHINES', 'F_PREV', 'F_SST'],
    specialties: ['Machines mobiles', 'Prévention des risques', 'SST'],
  },
];

const FORMATEUR_PARTNER_ASSIGNMENT = {
  positionCode: 'FORM_INTERV_PART',
  qualificationCodes: ['F_PARTENAIRE', 'F_SST', 'F_PREV'],
  specialties: ['Intervention sous-traitance / partenaire', 'SST', 'Prévention des risques'],
};

/** Rotation collaborateurs pôle pédagogique. */
const PEDAGOGICAL_STAFF_ASSIGNMENTS = [
  { positionCode: 'PED_COORD', qualificationCodes: ['PED_CONCEPTION', 'PED_SUIVI'] },
  { positionCode: 'PED_REF', qualificationCodes: ['PED_SUIVI', 'PED_HANDICAP'] },
  { positionCode: 'PED_QUAL', qualificationCodes: ['PED_QUALITE', 'PED_EXAM'] },
  { positionCode: 'PED_REF_ALTERN', qualificationCodes: ['PED_ALTERN', 'PED_SUIVI'] },
  { positionCode: 'PED_CHARG_SUIVI', qualificationCodes: ['PED_SUIVI', 'PED_NUMERIQUE'] },
];

/** Rotation collaborateurs / admins pôle RH & admin. */
const HR_ADMIN_STAFF_ASSIGNMENTS = [
  { positionCode: 'ADM_GENERAL', qualificationCodes: ['ADM_SCOLARITE', 'ADM_ACCUEIL'] },
  { positionCode: 'ADM_SECRETARIAT', qualificationCodes: ['ADM_ACCUEIL', 'ADM_SCOLARITE'] },
  { positionCode: 'ADM_COMPTA', qualificationCodes: ['ADM_COMPTA', 'ADM_PAIE'] },
  { positionCode: 'ADM_RH', qualificationCodes: ['ADM_RH', 'ADM_SCOLARITE'] },
  { positionCode: 'ADM_MARKETING', qualificationCodes: ['ADM_MARKET', 'ADM_COM'] },
  { positionCode: 'ADM_IT', qualificationCodes: ['ADM_IT', 'ADM_SCOLARITE'] },
];

const DIRECTOR_LOGIN_EMAIL = 'yassine.hidjeb@ecole.local';
const SUPERADMIN_LOGIN_EMAIL = 'samir.iggui@ecole.local';
/** Avatar vitrine / landing — fichier statique dans `public/media/avatars/`. */
const SUPERADMIN_DEFAULT_AVATAR = '/media/avatars/300-14.png';

/** Textes vitrine (#trainers) et annuaire Structure — clé = code RhPosition. */
const LANDING_BIO_BY_POSITION_CODE = {
  DIR_DIRECTEUR:
    "Gérant et directeur de FORM'SSI : pilotage de l'établissement, conformité Qualiopi et relations institutionnelles.",
  DIR_ADJ:
    'Coordination stratégique des parcours et pilotage qualité — interface avec les financeurs et partenaires.',
  DIR_RAF:
    "Support à la direction sur la conformité réglementaire, le suivi des dossiers et l'organisation des sessions.",
  DIR_COORD:
    "Coordination opérationnelle des services, suivi des indicateurs et déploiement des procédures qualité.",
  DIR_ASSIST:
    "Assistanat de direction, préparation des instances et interface avec les partenaires institutionnels.",
  PED_COORD:
    "Coordination des parcours, animation des promotions et lien formateurs — apprenants.",
  PED_REF:
    "Référent pédagogique : suivi individualisé, conformité des dossiers et accompagnement jusqu'à la certification.",
  PED_QUAL:
    "Pilotage qualité & conformité Qualiopi, indicateurs pédagogiques et plans d'amélioration continue.",
  PED_REF_ALTERN:
    "Relations entreprises et alternance : conventions, tuteurs et suivi en centre de formation.",
  PED_CHARG_SUIVI:
    "Suivi des apprenants, emploi du temps, assiduité et remontées vers l'équipe pédagogique.",
  PED_CHARG_EXAM:
    "Organisation des examens, convocations jury et archivage des résultats de certification.",
  ADM_GENERAL:
    "Administration générale de l'établissement : dossiers, planning et support aux équipes.",
  ADM_SECRETARIAT:
    "Accueil, standard téléphonique et gestion des demandes entrantes candidats & entreprises.",
  ADM_COMPTA:
    "Comptabilité, facturation OPCO et suivi des encaissements formation.",
  ADM_RH:
    "Ressources humaines : recrutement, contrats, absences et dossiers du personnel.",
  ADM_MARKETING:
    "Communication digitale, acquisition leads et animation des réseaux de l'école.",
  ADM_IT:
    "Support informatique, CRM LMS et continuité des services numériques.",
  FORM_PRINCIPAL:
    "Formateur principal SST & prévention — interventions terrain et sessions certifiantes catalogue.",
  FORM_EXPERT:
    "Formateur expert incendie / secours — expérience opérationnelle et pédagogie active.",
  FORM_VACATAIRE:
    "Formateur vacataire spécialisé habilitations & travaux à risques.",
  FORM_INTERV_PART:
    "Intervenant partenaire — complément d'expertise sur modules réglementaires.",
  FORM_REF_TECHNIQUE:
    "Référent technique formation : veille réglementaire, mises à jour de programmes et qualité des contenus.",
};

function landingBioForPosition(positionCode, posLabel, qualification, specialties = []) {
  const fixed = LANDING_BIO_BY_POSITION_CODE[positionCode];
  if (fixed) return fixed;
  if (specialties.length) {
    return `${posLabel} — ${specialties.join(' · ')}. ${qualification}.`;
  }
  if (qualification) return `${posLabel} — ${qualification}.`;
  return `${posLabel} — FORM'SSI.`;
}

module.exports = {
  RH_POSITIONS,
  RH_QUALIFICATIONS,
  DIRECTION_TEAM_ASSIGNMENTS,
  FORMATEUR_DEMO_ASSIGNMENTS,
  FORMATEUR_PARTNER_ASSIGNMENT,
  PEDAGOGICAL_STAFF_ASSIGNMENTS,
  HR_ADMIN_STAFF_ASSIGNMENTS,
  DIRECTOR_LOGIN_EMAIL,
  SUPERADMIN_LOGIN_EMAIL,
  SUPERADMIN_DEFAULT_AVATAR,
  LANDING_BIO_BY_POSITION_CODE,
  landingBioForPosition,
  /** @deprecated utiliser DIRECTOR_LOGIN_EMAIL */
  DIRECTOR_EMAIL: DIRECTOR_LOGIN_EMAIL,
  /** @deprecated utiliser SUPERADMIN_LOGIN_EMAIL */
  SUPERADMIN_EMAIL: SUPERADMIN_LOGIN_EMAIL,
};
