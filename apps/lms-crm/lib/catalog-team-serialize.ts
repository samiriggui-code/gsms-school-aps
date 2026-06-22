import type { SchoolInternalService } from '@repo/database';
import { LandingTeamVolet } from '@repo/database';
import type { PublicCatalogTeamMember } from '@/lib/catalog-public-types';
import { getAvatarUrl } from '@/lib/helpers';

type LandingTeamVoletValue = (typeof LandingTeamVolet)[keyof typeof LandingTeamVolet];

type UserSlice = {
  id: string;
  name: string | null;
  firstName: string | null;
  lastName: string | null;
  avatar: string | null;
  jobFunction: string | null;
  qualification: string | null;
  landingPresentation: string | null;
  formateurProfile: {
    schoolInternalService: SchoolInternalService | null;
    speciality: string | null;
    specialties: unknown;
    certifications: unknown;
    yearsOfExperience: number | null;
    metadata: unknown;
  } | null;
  collaborateurProfile: {
    schoolInternalService: SchoolInternalService | null;
    jobFunction: string | null;
    qualification: string | null;
  } | null;
};

type OfferSlice = {
  id: string;
  userId: string;
  volet: LandingTeamVoletValue;
  catalogStatus: string;
  sortOrder: number;
  titleOverride: string | null;
  certificationsLabelOverride: string | null;
  bioOverride: string | null;
  statAOverride: number | null;
  statBOverride: number | null;
  ratingOverride: number | null;
  linkedinUrl: string | null;
  websiteUrl: string | null;
  user: UserSlice;
};

function displayName(user: UserSlice): string {
  const fromParts = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
  return user.name?.trim() || fromParts || 'Membre équipe';
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((x): x is string => typeof x === 'string' && x.trim() !== '');
}

function inferTitle(user: UserSlice): string {
  return (
    user.jobFunction?.trim() ||
    user.collaborateurProfile?.jobFunction?.trim() ||
    user.formateurProfile?.speciality?.trim() ||
    user.qualification?.trim() ||
    user.collaborateurProfile?.qualification?.trim() ||
    '—'
  );
}

function inferCertifications(user: UserSlice): string {
  const certs = asStringArray(user.formateurProfile?.certifications);
  if (certs.length) return certs.join(' · ');
  const specs = asStringArray(user.formateurProfile?.specialties);
  if (specs.length) return specs.join(' · ');
  return '—';
}

function inferBio(user: UserSlice): string {
  if (user.landingPresentation?.trim()) return user.landingPresentation.trim();

  const meta = user.formateurProfile?.metadata;
  if (meta && typeof meta === 'object' && !Array.isArray(meta)) {
    const raw =
      (meta as { landingBio?: unknown; portalBio?: unknown }).landingBio ??
      (meta as { portalBio?: unknown }).portalBio;
    if (typeof raw === 'string' && raw.trim()) return raw.trim();
  }
  const qual =
    user.qualification?.trim() ||
    user.collaborateurProfile?.qualification?.trim() ||
    user.jobFunction?.trim() ||
    user.collaborateurProfile?.jobFunction?.trim();
  if (qual) return qual;
  return '—';
}

export function inferLandingTeamVolet(user: UserSlice): LandingTeamVoletValue {
  const svc =
    user.formateurProfile?.schoolInternalService ??
    user.collaborateurProfile?.schoolInternalService;
  if (svc === 'DIRECTION') return 'direction';
  if (svc === 'PEDAGOGICAL') return 'pedagogique';
  if (svc === 'HR_ADMIN') return 'rh';
  return 'formateur';
}

export function serializeLandingTeamOffer(offer: OfferSlice): PublicCatalogTeamMember {
  const user = offer.user;
  const title = offer.titleOverride?.trim() || inferTitle(user);
  const certifications = offer.certificationsLabelOverride?.trim() || inferCertifications(user);
  const bio = offer.bioOverride?.trim() || inferBio(user);
  const statA = offer.statAOverride ?? user.formateurProfile?.yearsOfExperience ?? 5;
  const statB = offer.statBOverride ?? 100;
  const rating = offer.ratingOverride ?? 4.8;

  return {
    id: offer.id,
    userId: offer.userId,
    volet: offer.volet,
    catalogStatus: offer.catalogStatus,
    sortOrder: offer.sortOrder,
    name: displayName(user),
    title,
    certifications,
    bio,
    avatarUrl: user.avatar?.trim() ? getAvatarUrl(user.avatar, '/media/avatars/blank.png') : null,
    statA,
    statB,
    rating,
    linkedinUrl: offer.linkedinUrl?.trim() || null,
    websiteUrl: offer.websiteUrl?.trim() || null,
  };
}

export type LandingTeamOfferApiRow = PublicCatalogTeamMember & {
  updatedAt: string;
  titleOverride: string | null;
  certificationsLabelOverride: string | null;
  bioOverride: string | null;
};

export function serializeLandingTeamOfferForCrm(offer: OfferSlice & { updatedAt: Date }): LandingTeamOfferApiRow {
  return {
    ...serializeLandingTeamOffer(offer),
    updatedAt: offer.updatedAt.toISOString(),
    titleOverride: offer.titleOverride,
    certificationsLabelOverride: offer.certificationsLabelOverride,
    bioOverride: offer.bioOverride,
  };
}
