/**
 * Parse les blocs « Libellé: valeur » issus des notes landing (demande de devis, etc.).
 * Les clés sont normalisées en minuscules pour correspondre aux libellés du formulaire.
 */
export function parseNotesLabelValues(notes: string | null | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!notes) return out;
  for (const rawLine of notes.split('\n')) {
    const line = rawLine.trim();
    const i = line.indexOf(':');
    if (i <= 0 || i >= line.length - 1) continue;
    const key = line.slice(0, i).trim().toLowerCase();
    const val = line.slice(i + 1).trim();
    if (!key || !val || key.startsWith('===')) continue;
    out[key] = val;
  }
  return out;
}

export function companyFromLeadNotes(notes: string | null | undefined): string | null {
  const v = parseNotesLabelValues(notes)['raison sociale']?.trim();
  return v?.length ? v : null;
}

/** Formation / parcours visé (notes devis ou préinscription). */
export function formationLabelFromLeadNotes(notes: string | null | undefined): string | null {
  const p = parseNotesLabelValues(notes);
  const v =
    p['formation visée']?.trim() ||
    p['formation demandée']?.trim() ||
    p['libellé']?.trim() ||
    '';
  return v.length ? v : null;
}

/** Champs clientSnapshot alignés sur le formulaire d’édition devis (draft). */
export function clientSnapshotFieldsFromLead(lead: {
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  notes: string | null;
  formation: { name: string } | null;
}): Record<string, string> {
  const p = parseNotesLabelValues(lead.notes);
  const pick = (...keys: string[]) => {
    for (const k of keys) {
      const v = p[k.toLowerCase()];
      if (v?.trim()) return v.trim();
    }
    return undefined;
  };
  const snap: Record<string, string> = {
    contactFirstName: lead.firstName,
    contactLastName: lead.lastName,
    contactName: `${lead.firstName} ${lead.lastName}`.trim(),
    email: lead.email,
  };
  if (lead.phone?.trim()) snap.phone = lead.phone.trim();
  const company = pick('raison sociale');
  if (company) snap.company = company;
  const siret = pick('siret / siren');
  if (siret) snap.companySiret = siret;
  const addr = pick('adresse / site d’intervention', "adresse / site d'intervention");
  if (addr) {
    snap.address = addr;
    snap.billingAddress = addr;
  }
  const trainees = pick('nombre de stagiaires (estimation)');
  if (trainees) snap.traineesExpected = trainees;
  const delivery = pick('modalité souhaitée');
  if (delivery) snap.deliveryMode = delivery;
  const funding = pick('financement envisagé');
  if (funding) snap.fundingHint = funding;
  const pref = pick('période ou dates souhaitées');
  if (pref) snap.preferredDates = pref;
  const slug = pick('slug crm');
  if (slug) snap.catalogFormationSlug = slug;
  const libelle = pick('libellé');
  if (libelle) snap.catalogFormationLabel = libelle;
  if (lead.formation?.name) snap.catalogFormationName = lead.formation.name;
  return snap;
}
