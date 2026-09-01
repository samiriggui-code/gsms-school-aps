import type { DocTypeDefinition } from '@repo/doctype';
import { LMS_PERMISSION } from '@/lib/auth/crm-permissions';

export const lmsCourseDocType: DocTypeDefinition = {
  name: 'LmsCourse',
  module: 'lms',
  label: 'Cours LMS',
  table: 'Course',
  schemaVersion: 1,
  aliases: ['course'],
  fields: [
    { fieldname: 'title', label: 'Titre', fieldtype: 'Data', required: true, searchable: true },
    { fieldname: 'isPublished', label: 'Publié', fieldtype: 'Boolean' },
  ],
  permissions: [
    {
      role: '*',
      permlevel: 0,
      read: true,
      requires: { anyPermissionSlugs: [LMS_PERMISSION.courseView] },
    },
    {
      role: '*',
      permlevel: 0,
      create: true,
      write: true,
      requires: { anyPermissionSlugs: [LMS_PERMISSION.contentDraft] },
    },
    {
      role: '*',
      permlevel: 0,
      delete: true,
      requires: { anyPermissionSlugs: [LMS_PERMISSION.catalogManage] },
    },
  ],
  naming: { strategy: 'UUID_INTERNAL' },
  flags: { isChild: false, isSingle: false, isVirtual: false, isSubmittable: false },
  persistence: {
    table: 'Course',
    delegate: 'course',
    nameField: 'id',
    creationField: 'createdAt',
    modifiedField: 'updatedAt',
  },
};

export const lmsChapterDocType: DocTypeDefinition = {
  name: 'LmsChapter',
  module: 'lms',
  label: 'Chapitre LMS',
  table: 'Chapter',
  schemaVersion: 1,
  /** Compat: ancien nom DocType + alias lesson legacy. */
  aliases: ['LmsLesson', 'lmsChapter', 'lesson'],
  fields: [
    { fieldname: 'title', label: 'Titre', fieldtype: 'Data', required: true, searchable: true },
    {
      fieldname: 'courseId',
      label: 'Cours',
      fieldtype: 'Link',
      options: 'LmsCourse',
      required: true,
      linkDisplayField: 'title',
    },
  ],
  permissions: [
    {
      role: '*',
      permlevel: 0,
      read: true,
      requires: { anyPermissionSlugs: [LMS_PERMISSION.courseView] },
    },
    {
      role: '*',
      permlevel: 0,
      create: true,
      write: true,
      delete: true,
      requires: { anyPermissionSlugs: [LMS_PERMISSION.contentDraft] },
    },
  ],
  naming: { strategy: 'UUID_INTERNAL' },
  flags: { isChild: false, isSingle: false, isVirtual: false, isSubmittable: false },
  persistence: {
    table: 'Chapter',
    delegate: 'chapter',
    nameField: 'id',
    creationField: 'createdAt',
    modifiedField: 'updatedAt',
  },
};

/** @deprecated Prefer `lmsChapterDocType` (K8). */
export const lmsLessonDocType = lmsChapterDocType;

export const lmsEnrollmentDocType: DocTypeDefinition = {
  name: 'LmsEnrollment',
  module: 'lms',
  label: 'Inscription LMS',
  table: 'Enrollment',
  schemaVersion: 1,
  aliases: ['lmsEnrollment'],
  fields: [
    {
      fieldname: 'userId',
      label: 'Utilisateur',
      fieldtype: 'Link',
      options: 'User',
      required: true,
    },
    {
      fieldname: 'courseId',
      label: 'Cours',
      fieldtype: 'Link',
      options: 'LmsCourse',
      required: true,
    },
  ],
  permissions: [
    {
      role: '*',
      permlevel: 0,
      read: true,
      requires: { anyPermissionSlugs: [LMS_PERMISSION.courseView] },
    },
    {
      role: '*',
      permlevel: 0,
      create: true,
      write: true,
      delete: true,
      requires: { anyPermissionSlugs: [LMS_PERMISSION.catalogManage] },
    },
  ],
  naming: { strategy: 'UUID_INTERNAL' },
  flags: { isChild: false, isSingle: false, isVirtual: false, isSubmittable: false },
  persistence: {
    table: 'Enrollment',
    delegate: 'enrollment',
    nameField: 'id',
    creationField: 'createdAt',
    modifiedField: 'updatedAt',
  },
};

