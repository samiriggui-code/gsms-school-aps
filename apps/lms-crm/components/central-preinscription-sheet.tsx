'use client';

import { type ComponentProps, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import type { CatalogSessionRow } from '@/components/catalog/catalog-sessions-panel';
import {
  PREINSCRIPTION_FORMATION_OPTIONS,
  PREINSCRIPTION_SESSION_FLEXIBLE,
  preinscriptionLabelForSlug,
} from '@/lib/preinscription-formation-options';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/providers/i18n-provider';
import { preinscriptionMessages } from '@/i18n/landing-content/preinscription';
import {
  assessPreinscriptionIdentity,
  isFrenchBirthContext,
} from '@/lib/cnaps/cnaps-onboarding-fields';

/** Dans le sheet, Radix retournait le menu vers le haut sur desktop — liste tronquée en haut. */
const SHEET_SELECT_CONTENT_PROPS: ComponentProps<typeof SelectContent> = {
  side: 'bottom',
  align: 'start',
  avoidCollisions: false,
  collisionPadding: 8,
  position: 'popper',
};

const SHEET_SELECT_CONTENT_CLASS = cn(
  'z-[200] max-h-[min(22rem,60vh)]',
  '[&_[data-radix-select-viewport]]:max-h-[min(20rem,55vh)]',
  '[&_[data-radix-select-viewport]]:overflow-y-auto',
);

type CentralPreinscriptionSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type FormState = {
  civility: 'M' | 'MME' | '';
  firstName: string;
  lastName: string;
  usageName: string;
  email: string;
  phone: string;
  birthDate: string;
  birthCity: string;
  birthDepartment: string;
  birthCountry: string;
  nationality: string;
  address: string;
  postalCode: string;
  city: string;
  formationSlug: string;
  fundingMode: string;
  sessionChoice: string;
  sessionLabel: string;
  currentSituation: string;
  experience: string;
  motivation: string;
};

type ComplianceState = {
  hasValidIdentityDocument: boolean;
  hasNoIncompatibleConviction: boolean;
  meetsFormationPrerequisites: boolean;
  acceptsInternalRules: boolean;
  acknowledgesCnapsHandledBySchool: boolean;
  certifiesInformationAccuracy: boolean;
};

const EMPTY_FORM: FormState = {
  civility: '',
  firstName: '',
  lastName: '',
  usageName: '',
  email: '',
  phone: '',
  birthDate: '',
  birthCity: '',
  birthDepartment: '',
  birthCountry: 'France',
  nationality: '',
  address: '',
  postalCode: '',
  city: '',
  formationSlug: '',
  fundingMode: '',
  sessionChoice: '',
  sessionLabel: '',
  currentSituation: '',
  experience: '',
  motivation: '',
};

const EMPTY_COMPLIANCE: ComplianceState = {
  hasValidIdentityDocument: false,
  hasNoIncompatibleConviction: false,
  meetsFormationPrerequisites: false,
  acceptsInternalRules: false,
  acknowledgesCnapsHandledBySchool: false,
  certifiesInformationAccuracy: false,
};

function formatCatalogSessionLabel(session: CatalogSessionRow): string {
  const parts = [session.dateDisplayLabel];
  if (session.location) parts.push(session.location);
  if (session.sessionSubtitle) parts.push(session.sessionSubtitle);
  return parts.join(' · ');
}

const FUNDING_OPTION_KEYS = [
  'cpf',
  'transition',
  'opco',
  'franceTravail',
  'selfFunded',
  'apprenticeship',
  'discuss',
] as const;

type FundingKey = (typeof FUNDING_OPTION_KEYS)[number];

function fundingLabelForKey(key: FundingKey, funding: Record<FundingKey, string>): string {
  return funding[key];
}

export function CentralPreinscriptionSheet({
  open,
  onOpenChange,
}: CentralPreinscriptionSheetProps) {
  const { languageCode } = useLanguage();
  const locale = languageCode === 'en' ? 'en' : 'fr';
  const p = preinscriptionMessages[locale].landing.preinscription;
  const f = p.fields;
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [compliance, setCompliance] = useState<ComplianceState>(EMPTY_COMPLIANCE);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [catalogSessions, setCatalogSessions] = useState<CatalogSessionRow[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      setForm(EMPTY_FORM);
      setCompliance(EMPTY_COMPLIANCE);
      setIsSubmitting(false);
      setCatalogSessions([]);
      setSessionsLoading(false);
    }
  }, [open]);

  useEffect(() => {
    if (!form.formationSlug) {
      setCatalogSessions([]);
      return;
    }

    let cancelled = false;
    setSessionsLoading(true);

    fetch(`/api/catalog/sessions?slug=${encodeURIComponent(form.formationSlug)}`)
      .then(async (res) => {
        if (!res.ok) return { sessions: [] as CatalogSessionRow[] };
        const data = (await res.json()) as { sessions?: CatalogSessionRow[] };
        return { sessions: data.sessions ?? [] };
      })
      .then(({ sessions }) => {
        if (!cancelled) setCatalogSessions(sessions);
      })
      .catch(() => {
        if (!cancelled) setCatalogSessions([]);
      })
      .finally(() => {
        if (!cancelled) setSessionsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [form.formationSlug]);

  const bornInFrance = useMemo(
    () =>
      isFrenchBirthContext({
        birthCountry: form.birthCountry,
        nationality: form.nationality,
      }),
    [form.birthCountry, form.nationality],
  );

  const identityCheck = useMemo(
    () =>
      assessPreinscriptionIdentity({
        civility: form.civility || null,
        firstName: form.firstName,
        lastName: form.lastName,
        usageName: form.usageName,
        email: form.email,
        phone: form.phone,
        birthDate: form.birthDate,
        birthCity: form.birthCity,
        birthDepartment: form.birthDepartment || null,
        birthCountry: form.birthCountry || null,
        nationality: form.nationality,
        address: form.address,
        postalCode: form.postalCode,
        city: form.city,
      }),
    [form],
  );

  const canSubmit = useMemo(() => {
    const requiredDossier =
      form.formationSlug.trim() &&
      form.fundingMode.trim() &&
      form.currentSituation.trim();

    const allComplianceChecked = Object.values(compliance).every(Boolean);

    return Boolean(identityCheck.complete && requiredDossier && allComplianceChecked);
  }, [form, compliance, identityCheck.complete]);

  const updateField = (key: keyof FormState, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const updateCompliance = (key: keyof ComplianceState, value: boolean) =>
    setCompliance((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canSubmit || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const sessionId =
        form.sessionChoice &&
        form.sessionChoice !== PREINSCRIPTION_SESSION_FLEXIBLE
          ? form.sessionChoice
          : undefined;

      const sessionLabel =
        form.sessionChoice === PREINSCRIPTION_SESSION_FLEXIBLE
          ? form.sessionLabel.trim() || undefined
          : undefined;

      const res = await fetch('/api/preinscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          civility: form.civility,
          firstName: form.firstName,
          lastName: form.lastName,
          usageName: form.usageName || undefined,
          email: form.email,
          phone: form.phone,
          birthDate: form.birthDate,
          birthCity: form.birthCity,
          birthDepartment: bornInFrance ? form.birthDepartment : undefined,
          birthCountry: bornInFrance ? 'France' : form.birthCountry,
          nationality: form.nationality,
          address: form.address,
          postalCode: form.postalCode,
          city: form.city,
          formationSlug: form.formationSlug,
          formationName: preinscriptionLabelForSlug(form.formationSlug),
          fundingMode: form.fundingMode,
          sessionId,
          sessionLabel,
          currentSituation: form.currentSituation,
          experience: form.experience,
          motivation: form.motivation,
          ...compliance,
          sourceContext: 'central-landing-cta',
        }),
      });

      const json = (await res.json().catch(() => ({}))) as { message?: string };
      if (!res.ok) {
        throw new Error(json.message ?? p.toasts.saveFailed);
      }

      toast.success(p.toasts.success);
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : p.toasts.errorGeneric);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="gap-0 w-[calc(100vw-1rem)] max-w-[calc(100vw-1rem)] sm:w-[calc(100vw-2rem)] sm:max-w-[calc(100vw-2rem)] lg:w-[1160px] inset-2 sm:inset-5 border start-auto h-[calc(100dvh-1rem)] sm:h-auto max-h-[calc(100dvh-1rem)] sm:max-h-[calc(100dvh-2rem)] rounded-lg p-0 [&_[data-slot=sheet-close]]:top-3 sm:[&_[data-slot=sheet-close]]:top-4.5 [&_[data-slot=sheet-close]]:end-3 sm:[&_[data-slot=sheet-close]]:end-5">
        <SheetHeader className="border-b border-border px-5 py-3.5">
          <SheetTitle className="font-medium">{p.sheetTitle}</SheetTitle>
          <SheetDescription>{p.sheetDescription}</SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <SheetBody className="grow p-0">
            <ScrollArea
              className="flex h-[calc(100dvh-10.5rem)] flex-col sm:h-[calc(100dvh-11.5rem)] mx-1.5"
              viewportClassName="[&>div]:h-full [&>div>div]:h-full"
            >
              <div className="px-3.5 py-5">
                <Tabs defaultValue="profile" className="w-auto text-sm text-muted-foreground">
                  <TabsList className="mb-4 inline-flex h-auto w-auto max-w-full grow-0 flex-wrap gap-y-1">
                    <TabsTrigger value="profile">{p.tabs.profile}</TabsTrigger>
                    <TabsTrigger value="compliance">{p.tabs.compliance}</TabsTrigger>
                    <TabsTrigger value="project">{p.tabs.project}</TabsTrigger>
                  </TabsList>

                  <TabsContent value="profile">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="space-y-2 sm:col-span-2">
                        <Label>{f.civility.label}</Label>
                        <Select
                          value={form.civility || undefined}
                          onValueChange={(v) => updateField('civility', v as 'M' | 'MME')}
                          required
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={f.civility.placeholder} />
                          </SelectTrigger>
                          <SelectContent {...SHEET_SELECT_CONTENT_PROPS} className={SHEET_SELECT_CONTENT_CLASS}>
                            <SelectItem value="M">{f.civility.monsieur}</SelectItem>
                            <SelectItem value="MME">{f.civility.madame}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>{f.firstName.label}</Label>
                        <Input
                          value={form.firstName}
                          onChange={(e) => updateField('firstName', e.target.value)}
                          placeholder={f.firstName.placeholder}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{f.lastName.label}</Label>
                        <Input
                          value={form.lastName}
                          onChange={(e) => updateField('lastName', e.target.value)}
                          placeholder={f.lastName.placeholder}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{f.usageName.label}</Label>
                        <Input
                          value={form.usageName}
                          onChange={(e) => updateField('usageName', e.target.value)}
                          placeholder={f.usageName.placeholder}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{f.email.label}</Label>
                        <Input
                          type="email"
                          value={form.email}
                          onChange={(e) => updateField('email', e.target.value)}
                          placeholder={f.email.placeholder}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{f.phone.label}</Label>
                        <Input
                          value={form.phone}
                          onChange={(e) => updateField('phone', e.target.value)}
                          placeholder={f.phone.placeholder}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{f.birthDate.label}</Label>
                        <Input
                          type="date"
                          value={form.birthDate}
                          onChange={(e) => updateField('birthDate', e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{f.birthCity.label}</Label>
                        <Input
                          value={form.birthCity}
                          onChange={(e) => updateField('birthCity', e.target.value)}
                          placeholder={f.birthCity.placeholder}
                          required
                        />
                      </div>
                      {bornInFrance ? (
                        <div className="space-y-2">
                          <Label>{f.birthDepartment.label}</Label>
                          <Input
                            value={form.birthDepartment}
                            onChange={(e) => updateField('birthDepartment', e.target.value.toUpperCase())}
                            placeholder={f.birthDepartment.placeholder}
                            required
                          />
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Label>{f.birthCountry.label}</Label>
                          <Input
                            value={form.birthCountry}
                            onChange={(e) => updateField('birthCountry', e.target.value)}
                            placeholder={f.birthCountry.placeholder}
                            required
                          />
                        </div>
                      )}
                      <div className="space-y-2">
                        <Label>{f.nationality.label}</Label>
                        <Input
                          value={form.nationality}
                          onChange={(e) => {
                            const value = e.target.value;
                            setForm((prev) => ({
                              ...prev,
                              nationality: value,
                              birthCountry:
                                isFrenchBirthContext({
                                  birthCountry: prev.birthCountry,
                                  nationality: value,
                                }) && !prev.birthCountry.trim()
                                  ? 'France'
                                  : prev.birthCountry,
                            }));
                          }}
                          placeholder={f.nationality.placeholder}
                          required
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label>{f.address.label}</Label>
                        <Input
                          value={form.address}
                          onChange={(e) => updateField('address', e.target.value)}
                          placeholder={f.address.placeholder}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{f.postalCode.label}</Label>
                        <Input
                          value={form.postalCode}
                          onChange={(e) => updateField('postalCode', e.target.value)}
                          placeholder={f.postalCode.placeholder}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{f.city.label}</Label>
                        <Input
                          value={form.city}
                          onChange={(e) => updateField('city', e.target.value)}
                          placeholder={f.city.placeholder}
                          required
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="compliance">
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          id="compliance-id"
                          checked={compliance.hasValidIdentityDocument}
                          onCheckedChange={(value) =>
                            updateCompliance('hasValidIdentityDocument', value === true)
                          }
                        />
                        <Label htmlFor="compliance-id" className="leading-relaxed">
                          {p.compliance.hasValidIdentityDocument}
                        </Label>
                      </div>
                      <div className="flex items-start gap-3">
                        <Checkbox
                          id="compliance-record"
                          checked={compliance.hasNoIncompatibleConviction}
                          onCheckedChange={(value) =>
                            updateCompliance('hasNoIncompatibleConviction', value === true)
                          }
                        />
                        <Label htmlFor="compliance-record" className="leading-relaxed">
                          {p.compliance.hasNoIncompatibleConviction}
                        </Label>
                      </div>
                      <div className="flex items-start gap-3">
                        <Checkbox
                          id="compliance-prereq"
                          checked={compliance.meetsFormationPrerequisites}
                          onCheckedChange={(value) =>
                            updateCompliance('meetsFormationPrerequisites', value === true)
                          }
                        />
                        <Label htmlFor="compliance-prereq" className="leading-relaxed">
                          {p.compliance.meetsFormationPrerequisites}
                        </Label>
                      </div>
                      <div className="flex items-start gap-3">
                        <Checkbox
                          id="compliance-rules"
                          checked={compliance.acceptsInternalRules}
                          onCheckedChange={(value) =>
                            updateCompliance('acceptsInternalRules', value === true)
                          }
                        />
                        <Label htmlFor="compliance-rules" className="leading-relaxed">
                          {p.compliance.acceptsInternalRules}
                        </Label>
                      </div>
                      <div className="flex items-start gap-3">
                        <Checkbox
                          id="compliance-cnaps"
                          checked={compliance.acknowledgesCnapsHandledBySchool}
                          onCheckedChange={(value) =>
                            updateCompliance('acknowledgesCnapsHandledBySchool', value === true)
                          }
                        />
                        <Label htmlFor="compliance-cnaps" className="leading-relaxed">
                          {p.compliance.acknowledgesCnapsHandledBySchool}
                        </Label>
                      </div>
                      <div className="flex items-start gap-3">
                        <Checkbox
                          id="compliance-accuracy"
                          checked={compliance.certifiesInformationAccuracy}
                          onCheckedChange={(value) =>
                            updateCompliance('certifiesInformationAccuracy', value === true)
                          }
                        />
                        <Label htmlFor="compliance-accuracy" className="leading-relaxed">
                          {p.compliance.certifiesInformationAccuracy}
                        </Label>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="project">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="space-y-2 md:col-span-2">
                        <Label>{f.formation.label}</Label>
                        <Select
                          value={form.formationSlug}
                          onValueChange={(value) =>
                            setForm((prev) => ({
                              ...prev,
                              formationSlug: value,
                              sessionChoice: '',
                              sessionLabel: '',
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={f.formation.placeholder} />
                          </SelectTrigger>
                          <SelectContent
                            {...SHEET_SELECT_CONTENT_PROPS}
                            className={SHEET_SELECT_CONTENT_CLASS}
                          >
                            {PREINSCRIPTION_FORMATION_OPTIONS.map((option) => (
                              <SelectItem key={option.slug} value={option.slug}>
                                {preinscriptionLabelForSlug(option.slug) || option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label>{f.funding.label}</Label>
                        <Select
                          value={form.fundingMode}
                          onValueChange={(value) => updateField('fundingMode', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={f.funding.placeholder} />
                          </SelectTrigger>
                          <SelectContent
                            {...SHEET_SELECT_CONTENT_PROPS}
                            className={SHEET_SELECT_CONTENT_CLASS}
                          >
                            {FUNDING_OPTION_KEYS.map((key) => (
                              <SelectItem key={key} value={fundingLabelForKey(key, p.funding)}>
                                {p.funding[key]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label>{f.currentSituation.label}</Label>
                        <Input
                          value={form.currentSituation}
                          onChange={(e) => updateField('currentSituation', e.target.value)}
                          placeholder={f.currentSituation.placeholder}
                          required
                        />
                      </div>
                      {form.formationSlug ? (
                        <div className="space-y-2 md:col-span-2">
                          <Label>{f.session.label}</Label>
                          <Select
                            value={form.sessionChoice}
                            onValueChange={(value) =>
                              setForm((prev) => ({
                                ...prev,
                                sessionChoice: value,
                                sessionLabel:
                                  value === PREINSCRIPTION_SESSION_FLEXIBLE ? prev.sessionLabel : '',
                              }))
                            }
                            disabled={sessionsLoading}
                          >
                            <SelectTrigger>
                              <SelectValue
                                placeholder={
                                  sessionsLoading
                                    ? f.session.loadingPlaceholder
                                    : f.session.placeholder
                                }
                              />
                            </SelectTrigger>
                            <SelectContent
                              {...SHEET_SELECT_CONTENT_PROPS}
                              className={SHEET_SELECT_CONTENT_CLASS}
                            >
                              <SelectItem value={PREINSCRIPTION_SESSION_FLEXIBLE}>
                                {f.session.flexibleOption}
                              </SelectItem>
                              {catalogSessions.map((session) => (
                                <SelectItem
                                  key={session.id}
                                  value={session.id}
                                  disabled={session.isFull || session.registrationClosed}
                                >
                                  {formatCatalogSessionLabel(session)}
                                  {session.isFull ? f.session.fullSuffix : ''}
                                  {session.registrationClosed ? f.session.closedSuffix : ''}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {form.sessionChoice === PREINSCRIPTION_SESSION_FLEXIBLE ? (
                            <Input
                              value={form.sessionLabel}
                              onChange={(e) => updateField('sessionLabel', e.target.value)}
                              placeholder={f.session.flexiblePlaceholder}
                            />
                          ) : null}
                        </div>
                      ) : null}
                      <div className="space-y-2 md:col-span-2">
                        <Label>{f.experience.label}</Label>
                        <Textarea
                          value={form.experience}
                          onChange={(e) => updateField('experience', e.target.value)}
                          rows={3}
                          placeholder={f.experience.placeholder}
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label>{f.motivation.label}</Label>
                        <Textarea
                          value={form.motivation}
                          onChange={(e) => updateField('motivation', e.target.value)}
                          rows={3}
                          placeholder={f.motivation.placeholder}
                        />
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </ScrollArea>
          </SheetBody>

          <SheetFooter className="flex-row flex-wrap justify-end gap-2.5 border-t border-border p-4 pb-4 sm:p-5">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {p.actions.cancel}
            </Button>
            <Button type="submit" variant="primary" disabled={!canSubmit || isSubmitting}>
              {isSubmitting ? p.actions.submitting : p.actions.submit}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
