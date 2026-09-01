import type { FormationDeliveryMode, FundingFunderType } from '@repo/database';
import {
  BPF_CADRE_C_LINES,
  BPF_CADRE_F_AUDIENCES,
  mapAudienceKey,
  mapFunderTypeToCadreC,
  splitHoursByDeliveryMode,
  type BpfCadreCKey,
  type BpfCadreFAudienceKey,
} from './bpf-cerfa-mappings';
import { BPF_APPROVED_STATUSES, BPF_HOURS_PER_SLOT } from './bpf-cerfa-mappings';

export type CerfaAmountRow = {
  key: string;
  label: string;
  amountHt: number;
};

export type CerfaAudienceRow = {
  key: string;
  label: string;
  trainees: number;
  hours: number;
};

export type BpfCerfaSections = {
  cadreC: CerfaAmountRow[];
  cadreD: CerfaAmountRow[];
  cadreE: {
    internalTrainers: number;
    externalTrainers: number;
    pedagogicalHoursProxy: number;
  };
  cadreF: {
    byAudience: CerfaAudienceRow[];
    apprentices: number;
    hoursPresentiel: number;
    hoursDistanciel: number;
    hoursDirect: number;
    hoursDelegated: number;
  };
  cadreG: {
    subcontractTrainees: number;
    subcontractHours: number;
    revenueSubcontractHt: number;
  };
  notes: string[];
};

type FundingCaseLite = {
  status: string;
  funderType: FundingFunderType;
  requestedAmount: unknown;
  approvedAmount: unknown;
  participantId: string | null;
};

type ParticipantLite = {
  id: string;
  userId: string;
  fundingMode: string | null;
  attendedSlots: number;
  catalogHours: number;
};

type SessionLite = {
  trainerUserId: string | null;
  deliveryMode: FormationDeliveryMode | null;
  participants: ParticipantLite[];
};

export function buildCerfaSections(input: {
  fundingCases: FundingCaseLite[];
  sessions: SessionLite[];
  hoursAttendedProxy: number;
}): BpfCerfaSections {
  const cadreCAmounts = new Map<BpfCadreCKey, number>(
    BPF_CADRE_C_LINES.map((line) => [line.key, 0]),
  );

  for (const c of input.fundingCases) {
    if (!BPF_APPROVED_STATUSES.includes(c.status as (typeof BPF_APPROVED_STATUSES)[number])) {
      continue;
    }
    const key = mapFunderTypeToCadreC(c.funderType);
    const approved = Number(c.approvedAmount ?? 0);
    cadreCAmounts.set(key, (cadreCAmounts.get(key) ?? 0) + (Number.isFinite(approved) ? approved : 0));
  }

  const participantFunder = new Map<string, FundingFunderType>();
  for (const c of input.fundingCases) {
    if (c.participantId) participantFunder.set(c.participantId, c.funderType);
  }

  const audienceTrainees = new Map<BpfCadreFAudienceKey, Set<string>>(
    BPF_CADRE_F_AUDIENCES.map((a) => [a.key, new Set<string>()]),
  );
  const audienceHours = new Map<BpfCadreFAudienceKey, number>(
    BPF_CADRE_F_AUDIENCES.map((a) => [a.key, 0]),
  );
  let apprentices = 0;
  let hoursPresentiel = 0;
  let hoursDistanciel = 0;
  const trainerIds = new Set<string>();

  for (const session of input.sessions) {
    if (session.trainerUserId) trainerIds.add(session.trainerUserId);
    for (const p of session.participants) {
      const funder = participantFunder.get(p.id);
      if (funder === 'APPRENTICESHIP') {
        apprentices += 1;
        continue;
      }
      const audience = mapAudienceKey(funder, p.fundingMode);
      audienceTrainees.get(audience)?.add(p.userId);
      const attendedHours = p.attendedSlots * BPF_HOURS_PER_SLOT;
      const hours = attendedHours > 0 ? attendedHours : p.catalogHours;
      audienceHours.set(audience, (audienceHours.get(audience) ?? 0) + hours);
      const split = splitHoursByDeliveryMode(hours, session.deliveryMode);
      hoursPresentiel += split.presentiel;
      hoursDistanciel += split.distanciel;
    }
  }

  const cadreC = BPF_CADRE_C_LINES.map((line) => ({
    key: line.key,
    label: line.label,
    amountHt: Math.round((cadreCAmounts.get(line.key) ?? 0) * 100) / 100,
  }));

  const byAudience = BPF_CADRE_F_AUDIENCES.map((line) => ({
    key: line.key,
    label: line.label,
    trainees: audienceTrainees.get(line.key)?.size ?? 0,
    hours: Math.round((audienceHours.get(line.key) ?? 0) * 10) / 10,
  }));

  const hoursDirect = Math.round((hoursPresentiel + hoursDistanciel) * 10) / 10;

  return {
    cadreC,
    cadreD: [
      {
        key: 'charges_total',
        label: 'Charges formation (HT)',
        amountHt: 0,
      },
      {
        key: 'salaires_formateurs',
        label: 'Salaires formateurs (compte 6411)',
        amountHt: 0,
      },
      {
        key: 'sous_traitance',
        label: 'Sous-traitance / honoraires externes',
        amountHt: 0,
      },
    ],
    cadreE: {
      internalTrainers: trainerIds.size,
      externalTrainers: 0,
      pedagogicalHoursProxy: Math.round(input.hoursAttendedProxy * 10) / 10,
    },
    cadreF: {
      byAudience,
      apprentices,
      hoursPresentiel: Math.round(hoursPresentiel * 10) / 10,
      hoursDistanciel: Math.round(hoursDistanciel * 10) / 10,
      hoursDirect,
      hoursDelegated: 0,
    },
    cadreG: {
      subcontractTrainees: 0,
      subcontractHours: 0,
      revenueSubcontractHt: cadreCAmounts.get('sous_traitance_recue') ?? 0,
    },
    notes: [
      'Cadre C : produits HT (comptabilité d’engagement) dérivés des FundingCase post-approbation.',
      'Cadre D : charges non alimentées — saisie comptable hors périmètre GSMS V1.',
      'Cadre E : formateurs internes = trainerUserId distincts ; heures = proxy émargement (face-à-face pédagogique approximé).',
      'Cadre F : public déduit du financeur / fundingMode participant ; apprentis = dossiers APPRENTICESHIP.',
      'Cadre G : sous-traitance non modélisée — reste à zéro tant qu’aucun flux sous-traitant n’est saisi.',
      'Ne remplace pas le dépôt Cerfa 10443 officiel sur le portail MAF.',
    ],
  };
}
