import {
  CandidatureStatus,
  FinanceDevisStatus,
  FormationLifecycleStatus,
  Prisma,
  type PrismaClient,
} from '@repo/database';
import { StatService } from './services';

export type WorkspaceKpi = {
  key?: string;
  label: string;
  value: string | number;
  subtitle?: string;
};

export type WorkspaceColumn = {
  key: string;
  label: string;
  align?: 'left' | 'right';
};

export type WorkspaceRow = Record<string, string | number | null>;

export type WorkspaceChartSlice = { name: string; value: number };

export type WorkspaceChartPoint = { label: string; value: number };

export type WorkspaceCharts = {
  distributionTitle?: string;
  evolutionTitle?: string;
  distribution: WorkspaceChartSlice[];
  distributionTotal?: number;
  evolution: WorkspaceChartPoint[];
  evolutionSeriesName?: string;
};

export type WorkspacePayload = {
  viewKey: string;
  kpis: WorkspaceKpi[];
  columns: WorkspaceColumn[];
  rows: WorkspaceRow[];
  pagination: { page: number; limit: number; total: number };
  footnote?: string;
  charts?: WorkspaceCharts;
};

export type WorkspaceQuery = {
  page?: number;
  limit?: number;
  q?: string;
};

const CANDIDATURE_STATUS_FR: Partial<Record<CandidatureStatus, string>> = {
  DRAFT: 'Brouillon',
  SUBMITTED: 'Transmis',
  MISSING_DOCUMENTS: 'Pièces manquantes',
  VALIDATION_PENDING: 'En validation',
  PENDING_CNAPS: 'CNAPS',
  VALIDATED: 'Validé',
  COMPLETED: 'Terminé',
  REJECTED: 'Refusé',
  ARCHIVED: 'Archivé',
};

const DEVIS_STATUS_FR: Record<FinanceDevisStatus, string> = {
  DRAFT: 'Brouillon',
  SENT: 'Envoyé',
  ACCEPTED: 'Accepté',
  REJECTED: 'Refusé',
  EXPIRED: 'Expiré',
};

function decimalNum(d: unknown): number {
  if (d == null) return 0;
  if (typeof d === 'object' && d !== null && 'toNumber' in d) {
    return (d as { toNumber: () => number }).toNumber();
  }
  return Number(d);
}

function money(value: number, currency = 'EUR'): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency }).format(value);
}

