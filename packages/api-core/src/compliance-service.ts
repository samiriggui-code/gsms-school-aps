import type {
  ComplianceDossier,
  ComplianceDossierKind,
  ComplianceDossierStatus,
  ComplianceItemStatus,
  ComplianceSubjectType,
  DocumentRequest,
  Prisma,
  PrismaClient,
  User,
} from '@repo/database';
import {
  sendComplianceDocumentExpiringEmail,
  sendComplianceDocumentReceivedEmail,
  sendComplianceDocumentRejectedEmail,
  sendComplianceDocumentRequestEmail,
  sendComplianceDocumentRequestReminderEmail,
  sendComplianceDocumentValidatedEmail,
  sendComplianceDossierCompleteEmail,
  sendComplianceDossierIncompleteAdminEmail,
  isEmailConfigured,
} from '@repo/mail';
import { CrmEventService } from './crm-events';
import { emitWorkflowBridge } from './workflows/workflow-bridge';
import {
  complianceCandidatureCrmUrl,
  complianceDemandesUrl,
  complianceDossierLabel,
  complianceGedDossierUrl,
  compliancePortalUploadUrl,
  formatDateFr,
} from './compliance-urls';

export type EnsureComplianceDossierInput = {
  kind: ComplianceDossierKind;
  subjectType: ComplianceSubjectType;
  subjectId: string;
  userId?: string | null;
  candidatureId?: string | null;
  formationId?: string | null;
  sessionId?: string | null;
  dueAt?: Date | null;
  metadata?: Record<string, unknown>;
};

export type ComplianceDossierItemSummary = {
  id: string;
  code: string;
  label: string;
  fileCategory: string;
  required: boolean;
  status: ComplianceItemStatus;
  fileAssetId: string | null;
  expiresAt: string | null;
  rejectionReason: string | null;
};

export type ComplianceDossierSummary = {
  id: string;
  kind: ComplianceDossierKind;
  subjectType: ComplianceSubjectType;
  subjectId: string;
  userId: string | null;
  candidatureId: string | null;
  status: ComplianceDossierStatus;
  completenessPct: number;
  items: ComplianceDossierItemSummary[];
  missingRequired: string[];
  updatedAt: string;
};

/** Champs User legacy → code pièce (rétrocompat P1). */
const LEGACY_USER_FIELD_BY_CODE: Record<string, keyof User> = {
  CNI: 'documentCni',
  ASSURANCE: 'documentAssurance',
  RESIDENCE_PERMIT: 'documentResidencePermit',
  PHOTO: 'avatar',
  CARTE_PRO: 'documentCartePro',
};

const EXPIRY_FIELD_BY_CODE: Record<string, keyof User> = {
  RESIDENCE_PERMIT: 'residencePermitExpiry',
  CARTE_PRO: 'carteProExpiry',
};

const SATISFIED_STATUSES: ComplianceItemStatus[] = ['RECEIVED', 'VALIDATED', 'WAIVED'];

type ComplianceLegacyUser = Pick<
  User,
  | 'documentCni'
  | 'documentAssurance'
  | 'documentResidencePermit'
  | 'documentCartePro'
  | 'avatar'
  | 'residencePermitNumber'
  | 'residencePermitExpiry'
  | 'carteProExpiry'
>;

export class ComplianceService {
  constructor(private prisma: PrismaClient) {}

  async listTemplates() {
    return this.prisma.documentRequirementTemplate.findMany({
      where: { isActive: true },
      orderBy: { label: 'asc' },
      include: {
        items: { orderBy: { sortOrder: 'asc' } },
      },
    });
  }

