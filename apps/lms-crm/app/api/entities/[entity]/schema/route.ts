import { NextRequest } from 'next/server';
import type { DocField, DocFieldType } from '@repo/doctype';
import { fail, ok } from '@/app/api/_shared/http/response';
import { protectRoute } from '@/lib/auth/protect-route';
import {
  ensureDocTypeBootstrap,
  getDocTypeBootstrapError,
  getDocTypeBootstrapStatus,
} from '@/lib/doctype/bootstrap';

type Params = { params: Promise<{ entity: string }> };

function mapFieldType(fieldtype: DocFieldType): string {
  switch (fieldtype) {
    case 'Data':
    case 'Email':
    case 'Phone':
    case 'Select':
      return 'string';
    case 'Text':
    case 'Long Text':
      return 'text';
    case 'Integer':
    case 'Decimal':
    case 'Currency':
    case 'Percent':
      return 'number';
    case 'Boolean':
      return 'boolean';
    case 'Date':
    case 'Datetime':
    case 'Time':
      return 'date';
    case 'Link':
      return 'relation';
    case 'JSON':
      return 'json';
    case 'File':
    case 'Image':
      return 'file';
    case 'Table':
      return 'json';
    default: {
      const _exhaustive: never = fieldtype;
      return _exhaustive;
    }
  }
}

function serializeField(field: DocField) {
  return {
    name: field.fieldname,
    type: mapFieldType(field.fieldtype),
    label: field.label,
    required: Boolean(field.required),
    readOnly: Boolean(field.readOnly),
    options: Array.isArray(field.options) ? field.options : undefined,
    relation:
      field.fieldtype === 'Link' && typeof field.options === 'string'
        ? { entity: field.options, displayField: field.linkDisplayField ?? 'name' }
        : undefined,
  };
}

/** Schema pour formulaire générique — shape legacy conservée. */
export async function GET(req: NextRequest, { params }: Params) {
  const { entity } = await params;
  ensureDocTypeBootstrap();
  if (getDocTypeBootstrapStatus() === 'failed') {
    return fail(getDocTypeBootstrapError() ?? 'DocType bootstrap failed', 503);
  }
  const registry = ensureDocTypeBootstrap();
  if (!registry.hasDocType(entity)) {
    return fail('Entité inconnue.', 404);
  }

  const auth = await protectRoute(req, entity, 'GET');
  if (!auth.ok) return auth.response;

  try {
    const meta = registry.getMeta(entity);
    return ok({
      name: meta.aliases[0] ?? meta.name,
      label: meta.label,
      softDelete: Boolean(meta.flags.softDelete || meta.persistence.softDeleteField),
      fields: [
        {
          name: meta.persistence.nameField,
          type: 'string',
          label: 'ID',
          required: false,
          readOnly: true,
        },
        ...meta.fields
          .filter((f) => f.fieldname !== meta.persistence.nameField)
          .map(serializeField),
      ],
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur schema.';
    return fail(message, 500);
  }
}
