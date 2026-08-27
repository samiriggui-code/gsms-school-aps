type LeadContact = {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
};

export type DevisClientContact = {
  email: string | null;
  firstName: string;
  lastName: string;
  phone: string | null;
  source: 'lead' | 'snapshot' | null;
};

function strFromSnapshot(snap: Record<string, unknown>, key: string): string | null {
  const v = snap[key];
  if (typeof v !== 'string') return null;
  const t = v.trim();
  return t.length ? t : null;
}

/** E-mail / identité du destinataire : lead lié, sinon snapshot client du devis. */
export function resolveDevisClientContact(input: {
  lead: LeadContact | null;
  clientSnapshot: unknown;
}): DevisClientContact {
  const snap =
    input.clientSnapshot && typeof input.clientSnapshot === 'object' && !Array.isArray(input.clientSnapshot)
      ? (input.clientSnapshot as Record<string, unknown>)
      : {};

  if (input.lead?.email?.trim()) {
    return {
      email: input.lead.email.trim(),
      firstName: input.lead.firstName?.trim() || '',
      lastName: input.lead.lastName?.trim() || '',
      phone: input.lead.phone?.trim() || strFromSnapshot(snap, 'phone'),
      source: 'lead',
    };
  }

  const email = strFromSnapshot(snap, 'email');
  const firstName =
    strFromSnapshot(snap, 'contactFirstName') ??
    strFromSnapshot(snap, 'firstName') ??
    '';
  const lastName =
    strFromSnapshot(snap, 'contactLastName') ??
    strFromSnapshot(snap, 'lastName') ??
    strFromSnapshot(snap, 'contactName') ??
    '';

  return {
    email,
    firstName,
    lastName,
    phone: strFromSnapshot(snap, 'phone'),
    source: email ? 'snapshot' : null,
  };
}
