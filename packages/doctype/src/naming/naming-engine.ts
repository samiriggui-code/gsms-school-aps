import { randomUUID } from 'node:crypto';
import type { DocData, DocMeta, Naming } from '../types';

export function allocateName(naming: Naming, data: DocData, nameField: string): string {
  const existing = data[nameField];
  if (typeof existing === 'string' && existing.trim()) return existing.trim();

  switch (naming.strategy) {
    case 'UUID_INTERNAL':
      return randomUUID();
    case 'FIELD': {
      const v = data[naming.fieldname];
      if (typeof v !== 'string' || !v.trim()) {
        throw new Error(`Naming FIELD requires non-empty ${naming.fieldname}`);
      }
      return v.trim();
    }
    case 'MANUAL':
      throw new Error('Naming MANUAL requires an explicit name');
    case 'SERIES':
      throw new Error('Naming SERIES not implemented in Vague 1');
    default: {
      const _exhaustive: never = naming;
      return _exhaustive;
    }
  }
}

export function pickWritableFields(meta: DocMeta, data: DocData, mode: 'create' | 'update'): DocData {
  const out: DocData = {};
  for (const field of meta.fields) {
    if (field.readOnly) continue;
    if (!(field.fieldname in data)) continue;
    if (mode === 'update' && meta.flags.isSubmittable && !field.allowOnSubmit) {
      // Still allow draft writes; submit gate is elsewhere.
    }
    out[field.fieldname] = data[field.fieldname];
  }
  return out;
}

export function validateRequired(meta: DocMeta, data: DocData, mode: 'create' | 'update'): void {
  if (mode !== 'create') return;
  const missing: string[] = [];
  for (const field of meta.fields) {
    if (!field.required || field.readOnly) continue;
    const v = data[field.fieldname];
    if (v === undefined || v === null || v === '') missing.push(field.fieldname);
  }
  if (missing.length) {
    throw new Error(`Validation: missing required fields: ${missing.join(', ')}`);
  }
}
