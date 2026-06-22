/** Formation affichée sur la section pricing du landing (catalogue CRM actif). */
export type PublicCatalogFormationItem = {
  slug: string;
  name: string;
  track: string;
  tag: string;
  duration: string;
  description: string;
  modules: string[];
  outcomes: string[];
  featured: boolean;
  priceFrom: number | null;
  currency: string;
};

/** Membre équipe affiché sur la section #trainers du landing. */
export type PublicCatalogTeamMember = {
  id: string;
  userId: string;
  volet: 'direction' | 'formateur' | 'pedagogique' | 'rh';
  catalogStatus: string;
  sortOrder: number;
  name: string;
  title: string;
  certifications: string;
  bio: string;
  avatarUrl: string | null;
  statA: number;
  statB: number;
  rating: number;
  linkedinUrl: string | null;
  websiteUrl: string | null;
};