function fmtDate(d: Date | string | null | undefined): string | null {
  if (!d) return null;
  const date = typeof d === 'string' ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function paginate<T>(items: T[], page: number, limit: number) {
  const total = items.length;
  const start = (page - 1) * limit;
  return { slice: items.slice(start, start + limit), total };
}

const PILOTAGE_CHART_MONTHS = 12;

export class ModuleWorkspaceService {
  constructor(private prisma: PrismaClient) {}

  async getView(viewKey: string, query: WorkspaceQuery = {}): Promise<WorkspacePayload> {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(Math.max(query.limit ?? 15, 1), 100);
    const q = (query.q ?? '').trim().toLowerCase();

    switch (viewKey) {
      case 'finance-budget':
        return this.financeBudget(page, limit, q);
      case 'finance-paiements':
        return this.financePaiements(page, limit, q);
      case 'finance-rapports':
        return this.financeRapports(page, limit, q);
      case 'comm-cms-pages':
        return this.commCmsPages(page, limit, q);
      case 'comm-cms-contenus':
        return this.commCmsContenus(page, limit, q);
      case 'comm-campagnes':
        return this.commCampagnes(page, limit, q);
      case 'comm-seo-meta':
        return this.commSeoMeta(page, limit, q);
      case 'comm-seo-redirections':
        return this.commSeoRedirections(page, limit, q);
      case 'support-tickets':
        return this.supportTickets(page, limit, q);
      case 'support-base-aide':
        return this.supportBaseAide(page, limit, q);
      case 'support-incidents':
        return this.supportIncidents(page, limit, q);
      case 'gouvernance-storage':
        return this.gouvernanceStorage(page, limit, q);
      case 'gouvernance-demandes':
        return this.gouvernanceDemandes(page, limit, q);
      case 'gouvernance-corbeille':
        return this.gouvernanceCorbeille(page, limit, q);
      case 'gouvernance-audit':
        return this.gouvernanceAudit(page, limit, q);
      case 'pilotage-alertes':
        return this.pilotageAlertes(page, limit, q);
      case 'pilotage-indicateurs':
        return this.pilotageIndicateurs(page, limit, q);
      case 'pilotage-rapports':
        return this.pilotageRapports(page, limit, q);
      case 'pilotage-risques':
        return this.pilotageRisques(page, limit, q);
      default:
        throw new Error(`Vue workspace inconnue : ${viewKey}`);
    }
  }

  private async financeBudget(page: number, limit: number, q: string): Promise<WorkspacePayload> {
    const year = new Date().getFullYear();
    const where: Prisma.FinanceBudgetLineWhereInput = { periodYear: year };

    const [agg, rowsRaw, totalLines] = await Promise.all([
      this.prisma.financeBudgetLine.aggregate({
        where,
        _sum: { plannedAmount: true, actualAmount: true },
      }),
      this.prisma.financeBudgetLine.findMany({
        where,
        orderBy: { label: 'asc' },
        take: 200,
      }),
      this.prisma.financeBudgetLine.count({ where }),
    ]);

    const planned = decimalNum(agg._sum.plannedAmount);
    const actual = decimalNum(agg._sum.actualAmount);

    const rowsAll = rowsRaw
      .filter((r) => {
        if (!q) return true;
        return `${r.label} ${r.category}`.toLowerCase().includes(q);
      })
      .map((r) => ({
        libelle: r.label,
        categorie: r.category,
        prevu: money(decimalNum(r.plannedAmount)),
        realise: money(decimalNum(r.actualAmount)),
        ecart: money(decimalNum(r.plannedAmount) - decimalNum(r.actualAmount)),
      }));

    const { slice, total } = paginate(rowsAll, page, limit);

    return {
      viewKey: 'finance-budget',
      kpis: [
        { key: 'total', label: 'Lignes', value: totalLines, subtitle: `Exercice ${year}` },
        { key: 'planned', label: 'Prévu', value: money(planned), subtitle: 'Total planifié' },
        { key: 'actual', label: 'Réalisé', value: money(actual), subtitle: 'Consommé' },
        { key: 'ecart', label: 'Écart', value: money(planned - actual), subtitle: 'Prévu − réalisé' },
        {
          key: 'consumptionRate',
          label: 'Consommation',
          value: planned ? `${Math.round((actual / planned) * 100)} %` : '—',
          subtitle: 'Réalisé / prévu',
        },
      ],
      columns: [
        { key: 'libelle', label: 'Libellé' },
        { key: 'categorie', label: 'Catégorie' },
        { key: 'prevu', label: 'Prévu', align: 'right' },
        { key: 'realise', label: 'Réalisé', align: 'right' },
        { key: 'ecart', label: 'Écart', align: 'right' },
      ],
      rows: slice,
      pagination: { page, limit, total },
      footnote: 'Lignes budgétaires FinanceBudgetLine (exercice en cours).',
    };
  }

  private async financePaiements(page: number, limit: number, q: string): Promise<WorkspacePayload> {
    const [pendingAgg, receivedCount, rowsRaw] = await Promise.all([
      this.prisma.financePayment.aggregate({
        where: { status: 'PENDING' },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.financePayment.count({ where: { status: 'RECEIVED' } }),
      this.prisma.financePayment.findMany({
        orderBy: { updatedAt: 'desc' },
        take: 200,
        include: {
          devis: { select: { referenceCode: true, title: true, lead: { select: { email: true } } } },
        },
      }),
    ]);

    const PAY_STATUS: Record<string, string> = {
      PENDING: 'En attente',
      RECEIVED: 'Encaissé',
      FAILED: 'Échoué',
      REFUNDED: 'Remboursé',
    };

    const rowsAll = rowsRaw
      .filter((r) => {
        if (!q) return true;
        const hay = `${r.referenceCode} ${r.devis?.referenceCode} ${r.devis?.lead?.email}`.toLowerCase();
        return hay.includes(q);
      })
      .map((r) => ({
        reference: r.referenceCode,
        devis: r.devis?.referenceCode ?? '—',
        statut: PAY_STATUS[r.status] ?? r.status,
        montant: money(decimalNum(r.amount), r.currency),
        maj: fmtDate(r.updatedAt),
      }));

    const { slice, total } = paginate(rowsAll, page, limit);
    const failedCount = rowsRaw.filter((r) => r.status === 'FAILED').length;

    return {
      viewKey: 'finance-paiements',
      kpis: [
        {
          key: 'pending',
          label: 'En attente',
          value: pendingAgg._count,
          subtitle: money(decimalNum(pendingAgg._sum.amount)),
        },
        { key: 'received', label: 'Encaissés', value: receivedCount, subtitle: 'Paiements reçus' },
        { key: 'total', label: 'Total suivi', value: rowsRaw.length, subtitle: 'Enregistrements' },
        { key: 'pendingAmount', label: 'Montant dû', value: money(decimalNum(pendingAgg._sum.amount)), subtitle: 'Somme pending' },
        { key: 'failed', label: 'Échoués', value: failedCount, subtitle: 'Paiements en erreur' },
      ],
      columns: [
        { key: 'reference', label: 'Référence' },
        { key: 'devis', label: 'Devis' },
        { key: 'statut', label: 'Statut' },
        { key: 'montant', label: 'Montant', align: 'right' },
        { key: 'maj', label: 'Suivi', align: 'right' },
      ],
      rows: slice,
      pagination: { page, limit, total },
      footnote: 'Encaissements FinancePayment liés aux devis.',
    };
  }

  private async financeRapports(page: number, limit: number, q: string): Promise<WorkspacePayload> {
    const months = 12;
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);

    const [devis, leads] = await Promise.all([
      this.prisma.financeDevis.findMany({
        where: { createdAt: { gte: start } },
        select: { createdAt: true, status: true, totalTtc: true },
      }),
      this.prisma.lead.findMany({
        where: { createdAt: { gte: start } },
        select: { createdAt: true },
      }),
    ]);

    const monthRows: WorkspaceRow[] = [];
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(d);

      const monthDevis = devis.filter((x) => {
        const k = `${x.createdAt.getFullYear()}-${String(x.createdAt.getMonth() + 1).padStart(2, '0')}`;
        return k === key;
      });
      const monthLeads = leads.filter((x) => {
        const k = `${x.createdAt.getFullYear()}-${String(x.createdAt.getMonth() + 1).padStart(2, '0')}`;
        return k === key;
      });
      const accepted = monthDevis.filter((x) => x.status === FinanceDevisStatus.ACCEPTED);
      const ca = accepted.reduce((s, x) => s + decimalNum(x.totalTtc), 0);

      monthRows.push({
        periode: label,
        devis: monthDevis.length,
        acceptes: accepted.length,
        leads: monthLeads.length,
        ca: money(ca),
      });
    }

    const filtered = monthRows.filter((r) => !q || String(r.periode).toLowerCase().includes(q));
    const { slice, total } = paginate(filtered, page, limit);

    const totalDevis = devis.length;
    const totalAccepted = devis.filter((d) => d.status === FinanceDevisStatus.ACCEPTED).length;
    const caTotal = devis
      .filter((d) => d.status === FinanceDevisStatus.ACCEPTED)
      .reduce((s, x) => s + decimalNum(x.totalTtc), 0);

    return {
      viewKey: 'finance-rapports',
      kpis: [
        { key: 'devis12m', label: 'Devis 12 mois', value: totalDevis, subtitle: 'Volume commercial' },
        { key: 'accepted', label: 'Acceptés', value: totalAccepted, subtitle: 'Taux de conversion' },
        { key: 'leads12m', label: 'Leads 12 mois', value: leads.length, subtitle: 'Entrées commerciales' },
        {
          key: 'conversionRate',
          label: 'Taux conversion',
          value: totalDevis ? `${Math.round((totalAccepted / totalDevis) * 100)} %` : '—',
          subtitle: 'Devis → accepté',
        },
        { key: 'revenue', label: 'CA accepté', value: money(caTotal), subtitle: '12 mois glissants' },
      ],
      columns: [
        { key: 'periode', label: 'Période' },
        { key: 'devis', label: 'Devis', align: 'right' },
        { key: 'acceptes', label: 'Acceptés', align: 'right' },
        { key: 'leads', label: 'Leads', align: 'right' },
        { key: 'ca', label: 'CA accepté', align: 'right' },
      ],
      rows: slice,
      pagination: { page, limit, total },
      footnote: 'Rapport mensuel consolidé (devis, leads, CA accepté).',
    };
  }

  private async commCmsPages(page: number, limit: number, q: string): Promise<WorkspacePayload> {
    const config = await this.prisma.landingConfig.findFirst({
      orderBy: { updatedAt: 'desc' },
      select: { sections: true, enabled: true, updatedAt: true },
    });

    const sections = Array.isArray(config?.sections)
      ? (config!.sections as Array<Record<string, unknown>>)
      : [];

    const rowsAll = sections.map((s, idx) => ({
      ordre: idx + 1,
      type: String(s.type ?? s.kind ?? 'section'),
      titre: String(s.title ?? s.label ?? s.id ?? `Bloc ${idx + 1}`),
      actif: config?.enabled ? 'Oui' : 'Non',
    }));

    const filtered = rowsAll.filter((r) => {
      if (!q) return true;
      return `${r.type} ${r.titre}`.toLowerCase().includes(q);
    });
    const { slice, total } = paginate(filtered, page, limit);

    return {
      viewKey: 'comm-cms-pages',
      kpis: [
        { key: 'sections', label: 'Sections landing', value: sections.length, subtitle: 'Blocs configurés' },
        { key: 'publication', label: 'Publication', value: config?.enabled ? 'Active' : 'Désactivée', subtitle: 'LandingConfig' },
        { key: 'lastUpdate', label: 'Dernière MAJ', value: fmtDate(config?.updatedAt) ?? '—', subtitle: 'CMS landing' },
        { key: 'crmPages', label: 'Pages CRM', value: 1, subtitle: 'Site vitrine unique' },
        {
          key: 'blockTypes',
          label: 'Types de blocs',
          value: new Set(sections.map((s) => String(s.type ?? s.kind ?? 'section'))).size,
          subtitle: 'Sections distinctes',
        },
      ],
      columns: [
        { key: 'ordre', label: '#', align: 'right' },
        { key: 'type', label: 'Type' },
        { key: 'titre', label: 'Titre / libellé' },
        { key: 'actif', label: 'Actif' },
      ],
      rows: slice,
      pagination: { page, limit, total },
      footnote: 'Sections issues de LandingConfig (site public).',
    };
  }

  private async commCmsContenus(page: number, limit: number, q: string): Promise<WorkspacePayload> {
    const formations = await this.prisma.formation.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 200,
      select: {
        name: true,
        slug: true,
        status: true,
        updatedAt: true,
        catalogOffer: { select: { catalogStatus: true } },
      },
    });

    const rowsAll = formations
      .filter((f) => {
        if (!q) return true;
        return `${f.name} ${f.slug}`.toLowerCase().includes(q);
      })
      .map((f) => ({
        formation: f.name,
        slug: f.slug,
        statut: f.status,
        catalogue: f.catalogOffer?.catalogStatus ?? '—',
        maj: fmtDate(f.updatedAt),
      }));

    const actives = formations.filter((f) => f.status === FormationLifecycleStatus.ACTIVE).length;
    const { slice, total } = paginate(rowsAll, page, limit);

    return {
      viewKey: 'comm-cms-contenus',
      kpis: [
        { key: 'formations', label: 'Formations', value: formations.length, subtitle: 'Catalogue CRM' },
        { key: 'active', label: 'Actives', value: actives, subtitle: 'Publiables' },
        {
          key: 'catalogOffers',
          label: 'Offres catalogue',
          value: formations.filter((f) => f.catalogOffer?.catalogStatus === 'ACTIVE').length,
          subtitle: 'Visibles landing',
        },
        { key: 'drafts', label: 'Brouillons', value: formations.length - actives, subtitle: 'Hors ligne' },
        {
          key: 'noOffer',
          label: 'Sans offre',
          value: formations.filter((f) => !f.catalogOffer).length,
          subtitle: 'Hors catalogue landing',
        },
      ],
      columns: [
        { key: 'formation', label: 'Formation' },
        { key: 'slug', label: 'Slug' },
        { key: 'statut', label: 'Statut' },
        { key: 'catalogue', label: 'Catalogue' },
        { key: 'maj', label: 'MAJ', align: 'right' },
      ],
      rows: slice,
      pagination: { page, limit, total },
      footnote: 'Contenus pédagogiques et statut catalogue landing.',
    };
  }

  private async commCampagnes(page: number, limit: number, q: string): Promise<WorkspacePayload> {
    const [total, active, paused, ended, rowsRaw] = await Promise.all([
      this.prisma.marketingCampaign.count(),
      this.prisma.marketingCampaign.count({ where: { status: 'ACTIVE' } }),
      this.prisma.marketingCampaign.count({ where: { status: 'PAUSED' } }),
      this.prisma.marketingCampaign.count({ where: { status: 'ENDED' } }),
      this.prisma.marketingCampaign.findMany({ orderBy: { updatedAt: 'desc' }, take: 200 }),
    ]);

    const CAMP_STATUS: Record<string, string> = {
      DRAFT: 'Brouillon',
      ACTIVE: 'Active',
      PAUSED: 'En pause',
      ENDED: 'Terminée',
    };

    const rowsAll = rowsRaw
      .filter((r) => {
        if (!q) return true;
        return `${r.name} ${r.channel} ${r.utmSource} ${r.utmCampaign}`.toLowerCase().includes(q);
      })
      .map((r) => ({
        nom: r.name,
        canal: r.channel,
        statut: CAMP_STATUS[r.status] ?? r.status,
        utm: r.utmCampaign ?? r.utmSource ?? '—',
        maj: fmtDate(r.updatedAt),
      }));

    const { slice, total: filteredTotal } = paginate(rowsAll, page, limit);

    return {
      viewKey: 'comm-campagnes',
      kpis: [
        { key: 'total', label: 'Campagnes', value: total, subtitle: 'Total enregistrées' },
        { key: 'active', label: 'Actives', value: active, subtitle: 'En cours' },
        { key: 'paused', label: 'En pause', value: paused, subtitle: 'Suspendues' },
        { key: 'channels', label: 'Canaux', value: new Set(rowsRaw.map((r) => r.channel)).size, subtitle: 'Distincts' },
        { key: 'ended', label: 'Terminées', value: ended, subtitle: 'Campagnes closes' },
      ],
      columns: [
        { key: 'nom', label: 'Nom' },
        { key: 'canal', label: 'Canal' },
        { key: 'statut', label: 'Statut' },
        { key: 'utm', label: 'UTM' },
        { key: 'maj', label: 'MAJ', align: 'right' },
      ],
      rows: slice,
      pagination: { page, limit, total: filteredTotal },
      footnote: 'Campagnes marketing (MarketingCampaign).',
    };
  }

  private async commSeoMeta(page: number, limit: number, q: string): Promise<WorkspacePayload> {
    const [setting, config] = await Promise.all([
      this.prisma.systemSetting.findFirst({ orderBy: { id: 'asc' } }),
      this.prisma.landingConfig.findFirst({ orderBy: { updatedAt: 'desc' }, select: { enabled: true, updatedAt: true } }),
    ]);

    const rowsAll: WorkspaceRow[] = [
      { cle: 'Organisme', valeur: setting?.name ?? "FORM'SSI", zone: 'CRM' },
      { cle: 'Site actif', valeur: setting?.active ? 'Oui' : 'Non', zone: 'CRM' },
      { cle: 'Landing publiée', valeur: config?.enabled ? 'Oui' : 'Non', zone: 'Landing' },
      { cle: 'Ville', valeur: setting?.companyCity ?? '—', zone: 'CRM' },
      { cle: 'SIRET', valeur: setting?.siret ?? '—', zone: 'CRM' },
      { cle: 'Dernière MAJ landing', valeur: fmtDate(config?.updatedAt) ?? '—', zone: 'Landing' },
    ];

    const filtered = rowsAll.filter((r) => !q || `${r.cle} ${r.valeur}`.toLowerCase().includes(q));
    const { slice, total } = paginate(filtered, page, limit);

    return {
      viewKey: 'comm-seo-meta',
      kpis: [
        { key: 'metaEntries', label: 'Entrées meta', value: rowsAll.length, subtitle: 'Champs suivis' },
        { key: 'org', label: 'Organisme', value: setting?.name ? 'Configuré' : '—', subtitle: 'SystemSetting' },
        { key: 'landing', label: 'Landing', value: config?.enabled ? 'En ligne' : 'Hors ligne', subtitle: 'Publication' },
        { key: 'indexing', label: 'Indexation', value: 'Manuelle', subtitle: 'Sitemap à brancher' },
        { key: 'crmSite', label: 'Site CRM', value: setting?.active ? 'Actif' : 'Inactif', subtitle: 'SystemSetting' },
      ],
      columns: [
        { key: 'cle', label: 'Meta' },
        { key: 'valeur', label: 'Valeur' },
        { key: 'zone', label: 'Zone' },
      ],
      rows: slice,
      pagination: { page, limit, total },
      footnote: 'Meta & indexation — valeurs SystemSetting + LandingConfig.',
    };
  }

  private async commSeoRedirections(page: number, limit: number, q: string): Promise<WorkspacePayload> {
    const [total, active, rowsRaw] = await Promise.all([
      this.prisma.seoRedirect.count(),
      this.prisma.seoRedirect.count({ where: { active: true } }),
      this.prisma.seoRedirect.findMany({ orderBy: { sourcePath: 'asc' }, take: 200 }),
    ]);

    const rowsAll = rowsRaw
      .filter((r) => {
        if (!q) return true;
        return `${r.sourcePath} ${r.targetPath}`.toLowerCase().includes(q);
      })
      .map((r) => ({
        source: r.sourcePath,
        cible: r.targetPath,
        type: String(r.redirectType),
        statut: r.active ? 'Actif' : 'Inactif',
      }));

    const { slice, total: filteredTotal } = paginate(rowsAll, page, limit);

    return {
      viewKey: 'comm-seo-redirections',
      kpis: [
        { key: 'total', label: 'Redirections', value: total, subtitle: 'Règles enregistrées' },
        { key: 'active', label: 'Actives', value: active, subtitle: 'En production' },
        { key: 'perm301', label: '301', value: rowsRaw.filter((r) => r.redirectType === 301).length, subtitle: 'Permanentes' },
        { key: 'perm302', label: '302', value: rowsRaw.filter((r) => r.redirectType === 302).length, subtitle: 'Temporaires' },
        { key: 'inactive', label: 'Inactives', value: total - active, subtitle: 'Hors production' },
      ],
      columns: [
        { key: 'source', label: 'Source' },
        { key: 'cible', label: 'Cible' },
        { key: 'type', label: 'Type' },
        { key: 'statut', label: 'Statut' },
      ],
      rows: slice,
      pagination: { page, limit, total: filteredTotal },
      footnote: 'Redirections SEO (SeoRedirect).',
    };
  }

  private async supportTickets(page: number, limit: number, q: string): Promise<WorkspacePayload> {
    const [total, open, inProgress, resolved, urgent, rowsRaw] = await Promise.all([
      this.prisma.supportTicket.count(),
      this.prisma.supportTicket.count({ where: { status: 'OPEN' } }),
      this.prisma.supportTicket.count({ where: { status: 'IN_PROGRESS' } }),
      this.prisma.supportTicket.count({ where: { status: { in: ['RESOLVED', 'CLOSED'] } } }),
      this.prisma.supportTicket.count({
        where: { priority: { in: ['HIGH', 'URGENT'] }, status: { notIn: ['RESOLVED', 'CLOSED'] } },
      }),
      this.prisma.supportTicket.findMany({
        orderBy: { updatedAt: 'desc' },
        take: 200,
        select: {
          referenceCode: true,
          subject: true,
          status: true,
          priority: true,
          requesterName: true,
          requesterEmail: true,
          updatedAt: true,
        },
      }),
    ]);

    const TICKET_STATUS: Record<string, string> = {
      OPEN: 'Ouvert',
      IN_PROGRESS: 'En cours',
      WAITING_CLIENT: 'Attente client',
      RESOLVED: 'Résolu',
      CLOSED: 'Clôturé',
    };

    const rowsAll = rowsRaw
      .filter((r) => {
        if (!q) return true;
        return `${r.referenceCode} ${r.subject} ${r.requesterEmail}`.toLowerCase().includes(q);
      })
      .map((r) => ({
        reference: r.referenceCode,
        sujet: r.subject,
        demandeur: r.requesterName,
        statut: TICKET_STATUS[r.status] ?? r.status,
        maj: fmtDate(r.updatedAt),
      }));

    const { slice, total: filteredTotal } = paginate(rowsAll, page, limit);

    return {
      viewKey: 'support-tickets',
      kpis: [
        { key: 'total', label: 'Total', value: total, subtitle: 'Tickets' },
        { key: 'open', label: 'Ouverts', value: open, subtitle: 'À traiter' },
        { key: 'inProgress', label: 'En cours', value: inProgress, subtitle: 'Assignés' },
        { key: 'resolved', label: 'Résolus', value: resolved, subtitle: 'Clôturés' },
        { key: 'urgent', label: 'Priorité haute', value: urgent, subtitle: 'Urgent / haute' },
      ],
      columns: [
        { key: 'reference', label: 'Réf.' },
        { key: 'sujet', label: 'Sujet' },
        { key: 'demandeur', label: 'Demandeur' },
        { key: 'statut', label: 'Statut' },
        { key: 'maj', label: 'MAJ', align: 'right' },
      ],
      rows: slice,
      pagination: { page, limit, total: filteredTotal },
      footnote: 'File support (SupportTicket).',
    };
  }

  private async supportBaseAide(page: number, limit: number, q: string): Promise<WorkspacePayload> {
    const formations = await this.prisma.formation.findMany({
      where: { status: FormationLifecycleStatus.ACTIVE },
      orderBy: { name: 'asc' },
      select: { name: true, slug: true, description: true },
    });

    const rowsAll = formations
      .filter((f) => !q || `${f.name} ${f.slug}`.toLowerCase().includes(q))
      .map((f) => ({
        article: f.name,
        slug: f.slug,
        extrait: (f.description ?? 'Formation sécurité FORM\'SSI').slice(0, 72),
        categorie: 'Catalogue',
      }));

    const { slice, total } = paginate(rowsAll, page, limit);

    return {
      viewKey: 'support-base-aide',
      kpis: [
        { key: 'articles', label: 'Articles', value: formations.length, subtitle: 'Fiches formation' },
        { key: 'faq', label: 'FAQ dédiée', value: 0, subtitle: 'À enrichir' },
        { key: 'searches', label: 'Recherches', value: '—', subtitle: 'Analytics à brancher' },
        { key: 'satisfaction', label: 'Satisfaction', value: '—', subtitle: 'Enquêtes à brancher' },
        { key: 'coverage', label: 'Couverture', value: formations.length, subtitle: 'Fiches actives' },
      ],
      columns: [
        { key: 'article', label: 'Article' },
        { key: 'slug', label: 'Slug' },
        { key: 'extrait', label: 'Extrait' },
        { key: 'categorie', label: 'Catégorie' },
      ],
      rows: slice,
      pagination: { page, limit, total },
      footnote: 'Fiches catalogue formations actives (aide self-service). Documentation : Mintlify @lms/docs.',
    };
  }

  private async supportIncidents(page: number, limit: number, q: string): Promise<WorkspacePayload> {
    const [equipments, errorLogs] = await Promise.all([
      this.prisma.equipment.findMany({
        where: { status: 'OUT_OF_SERVICE' },
        orderBy: { updatedAt: 'desc' },
        take: 100,
        select: { label: true, serialNumber: true, updatedAt: true, type: true },
      }),
      this.prisma.systemLog.findMany({
        where: { event: { contains: 'ERROR', mode: 'insensitive' } },
        orderBy: { createdAt: 'desc' },
        take: 100,
        select: { event: true, description: true, createdAt: true },
      }),
    ]);

    const rowsAll: WorkspaceRow[] = [
      ...equipments.map((e) => ({
        type: 'Matériel',
        sujet: e.label,
        reference: e.serialNumber ?? '—',
        lieu: e.type ?? '—',
        date: fmtDate(e.updatedAt),
      })),
      ...errorLogs.map((l) => ({
        type: 'Système',
        sujet: l.event ?? 'Erreur',
        reference: '—',
        lieu: (l.description ?? '—').slice(0, 60),
        date: fmtDate(l.createdAt),
      })),
    ].filter((r) => !q || `${r.sujet} ${r.reference}`.toLowerCase().includes(q));

    const { slice, total } = paginate(rowsAll, page, limit);

    return {
      viewKey: 'support-incidents',
      kpis: [
        { key: 'equipmentDown', label: 'Matériel HS', value: equipments.length, subtitle: 'Équipements' },
        { key: 'systemErrors', label: 'Erreurs système', value: errorLogs.length, subtitle: 'Logs' },
        { key: 'critical', label: 'Critiques', value: errorLogs.length, subtitle: 'À traiter' },
        { key: 'resolved7d', label: 'Résolus 7j', value: 0, subtitle: 'Workflow qualité' },
        {
          key: 'totalReports',
          label: 'Total signalements',
          value: equipments.length + errorLogs.length,
          subtitle: 'Matériel + système',
        },
      ],
      columns: [
        { key: 'type', label: 'Type' },
        { key: 'sujet', label: 'Sujet' },
        { key: 'reference', label: 'Réf.' },
        { key: 'lieu', label: 'Détail / lieu' },
        { key: 'date', label: 'Date', align: 'right' },
      ],
      rows: slice,
      pagination: { page, limit, total },
      footnote: 'Incidents consolidés : matériel hors service + logs ERROR.',
    };
  }

  private async gouvernanceStorage(page: number, limit: number, q: string): Promise<WorkspacePayload> {
    const where: Prisma.FileAssetWhereInput = {
      deletedAt: null,
      status: 'ACTIVE',
      ...(q
        ? {
            OR: [
              { originalName: { contains: q, mode: 'insensitive' } },
              { module: { contains: q, mode: 'insensitive' } },
              { entityType: { contains: q, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [total, sumSize, rowsRaw] = await Promise.all([
      this.prisma.fileAsset.count({ where }),
      this.prisma.fileAsset.aggregate({ where, _sum: { size: true } }),
      this.prisma.fileAsset.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          originalName: true,
          module: true,
          entityType: true,
          mimeType: true,
          size: true,
          createdAt: true,
        },
      }),
    ]);

    const sizeMb = Math.round((sumSize._sum.size ?? 0) / (1024 * 1024));

    return {
      viewKey: 'gouvernance-storage',
      kpis: [
        { key: 'total', label: 'Fichiers actifs', value: total, subtitle: 'FileAsset' },
        { key: 'sizeMb', label: 'Volume', value: `${sizeMb} Mo`, subtitle: 'Stockage S3' },
        { key: 'modules', label: 'Modules', value: new Set(rowsRaw.map((r) => r.module)).size, subtitle: 'Page courante' },
        { key: 'privateDefault', label: 'Privés', value: total, subtitle: 'Visibilité par défaut' },
        {
          key: 'avgSizeKb',
          label: 'Taille moyenne',
          value: `${Math.round((sumSize._sum.size ?? 0) / Math.max(total, 1) / 1024)} Ko`,
          subtitle: 'Par fichier',
        },
      ],
      columns: [
        { key: 'fichier', label: 'Fichier' },
        { key: 'module', label: 'Module' },
        { key: 'type', label: 'Entité' },
        { key: 'mime', label: 'MIME' },
        { key: 'taille', label: 'Taille', align: 'right' },
        { key: 'date', label: 'Dépôt', align: 'right' },
      ],
      rows: rowsRaw.map((r) => ({
        fichier: r.originalName,
        module: r.module,
        type: r.entityType,
        mime: r.mimeType,
        taille: `${Math.max(1, Math.round(r.size / 1024))} Ko`,
        date: fmtDate(r.createdAt),
      })),
      pagination: { page, limit, total },
      footnote: 'Inventaire des fichiers actifs (@repo/storage / FileAsset).',
    };
  }

  private async gouvernanceDemandes(page: number, limit: number, q: string): Promise<WorkspacePayload> {
    const where: Prisma.CandidatureWhereInput = {
      status: {
        in: [
          CandidatureStatus.DRAFT,
          CandidatureStatus.SUBMITTED,
          CandidatureStatus.MISSING_DOCUMENTS,
          CandidatureStatus.VALIDATION_PENDING,
        ],
      },
      ...(q
        ? {
            OR: [
              { user: { email: { contains: q, mode: 'insensitive' } } },
              { user: { firstName: { contains: q, mode: 'insensitive' } } },
              { user: { lastName: { contains: q, mode: 'insensitive' } } },
              { formation: { name: { contains: q, mode: 'insensitive' } } },
            ],
          }
        : {}),
    };

    const [total, rowsRaw] = await Promise.all([
      this.prisma.candidature.count({ where }),
      this.prisma.candidature.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          status: true,
          updatedAt: true,
          user: { select: { firstName: true, lastName: true, email: true } },
          formation: { select: { name: true } },
        },
      }),
    ]);

    return {
      viewKey: 'gouvernance-demandes',
      kpis: [
        { key: 'total', label: 'Dossiers ouverts', value: total, subtitle: 'Candidatures actives' },
        { key: 'missing', label: 'Pièces manquantes', value: await this.prisma.candidature.count({ where: { status: CandidatureStatus.MISSING_DOCUMENTS } }), subtitle: 'À relancer' },
        { key: 'pending', label: 'En validation', value: await this.prisma.candidature.count({ where: { status: CandidatureStatus.VALIDATION_PENDING } }), subtitle: 'Instruction' },
        { key: 'draft', label: 'Brouillons', value: await this.prisma.candidature.count({ where: { status: CandidatureStatus.DRAFT } }), subtitle: 'Landing / CRM' },
        {
          key: 'submitted',
          label: 'Transmis',
          value: await this.prisma.candidature.count({ where: { status: CandidatureStatus.SUBMITTED } }),
          subtitle: 'En attente instruction',
        },
      ],
      columns: [
        { key: 'candidat', label: 'Candidat' },
        { key: 'email', label: 'E-mail' },
        { key: 'formation', label: 'Formation' },
        { key: 'statut', label: 'Statut' },
        { key: 'maj', label: 'MAJ', align: 'right' },
      ],
      rows: rowsRaw.map((r) => ({
        candidat: `${r.user.firstName} ${r.user.lastName}`,
        email: r.user.email,
        formation: r.formation?.name ?? '—',
        statut: CANDIDATURE_STATUS_FR[r.status] ?? r.status,
        maj: fmtDate(r.updatedAt),
      })),
      pagination: { page, limit, total },
      footnote: 'Demandes de pièces / dossiers candidats en cours de traitement.',
    };
  }

  private async gouvernanceCorbeille(page: number, limit: number, q: string): Promise<WorkspacePayload> {
    const [trashedUsers, deletedFiles] = await Promise.all([
      this.prisma.user.count({ where: { isTrashed: true } }),
      this.prisma.fileAsset.count({ where: { deletedAt: { not: null } } }),
    ]);

    const files = await this.prisma.fileAsset.findMany({
      where: {
        deletedAt: { not: null },
        ...(q ? { originalName: { contains: q, mode: 'insensitive' } } : {}),
      },
      orderBy: { deletedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      select: { originalName: true, module: true, deletedAt: true },
    });

    return {
      viewKey: 'gouvernance-corbeille',
      kpis: [
        { key: 'total', label: 'Fichiers supprimés', value: deletedFiles, subtitle: 'Corbeille S3' },
        { key: 'trashedUsers', label: 'Comptes corbeille', value: trashedUsers, subtitle: 'Utilisateurs' },
        { key: 'restoreCount', label: 'Restaurations', value: 0, subtitle: 'Action admin' },
        { key: 'retentionDays', label: 'Rétention', value: '90 j', subtitle: 'Politique indicative' },
        { key: 'volumeTotal', label: 'Volume total', value: deletedFiles + trashedUsers, subtitle: 'Éléments archivés' },
      ],
      columns: [
        { key: 'fichier', label: 'Fichier' },
        { key: 'module', label: 'Module' },
        { key: 'supprime', label: 'Supprimé le', align: 'right' },
      ],
      rows: files.map((f) => ({
        fichier: f.originalName,
        module: f.module,
        supprime: fmtDate(f.deletedAt),
      })),
      pagination: { page, limit, total: deletedFiles },
      footnote: 'Corbeille documentaire (FileAsset soft-deleted).',
    };
  }

  private async gouvernanceAudit(page: number, limit: number, q: string): Promise<WorkspacePayload> {
    const where: Prisma.SystemLogWhereInput = q
      ? {
          OR: [
            { event: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
            { user: { email: { contains: q, mode: 'insensitive' } } },
          ],
        }
      : {};

    const [total, rowsRaw] = await Promise.all([
      this.prisma.systemLog.count({ where }),
      this.prisma.systemLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          event: true,
          description: true,
          ipAddress: true,
          createdAt: true,
          user: { select: { email: true, name: true } },
        },
      }),
    ]);

    return {
      viewKey: 'gouvernance-audit',
      kpis: [
        { key: 'total', label: 'Événements', value: total, subtitle: 'SystemLog' },
        { key: 'recent', label: '7 jours', value: await this.prisma.systemLog.count({ where: { ...where, createdAt: { gte: new Date(Date.now() - 7 * 86400000) } } }), subtitle: 'Activité récente' },
        { key: 'loginCount', label: 'Connexions', value: await this.prisma.systemLog.count({ where: { event: { contains: 'LOGIN', mode: 'insensitive' } } }), subtitle: 'Authentification' },
        { key: 'ipCount', label: 'Adresses IP', value: new Set(rowsRaw.map((r) => r.ipAddress).filter(Boolean)).size, subtitle: 'Page courante' },
        {
          key: 'today',
          label: "Aujourd'hui",
          value: await this.prisma.systemLog.count({
            where: {
              ...where,
              createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
            },
          }),
          subtitle: 'Événements du jour',
        },
      ],
      columns: [
        { key: 'evenement', label: 'Événement' },
        { key: 'utilisateur', label: 'Utilisateur' },
        { key: 'ip', label: 'IP' },
        { key: 'detail', label: 'Détail' },
        { key: 'date', label: 'Date', align: 'right' },
      ],
      rows: rowsRaw.map((r) => ({
        evenement: r.event ?? '—',
        utilisateur: r.user?.email ?? r.user?.name ?? '—',
        ip: r.ipAddress ?? '—',
        detail: (r.description ?? '—').slice(0, 64),
        date: fmtDate(r.createdAt),
      })),
      pagination: { page, limit, total },
      footnote: 'Journal d\'audit basé sur SystemLog (accès, actions CRM).',
    };
  }

  private async pilotageAlertes(page: number, limit: number, q: string): Promise<WorkspacePayload> {
    return this.buildPilotageView('pilotage-alertes', page, limit, q, 'Alertes opérationnelles');
  }

  private async pilotageIndicateurs(page: number, limit: number, q: string): Promise<WorkspacePayload> {
    return this.buildPerformanceView('pilotage-indicateurs', page, limit, q);
  }

  private async pilotageRapports(page: number, limit: number, q: string): Promise<WorkspacePayload> {
    return this.buildPilotageView('pilotage-rapports', page, limit, q, 'Rapports de pilotage');
  }

  private async pilotageRisques(page: number, limit: number, q: string): Promise<WorkspacePayload> {
    return this.buildRisquesView('pilotage-risques', page, limit, q);
  }

  private async monthlyCandidatureEvolution(months: number): Promise<WorkspaceChartPoint[]> {
    const timelineStart = new Date();
    timelineStart.setMonth(timelineStart.getMonth() - (months - 1));
    timelineStart.setDate(1);
    timelineStart.setHours(0, 0, 0, 0);

    const rows = await this.prisma.candidature.findMany({
      where: { createdAt: { gte: timelineStart } },
      select: { createdAt: true },
    });

    const monthMap = new Map<string, number>();
    for (const row of rows) {
      const key = StatService.toMonthKey(row.createdAt);
      monthMap.set(key, (monthMap.get(key) || 0) + 1);
    }

    return StatService.generateMonthlyTimeline(months).map((t) => ({
      label: new Date(t.date).toLocaleString('fr-FR', { month: 'short' }),
      value: monthMap.get(t.key) || 0,
    }));
  }

  private async monthlySessionEvolution(months: number): Promise<WorkspaceChartPoint[]> {
    const timelineStart = new Date();
    timelineStart.setMonth(timelineStart.getMonth() - (months - 1));
    timelineStart.setDate(1);
    timelineStart.setHours(0, 0, 0, 0);

    const rows = await this.prisma.formationSession.findMany({
      where: { startDate: { gte: timelineStart } },
      select: { startDate: true },
    });

    const monthMap = new Map<string, number>();
    for (const row of rows) {
      if (!row.startDate) continue;
      const key = StatService.toMonthKey(row.startDate);
      monthMap.set(key, (monthMap.get(key) || 0) + 1);
    }

    return StatService.generateMonthlyTimeline(months).map((t) => ({
      label: new Date(t.date).toLocaleString('fr-FR', { month: 'short' }),
      value: monthMap.get(t.key) || 0,
    }));
  }

  private async buildPilotageView(
    viewKey: string,
    page: number,
    limit: number,
    q: string,
    title: string,
  ): Promise<WorkspacePayload> {
    const [pendingCandidatures, expiredDevis, brokenEquip, upcomingSessions] = await Promise.all([
      this.prisma.candidature.count({
        where: { status: { in: [CandidatureStatus.SUBMITTED, CandidatureStatus.VALIDATION_PENDING] } },
      }),
      this.prisma.financeDevis.count({ where: { status: FinanceDevisStatus.EXPIRED } }),
      this.prisma.equipment.count({ where: { status: 'OUT_OF_SERVICE' } }),
      this.prisma.formationSession.count({
        where: { startDate: { gte: new Date(), lte: new Date(Date.now() + 14 * 86400000) } },
      }),
    ]);

    const rowsAll: WorkspaceRow[] = [
      { alerte: 'Candidatures en instruction', niveau: pendingCandidatures > 5 ? 'Élevé' : 'Modéré', valeur: pendingCandidatures, action: 'Vie scolaire' },
      { alerte: 'Devis expirés', niveau: expiredDevis > 0 ? 'Élevé' : 'Faible', valeur: expiredDevis, action: 'Finance' },
      { alerte: 'Matériel hors service', niveau: brokenEquip > 0 ? 'Élevé' : 'Faible', valeur: brokenEquip, action: 'Équipements' },
      { alerte: 'Sessions sous 14 j', niveau: 'Info', valeur: upcomingSessions, action: 'Planning' },
    ].filter((r) => !q || String(r.alerte).toLowerCase().includes(q));

    const { slice, total } = paginate(rowsAll, page, limit);
    const evolution = await this.monthlyCandidatureEvolution(PILOTAGE_CHART_MONTHS);
    const alertTotal =
      pendingCandidatures + expiredDevis + brokenEquip + upcomingSessions;

    return {
      viewKey,
      kpis: [
        { key: 'activeAlerts', label: 'Alertes actives', value: rowsAll.filter((r) => r.niveau === 'Élevé').length, subtitle: title },
        { key: 'candidatures', label: 'Candidatures', value: pendingCandidatures, subtitle: 'Instruction' },
        { key: 'expiredQuotes', label: 'Devis expirés', value: expiredDevis, subtitle: 'Relance commerciale' },
        { key: 'sessions14d', label: 'Sessions 14 j', value: upcomingSessions, subtitle: 'Charge pédagogique' },
        { key: 'brokenEquip', label: 'Matériel HS', value: brokenEquip, subtitle: 'Équipements' },
      ],
      columns: [
        { key: 'alerte', label: 'Alerte' },
        { key: 'niveau', label: 'Niveau' },
        { key: 'valeur', label: 'Valeur', align: 'right' },
        { key: 'action', label: 'Module' },
      ],
      rows: slice,
      pagination: { page, limit, total },
      footnote: 'Synthèse temps réel à partir des modules CRM existants.',
      charts: {
        distributionTitle: 'Répartition par module',
        evolutionTitle: 'Flux candidatures (12 mois)',
        evolutionSeriesName: 'Dossiers créés',
        distribution: [
          { name: 'Vie scolaire', value: pendingCandidatures },
          { name: 'Finance', value: expiredDevis },
          { name: 'Équipements', value: brokenEquip },
          { name: 'Planning', value: upcomingSessions },
        ],
        distributionTotal: alertTotal,
        evolution,
      },
    };
  }

  private async buildPerformanceView(
    viewKey: string,
    page: number,
    limit: number,
    q: string,
  ): Promise<WorkspacePayload> {
    const [sessions, participants, passedExams, completed] = await Promise.all([
      this.prisma.formationSession.count(),
      this.prisma.formationSessionParticipant.count(),
      this.prisma.formationSessionParticipant.count({ where: { examOutcome: 'PASSED' } }),
      this.prisma.candidature.count({ where: { status: CandidatureStatus.COMPLETED } }),
    ]);

    const tauxReussite = participants ? Math.round((passedExams / participants) * 100) : 0;

    const rowsAll: WorkspaceRow[] = [
      { indicateur: 'Sessions planifiées', valeur: sessions, cible: '—', ecart: '—' },
      { indicateur: 'Participants', valeur: participants, cible: '—', ecart: '—' },
      { indicateur: 'Taux réussite examens', valeur: `${tauxReussite} %`, cible: '85 %', ecart: `${tauxReussite - 85} pts` },
      { indicateur: 'Parcours terminés', valeur: completed, cible: '—', ecart: '—' },
    ].filter((r) => !q || String(r.indicateur).toLowerCase().includes(q));

    const { slice, total } = paginate(rowsAll, page, limit);

    const [passed, failed, absent, pendingExam] = await Promise.all([
      this.prisma.formationSessionParticipant.count({ where: { examOutcome: 'PASSED' } }),
      this.prisma.formationSessionParticipant.count({ where: { examOutcome: 'FAILED' } }),
      this.prisma.formationSessionParticipant.count({ where: { examOutcome: 'ABSENT' } }),
      this.prisma.formationSessionParticipant.count({ where: { examOutcome: null } }),
    ]);

    const evolution = await this.monthlySessionEvolution(PILOTAGE_CHART_MONTHS);

    return {
      viewKey,
      kpis: [
        { key: 'kpiCount', label: 'KPI pédagogiques', value: 5, subtitle: 'Indicateurs suivis' },
        { key: 'examSuccess', label: 'Réussite examens', value: `${tauxReussite} %`, subtitle: 'Réel' },
        { key: 'participants', label: 'Participants', value: participants, subtitle: 'Sessions' },
        { key: 'completed', label: 'Terminés', value: completed, subtitle: 'Parcours complet' },
        { key: 'sessions', label: 'Sessions', value: sessions, subtitle: 'Planifiées' },
      ],
      columns: [
        { key: 'indicateur', label: 'Indicateur' },
        { key: 'valeur', label: 'Réel', align: 'right' },
        { key: 'cible', label: 'Cible', align: 'right' },
        { key: 'ecart', label: 'Écart', align: 'right' },
      ],
      rows: slice,
      pagination: { page, limit, total },
      footnote: 'Performance consolidée (sessions, examens, parcours candidat).',
      charts: {
        distributionTitle: 'Résultats examens',
        evolutionTitle: 'Sessions démarrées (12 mois)',
        evolutionSeriesName: 'Sessions',
        distribution: [
          { name: 'Réussite', value: passed },
          { name: 'Échec', value: failed },
          { name: 'Absent', value: absent },
          { name: 'En attente', value: pendingExam },
        ],
        distributionTotal: participants,
        evolution,
      },
    };
  }

  private async buildRisquesView(
    viewKey: string,
    page: number,
    limit: number,
    q: string,
  ): Promise<WorkspacePayload> {
    const [rejected, cnapsPending, absentExams, maintenanceDue] = await Promise.all([
      this.prisma.candidature.count({ where: { status: CandidatureStatus.REJECTED } }),
      this.prisma.candidature.count({ where: { status: CandidatureStatus.PENDING_CNAPS } }),
      this.prisma.formationSessionParticipant.count({ where: { examOutcome: 'ABSENT' } }),
      this.prisma.equipmentMaintenance.count({
        where: { scheduledDate: { lte: new Date(Date.now() + 7 * 86400000) }, status: 'SCHEDULED' },
      }),
    ]);

    const rowsAll: WorkspaceRow[] = [
      { risque: 'Candidatures refusées', gravite: 'Moyenne', exposition: rejected, mesure: 'Qualification entrée' },
      { risque: 'Dossiers CNAPS', gravite: 'Élevée', exposition: cnapsPending, mesure: 'Suivi PN' },
      { risque: 'Absents examen', gravite: 'Moyenne', exposition: absentExams, mesure: 'Replanification' },
      { risque: 'Maintenance équipement', gravite: maintenanceDue > 0 ? 'Élevée' : 'Faible', exposition: maintenanceDue, mesure: 'Atelier' },
    ].filter((r) => !q || String(r.risque).toLowerCase().includes(q));

    const { slice, total } = paginate(rowsAll, page, limit);
    const evolution = await this.monthlyCandidatureEvolution(PILOTAGE_CHART_MONTHS);
    const exposureTotal = rejected + cnapsPending + absentExams + maintenanceDue;

    const eleve = rowsAll.filter((r) => r.gravite === 'Élevée').length;
    const moyenne = rowsAll.filter((r) => r.gravite === 'Moyenne').length;
    const faible = rowsAll.filter((r) => r.gravite === 'Faible').length;

    return {
      viewKey,
      kpis: [
        { key: 'exposures', label: 'Expositions', value: rowsAll.length, subtitle: 'Risques suivis' },
        { key: 'cnapsPending', label: 'CNAPS en cours', value: cnapsPending, subtitle: 'Conformité' },
        { key: 'examAbsences', label: 'Absences examen', value: absentExams, subtitle: 'Pédagogie' },
        { key: 'maintenance7d', label: 'Maintenance 7 j', value: maintenanceDue, subtitle: 'Matériel' },
        { key: 'rejected', label: 'Refus dossiers', value: rejected, subtitle: 'Candidatures' },
      ],
      columns: [
        { key: 'risque', label: 'Risque' },
        { key: 'gravite', label: 'Gravité' },
        { key: 'exposition', label: 'Exposition', align: 'right' },
        { key: 'mesure', label: 'Mesure' },
      ],
      rows: slice,
      pagination: { page, limit, total },
      footnote: 'Registre des risques alimenté par candidatures, examens et maintenance.',
      charts: {
        distributionTitle: 'Répartition par gravité',
        evolutionTitle: 'Évolution dossiers (12 mois)',
        evolutionSeriesName: 'Candidatures',
        distribution: [
          { name: 'Gravité élevée', value: eleve },
          { name: 'Gravité moyenne', value: moyenne },
          { name: 'Gravité faible', value: faible },
        ],
        distributionTotal: exposureTotal,
        evolution,
      },
    };
  }
}

export const MODULE_WORKSPACE_VIEW_KEYS = [
  'finance-budget',
  'finance-paiements',
  'finance-rapports',
  'comm-cms-pages',
  'comm-cms-contenus',
  'comm-campagnes',
  'comm-seo-meta',
  'comm-seo-redirections',
  'support-tickets',
  'support-base-aide',
  'support-incidents',
  'gouvernance-storage',
  'gouvernance-demandes',
  'gouvernance-corbeille',
  'gouvernance-audit',
  'pilotage-alertes',
  'pilotage-indicateurs',
  'pilotage-rapports',
  'pilotage-risques',
] as const;

export type ModuleWorkspaceViewKey = (typeof MODULE_WORKSPACE_VIEW_KEYS)[number];
