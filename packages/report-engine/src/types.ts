/** Période standard des rapports (alignée pilotage + date picker UI). */
export type ReportPeriod = 'day' | 'week' | 'month' | 'year' | 'custom';

export type ReportOutputFormat = 'PDF' | 'EXCEL' | 'CSV';

export type ReportTemplateCategory =
  | 'pilotage'
  | 'rh'
  | 'academic'
  | 'finance'
  | 'support'
  | 'legal';

export type ReportRenderEngine = 'html-print' | 'pdfkit' | 'csv-export';

export type ReportTemplateDefinition = {
  key: string;
  label: string;
  description: string;
  category: ReportTemplateCategory;
  moduleKey: string;
  renderPath: string;
  supportedFormats: ReportOutputFormat[];
  engine: ReportRenderEngine;
  exportDataset?: string;
  /** Paramètres requis dans `ReportGenerationJob.parameters` (ex. sessionId, candidatureId). */
  requiredParameters?: { key: string; label: string; placeholder?: string }[];
};

export type ReportPeriodRange = {
  period: ReportPeriod;
  start: Date;
  end: Date;
  label: string;
};