  async getDossierById(dossierId: string) {
    return this.prisma.complianceDossier.findUnique({
      where: { id: dossierId },
      include: {
        items: { orderBy: { code: 'asc' } },
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            name: true,
          },
        },
      },
    });
  }

  async getDossierSummary(dossierId: string): Promise<ComplianceDossierSummary | null> {
    const dossier = await this.getDossierById(dossierId);
    if (!dossier) return null;
    return this.toSummary(dossier);
  }

  /**
   * Crée le dossier + items depuis le template catalogue si absent.
   */
  async ensureDossier(input: EnsureComplianceDossierInput): Promise<ComplianceDossier> {
    const existing = await this.prisma.complianceDossier.findUnique({
      where: {
        kind_subjectType_subjectId: {
          kind: input.kind,
          subjectType: input.subjectType,
          subjectId: input.subjectId,
        },
      },
    });
    if (existing) return existing;

    const template = await this.prisma.documentRequirementTemplate.findUnique({
      where: { kind: input.kind },
      include: { items: { orderBy: { sortOrder: 'asc' } } },
    });
    if (!template) {
      throw new Error(`Template conformité introuvable pour kind=${input.kind}`);
    }

    return this.prisma.complianceDossier.create({
      data: {
        kind: input.kind,
        subjectType: input.subjectType,
        subjectId: input.subjectId,
        userId: input.userId ?? null,
        candidatureId: input.candidatureId ?? null,
        formationId: input.formationId ?? null,
        sessionId: input.sessionId ?? null,
        dueAt: input.dueAt ?? null,
        metadata: (input.metadata ?? {}) as Prisma.InputJsonObject,
        items: {
          create: template.items.map((ti) => ({
            templateItemId: ti.id,
            code: ti.code,
            label: ti.label,
            fileCategory: ti.fileCategory,
            required: ti.required,
            uploadedBy: ti.uploadedBy,
            status: 'MISSING',
          })),
        },
        events: {
          create: {
            eventType: 'DOSSIER_CREATED',
            payload: { kind: input.kind, subjectType: input.subjectType },
          },
        },
      },
    });
  }

  /**
   * Recalcule chaque pièce : FileAsset GED + champs User legacy + expirations.
   */
  async evaluateDossier(dossierId: string): Promise<ComplianceDossierSummary> {
    const dossier = await this.prisma.complianceDossier.findUnique({
      where: { id: dossierId },
      include: { items: true },
    });
    if (!dossier) throw new Error(`Dossier conformité introuvable: ${dossierId}`);

    const entityId = await this.resolveFileEntityId(dossier);
    const user = entityId
      ? await this.prisma.user.findUnique({
          where: { id: entityId },
          select: {
            id: true,
            documentCni: true,
            documentAssurance: true,
            documentResidencePermit: true,
            documentCartePro: true,
            avatar: true,
            residencePermitNumber: true,
            residencePermitExpiry: true,
            carteProExpiry: true,
          },
        })
      : null;

    const fileAssets = entityId
      ? await this.prisma.fileAsset.findMany({
          where: {
            entityId,
            deletedAt: null,
            status: 'ACTIVE',
          },
          orderBy: { updatedAt: 'desc' },
        })
      : [];

    const now = new Date();
    const updates: Prisma.PrismaPromise<unknown>[] = [];

    for (const item of dossier.items) {
      if (item.status === 'WAIVED' || item.status === 'VALIDATED') {
        continue;
      }

      const matchedAsset = fileAssets.find(
        (a) =>
          (a.category ?? '').toUpperCase() === item.fileCategory.toUpperCase() ||
          (a.category ?? '').toUpperCase().startsWith(item.fileCategory.toUpperCase()),
      );

      const legacyValue = user ? this.legacyUserValue(user, item.code) : null;
      const hasLegacy = Boolean(legacyValue && String(legacyValue).trim());

      let nextStatus: ComplianceItemStatus = item.status;
      let fileAssetId: string | null = item.fileAssetId;
      let expiresAt: Date | null = item.expiresAt;

      if (matchedAsset) {
        fileAssetId = matchedAsset.id;
        nextStatus = 'RECEIVED';
      } else if (hasLegacy) {
        nextStatus = 'RECEIVED';
      } else if (item.status === 'REQUESTED') {
        nextStatus = 'REQUESTED';
      } else {
        nextStatus = 'MISSING';
        fileAssetId = null;
      }

      const expiryField = EXPIRY_FIELD_BY_CODE[item.code];
      if (user && expiryField) {
        const raw = user[expiryField as keyof ComplianceLegacyUser];
        if (raw instanceof Date) {
          expiresAt = raw;
          if (raw < now && nextStatus !== 'MISSING') {
            nextStatus = 'EXPIRED';
          }
        }
      }

      if (
        item.code === 'RESIDENCE_PERMIT' &&
        user &&
        !user.residencePermitNumber?.trim() &&
        !matchedAsset &&
        !hasLegacy
      ) {
        nextStatus = 'WAIVED';
      }

      const changed =
        item.status !== nextStatus ||
        item.fileAssetId !== fileAssetId ||
        (item.expiresAt?.getTime() ?? 0) !== (expiresAt?.getTime() ?? 0);

      if (changed) {
        updates.push(
          this.prisma.complianceDossierItem.update({
            where: { id: item.id },
            data: {
              status: nextStatus,
              fileAssetId,
              expiresAt,
              lastCheckedAt: now,
            },
          }),
        );

        if (nextStatus !== item.status) {
          updates.push(
            this.prisma.complianceItemEvent.create({
              data: {
                dossierId: dossier.id,
                dossierItemId: item.id,
                eventType: 'AUTO_EVALUATED',
                fileAssetId: fileAssetId ?? undefined,
                payload: {
                  from: item.status,
                  to: nextStatus,
                  source: matchedAsset ? 'file_asset' : hasLegacy ? 'legacy_user' : 'none',
                },
              },
            }),
          );
        }
      }
    }

    if (updates.length > 0) {
      await this.prisma.$transaction(updates);
    }

    const refreshed = await this.getDossierById(dossierId);
    if (!refreshed) throw new Error('Dossier disparu après évaluation');

    const { completenessPct, status, missingRequired } = this.computeAggregate(refreshed.items);

    await this.prisma.complianceDossier.update({
      where: { id: dossierId },
      data: { completenessPct, status, updatedAt: now },
    });

    if (refreshed.candidatureId && refreshed.kind === 'CANDIDATURE_ADMISSION') {
      await this.syncCandidatureDocumentsFlag(refreshed.candidatureId, status, now);
    }

    return this.toSummary({ ...refreshed, completenessPct, status });
  }

  private async syncCandidatureDocumentsFlag(
    candidatureId: string,
    dossierStatus: ComplianceDossierStatus,
    now: Date,
  ) {
    const data: Prisma.CandidatureUpdateInput = {};
    if (dossierStatus === 'COMPLETE') {
      data.documentsCompleteAt = now;
    } else {
      data.documentsCompleteAt = null;
    }
    await this.prisma.candidature.update({
      where: { id: candidatureId },
      data,
    });
  }

  private computeAggregate(items: {
    code: string;
    label: string;
    required: boolean;
    status: ComplianceItemStatus;
  }[]) {
    const applicable = items.filter((i) => i.required);
    const total = applicable.length || 1;
    const satisfied = applicable.filter((i) => SATISFIED_STATUSES.includes(i.status)).length;
    const completenessPct = Math.round((satisfied / total) * 100);

    const hasExpired = items.some((i) => i.required && i.status === 'EXPIRED');
    const missingRequired = applicable
      .filter((i) => !SATISFIED_STATUSES.includes(i.status))
      .map((i) => i.label);

    let status: ComplianceDossierStatus = 'INCOMPLETE';
    if (hasExpired) status = 'EXPIRED';
    else if (missingRequired.length === 0) status = 'COMPLETE';

    return { completenessPct, status, missingRequired };
  }

  private async resolveFileEntityId(dossier: ComplianceDossier): Promise<string | null> {
    if (dossier.userId) return dossier.userId;
    if (
      dossier.subjectType === 'USER' ||
      dossier.subjectType === 'COLLABORATEUR' ||
      dossier.subjectType === 'FORMATEUR' ||
      dossier.subjectType === 'STAGIAIRE'
    ) {
      return dossier.subjectId;
    }
    if (dossier.candidatureId) {
      const c = await this.prisma.candidature.findUnique({
        where: { id: dossier.candidatureId },
        select: { userId: true },
      });
      return c?.userId ?? null;
    }
    return null;
  }

  private legacyUserValue(user: ComplianceLegacyUser, code: string): unknown {
    const field = LEGACY_USER_FIELD_BY_CODE[code];
    if (!field) return null;
    return user[field as keyof ComplianceLegacyUser];
  }

  private toSummary(
    dossier: ComplianceDossier & {
      items: Array<{
        id: string;
        code: string;
        label: string;
        fileCategory: string;
        required: boolean;
        status: ComplianceItemStatus;
        fileAssetId: string | null;
        expiresAt: Date | null;
        rejectionReason: string | null;
      }>;
    },
  ): ComplianceDossierSummary {
    const { missingRequired } = this.computeAggregate(dossier.items);
    return {
      id: dossier.id,
      kind: dossier.kind,
      subjectType: dossier.subjectType,
      subjectId: dossier.subjectId,
      userId: dossier.userId,
      candidatureId: dossier.candidatureId,
      status: dossier.status,
      completenessPct: dossier.completenessPct,
      items: dossier.items.map((i) => ({
        id: i.id,
        code: i.code,
        label: i.label,
        fileCategory: i.fileCategory,
        required: i.required,
        status: i.status,
        fileAssetId: i.fileAssetId,
        expiresAt: i.expiresAt?.toISOString() ?? null,
        rejectionReason: i.rejectionReason,
      })),
      missingRequired,
      updatedAt: dossier.updatedAt.toISOString(),
    };
  }

  /** Crée une demande de pièce et envoie l’e-mail si configuré. */
  async createDocumentRequest(input: {
    dossierItemId: string;
    message?: string;
    dueAt?: Date | null;
    requestedById?: string | null;
    sendEmail?: boolean;
  }): Promise<DocumentRequest & { emailSent: boolean; emailError?: string }> {
    const item = await this.prisma.complianceDossierItem.findUnique({
      where: { id: input.dossierItemId },
      include: {
        dossier: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                name: true,
              },
            },
            candidature: { select: { id: true } },
          },
        },
      },
    });
    if (!item) throw new Error('Pièce de dossier introuvable');

    const request = await this.prisma.documentRequest.create({
      data: {
        dossierId: item.dossierId,
        dossierItemId: item.id,
        status: 'OPEN',
        channel: 'EMAIL',
        message: input.message ?? null,
        dueAt: input.dueAt ?? null,
        requestedById: input.requestedById ?? null,
      },
    });

    await this.prisma.complianceDossierItem.update({
      where: { id: item.id },
      data: { status: 'REQUESTED' },
    });

    await this.prisma.complianceItemEvent.create({
      data: {
        dossierId: item.dossierId,
        dossierItemId: item.id,
        eventType: 'REQUESTED',
        actorId: input.requestedById ?? undefined,
        payload: { requestId: request.id },
      },
    });

    const sendMail = input.sendEmail !== false && isEmailConfigured();
    let emailSent = false;
    let emailError: string | undefined;
    if (sendMail) {
      try {
        await this.sendDocumentRequestEmail(request.id, { reminder: false });
        emailSent = true;
      } catch (err) {
        emailError = err instanceof Error ? err.message : String(err);
        console.error('[compliance] e-mail demande pièce non envoyé:', err);
        await this.prisma.complianceItemEvent.create({
          data: {
            dossierId: item.dossierId,
            dossierItemId: item.id,
            eventType: 'EMAIL_FAILED',
            payload: {
              requestId: request.id,
              error: emailError,
            },
          },
        });
      }
    } else {
      await this.prisma.documentRequest.update({
        where: { id: request.id },
        data: { channel: 'IN_APP' },
      });
    }

    const events = new CrmEventService(this.prisma);
    const recipient = this.displayName(item.dossier.user);
    await events.enqueue({
      eventType: 'compliance.document.requested',
      title: `Demande — ${item.label}`,
      body: `${recipient} : pièce « ${item.label} » demandée.`,
      href: complianceDemandesUrl(),
      permissionSlugs: ['crm.securite.view'],
      createdById: input.requestedById ?? undefined,
      dedupeKey: `doc-req-${request.id}`,
    });
    void emitWorkflowBridge(
      this.prisma,
      'compliance.document.requested',
      { summary: `${recipient} : pièce « ${item.label} » demandée.` },
      { dedupeKey: `doc-req-${request.id}` },
    );

    return { ...request, emailSent, emailError };
  }

  /**
   * Enregistre les demandes pour toutes les pièces éligibles d’un dossier
   * et envoie un seul e-mail récapitulatif au destinataire.
   */
  async notifyDossierMissingDocuments(input: {
    dossierId: string;
    message?: string;
    dueAt?: Date | null;
    requestedById?: string | null;
  }): Promise<{
    requestIds: string[];
    emailSent: boolean;
    recipientEmail: string;
    recipientName: string;
    piecesCount: number;
    pieceLabels: string[];
    emailError?: string;
  }> {
    const requestableStatuses: ComplianceItemStatus[] = ['MISSING', 'REJECTED', 'EXPIRED'];

    const dossier = await this.prisma.complianceDossier.findUnique({
      where: { id: input.dossierId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            name: true,
          },
        },
        items: {
          where: {
            required: true,
            status: { in: requestableStatuses },
          },
          orderBy: { code: 'asc' },
        },
      },
    });

    if (!dossier) throw new Error('Dossier introuvable');
    if (!dossier.user?.email) {
      throw new Error('Aucune adresse e-mail associée à ce dossier.');
    }
    if (dossier.items.length === 0) {
      throw new Error('Aucune pièce à demander pour ce dossier.');
    }

    const recipientName = this.displayName(dossier.user);
    const recipientEmail = dossier.user.email;
    const pieceLabels = dossier.items.map((item) => item.label);
    const requestIds: string[] = [];

    for (const item of dossier.items) {
      const request = await this.prisma.documentRequest.create({
        data: {
          dossierId: dossier.id,
          dossierItemId: item.id,
          status: 'OPEN',
          channel: isEmailConfigured() ? 'EMAIL' : 'IN_APP',
          message: input.message ?? null,
          dueAt: input.dueAt ?? null,
          requestedById: input.requestedById ?? null,
        },
      });
      requestIds.push(request.id);

      await this.prisma.complianceDossierItem.update({
        where: { id: item.id },
        data: { status: 'REQUESTED' },
      });

      await this.prisma.complianceItemEvent.create({
        data: {
          dossierId: dossier.id,
          dossierItemId: item.id,
          eventType: 'REQUESTED',
          actorId: input.requestedById ?? undefined,
          payload: { requestId: request.id, batch: true },
        },
      });
    }

    const customLines = [
      input.message?.trim(),
      'Pièces attendues :',
      ...pieceLabels.map((label) => `• ${label}`),
    ].filter(Boolean);

    const documentLabel =
      pieceLabels.length === 1 ? pieceLabels[0]! : `${pieceLabels.length} pièces à fournir`;

    let emailSent = false;
    let emailError: string | undefined;

    if (isEmailConfigured()) {
      try {
        await sendComplianceDocumentRequestEmail({
          recipientName,
          recipientEmail,
          documentLabel,
          dossierLabel: complianceDossierLabel(dossier.kind),
          uploadUrl: compliancePortalUploadUrl(),
          dueDateLabel: input.dueAt ? formatDateFr(input.dueAt) : undefined,
          customMessage: customLines.join('\n'),
        });
        emailSent = true;
        await this.prisma.documentRequest.updateMany({
          where: { id: { in: requestIds } },
          data: { sentAt: new Date(), channel: 'EMAIL' },
        });
      } catch (err) {
        emailError = err instanceof Error ? err.message : String(err);
        console.error('[compliance] e-mail dossier non envoyé:', err);
        await this.prisma.complianceItemEvent.create({
          data: {
            dossierId: dossier.id,
            eventType: 'EMAIL_FAILED',
            actorId: input.requestedById ?? undefined,
            payload: { requestIds, error: emailError },
          },
        });
      }
    }

    const events = new CrmEventService(this.prisma);
    await events.enqueue({
      eventType: 'compliance.document.requested',
      title: `Demande — ${complianceDossierLabel(dossier.kind)}`,
      body: `${recipientName} (${recipientEmail}) : ${pieceLabels.join(', ')}.`,
      href: complianceDemandesUrl(),
      permissionSlugs: ['crm.securite.view'],
      createdById: input.requestedById ?? undefined,
      dedupeKey: `dossier-notify-${dossier.id}-${requestIds[0]}`,
    });
    void emitWorkflowBridge(
      this.prisma,
      'compliance.document.requested',
      { summary: `${recipientName} : ${pieceLabels.join(', ')}` },
      { dedupeKey: `dossier-notify-${dossier.id}-${requestIds[0]}` },
    );

    return {
      requestIds,
      emailSent,
      recipientEmail,
      recipientName,
      piecesCount: pieceLabels.length,
      pieceLabels,
      emailError,
    };
  }

  async sendDocumentRequestEmail(
    requestId: string,
    options?: { reminder?: boolean },
  ): Promise<void> {
    const request = await this.prisma.documentRequest.findUnique({
      where: { id: requestId },
      include: {
        dossierItem: true,
        dossier: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                name: true,
              },
            },
          },
        },
      },
    });
    if (!request?.dossier.user?.email) return;

    const user = request.dossier.user;
    const mailCtx = {
      recipientName: this.displayName(user),
      recipientEmail: user.email,
      documentLabel: request.dossierItem.label,
      dossierLabel: complianceDossierLabel(request.dossier.kind),
      uploadUrl: compliancePortalUploadUrl(),
      dueDateLabel: request.dueAt ? formatDateFr(request.dueAt) : undefined,
      customMessage: request.message ?? undefined,
    };

    if (options?.reminder) {
      await sendComplianceDocumentRequestReminderEmail({
        ...mailCtx,
        daysWaiting: 3,
      });
    } else {
      await sendComplianceDocumentRequestEmail(mailCtx);
    }

    await this.prisma.documentRequest.update({
      where: { id: requestId },
      data: { sentAt: new Date(), channel: 'EMAIL' },
    });
  }

  async validateDossierItem(itemId: string, validatorId: string): Promise<ComplianceDossierSummary> {
    const item = await this.prisma.complianceDossierItem.findUnique({
      where: { id: itemId },
      include: { dossier: { include: { user: true } } },
    });
    if (!item) throw new Error('Pièce introuvable');

    await this.prisma.complianceDossierItem.update({
      where: { id: itemId },
      data: {
        status: 'VALIDATED',
        validatedAt: new Date(),
        validatedById: validatorId,
        rejectionReason: null,
      },
    });

    await this.prisma.complianceItemEvent.create({
      data: {
        dossierId: item.dossierId,
        dossierItemId: itemId,
        eventType: 'VALIDATED',
        actorId: validatorId,
      },
    });

    if (item.dossier.user?.email && isEmailConfigured()) {
      await sendComplianceDocumentValidatedEmail({
        recipientName: this.displayName(item.dossier.user),
        recipientEmail: item.dossier.user.email,
        documentLabel: item.label,
        dossierLabel: complianceDossierLabel(item.dossier.kind),
        uploadUrl: compliancePortalUploadUrl(),
      });
    }

    return this.evaluateDossier(item.dossierId);
  }

  async rejectDossierItem(
    itemId: string,
    validatorId: string,
    reason: string,
  ): Promise<ComplianceDossierSummary> {
    const item = await this.prisma.complianceDossierItem.findUnique({
      where: { id: itemId },
      include: { dossier: { include: { user: true } } },
    });
    if (!item) throw new Error('Pièce introuvable');

    await this.prisma.complianceDossierItem.update({
      where: { id: itemId },
      data: {
        status: 'REJECTED',
        rejectionReason: reason,
        validatedById: validatorId,
        validatedAt: new Date(),
        fileAssetId: null,
      },
    });

    await this.prisma.complianceItemEvent.create({
      data: {
        dossierId: item.dossierId,
        dossierItemId: itemId,
        eventType: 'REJECTED',
        actorId: validatorId,
        payload: { reason },
      },
    });

    if (item.dossier.user?.email && isEmailConfigured()) {
      await sendComplianceDocumentRejectedEmail({
        recipientName: this.displayName(item.dossier.user),
        recipientEmail: item.dossier.user.email,
        documentLabel: item.label,
        dossierLabel: complianceDossierLabel(item.dossier.kind),
        uploadUrl: compliancePortalUploadUrl(),
        rejectionReason: reason,
      });
    }

    return this.evaluateDossier(item.dossierId);
  }

  /** Après upload FileAsset — réévalue les dossiers liés. */
  async onFileAssetUploaded(entityId: string, category: string | null, fileAssetId: string) {
    if (!entityId) return;

    const dossiers = await this.prisma.complianceDossier.findMany({
      where: {
        status: { in: ['INCOMPLETE', 'EXPIRED'] },
        OR: [{ userId: entityId }, { subjectId: entityId }],
      },
      select: { id: true },
    });

    for (const d of dossiers) {
      const before = await this.getDossierById(d.id);
      const summary = await this.evaluateDossier(d.id);
      const after = await this.getDossierById(d.id);

      if (!before || !after?.user) continue;

      const newlyReceived = after.items.filter((ai) => {
        const bi = before.items.find((x) => x.id === ai.id);
        return bi && bi.status !== 'RECEIVED' && ai.status === 'RECEIVED';
      });

      if (newlyReceived.length > 0 && after.user.email && isEmailConfigured()) {
        for (const piece of newlyReceived) {
          if (
            category &&
            piece.fileCategory.toUpperCase() !== category.toUpperCase() &&
            !category.toUpperCase().startsWith(piece.fileCategory.toUpperCase())
          ) {
            continue;
          }
          await sendComplianceDocumentReceivedEmail({
            recipientName: this.displayName(after.user),
            recipientEmail: after.user.email,
            documentLabel: piece.label,
            dossierLabel: complianceDossierLabel(after.kind),
            uploadUrl: compliancePortalUploadUrl(),
          });

          await this.prisma.documentRequest.updateMany({
            where: {
              dossierItemId: piece.id,
              status: 'OPEN',
            },
            data: { status: 'FULFILLED', fulfilledAt: new Date() },
          });
        }
      }

      if (summary.status === 'COMPLETE' && before.status !== 'COMPLETE' && after.user.email) {
        if (isEmailConfigured()) {
          await sendComplianceDossierCompleteEmail({
            recipientName: this.displayName(after.user),
            recipientEmail: after.user.email,
            documentLabel: '',
            dossierLabel: complianceDossierLabel(after.kind),
            uploadUrl: compliancePortalUploadUrl(),
            portalUrl: compliancePortalUploadUrl(),
          });
        }
        const events = new CrmEventService(this.prisma);
        await events.enqueue({
          eventType: 'compliance.dossier.complete',
          title: 'Dossier documentaire complet',
          body: `${this.displayName(after.user)} — ${complianceDossierLabel(after.kind)}.`,
          href: after.candidatureId
            ? complianceCandidatureCrmUrl(after.candidatureId)
            : complianceDemandesUrl(),
          permissionSlugs: ['crm.securite.view'],
          dedupeKey: `dossier-complete-${d.id}`,
        });
      }

      await this.prisma.complianceItemEvent.create({
        data: {
          dossierId: d.id,
          eventType: 'FILE_UPLOADED',
          fileAssetId,
          payload: { entityId, category },
        },
      });
    }
  }

  /** Worker : réévalue les dossiers ouverts, relances e-mail, alertes admin. */
  async auditOpenDossiers(options?: { limit?: number; sendAdminDigest?: boolean }) {
    const limit = options?.limit ?? 100;
    const dossiers = await this.prisma.complianceDossier.findMany({
      where: { status: { in: ['INCOMPLETE', 'EXPIRED'] } },
      orderBy: { updatedAt: 'asc' },
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            name: true,
          },
        },
        candidature: { select: { id: true } },
      },
    });

    let evaluated = 0;
    let reminders = 0;
    let expiringMails = 0;

    const events = new CrmEventService(this.prisma);
    const reminderAfterMs = 3 * 24 * 60 * 60 * 1000;

    for (const dossier of dossiers) {
      const prevStatus = dossier.status;
      const summary = await this.evaluateDossier(dossier.id);
      evaluated += 1;

      const openRequests = await this.prisma.documentRequest.findMany({
        where: { dossierId: dossier.id, status: 'OPEN', channel: 'EMAIL' },
        include: { dossierItem: true },
      });

      for (const req of openRequests) {
        if (!req.sentAt) continue;
        const age = Date.now() - req.sentAt.getTime();
        if (age >= reminderAfterMs) {
          const alreadyReminded = await this.prisma.complianceItemEvent.findFirst({
            where: {
              dossierItemId: req.dossierItemId,
              eventType: 'REMINDER_SENT',
            },
          });
          if (!alreadyReminded && isEmailConfigured()) {
            await this.sendDocumentRequestEmail(req.id, { reminder: true });
            await this.prisma.complianceItemEvent.create({
              data: {
                dossierId: dossier.id,
                dossierItemId: req.dossierItemId,
                eventType: 'REMINDER_SENT',
                payload: { requestId: req.id },
              },
            });
            reminders += 1;
          }
        }
      }

      for (const item of summary.items) {
        if (item.status === 'EXPIRED' && item.expiresAt && dossier.user?.email && isEmailConfigured()) {
          await sendComplianceDocumentExpiringEmail({
            recipientName: this.displayName(dossier.user),
            recipientEmail: dossier.user.email,
            documentLabel: item.label,
            dossierLabel: complianceDossierLabel(dossier.kind),
            uploadUrl: compliancePortalUploadUrl(),
            expiryDateLabel: formatDateFr(new Date(item.expiresAt)),
          });
          expiringMails += 1;
          await events.enqueue({
            eventType: 'compliance.document.expiring',
            title: `Échéance — ${item.label}`,
            body: `${this.displayName(dossier.user)} : ${item.label}`,
            href: complianceDemandesUrl(),
            permissionSlugs: ['crm.securite.view'],
            dedupeKey: `expiring-${item.id}-${item.expiresAt}`,
          });
          void emitWorkflowBridge(
            this.prisma,
            'compliance.document.expiring',
            {
              summary: `${this.displayName(dossier.user)} : ${item.label}`,
              documentLabel: item.label,
            },
            { dedupeKey: `expiring-${item.id}-${item.expiresAt}` },
          );
        }
      }

      if (summary.missingRequired.length > 0 && dossier.user) {
        await events.enqueue({
          eventType: 'compliance.document.missing',
          title: `Pièces manquantes — ${this.displayName(dossier.user)}`,
          body: summary.missingRequired.slice(0, 3).join(', '),
          href: dossier.candidatureId
            ? complianceCandidatureCrmUrl(dossier.candidatureId)
            : complianceDemandesUrl(),
          permissionSlugs: ['crm.securite.view'],
          dedupeKey: `missing-${dossier.id}-${summary.completenessPct}`,
        });
        void emitWorkflowBridge(
          this.prisma,
          'compliance.document.missing',
          {
            summary: summary.missingRequired.slice(0, 3).join(', '),
            candidatureId: dossier.candidatureId,
          },
          { dedupeKey: `missing-${dossier.id}-${summary.completenessPct}` },
        );

        if (options?.sendAdminDigest && isEmailConfigured()) {
          await sendComplianceDossierIncompleteAdminEmail({
            subjectName: this.displayName(dossier.user),
            subjectEmail: dossier.user.email,
            dossierLabel: complianceDossierLabel(dossier.kind),
            missingPieces: summary.missingRequired.join('\n'),
            crmUrl: dossier.candidatureId
              ? complianceCandidatureCrmUrl(dossier.candidatureId)
              : complianceDemandesUrl(),
            gedUrl: complianceGedDossierUrl(dossier.user.id, this.displayName(dossier.user)),
          });
        }
      }

      if (summary.status === 'COMPLETE' && prevStatus !== 'COMPLETE') {
        await events.enqueue({
          eventType: 'compliance.dossier.complete',
          title: 'Dossier complet',
          body: complianceDossierLabel(dossier.kind),
          href: complianceDemandesUrl(),
          permissionSlugs: ['crm.securite.view'],
          dedupeKey: `audit-complete-${dossier.id}`,
        });
      }
    }

    return { evaluated, reminders, expiringMails };
  }

  private displayName(
    user: Pick<User, 'firstName' | 'lastName' | 'name' | 'email'> | null | undefined,
  ): string {
    if (!user) return '—';
    return (
      `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.name || user.email || '—'
    );
  }
}
