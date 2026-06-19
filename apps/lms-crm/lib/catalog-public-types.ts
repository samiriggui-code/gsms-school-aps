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
