import type { EntityDefinition } from './entity';
import {
  CRM_PERMISSION,
  IAM_PERMISSION,
  LMS_PERMISSION,
} from '@/lib/auth/crm-permissions';
import { SCHOOL_IAM_ROLE_SLUGS } from '@/lib/rh-iam-roles';
import { qualiopiComplianceDossierItemEntity } from '@/lib/of/qualiopi-compliance-item-entity';
import type { Prisma } from '@repo/database';

/**
 * Catalogue central des entités (DocType-like).
 * Fail-closed : une entité absente ici n’est pas exposée par /api/entities/*.
 */
export const ENTITIES: Record<string, EntityDefinition> = {
  user: {
    name: 'user',
    label: 'Utilisateur',
    prismaModel: 'user',
    softDelete: false,
    permissions: {
      GET: IAM_PERMISSION.usersView,
      POST: IAM_PERMISSION.usersCreate,
      PATCH: IAM_PERMISSION.usersEdit,
      DELETE: IAM_PERMISSION.usersDelete,
    },
    fields: [
      { name: 'id', type: 'string', label: 'ID', readOnly: true },
      { name: 'name', type: 'string', label: 'Nom', required: true, search: true },
      { name: 'email', type: 'string', label: 'E-mail', required: true, search: true },
      { name: 'proEmail', type: 'string', label: 'E-mail pro', search: true },
      { name: 'avatar', type: 'file', label: 'Avatar' },
      {
        name: 'status',
        type: 'select',
        label: 'Statut',
        required: true,
        options: [
          { value: 'INACTIVE', label: 'Inactif' },
          { value: 'ACTIVE', label: 'Actif' },
          { value: 'BLOCKED', label: 'Bloqué' },
          { value: 'PENDING', label: 'En attente' },
          { value: 'BANNED', label: 'Banni' },
          { value: 'ABSENT', label: 'Absent' },
        ],
      },
      {
        name: 'roleId',
        type: 'relation',
        label: 'Rôle',
        required: true,
        relation: { entity: 'role', displayField: 'name' },
      },
      { name: 'createdAt', type: 'date', label: 'Créé le', readOnly: true },
      { name: 'lastSignInAt', type: 'date', label: 'Dernière connexion', readOnly: true },
      { name: 'isTrashed', type: 'boolean', label: 'Corbeille', readOnly: true },
    ],
    list: {
      searchFields: ['name', 'email', 'proEmail'],
      extraSelect: {
        id: true,
        isTrashed: true,
        avatar: true,
        name: true,
        email: true,
        proEmail: true,
        status: true,
        createdAt: true,
        lastSignInAt: true,
      },
      include: {
        role: { select: { id: true, name: true } },
      },
      defaultSort: 'name',
      sortMap: {
        name: (dir) => ({ name: dir }),
        role_name: (dir) => ({ role: { name: dir } }),
        status: (dir) => ({ status: dir }),
        createdAt: (dir) => ({ createdAt: dir }),
        lastSignInAt: (dir) => ({ lastSignInAt: dir }),
      },
      dynamicWhere: ({ searchParams, headers }) => {
        const status = searchParams.get('status');
        const roleId = searchParams.get('roleId');
        const sourceFlow = headers.get('x-lms-source-flow');
        const profileType = searchParams.get('profileType') || 'all';
        const and: Prisma.UserWhereInput[] = [];

        if (status && status !== 'all') {
          and.push({ status: status as Prisma.EnumUserStatusFilter['equals'] });
        }
        if (roleId && roleId !== 'all') {
          and.push({ roleId });
        }
        if (sourceFlow === 'collaborateur') {
          and.push({
            NOT: [{ role: { slug: { in: ['candidat', 'eleve'] } } }],
          });
          if (profileType === 'collaborateur') {
            and.push({ role: { slug: 'collaborateur' } });
          } else if (profileType === 'formateur') {
            and.push({ role: { slug: 'formateur' } });
          } else if (profileType === 'interne') {
            and.push({
              NOT: [
                {
                  role: {
                    slug: { in: ['collaborateur', 'formateur', 'candidat', 'eleve'] },
                  },
                },
              ],
            });
          }
        }
        return and.length ? { AND: and } : undefined;
      },
    },
  },

  role: {
    name: 'role',
    label: 'Rôle',
    prismaModel: 'userRole',
    softDelete: true,
    permissions: {
      GET: IAM_PERMISSION.rolesView,
      POST: IAM_PERMISSION.rolesEdit,
      PATCH: IAM_PERMISSION.rolesEdit,
      DELETE: IAM_PERMISSION.rolesEdit,
    },
    fields: [
      { name: 'id', type: 'string', label: 'ID', readOnly: true },
      { name: 'slug', type: 'string', label: 'Slug', required: true, search: true },
      { name: 'name', type: 'string', label: 'Nom', required: true, search: true },
      { name: 'description', type: 'text', label: 'Description' },
      { name: 'isDefault', type: 'boolean', label: 'Par défaut' },
      { name: 'isProtected', type: 'boolean', label: 'Protégé', readOnly: true },
      { name: 'createdAt', type: 'date', label: 'Créé le', readOnly: true },
    ],
    list: {
      searchFields: ['name', 'slug'],
      defaultSort: 'createdAt',
      defaultDir: 'desc',
      include: {
        permissions: {
          select: {
            permission: {
              select: { id: true, name: true, slug: true },
            },
          },
        },
      },
      dynamicWhere: () => ({
        isTrashed: false,
        slug: { in: [...SCHOOL_IAM_ROLE_SLUGS] },
      }),
    },
  },

  course: {
    name: 'course',
    label: 'Cours LMS',
    prismaModel: 'course',
    permissions: {
      GET: LMS_PERMISSION.courseView,
      POST: LMS_PERMISSION.contentDraft,
      PATCH: LMS_PERMISSION.contentDraft,
      DELETE: LMS_PERMISSION.catalogManage,
    },
    fields: [
      { name: 'id', type: 'string', label: 'ID', readOnly: true },
      { name: 'title', type: 'string', label: 'Titre', required: true, search: true },
      { name: 'description', type: 'text', label: 'Description', search: true },
      { name: 'imageUrl', type: 'file', label: 'Image' },
      { name: 'price', type: 'number', label: 'Prix' },
      { name: 'isPublished', type: 'boolean', label: 'Publié' },
      {
        name: 'createdById',
        type: 'relation',
        label: 'Auteur',
        relation: { entity: 'user', displayField: 'name' },
        readOnly: true,
      },
      { name: 'createdAt', type: 'date', label: 'Créé le', readOnly: true },
    ],
    list: {
      searchFields: ['title', 'description'],
      defaultSort: 'createdAt',
      defaultDir: 'desc',
      include: {
        createdBy: { select: { id: true, name: true } },
        _count: { select: { chapters: true, enrollments: true } },
      },
    },
    hooks: {
      beforeCreate: async ({ userId, data }) => ({
        ...data,
        createdById: (data.createdById as string) || userId,
      }),
    },
  },

  /** Leçon = modèle Prisma `Chapter` (existant LMS). */
  lesson: {
    name: 'lesson',
    label: 'Leçon',
    prismaModel: 'chapter',
    permissions: {
      GET: LMS_PERMISSION.courseView,
      POST: LMS_PERMISSION.contentDraft,
      PATCH: LMS_PERMISSION.contentDraft,
      DELETE: LMS_PERMISSION.contentDraft,
    },
    fields: [
      { name: 'id', type: 'string', label: 'ID', readOnly: true },
      {
        name: 'courseId',
        type: 'relation',
        label: 'Cours',
        required: true,
        relation: { entity: 'course', displayField: 'title' },
      },
      { name: 'title', type: 'string', label: 'Titre', required: true, search: true },
      { name: 'description', type: 'text', label: 'Contenu' },
      { name: 'videoUrl', type: 'file', label: 'Vidéo' },
      { name: 'position', type: 'number', label: 'Ordre', required: true },
      { name: 'isPublished', type: 'boolean', label: 'Publiée' },
      { name: 'isFree', type: 'boolean', label: 'Gratuit' },
    ],
    list: {
      searchFields: ['title'],
      defaultSort: 'position',
      defaultDir: 'asc',
      include: {
        course: { select: { id: true, title: true } },
      },
      dynamicWhere: ({ searchParams }) => {
        const courseId = searchParams.get('courseId');
        return courseId ? { courseId } : undefined;
      },
    },
  },

  enrollment: {
    name: 'enrollment',
    label: 'Inscription cours',
    prismaModel: 'enrollment',
    permissions: {
      GET: LMS_PERMISSION.courseView,
      POST: LMS_PERMISSION.courseProgress,
      PATCH: LMS_PERMISSION.courseProgress,
      DELETE: LMS_PERMISSION.catalogManage,
    },
    fields: [
      { name: 'id', type: 'string', label: 'ID', readOnly: true },
      {
        name: 'userId',
        type: 'relation',
        label: 'Apprenant',
        required: true,
        relation: { entity: 'user', displayField: 'name' },
      },
      {
        name: 'courseId',
        type: 'relation',
        label: 'Cours',
        required: true,
        relation: { entity: 'course', displayField: 'title' },
      },
      {
        name: 'status',
        type: 'select',
        label: 'Statut',
        required: true,
        options: [
          { value: 'PENDING', label: 'En attente' },
          { value: 'VALIDATED', label: 'Validé' },
          { value: 'REJECTED', label: 'Refusé' },
          { value: 'COMPLETED', label: 'Terminé' },
          { value: 'ARCHIVED', label: 'Archivé' },
        ],
      },
      { name: 'notes', type: 'text', label: 'Notes' },
      { name: 'createdAt', type: 'date', label: 'Créé le', readOnly: true },
    ],
    list: {
      defaultSort: 'createdAt',
      defaultDir: 'desc',
      include: {
        user: { select: { id: true, name: true, email: true } },
        course: { select: { id: true, title: true } },
      },
      dynamicWhere: ({ searchParams }) => {
        const courseId = searchParams.get('courseId');
        const userId = searchParams.get('userId');
        const where: Record<string, unknown> = {};
        if (courseId) where.courseId = courseId;
        if (userId) where.userId = userId;
        return Object.keys(where).length ? where : undefined;
      },
    },
  },

  /** Congés / absences RH — modèle Prisma `RhAbsence` déjà présent. */
  leaveRequest: {
    name: 'leaveRequest',
    label: 'Demande d’absence',
    prismaModel: 'rhAbsence',
    permissions: {
      GET: CRM_PERMISSION.ressourcesView,
      POST: CRM_PERMISSION.ressourcesEdit,
      PATCH: CRM_PERMISSION.ressourcesEdit,
      DELETE: CRM_PERMISSION.ressourcesEdit,
    },
    fields: [
      { name: 'id', type: 'string', label: 'ID', readOnly: true },
      {
        name: 'userId',
        type: 'relation',
        label: 'Collaborateur',
        required: true,
        relation: { entity: 'user', displayField: 'name' },
      },
      {
        name: 'type',
        type: 'select',
        label: 'Type',
        required: true,
        options: [
          { value: 'CONGE_PAYE', label: 'Congé payé' },
          { value: 'MALADIE', label: 'Maladie' },
          { value: 'RTT', label: 'RTT' },
          { value: 'AUTRE', label: 'Autre' },
        ],
      },
      {
        name: 'status',
        type: 'select',
        label: 'Statut',
        required: true,
        options: [
          { value: 'PENDING', label: 'En attente' },
          { value: 'APPROVED', label: 'Approuvé' },
          { value: 'REJECTED', label: 'Refusé' },
        ],
      },
      { name: 'startDate', type: 'date', label: 'Début', required: true },
      { name: 'endDate', type: 'date', label: 'Fin', required: true },
      { name: 'reason', type: 'text', label: 'Motif' },
    ],
    list: {
      defaultSort: 'startDate',
      defaultDir: 'desc',
      include: {
        user: { select: { id: true, name: true, email: true } },
        validatedBy: { select: { id: true, name: true } },
      },
      dynamicWhere: ({ searchParams }) => {
        const userId = searchParams.get('userId');
        const status = searchParams.get('status');
        const where: Record<string, unknown> = {};
        if (userId) where.userId = userId;
        if (status && status !== 'all') where.status = status;
        return Object.keys(where).length ? where : undefined;
      },
    },
  },
  complianceDossierItem: qualiopiComplianceDossierItemEntity,
};

export function getEntityDefinition(name: string): EntityDefinition | null {
  return ENTITIES[name] ?? null;
}

export function listEntityNames(): string[] {
  return Object.keys(ENTITIES);
}
