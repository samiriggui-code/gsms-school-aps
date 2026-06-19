/** `corporate` = stack UI app ; `legal` = Georgia (contrats, actes juridiques). */
export type OfficialDocumentKind = 'corporate' | 'legal';

export type OfficialDocumentAuthor = {
  name: string;
  avatarUrl?: string | null;
  email?: string | null;
};

export type OfficialDocumentMeta = {
  title: string;
  subtitle?: string;
  periodLabel: string;
  generatedAt: string;
  reference?: string;
  summary?: string | null;
  author?: OfficialDocumentAuthor | null;
  kind?: OfficialDocumentKind;
};