/** LMS-01 — devoir (Prisma Assignment → Activity). */
export const lmsAssignmentDocType: DocTypeDefinition = {
  name: 'LmsAssignment',
  module: 'lms',
  label: 'Devoir LMS',
  table: 'Assignment',
  schemaVersion: 1,
  aliases: ['lmsAssignment', 'assignment'],
  fields: [
    { fieldname: 'title', label: 'Titre', fieldtype: 'Data', required: true, searchable: true },
    { fieldname: 'description', label: 'Consignes', fieldtype: 'Text' },
    { fieldname: 'dueDate', label: 'Échéance', fieldtype: 'Datetime' },
    { fieldname: 'maxPoints', label: 'Points max', fieldtype: 'Integer' },
    {
      fieldname: 'activityId',
      label: 'Activité',
      fieldtype: 'Data',
      required: true,
    },
  ],
  permissions: [
    {
      role: '*',
      permlevel: 0,
      read: true,
      requires: { anyPermissionSlugs: [LMS_PERMISSION.courseView] },
    },
    {
      role: '*',
      permlevel: 0,
      create: true,
      write: true,
      requires: { anyPermissionSlugs: [LMS_PERMISSION.contentDraft] },
    },
    {
      role: '*',
      permlevel: 0,
      delete: true,
      requires: { anyPermissionSlugs: [LMS_PERMISSION.contentReview] },
    },
  ],
  naming: { strategy: 'UUID_INTERNAL' },
  flags: { isChild: false, isSingle: false, isVirtual: false, isSubmittable: false },
  persistence: {
    table: 'Assignment',
    delegate: 'assignment',
    nameField: 'id',
    creationField: 'createdAt',
    modifiedField: 'updatedAt',
  },
};

/** LMS-02 — discussion communauté cours (modération staff). */
export const lmsDiscussionDocType: DocTypeDefinition = {
  name: 'LmsDiscussion',
  module: 'lms',
  label: 'Discussion LMS',
  table: 'Discussion',
  schemaVersion: 1,
  aliases: ['lmsDiscussion', 'discussion'],
  fields: [
    { fieldname: 'title', label: 'Titre', fieldtype: 'Data', required: true, searchable: true },
    { fieldname: 'content', label: 'Contenu', fieldtype: 'Text' },
    { fieldname: 'isPinned', label: 'Épinglé', fieldtype: 'Boolean' },
    { fieldname: 'isLocked', label: 'Verrouillé', fieldtype: 'Boolean' },
    {
      fieldname: 'communityId',
      label: 'Communauté',
      fieldtype: 'Data',
      required: true,
    },
    {
      fieldname: 'authorId',
      label: 'Auteur',
      fieldtype: 'Link',
      options: 'User',
      required: true,
    },
  ],
  permissions: [
    {
      role: '*',
      permlevel: 0,
      read: true,
      requires: { anyPermissionSlugs: [LMS_PERMISSION.courseView] },
    },
    {
      role: '*',
      permlevel: 0,
      write: true,
      delete: true,
      requires: { anyPermissionSlugs: [LMS_PERMISSION.contentReview] },
    },
  ],
  naming: { strategy: 'UUID_INTERNAL' },
  flags: { isChild: false, isSingle: false, isVirtual: false, isSubmittable: false },
  persistence: {
    table: 'Discussion',
    delegate: 'discussion',
    nameField: 'id',
    creationField: 'createdAt',
    modifiedField: 'updatedAt',
  },
};
