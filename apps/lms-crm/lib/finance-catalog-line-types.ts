export type FinanceCatalogLineRow = {
  id: string;
  category: string;
  formationId: string | null;
  label: string;
  description: string | null;
  defaultUnitPriceHt: number | null;
  defaultVatRate: number;
  currency: string;
  sortOrder: number;
};
