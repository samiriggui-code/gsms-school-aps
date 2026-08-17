import { financeDecimalNum } from '@/lib/finance/finance-decimal';
import { resolveDevisClientContact } from '@/lib/finance/resolve-devis-client-contact';

export type EinvoiceReadinessIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
};

export type EinvoiceSellerProfile = {
  legalName: string;
  siret: string | null;
  siren: string | null;
  vatIntracommunityNumber: string | null;
  address: string | null;
  city: string | null;
  postalCode: string | null;
  countryCode: string;
};

export type EinvoiceLine = {
  label: string;
  quantity: number;
  unitPriceHt: number;
  vatRate: number;
};

export type EinvoiceBuildInput = {
  referenceCode: string;
  title: string;
  issueDate: Date;
  currency: string;
  lines: EinvoiceLine[];
  subtotalHt: number;
  vatTotal: number;
  totalTtc: number;
  notes: string | null;
  seller: EinvoiceSellerProfile;
  buyer: {
    name: string;
    email: string | null;
    siret: string | null;
    vatNumber: string | null;
    address: string | null;
    city: string | null;
    postalCode: string | null;
    countryCode: string;
  };
};

function xmlEscape(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function formatDateCii(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}${m}${day}`;
}

function money(n: number): string {
  return (Math.round(n * 100) / 100).toFixed(2);
}

function digitsOnly(value: string | null | undefined): string {
  return (value ?? '').replace(/\D/g, '');
}

function snapStr(snap: Record<string, unknown>, ...keys: string[]): string | null {
  for (const key of keys) {
    const v = snap[key];
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  return null;
}

export function parseEinvoiceLines(raw: unknown): EinvoiceLine[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((row) => {
      if (!row || typeof row !== 'object') return null;
      const r = row as Record<string, unknown>;
      const label = typeof r.label === 'string' ? r.label.trim() : '';
      if (!label) return null;
      return {
        label,
        quantity: Number(r.quantity ?? 1) || 1,
        unitPriceHt: Number(r.unitPriceHt ?? 0) || 0,
        vatRate: Number(r.vatRate ?? 20) || 0,
      };
    })
    .filter((x): x is EinvoiceLine => Boolean(x));
}

export function assessEinvoiceReadiness(input: {
  seller: EinvoiceSellerProfile;
  clientSnapshot: unknown;
  lead: { firstName: string; lastName: string; email: string; phone?: string | null } | null;
  lines: unknown;
  subtotalHt: unknown;
  totalTtc: unknown;
}): { ready: boolean; issues: EinvoiceReadinessIssue[] } {
  const issues: EinvoiceReadinessIssue[] = [];
  const snap =
    input.clientSnapshot && typeof input.clientSnapshot === 'object' && !Array.isArray(input.clientSnapshot)
      ? (input.clientSnapshot as Record<string, unknown>)
      : {};

  if (!input.seller.legalName.trim()) {
    issues.push({
      code: 'seller.name',
      message: 'Raison sociale école manquante (paramètres établissement).',
      severity: 'error',
    });
  }
  const sellerSiret = digitsOnly(input.seller.siret);
  if (sellerSiret.length !== 14) {
    issues.push({
      code: 'seller.siret',
      message: 'SIRET émetteur requis (14 chiffres) pour Factur-X / PDP.',
      severity: 'error',
    });
  }
  if (!input.seller.vatIntracommunityNumber?.trim()) {
    issues.push({
      code: 'seller.vat',
      message: 'N° TVA intracommunautaire émetteur recommandé (profil BASIC+).',
      severity: 'warning',
    });
  }
  if (!input.seller.address?.trim() || !input.seller.city?.trim() || !input.seller.postalCode?.trim()) {
    issues.push({
      code: 'seller.address',
      message: 'Adresse complète émetteur (rue, CP, ville) requise.',
      severity: 'error',
    });
  }

  const buyerSiret = digitsOnly(
    snapStr(snap, 'companySiret', 'siret', 'clientSiret', 'buyerSiret'),
  );
  const buyerName =
    snapStr(snap, 'company', 'companyName', 'clientCompany', 'buyerName') ||
    [input.lead?.firstName, input.lead?.lastName].filter(Boolean).join(' ').trim();

  if (!buyerName) {
    issues.push({
      code: 'buyer.name',
      message: 'Nom / raison sociale client manquant sur le dossier.',
      severity: 'error',
    });
  }
  if (buyerSiret && buyerSiret.length !== 14) {
    issues.push({
      code: 'buyer.siret',
      message: 'SIRET client invalide (14 chiffres attendus).',
      severity: 'error',
    });
  }
  if (!buyerSiret) {
    issues.push({
      code: 'buyer.siret',
      message:
        'SIRET client absent — obligatoire pour B2B e-facture (à saisir dans le snapshot client).',
      severity: 'error',
    });
  }

  const contact = resolveDevisClientContact({
    lead: input.lead,
    clientSnapshot: input.clientSnapshot,
  });
  if (!contact.email) {
    issues.push({
      code: 'buyer.email',
      message: 'E-mail client manquant (suivi / e-reporting).',
      severity: 'warning',
    });
  }

  const lines = parseEinvoiceLines(input.lines);
  if (lines.length === 0) {
    issues.push({
      code: 'lines.empty',
      message: 'Au moins une ligne de prestation est requise.',
      severity: 'error',
    });
  }
  if (financeDecimalNum(input.totalTtc) <= 0) {
    issues.push({
      code: 'total.zero',
      message: 'Montant TTC invalide.',
      severity: 'error',
    });
  }

  const ready = !issues.some((i) => i.severity === 'error');
  return { ready, issues };
}

export function buildBuyerFromSnapshot(input: {
  clientSnapshot: unknown;
  lead: { firstName: string; lastName: string; email: string; phone?: string | null } | null;
}): EinvoiceBuildInput['buyer'] {
  const snap =
    input.clientSnapshot && typeof input.clientSnapshot === 'object' && !Array.isArray(input.clientSnapshot)
      ? (input.clientSnapshot as Record<string, unknown>)
      : {};
  const contact = resolveDevisClientContact({
    lead: input.lead,
    clientSnapshot: input.clientSnapshot,
  });
  const name =
    snapStr(snap, 'company', 'companyName', 'clientCompany', 'buyerName') ||
    [contact.firstName, contact.lastName].filter(Boolean).join(' ').trim() ||
    'Client';

  return {
    name,
    email: contact.email,
    siret: snapStr(snap, 'companySiret', 'siret', 'clientSiret', 'buyerSiret'),
    vatNumber: snapStr(snap, 'vatNumber', 'vatIntracommunityNumber', 'tva'),
    address: snapStr(snap, 'companyAddress', 'address', 'clientAddress'),
    city: snapStr(snap, 'companyCity', 'city', 'clientCity'),
    postalCode: snapStr(snap, 'companyPostalCode', 'postalCode', 'clientPostalCode'),
    countryCode: snapStr(snap, 'countryCode', 'country') === 'FR' || !snapStr(snap, 'countryCode')
      ? 'FR'
      : String(snapStr(snap, 'countryCode')).slice(0, 2).toUpperCase(),
  };
}

/**
 * Génère un XML Factur-X (profil BASIC, CII CrossIndustryInvoice).
 * Compatible PDP / outils de validation — à embarquer ensuite dans un PDF/A-3.
 */
export function buildFacturXCiiXml(input: EinvoiceBuildInput): string {
  const issueDate = formatDateCii(input.issueDate);
  const sellerSiret = digitsOnly(input.seller.siret);
  const buyerSiret = digitsOnly(input.buyer.siret);
  const sellerSiren =
    digitsOnly(input.seller.siren) ||
    (sellerSiret.length === 14 ? sellerSiret.slice(0, 9) : '');

  const lineXml = input.lines
    .map((line, index) => {
      const lineHt = line.quantity * line.unitPriceHt;
      const lineVat = lineHt * (line.vatRate / 100);
      return `
    <ram:IncludedSupplyChainTradeLineItem>
      <ram:AssociatedDocumentLineDocument>
        <ram:LineID>${index + 1}</ram:LineID>
      </ram:AssociatedDocumentLineDocument>
      <ram:SpecifiedTradeProduct>
        <ram:Name>${xmlEscape(line.label)}</ram:Name>
      </ram:SpecifiedTradeProduct>
      <ram:SpecifiedLineTradeAgreement>
        <ram:NetPriceProductTradePrice>
          <ram:ChargeAmount>${money(line.unitPriceHt)}</ram:ChargeAmount>
        </ram:NetPriceProductTradePrice>
      </ram:SpecifiedLineTradeAgreement>
      <ram:SpecifiedLineTradeDelivery>
        <ram:BilledQuantity unitCode="C62">${money(line.quantity)}</ram:BilledQuantity>
      </ram:SpecifiedLineTradeDelivery>
      <ram:SpecifiedLineTradeSettlement>
        <ram:ApplicableTradeTax>
          <ram:TypeCode>VAT</ram:TypeCode>
          <ram:CategoryCode>S</ram:CategoryCode>
          <ram:RateApplicablePercent>${money(line.vatRate)}</ram:RateApplicablePercent>
        </ram:ApplicableTradeTax>
        <ram:SpecifiedTradeSettlementLineMonetarySummation>
          <ram:LineTotalAmount>${money(lineHt)}</ram:LineTotalAmount>
        </ram:SpecifiedTradeSettlementLineMonetarySummation>
      </ram:SpecifiedLineTradeSettlement>
    </ram:IncludedSupplyChainTradeLineItem>`.trim();
    })
    .join('\n');

  const vatByRate = new Map<number, { base: number; tax: number }>();
  for (const line of input.lines) {
    const base = line.quantity * line.unitPriceHt;
    const tax = base * (line.vatRate / 100);
    const prev = vatByRate.get(line.vatRate) ?? { base: 0, tax: 0 };
    vatByRate.set(line.vatRate, { base: prev.base + base, tax: prev.tax + tax });
  }
  const taxXml = [...vatByRate.entries()]
    .map(
      ([rate, { base, tax }]) => `
        <ram:ApplicableTradeTax>
          <ram:CalculatedAmount>${money(tax)}</ram:CalculatedAmount>
          <ram:TypeCode>VAT</ram:TypeCode>
          <ram:BasisAmount>${money(base)}</ram:BasisAmount>
          <ram:CategoryCode>S</ram:CategoryCode>
          <ram:RateApplicablePercent>${money(rate)}</ram:RateApplicablePercent>
        </ram:ApplicableTradeTax>`,
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rsm:CrossIndustryInvoice
  xmlns:rsm="urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100"
  xmlns:ram="urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100"
  xmlns:udt="urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100">
  <rsm:ExchangedDocumentContext>
    <ram:GuidelineSpecifiedDocumentContextParameter>
      <ram:ID>urn:cen.eu:en16931:2017#compliant#urn:factur-x.eu:1p0:basic</ram:ID>
    </ram:GuidelineSpecifiedDocumentContextParameter>
  </rsm:ExchangedDocumentContext>
  <rsm:ExchangedDocument>
    <ram:ID>${xmlEscape(input.referenceCode)}</ram:ID>
    <ram:TypeCode>380</ram:TypeCode>
    <ram:IssueDateTime>
      <udt:DateTimeString format="102">${issueDate}</udt:DateTimeString>
    </ram:IssueDateTime>
    <ram:IncludedNote>
      <ram:Content>${xmlEscape(input.title)}${input.notes ? ` — ${xmlEscape(input.notes.slice(0, 500))}` : ''}</ram:Content>
    </ram:IncludedNote>
  </rsm:ExchangedDocument>
  <rsm:SupplyChainTradeTransaction>
${lineXml}
    <ram:ApplicableHeaderTradeAgreement>
      <ram:SellerTradeParty>
        <ram:Name>${xmlEscape(input.seller.legalName)}</ram:Name>
        ${
          sellerSiren
            ? `<ram:SpecifiedLegalOrganization>
          <ram:ID schemeID="0002">${xmlEscape(sellerSiren)}</ram:ID>
        </ram:SpecifiedLegalOrganization>`
            : ''
        }
        ${
          sellerSiret
            ? `<ram:SpecifiedTaxRegistration>
          <ram:ID schemeID="FC">${xmlEscape(sellerSiret)}</ram:ID>
        </ram:SpecifiedTaxRegistration>`
            : ''
        }
        ${
          input.seller.vatIntracommunityNumber
            ? `<ram:SpecifiedTaxRegistration>
          <ram:ID schemeID="VA">${xmlEscape(input.seller.vatIntracommunityNumber)}</ram:ID>
        </ram:SpecifiedTaxRegistration>`
            : ''
        }
        <ram:PostalTradeAddress>
          <ram:PostcodeCode>${xmlEscape(input.seller.postalCode ?? '')}</ram:PostcodeCode>
          <ram:LineOne>${xmlEscape(input.seller.address ?? '')}</ram:LineOne>
          <ram:CityName>${xmlEscape(input.seller.city ?? '')}</ram:CityName>
          <ram:CountryID>${xmlEscape(input.seller.countryCode || 'FR')}</ram:CountryID>
        </ram:PostalTradeAddress>
      </ram:SellerTradeParty>
      <ram:BuyerTradeParty>
        <ram:Name>${xmlEscape(input.buyer.name)}</ram:Name>
        ${
          buyerSiret
            ? `<ram:SpecifiedTaxRegistration>
          <ram:ID schemeID="FC">${xmlEscape(buyerSiret)}</ram:ID>
        </ram:SpecifiedTaxRegistration>`
            : ''
        }
        ${
          input.buyer.vatNumber
            ? `<ram:SpecifiedTaxRegistration>
          <ram:ID schemeID="VA">${xmlEscape(input.buyer.vatNumber)}</ram:ID>
        </ram:SpecifiedTaxRegistration>`
            : ''
        }
        <ram:PostalTradeAddress>
          <ram:PostcodeCode>${xmlEscape(input.buyer.postalCode ?? '')}</ram:PostcodeCode>
          <ram:LineOne>${xmlEscape(input.buyer.address ?? '')}</ram:LineOne>
          <ram:CityName>${xmlEscape(input.buyer.city ?? '')}</ram:CityName>
          <ram:CountryID>${xmlEscape(input.buyer.countryCode || 'FR')}</ram:CountryID>
        </ram:PostalTradeAddress>
      </ram:BuyerTradeParty>
    </ram:ApplicableHeaderTradeAgreement>
    <ram:ApplicableHeaderTradeDelivery/>
    <ram:ApplicableHeaderTradeSettlement>
      <ram:InvoiceCurrencyCode>${xmlEscape(input.currency || 'EUR')}</ram:InvoiceCurrencyCode>
${taxXml}
      <ram:SpecifiedTradeSettlementHeaderMonetarySummation>
        <ram:LineTotalAmount>${money(input.subtotalHt)}</ram:LineTotalAmount>
        <ram:TaxBasisTotalAmount>${money(input.subtotalHt)}</ram:TaxBasisTotalAmount>
        <ram:TaxTotalAmount currencyID="${xmlEscape(input.currency || 'EUR')}">${money(input.vatTotal)}</ram:TaxTotalAmount>
        <ram:GrandTotalAmount>${money(input.totalTtc)}</ram:GrandTotalAmount>
        <ram:DuePayableAmount>${money(input.totalTtc)}</ram:DuePayableAmount>
      </ram:SpecifiedTradeSettlementHeaderMonetarySummation>
    </ram:ApplicableHeaderTradeSettlement>
  </rsm:SupplyChainTradeTransaction>
</rsm:CrossIndustryInvoice>
`;
}
