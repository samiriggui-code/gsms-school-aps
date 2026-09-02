'use client';

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { FileText, Loader2 } from 'lucide-react';
import { Button } from '@repo/ui/button';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@repo/ui/dialog';
import { Input } from '@repo/ui/input';
import { Label } from '@repo/ui/label';
import { Textarea } from '@repo/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@repo/ui/toggle-group';
import { useTranslation } from '@/hooks/useTranslation';

type Props = {
  catalogSlug: string | null | undefined;
  formationDisplayName: string;
  mode?: 'catalog-missing-price' | 'devis-prestation';
  /** Si fourni par le parent (ex. fiche catalogue), évite un second fetch et force l’éligibilité devis. */
  requiresQuote?: boolean | null;
};

type RequesterType = 'entreprise' | 'particulier';

const DELIVERY_KEYS = ['INTRA_SUR_SITE', 'CENTRE_FORMATION', 'MIXTE', 'DISTANCE'] as const;
const FUNDING_ENTREPRISE_KEYS = ['CPF', 'OPCO', 'BUDGET_ENTREPRISE', 'MULTI', 'AUTRE'] as const;
const FUNDING_PARTICULIER_KEYS = ['CPF', 'AUTRE'] as const;

export function FormationQuoteFooter({
  catalogSlug,
  formationDisplayName,
  mode = 'catalog-missing-price',
  requiresQuote: requiresQuoteProp = null,
}: Props) {
  const { t } = useTranslation();
  const [eligible, setEligible] = useState(false);
  const [checked, setChecked] = useState(false);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [requesterType, setRequesterType] = useState<RequesterType>('entreprise');

  const deliveryOptions = useMemo(
    () =>
      DELIVERY_KEYS.map((value) => ({
        value,
        label: t(`landing.quote.delivery.${value}`),
      })),
    [t],
  );

  const fundingOptions = useMemo(() => {
    const keys = requesterType === 'particulier' ? FUNDING_PARTICULIER_KEYS : FUNDING_ENTREPRISE_KEYS;
    return keys.map((value) => ({
      value,
      label: t(`landing.quote.funding.${value}`),
    }));
  }, [requesterType, t]);

  useEffect(() => {
    const s = catalogSlug?.trim();
    if (mode === 'devis-prestation') {
      setEligible(!!s);
      setChecked(true);
      return;
    }
    if (requiresQuoteProp != null) {
      setEligible(requiresQuoteProp === true && !!s);
      setChecked(true);
      return;
    }
    if (!s) {
      setChecked(true);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(`/api/catalog/formation?slug=${encodeURIComponent(s)}`, {
          cache: 'no-store',
        });
        const json = (await res.json()) as {
          requiresQuote?: boolean;
          catalogInactive?: boolean;
          formation?: { name?: string } | null;
        };
        if (!cancelled && json.formation && !json.catalogInactive && json.requiresQuote === true) {
          setEligible(true);
        }
      } catch {
        /* no CTA */
      } finally {
        if (!cancelled) setChecked(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [catalogSlug, mode, requiresQuoteProp]);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [contactRole, setContactRole] = useState('');
  const [company, setCompany] = useState('');
  const [companySiret, setCompanySiret] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [traineesExpected, setTraineesExpected] = useState('');
  const [preferredDates, setPreferredDates] = useState('');
  const [deliveryMode, setDeliveryMode] = useState('');
  const [fundingHint, setFundingHint] = useState('');
  const [message, setMessage] = useState('');
  const [honeypot, setHoneypot] = useState('');

  const isEntreprise = requesterType === 'entreprise';

  function resetForm() {
    setRequesterType('entreprise');
    setFirstName('');
    setLastName('');
    setEmail('');
    setPhone('');
    setContactRole('');
    setCompany('');
    setCompanySiret('');
    setCompanyAddress('');
    setTraineesExpected('');
    setPreferredDates('');
    setDeliveryMode('');
    setFundingHint('');
    setMessage('');
    setHoneypot('');
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!catalogSlug?.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/quote-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requesterType,
          firstName,
          lastName,
          email,
          phone,
          contactRole: isEntreprise ? contactRole : '',
          company: isEntreprise ? company : company.trim(),
          companySiret: isEntreprise ? companySiret : '',
          companyAddress,
          traineesExpected,
          preferredDates,
          deliveryMode: deliveryMode
            ? deliveryOptions.find((x) => x.value === deliveryMode)?.label ?? deliveryMode
            : '',
          fundingHint: fundingHint
            ? fundingOptions.find((x) => x.value === fundingHint)?.label ?? fundingHint
            : '',
          message,
          formationSlug: catalogSlug.trim(),
          formationName: formationDisplayName,
          website: honeypot,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as { message?: string };
      if (!res.ok) {
        toast.error(json.message || t('landing.quote.toasts.error'));
        return;
      }
      toast.success(t('landing.quote.toasts.success'));
      setOpen(false);
      resetForm();
    } catch {
      toast.error(t('landing.quote.toasts.network'));
    } finally {
      setSubmitting(false);
    }
  }

  if (!checked || !eligible) return null;

  return (
    <>
      <Button type="button" variant="primary" className="gap-2" onClick={() => setOpen(true)}>
        <FileText className="size-4" />
        {t('landing.quote.cta')}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl max-h-[min(92vh,900px)] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{t('landing.quote.title')}</DialogTitle>
            <DialogDescription>
              <span className="font-medium text-foreground">{formationDisplayName}</span>
              <span className="mt-1 block text-xs text-muted-foreground">
                {catalogSlug ? `Réf. catalogue : ${catalogSlug}` : null}
              </span>
              <span className="mt-1 block text-muted-foreground">
                {mode === 'devis-prestation'
                  ? t('landing.quote.descriptionPrestation')
                  : t('landing.quote.descriptionCatalog')}
              </span>
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={onSubmit}>
            <DialogBody className="space-y-5">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {t('landing.quote.sections.requesterType')}
                </p>
                <ToggleGroup
                  type="single"
                  value={requesterType}
                  onValueChange={(v) => {
                    if (v === 'entreprise' || v === 'particulier') {
                      setRequesterType(v);
                      if (v === 'particulier') {
                        setContactRole('');
                        setCompanySiret('');
                        setFundingHint('');
                      }
                    }
                  }}
                  className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2"
                >
                  <ToggleGroupItem value="entreprise" className="justify-center px-3 py-2.5 text-sm">
                    {t('landing.quote.requesterType.entreprise')}
                  </ToggleGroupItem>
                  <ToggleGroupItem value="particulier" className="justify-center px-3 py-2.5 text-sm">
                    {t('landing.quote.requesterType.particulier')}
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {t('landing.quote.sections.contact')}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="quote-fn">{t('landing.quote.fields.firstName')}</Label>
                    <Input
                      id="quote-fn"
                      required
                      autoComplete="given-name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="quote-ln">{t('landing.quote.fields.lastName')}</Label>
                    <Input
                      id="quote-ln"
                      required
                      autoComplete="family-name"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="quote-email">
                      {isEntreprise
                        ? t('landing.quote.fields.email')
                        : t('landing.quote.fields.emailPersonal')}
                    </Label>
                    <Input
                      id="quote-email"
                      type="email"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="quote-phone">{t('landing.quote.fields.phone')}</Label>
                    <Input
                      id="quote-phone"
                      type="tel"
                      required
                      autoComplete="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                </div>
                {isEntreprise ? (
                  <div className="space-y-1.5">
                    <Label htmlFor="quote-role">{t('landing.quote.fields.contactRole')}</Label>
                    <Input
                      id="quote-role"
                      placeholder={t('landing.quote.fields.contactRolePlaceholder')}
                      value={contactRole}
                      onChange={(e) => setContactRole(e.target.value)}
                    />
                  </div>
                ) : null}
              </div>

              {isEntreprise ? (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {t('landing.quote.sections.company')}
                  </p>
                  <div className="space-y-1.5">
                    <Label htmlFor="quote-co">{t('landing.quote.fields.company')}</Label>
                    <Input
                      id="quote-co"
                      required
                      autoComplete="organization"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="quote-siret">{t('landing.quote.fields.siret')}</Label>
                      <Input
                        id="quote-siret"
                        inputMode="numeric"
                        autoComplete="off"
                        placeholder={t('landing.quote.fields.siretPlaceholder')}
                        value={companySiret}
                        onChange={(e) => setCompanySiret(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label htmlFor="quote-addr">{t('landing.quote.fields.address')}</Label>
                      <Input
                        id="quote-addr"
                        autoComplete="street-address"
                        placeholder={t('landing.quote.fields.addressPlaceholder')}
                        value={companyAddress}
                        onChange={(e) => setCompanyAddress(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {t('landing.quote.sections.company')}
                  </p>
                  <p className="text-xs text-muted-foreground">{t('landing.quote.fields.companyParticulierHint')}</p>
                  <div className="space-y-1.5">
                    <Label htmlFor="quote-addr-part">{t('landing.quote.fields.address')}</Label>
                    <Input
                      id="quote-addr-part"
                      autoComplete="street-address"
                      placeholder={t('landing.quote.fields.addressPlaceholder')}
                      value={companyAddress}
                      onChange={(e) => setCompanyAddress(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {t('landing.quote.sections.project')}
                </p>
                <div className="space-y-1.5">
                  <Label htmlFor="quote-trainees">
                    {isEntreprise
                      ? t('landing.quote.fields.trainees')
                      : t('landing.quote.fields.traineesParticulier')}
                  </Label>
                  <Input
                    id="quote-trainees"
                    required={isEntreprise}
                    placeholder={
                      isEntreprise
                        ? t('landing.quote.fields.traineesPlaceholder')
                        : t('landing.quote.fields.traineesPlaceholderParticulier')
                    }
                    value={traineesExpected}
                    onChange={(e) => setTraineesExpected(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="quote-delivery">{t('landing.quote.fields.delivery')}</Label>
                  <Select value={deliveryMode || undefined} onValueChange={setDeliveryMode}>
                    <SelectTrigger id="quote-delivery" className="w-full">
                      <SelectValue placeholder={t('landing.quote.fields.deliveryPlaceholder')} />
                    </SelectTrigger>
                    <SelectContent>
                      {deliveryOptions.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="quote-dates">{t('landing.quote.fields.dates')}</Label>
                  <Textarea
                    id="quote-dates"
                    required
                    rows={3}
                    placeholder={t('landing.quote.fields.datesPlaceholder')}
                    value={preferredDates}
                    onChange={(e) => setPreferredDates(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="quote-fund">{t('landing.quote.fields.funding')}</Label>
                  <Select value={fundingHint || undefined} onValueChange={setFundingHint}>
                    <SelectTrigger id="quote-fund" className="w-full">
                      <SelectValue placeholder={t('landing.quote.fields.fundingPlaceholder')} />
                    </SelectTrigger>
                    <SelectContent>
                      {fundingOptions.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="quote-msg">{t('landing.quote.fields.message')}</Label>
                <Textarea
                  id="quote-msg"
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={t('landing.quote.fields.messagePlaceholder')}
                />
              </div>

              <input
                type="text"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                className="absolute h-0 w-0 opacity-0"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                aria-hidden
              />
            </DialogBody>
            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                {t('landing.quote.cancel')}
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin mr-2" />
                    {t('landing.quote.submitting')}
                  </>
                ) : (
                  t('landing.quote.submit')
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
