import { FinanceDevisStatus, type PrismaClient } from '@repo/database';

export const PILOTAGE_EXPORT_DATASETS = [
  { id: 'leads', label: 'Leads marketing', description: 'Formulaires landing et sources acquisition' },
  { id: 'devis', label: 'Devis finance', description: 'Pipeline commercial complet' },
  { id: 'tickets', label: 'Tickets support', description: 'File support CRM' },
  { id: 'candidatures', label: 'Candidatures', description: 'Parcours candidats et statuts' },
  { id: 'audit', label: 'Journal audit', description: 'SystemLog (90 derniers jours)' },
  { id: 'payments', label: 'Paiements', description: 'Encaissements FinancePayment' },
  { id: 'rh-compliance', label: 'Conformité RH', description: 'Cartes pro, titres de séjour et pièces dossier' },
  {
    id: 'equipment-inventory',
    label: 'Inventaire équipements',
    description: 'Parc matériel, statuts et maintenances',
  },
] as const;

export type PilotageExportDataset = (typeof PILOTAGE_EXPORT_DATASETS)[number]['id'];

function csvEscape(value: string | number | null | undefined): string {
  const s = value == null ? '' : String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function toCsv(headers: string[], rows: (string | number | null | undefined)[][]): string {
  const lines = rows.map((row) => row.map(csvEscape).join(','));
  return `\ufeff${headers.join(',')}\n${lines.join('\n')}`;
}

function decimalNum(d: unknown): number {
  if (d == null) return 0;
  return typeof d === 'object' && d !== null && 'toNumber' in d
    ? (d as { toNumber: () => number }).toNumber()
    : Number(d);
}

export class PilotageExportService {
  constructor(private readonly prisma: PrismaClient) {}

  exportCsv(dataset: PilotageExportDataset): Promise<{ filename: string; csv: string }> {
    switch (dataset) {
      case 'leads':
        return this.exportLeads();
      case 'devis':
        return this.exportDevis();
      case 'tickets':
        return this.exportTickets();
      case 'candidatures':
        return this.exportCandidatures();
      case 'audit':
        return this.exportAudit();
      case 'payments':
        return this.exportPayments();
      case 'rh-compliance':
        return this.exportRhCompliance();
      case 'equipment-inventory':
        return this.exportEquipmentInventory();
      default:
        throw new Error(`Export inconnu : ${dataset}`);
    }
  }

  private async exportLeads() {
    const rows = await this.prisma.lead.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5000,
      select: {
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        source: true,
        status: true,
        createdAt: true,
      },
    });
    const csv = toCsv(
      ['Prenom', 'Nom', 'Email', 'Telephone', 'Source', 'Statut', 'Cree le'],
      rows.map((r) => [
        r.firstName,
        r.lastName,
        r.email,
        r.phone,
        r.source,
        r.status,
        r.createdAt.toISOString().slice(0, 10),
      ]),
    );
    return { filename: `export-leads-${today()}.csv`, csv };
  }

  private async exportDevis() {
    const rows = await this.prisma.financeDevis.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 5000,
      select: {
        referenceCode: true,
        title: true,
        status: true,
        totalTtc: true,
        currency: true,
        updatedAt: true,
        lead: { select: { email: true } },
      },
    });
    const csv = toCsv(
      ['Reference', 'Titre', 'Statut', 'Montant TTC', 'Devise', 'Email lead', 'MAJ'],
      rows.map((r) => [
        r.referenceCode,
        r.title,
        r.status,
        decimalNum(r.totalTtc).toFixed(2),
        r.currency,
        r.lead?.email ?? '',
        r.updatedAt.toISOString().slice(0, 10),
      ]),
    );
    return { filename: `export-devis-${today()}.csv`, csv };
  }

  private async exportTickets() {
    const rows = await this.prisma.supportTicket.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 5000,
      select: {
        referenceCode: true,
        subject: true,
        status: true,
        priority: true,
        requesterEmail: true,
        updatedAt: true,
      },
    });
    const csv = toCsv(
      ['Reference', 'Sujet', 'Statut', 'Priorite', 'Email', 'MAJ'],
      rows.map((r) => [
        r.referenceCode,
        r.subject,
        r.status,
        r.priority,
        r.requesterEmail,
        r.updatedAt.toISOString().slice(0, 10),
      ]),
    );
    return { filename: `export-tickets-${today()}.csv`, csv };
  }

  private async exportCandidatures() {
    const rows = await this.prisma.candidature.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 5000,
      select: {
        status: true,
        updatedAt: true,
        user: { select: { firstName: true, lastName: true, email: true } },
        formation: { select: { name: true } },
      },
    });
    const csv = toCsv(
      ['Candidat', 'Email', 'Formation', 'Statut', 'MAJ'],
      rows.map((r) => [
        `${r.user.firstName} ${r.user.lastName}`.trim(),
        r.user.email,
        r.formation?.name ?? '',
        r.status,
        r.updatedAt.toISOString().slice(0, 10),
      ]),
    );
    return { filename: `export-candidatures-${today()}.csv`, csv };
  }

  private async exportAudit() {
    const since = new Date(Date.now() - 90 * 86400000);
    const rows = await this.prisma.systemLog.findMany({
      where: { createdAt: { gte: since } },
      orderBy: { createdAt: 'desc' },
      take: 5000,
      select: {
        event: true,
        description: true,
        ipAddress: true,
        createdAt: true,
        user: { select: { email: true } },
      },
    });
    const csv = toCsv(
      ['Evenement', 'Description', 'Utilisateur', 'IP', 'Date'],
      rows.map((r) => [
        r.event,
        r.description,
        r.user?.email ?? '',
        r.ipAddress,
        r.createdAt.toISOString(),
      ]),
    );
    return { filename: `export-audit-${today()}.csv`, csv };
  }

  private async exportPayments() {
    const rows = await this.prisma.financePayment.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 5000,
      select: {
        referenceCode: true,
        amount: true,
        currency: true,
        status: true,
        method: true,
        paidAt: true,
        devis: { select: { referenceCode: true } },
      },
    });
    const csv = toCsv(
      ['Reference', 'Devis', 'Montant', 'Devise', 'Statut', 'Mode', 'Encaisse le'],
      rows.map((r) => [
        r.referenceCode,
        r.devis?.referenceCode ?? '',
        decimalNum(r.amount).toFixed(2),
        r.currency,
        r.status,
        r.method,
        r.paidAt?.toISOString().slice(0, 10) ?? '',
      ]),
    );
    return { filename: `export-paiements-${today()}.csv`, csv };
  }

  private async exportRhCompliance() {
    const horizon = new Date(Date.now() + 90 * 86400000);
    const [users, dossierItems] = await Promise.all([
      this.prisma.user.findMany({
        where: {
          isTrashed: false,
          OR: [
            { carteProExpiry: { not: null } },
            { residencePermitExpiry: { not: null } },
            { carteProNumber: { not: null } },
            { residencePermitNumber: { not: null } },
          ],
        },
        orderBy: { lastName: 'asc' },
        take: 5000,
        select: {
          firstName: true,
          lastName: true,
          email: true,
          jobFunction: true,
          carteProNumber: true,
          carteProExpiry: true,
          residencePermitNumber: true,
          residencePermitExpiry: true,
        },
      }),
      this.prisma.complianceDossierItem.findMany({
        where: {
          required: true,
          OR: [
            { status: { in: ['MISSING', 'REJECTED', 'EXPIRED'] } },
            { expiresAt: { lte: horizon } },
          ],
        },
        orderBy: { expiresAt: 'asc' },
        take: 5000,
        select: {
          code: true,
          label: true,
          status: true,
          expiresAt: true,
          dossier: {
            select: {
              kind: true,
              user: { select: { firstName: true, lastName: true, email: true } },
              candidature: {
                select: { user: { select: { firstName: true, lastName: true, email: true } } },
              },
            },
          },
        },
      }),
    ]);

    const userRows = users.map((u) => [
      'Collaborateur',
      `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || u.email,
      u.email,
      u.jobFunction ?? '',
      u.carteProNumber ?? '',
      u.carteProExpiry?.toISOString().slice(0, 10) ?? '',
      u.residencePermitNumber ?? '',
      u.residencePermitExpiry?.toISOString().slice(0, 10) ?? '',
      '',
      '',
    ]);

    const itemRows = dossierItems.map((item) => {
      const subject =
        item.dossier.user != null
          ? `${item.dossier.user.firstName ?? ''} ${item.dossier.user.lastName ?? ''}`.trim() ||
            item.dossier.user.email
          : item.dossier.candidature?.user != null
            ? `${item.dossier.candidature.user.firstName ?? ''} ${item.dossier.candidature.user.lastName ?? ''}`.trim() ||
              item.dossier.candidature.user.email
            : item.dossier.kind;
      const email =
        item.dossier.user?.email ?? item.dossier.candidature?.user.email ?? '';
      return [
        'Piece dossier',
        subject,
        email,
        item.dossier.kind,
        item.code,
        item.label,
        '',
        '',
        item.status,
        item.expiresAt?.toISOString().slice(0, 10) ?? '',
      ];
    });

    const csv = toCsv(
      [
        'Type',
        'Sujet',
        'Email',
        'Fonction / Dossier',
        'Ref carte / Code',
        'Libelle',
        'Expiration carte pro',
        'Expiration titre sejour',
        'Statut piece',
        'Echeance piece',
      ],
      [...userRows, ...itemRows],
    );
    return { filename: `export-rh-conformite-${today()}.csv`, csv };
  }

  private async exportEquipmentInventory() {
    const rows = await this.prisma.equipment.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 5000,
      include: {
        assignedSite: { select: { name: true } },
        maintenanceItems: {
          orderBy: { scheduledDate: 'desc' },
          take: 1,
          select: {
            status: true,
            title: true,
            scheduledDate: true,
            completedDate: true,
          },
        },
      },
    });

    const csv = toCsv(
      [
        'Numero serie',
        'Libelle',
        'Type',
        'Statut',
        'Site',
        'Derniere maintenance',
        'Statut maintenance',
        'MAJ',
      ],
      rows.map((r) => {
        const maint = r.maintenanceItems[0];
        return [
          r.serialNumber,
          r.label,
          r.type ?? '',
          r.status,
          r.assignedSite?.name ?? '',
          maint?.scheduledDate?.toISOString().slice(0, 10) ??
            maint?.completedDate?.toISOString().slice(0, 10) ??
            '',
          maint?.status ?? '',
          r.updatedAt.toISOString().slice(0, 10),
        ];
      }),
    );
    return { filename: `export-equipements-${today()}.csv`, csv };
  }
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

export function isPilotageExportDataset(value: string): value is PilotageExportDataset {
  return PILOTAGE_EXPORT_DATASETS.some((d) => d.id === value);
}
