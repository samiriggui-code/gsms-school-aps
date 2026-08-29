import type { FormationDeliveryMode, PrismaClient } from '@repo/database';
import { FormationLifecycleStatus } from '@repo/database';
import {
  DEFAULT_ACCES_HANDICAPES,
  DEFAULT_ETAT_RECRUTEMENT,
  DEFAULT_LANGUE,
  DEFAULT_MODALITES_ENTREES_SORTIES,
  DEFAULT_NIVEAU_ENTREE,
  DEFAULT_OBJECTIF_GENERAL,
  DEFAULT_PARCOURS_DE_FORMATION,
  DEFAULT_PERIMETRE_RECRUTEMENT,
  LHEO_NS,
  type EdofGap,
} from './edof-catalog-constants';

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function yyyymmdd(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}${m}${day}`;
}

function jsonListToHtml(value: unknown): string | null {
  if (!Array.isArray(value) || value.length === 0) return null;
  const items = value
    .map((v) => {
      if (typeof v === 'string') return v.trim();
      if (v && typeof v === 'object' && 'label' in v && typeof (v as { label: unknown }).label === 'string') {
        return (v as { label: string }).label.trim();
      }
      if (v && typeof v === 'object' && 'title' in v && typeof (v as { title: unknown }).title === 'string') {
        return (v as { title: string }).title.trim();
      }
      return null;
    })
    .filter((s): s is string => Boolean(s));
  if (items.length === 0) return null;
  return `<ul>${items.map((i) => `<li>${escapeXml(i)}</li>`).join('')}</ul>`;
}

function jsonListToText(value: unknown): string | null {
  if (!Array.isArray(value) || value.length === 0) return null;
  const items = value
    .map((v) => {
      if (typeof v === 'string') return v.trim();
      if (v && typeof v === 'object' && 'label' in v && typeof (v as { label: unknown }).label === 'string') {
        return (v as { label: string }).label.trim();
      }
      return null;
    })
    .filter((s): s is string => Boolean(s));
  return items.length ? items.join(' ; ') : null;
}

function mapModalitesEnseignement(mode: FormationDeliveryMode | null | undefined): string {
  switch (mode) {
    case 'DISTANCIEL':
      return '1';
    case 'MIXTE':
      return '2';
    case 'PRESENTIEL':
    case 'ENTREPRISE_SUR_SITE':
    case undefined:
    case null:
    default:
      return '0';
  }
}

function splitDirectorName(full: string | null | undefined): { nom: string; prenom: string } {
  const t = full?.trim() ?? '';
  if (!t) return { nom: '', prenom: '' };
  const parts = t.split(/\s+/);
  if (parts.length === 1) return { nom: parts[0]!, prenom: parts[0]! };
  return { nom: parts[parts.length - 1]!, prenom: parts.slice(0, -1).join(' ') };
}

function digitsOnly(phone: string | null | undefined): string {
  return (phone ?? '').replace(/\D/g, '');
}

export type BuildEdofCatalogResult = {
  xml: string;
  gaps: EdofGap[];
  formationCount: number;
  sessionCount: number;
  skippedFormations: number;
};

/**
 * Génère un catalogue LHEO à partir des Formations ACTIVE cpfEligible.
 * Ne crée pas de modèle Prisma. Gaps explicites pour champs absents / défauts LHEO.
 */
export async function buildEdofCatalogXml(
  prisma: PrismaClient,
): Promise<BuildEdofCatalogResult> {
  const gaps: EdofGap[] = [];

  const school = await prisma.systemSetting.findFirst({
    where: { active: true },
  });

  const siret = school?.siret?.replace(/\s/g, '') ?? '';
  if (!siret || siret.length < 14) {
    gaps.push({
      severity: 'blocking',
      field: 'SystemSetting.siret',
      lheoPath: 'organisme-formation-responsable/SIRET',
      message: 'SIRET organisme manquant ou invalide — renseigner Paramètres compagnie avant import EDOF.',
    });
  }

  const contact = splitDirectorName(school?.directorFullName);
  if (!contact.nom || !contact.prenom) {
    gaps.push({
      severity: 'defaulted',
      field: 'SystemSetting.directorFullName',
      lheoPath: 'lieu-de-formation/coordonnees/nom|prenom',
      message: 'Nom/prénom contact OF absents — placeholders utilisés.',
      defaultUsed: 'OF / Contact',
    });
    if (!contact.nom) contact.nom = 'OF';
    if (!contact.prenom) contact.prenom = 'Contact';
  }

  const addressLine = school?.address?.trim() || '';
  const city = school?.companyCity?.trim() || '';
  const postal = school?.companyPostalCode?.trim() || '';
  if (!addressLine || !city || !postal) {
    gaps.push({
      severity: 'blocking',
      field: 'SystemSetting.address|companyCity|companyPostalCode',
      lheoPath: 'adresse',
      message: 'Adresse OF incomplète (ligne, ville, CP) — requise pour lieu / inscription.',
    });
  }

  const phone = digitsOnly(school?.supportPhone);
  const email = school?.supportEmail?.trim() || '';
  if (!phone || phone.length < 10) {
    gaps.push({
      severity: 'blocking',
      field: 'SystemSetting.supportPhone',
      lheoPath: 'telfixe/numtel',
      message: 'Téléphone OF manquant (supportPhone).',
    });
  }
  if (!email) {
    gaps.push({
      severity: 'blocking',
      field: 'SystemSetting.supportEmail',
      lheoPath: 'courriel',
      message: 'Email OF manquant (supportEmail).',
    });
  }

  const formations = await prisma.formation.findMany({
    where: {
      status: FormationLifecycleStatus.ACTIVE,
      cpfEligible: true,
    },
    include: {
      sessions: {
        where: {
          startDate: { not: null },
          endDate: { not: null },
        },
        orderBy: { startDate: 'asc' },
      },
    },
    orderBy: { name: 'asc' },
  });

  const parts: string[] = [];
  parts.push(`<?xml version="1.0" encoding="ISO-8859-1"?>`);
  parts.push(`<lheo xmlns="${LHEO_NS}">`);
  parts.push(`<offres>`);

  let formationCount = 0;
  let sessionCount = 0;
  let skippedFormations = 0;

  for (const f of formations) {
    const slug = f.slug;
    const numero = slug.replace(/[^A-Za-z0-9_-]/g, '_').slice(0, 80) || f.id.slice(0, 12);

    if (!f.rncpCode?.trim()) {
      gaps.push({
        severity: 'blocking',
        formationId: f.id,
        formationSlug: slug,
        field: 'Formation.rncpCode',
        lheoPath: 'certification/code-RNCP',
        message: `Formation « ${f.name} » sans rncpCode — exclue de l'export.`,
      });
      skippedFormations += 1;
      continue;
    }

    if (f.sessions.length === 0) {
      gaps.push({
        severity: 'blocking',
        formationId: f.id,
        formationSlug: slug,
        field: 'FormationSession.startDate|endDate',
        lheoPath: 'session/periode',
        message: `Aucune session datée pour « ${f.name} » — exclue (LHEO session requiert période).`,
      });
      skippedFormations += 1;
      continue;
    }

    const objectif =
      jsonListToHtml(f.presentationBullets) ||
      (f.longDescription?.trim()
        ? `<p>${f.longDescription.trim().replace(/]]>/g, ']] >')}</p>`
        : null) ||
      (f.description?.trim()
        ? `<p>${f.description.trim().replace(/]]>/g, ']] >')}</p>`
        : null);

    if (!objectif) {
      gaps.push({
        severity: 'blocking',
        formationId: f.id,
        formationSlug: slug,
        field: 'presentationBullets|longDescription|description',
        lheoPath: 'objectif-formation',
        message: `Objectifs pédagogiques absents pour « ${f.name} » — exclue.`,
      });
      skippedFormations += 1;
      continue;
    }

    const resultats =
      jsonListToText(f.outcomes) ||
      f.description?.trim() ||
      null;
    if (!resultats) {
      gaps.push({
        severity: 'blocking',
        formationId: f.id,
        formationSlug: slug,
        field: 'outcomes|description',
        lheoPath: 'resultats-attendus',
        message: `Résultats attendus absents pour « ${f.name} » — exclue.`,
      });
      skippedFormations += 1;
      continue;
    }

    const contenu =
      jsonListToHtml(f.programModules) ||
      jsonListToHtml(f.modules) ||
      (f.longDescription?.trim()
        ? `<p>${f.longDescription.trim().replace(/]]>/g, ']] >')}</p>`
        : null);
    if (!contenu) {
      gaps.push({
        severity: 'blocking',
        formationId: f.id,
        formationSlug: slug,
        field: 'programModules|modules|longDescription',
        lheoPath: 'contenu-formation',
        message: `Contenu formation absent pour « ${f.name} » — exclue.`,
      });
      skippedFormations += 1;
      continue;
    }

    gaps.push({
      severity: 'defaulted',
      formationId: f.id,
      formationSlug: slug,
      field: '(none)',
      lheoPath: 'parcours-de-formation',
      message: 'Pas de champ GSMS pour le code parcours LHEO.',
      defaultUsed: DEFAULT_PARCOURS_DE_FORMATION,
    });
    gaps.push({
      severity: 'defaulted',
      formationId: f.id,
      formationSlug: slug,
      field: '(none)',
      lheoPath: 'objectif-general-formation',
      message: 'Pas de champ GSMS — défaut certification (2) car rncpCode présent.',
      defaultUsed: DEFAULT_OBJECTIF_GENERAL,
    });
    gaps.push({
      severity: 'defaulted',
      formationId: f.id,
      formationSlug: slug,
      field: '(none)',
      lheoPath: 'niveau-entree-obligatoire|modalites-entrees-sorties|acces-handicapes|langue-formation',
      message: 'Codes LHEO action sans champ GSMS dédié.',
      defaultUsed: `${DEFAULT_NIVEAU_ENTREE}/${DEFAULT_MODALITES_ENTREES_SORTIES}/${DEFAULT_ACCES_HANDICAPES}/${DEFAULT_LANGUE}`,
    });

    if (!f.deliveryMode) {
      gaps.push({
        severity: 'defaulted',
        formationId: f.id,
        formationSlug: slug,
        field: 'Formation.deliveryMode',
        lheoPath: 'modalites-enseignement',
        message: 'deliveryMode null → présentiel (0).',
        defaultUsed: '0',
      });
    }

    const datemaj = yyyymmdd(f.updatedAt);
    const datecrea = yyyymmdd(f.createdAt);
    const rncp = f.rncpCode.trim().toUpperCase().startsWith('RNCP')
      ? f.rncpCode.trim().toUpperCase()
      : `RNCP${f.rncpCode.trim()}`;

    const hours = f.hoursMax ?? f.hoursMin ?? null;
    const modalites = mapModalitesEnseignement(f.deliveryMode);
    const conditions =
      f.authorizationSummary?.trim() ||
      f.frenchLevel?.trim() ||
      'Prérequis selon fiche formation.';

    const adresseBlock = (numeroAdresse: string) => `
					<adresse numero="${escapeXml(numeroAdresse)}">
						<ligne>${escapeXml(addressLine || 'ADRESSE_MANQUANTE')}</ligne>
						${postal ? `<codepostal>${escapeXml(postal)}</codepostal>` : ''}
						${city ? `<ville>${escapeXml(city)}</ville>` : ''}
						<extras info="adresse">
							<extra info="conformite-reglementaire">0</extra>
						</extras>
					</adresse>`;

    const sessionsXml: string[] = [];
    for (const s of f.sessions) {
      if (!s.startDate || !s.endDate) continue;
      const sNumero = `${numero}_${s.id.slice(0, 8)}`.slice(0, 80);
      const sMaj = yyyymmdd(s.updatedAt);
      const sCrea = yyyymmdd(s.createdAt);
      gaps.push({
        severity: 'defaulted',
        formationId: f.id,
        formationSlug: slug,
        sessionId: s.id,
        field: '(none)',
        lheoPath: 'session/etat-recrutement',
        message: 'Pas d’enum recrutement EDOF en GSMS.',
        defaultUsed: DEFAULT_ETAT_RECRUTEMENT,
      });
      sessionCount += 1;
      sessionsXml.push(`
				<session numero="${escapeXml(sNumero)}" datemaj="${sMaj}" datecrea="${sCrea}">
					<periode>
						<debut>${yyyymmdd(s.startDate)}</debut>
						<fin>${yyyymmdd(s.endDate)}</fin>
					</periode>
					<adresse-inscription>
						${adresseBlock('1')}
					</adresse-inscription>
					<etat-recrutement>${DEFAULT_ETAT_RECRUTEMENT}</etat-recrutement>
					<extras info="session">
						<extra info="garantie">0</extra>
						${s.sessionSubtitle ? `<extra info="modalites-particulieres">${escapeXml(s.sessionSubtitle)}</extra>` : ''}
					</extras>
				</session>`);
    }

    const urlAction =
      school?.websiteURL?.trim()
        ? `<url-action><urlweb>${escapeXml(school.websiteURL.trim())}</urlweb></url-action>`
        : '';

    const regionInfo = school?.companyRegion?.trim() || school?.ndaRegion?.trim() || '';
    if (!regionInfo) {
      gaps.push({
        severity: 'defaulted',
        formationId: f.id,
        formationSlug: slug,
        field: 'SystemSetting.companyRegion|ndaRegion',
        lheoPath: 'infos-perimetre-recrutement',
        message: 'Région OF absente.',
        defaultUsed: 'Non renseigné',
      });
    }

    parts.push(`
		<formation numero="${escapeXml(numero)}" datemaj="${datemaj}" datecrea="${datecrea}">
			<intitule-formation>${escapeXml(f.name)}</intitule-formation>
			<objectif-formation><![CDATA[${objectif}]]></objectif-formation>
			<resultats-attendus>${escapeXml(resultats)}</resultats-attendus>
			<contenu-formation><![CDATA[${contenu}]]></contenu-formation>
			<parcours-de-formation>${DEFAULT_PARCOURS_DE_FORMATION}</parcours-de-formation>
			<objectif-general-formation>${DEFAULT_OBJECTIF_GENERAL}</objectif-general-formation>
			<certification>
				<code-RNCP>${escapeXml(rncp)}</code-RNCP>
			</certification>
			<action numero="${escapeXml(numero)}" datemaj="${datemaj}" datecrea="${datecrea}">
				<niveau-entree-obligatoire>${DEFAULT_NIVEAU_ENTREE}</niveau-entree-obligatoire>
				<modalites-enseignement>${modalites}</modalites-enseignement>
				<conditions-specifiques>${escapeXml(conditions)}</conditions-specifiques>
				<lieu-de-formation>
					<coordonnees numero="1">
						<nom>${escapeXml(contact.nom)}</nom>
						<prenom>${escapeXml(contact.prenom)}</prenom>
						${adresseBlock('1')}
						<telfixe>
							<numtel>${escapeXml(phone || '0000000000')}</numtel>
						</telfixe>
						<courriel>${escapeXml(email || 'missing@example.fr')}</courriel>
					</coordonnees>
				</lieu-de-formation>
				<modalites-entrees-sorties>${DEFAULT_MODALITES_ENTREES_SORTIES}</modalites-entrees-sorties>
				${urlAction}
				${sessionsXml.join('\n')}
				<adresse-information>
					${adresseBlock('1')}
				</adresse-information>
				<acces-handicapes>${DEFAULT_ACCES_HANDICAPES}</acces-handicapes>
				<langue-formation>${DEFAULT_LANGUE}</langue-formation>
				<code-perimetre-recrutement>${DEFAULT_PERIMETRE_RECRUTEMENT}</code-perimetre-recrutement>
				<infos-perimetre-recrutement>${escapeXml(regionInfo || 'Non renseigné')}</infos-perimetre-recrutement>
				${hours != null ? `<nombre-heures-centre>${hours}</nombre-heures-centre>` : ''}
				<nombre-heures-entreprise>0</nombre-heures-entreprise>
				<extras info="action">
					${f.priceFrom != null
            ? `<extras info="frais-pedagogiques">
						<extra info="taux-tva">20.0</extra>
						<extra info="frais-ht">${Number(f.priceFrom).toFixed(2)}</extra>
					</extras>`
            : '<!-- MISSING: Formation.priceFrom → frais-pedagogiques -->'}
					<extra info="existence-prerequis">${f.prerequisitesTable && Array.isArray(f.prerequisitesTable) && (f.prerequisitesTable as unknown[]).length > 0 ? '1' : '0'}</extra>
				</extras>
			</action>
			<organisme-formation-responsable>
				<SIRET-organisme-formation>
					<SIRET>${escapeXml(siret || '00000000000000')}</SIRET>
				</SIRET-organisme-formation>
			</organisme-formation-responsable>
			<extras info="formation"/>
		</formation>`);

    formationCount += 1;
  }

  parts.push(`</offres>`);
  parts.push(`</lheo>`);

  if (formationCount === 0) {
    gaps.push({
      severity: 'blocking',
      field: 'Formation',
      lheoPath: 'offres/formation',
      message:
        'Aucune formation exportable (ACTIVE + cpfEligible + rncpCode + session datée + textes). Vérifier le catalogue.',
    });
  }

  return {
    xml: parts.join('\n'),
    gaps,
    formationCount,
    sessionCount,
    skippedFormations,
  };
}
