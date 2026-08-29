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

export const lmsLessonDocType: DocTypeDefinition = {
  name: 'LmsLesson',
  module: 'lms',
  label: 'Leçon LMS',
  table: 'Chapter',
  schemaVersion: 1,
  aliases: ['lmsChapter', 'lesson'],
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
