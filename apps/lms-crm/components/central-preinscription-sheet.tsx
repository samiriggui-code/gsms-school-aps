'use client';

import { type ComponentProps, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Badge, BadgeDot } from '@/components/ui/badge';
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
import { useTranslation } from '@/hooks/useTranslation';
import { preinscriptionMessages } from '@/i18n/landing-content/preinscription';

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
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  birthDate: string;
  birthPlace: string;
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
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  birthDate: '',
  birthPlace: '',
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

function fundingLabelForCrm(key: FundingKey): string {
  return preinscriptionMessages.fr.landing.preinscription.funding[key];
}

export function CentralPreinscriptionSheet({
  open,
  onOpenChange,
}: CentralPreinscriptionSheetProps) {
  const { t } = useTranslation();
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

  const canSubmit = useMemo(() => {
    const requiredIdentity =
      form.firstName.trim() &&
      form.lastName.trim() &&
      form.email.trim() &&
      form.phone.trim() &&
      form.birthDate.trim() &&
      form.birthPlace.trim() &&
      form.nationality.trim();

    const requiredDossier =
      form.address.trim() &&
      form.postalCode.trim() &&
      form.city.trim() &&
      form.formationSlug.trim() &&
      form.fundingMode.trim() &&
      form.currentSituation.trim();

    const allComplianceChecked = Object.values(compliance).every(Boolean);

    return Boolean(requiredIdentity && requiredDossier && allComplianceChecked);
  }, [form, compliance]);

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
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          phone: form.phone,
          birthDate: form.birthDate,
          birthPlace: form.birthPlace,
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
        throw new Error(json.message ?? t('landing.preinscription.toasts.saveFailed'));
      }

      toast.success(t('landing.preinscription.toasts.success'));
      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t('landing.preinscription.toasts.errorGeneric'),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="gap-0 w-[calc(100vw-1rem)] max-w-[calc(100vw-1rem)] sm:w-[calc(100vw-2rem)] sm:max-w-[calc(100vw-2rem)] lg:w-[1160px] inset-2 sm:inset-5 border start-auto h-[calc(100dvh-1rem)] sm:h-auto max-h-[calc(100dvh-1rem)] sm:max-h-[calc(100dvh-2rem)] rounded-lg p-0 [&_[data-slot=sheet-close]]:top-3 sm:[&_[data-slot=sheet-close]]:top-4.5 [&_[data-slot=sheet-close]]:end-3 sm:[&_[data-slot=sheet-close]]:end-5">
        <SheetHeader className="border-b border-border px-5 py-3.5">
          <SheetTitle className="font-medium">{t('landing.preinscription.sheetTitle')}</SheetTitle>
          <SheetDescription className="sr-only">{t('landing.preinscription.sheetDescription')}</SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <SheetBody className="grow p-0">
            <div className="flex flex-wrap justify-between gap-2 border-b border-border px-5 py-4">
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="text-[22px] font-semibold leading-none text-foreground lg:text-[22px]">
                    {t('landing.preinscription.formTitle')}
                  </span>
                  <Badge size="sm" variant="warning" appearance="light">
                    {t('landing.preinscription.verificationBadge')}
                  </Badge>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-2sm">
                  <span className="font-normal text-muted-foreground">{t('landing.preinscription.pathwayLabel')}</span>
                  <span className="font-medium text-foreground">{t('landing.preinscription.pathwayValue')}</span>
                  <BadgeDot className="size-1 bg-muted-foreground" />
                  <span className="font-normal text-muted-foreground">{t('landing.preinscription.channelLabel')}</span>
                  <span className="font-medium text-foreground">{t('landing.preinscription.channelValue')}</span>
                </div>
              </div>
            </div>

            <ScrollArea
              className="flex h-[calc(100dvh-13.8rem)] flex-col sm:h-[calc(100dvh-15.8rem)] mx-1.5"
              viewportClassName="[&>div]:h-full [&>div>div]:h-full"
            >
              <div className="px-3.5 py-5">
                <Tabs defaultValue="profile" className="w-auto text-sm text-muted-foreground">
                  <TabsList className="mb-2.5 inline-flex h-auto w-auto max-w-full grow-0 flex-wrap gap-y-1">
                    <TabsTrigger value="profile">{t('landing.preinscription.tabs.profile')}</TabsTrigger>
                    <TabsTrigger value="compliance">{t('landing.preinscription.tabs.compliance')}</TabsTrigger>
                    <TabsTrigger value="project">{t('landing.preinscription.tabs.project')}</TabsTrigger>
                  </TabsList>

                  <TabsContent value="profile">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>{t('landing.preinscription.fields.firstName.label')}</Label>
                        <Input
                          value={form.firstName}
                          onChange={(e) => updateField('firstName', e.target.value)}
                          placeholder={t('landing.preinscription.fields.firstName.placeholder')}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t('landing.preinscription.fields.lastName.label')}</Label>
                        <Input
                          value={form.lastName}
                          onChange={(e) => updateField('lastName', e.target.value)}
                          placeholder={t('landing.preinscription.fields.lastName.placeholder')}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t('landing.preinscription.fields.email.label')}</Label>
                        <Input
                          type="email"
                          value={form.email}
                          onChange={(e) => updateField('email', e.target.value)}
                          placeholder={t('landing.preinscription.fields.email.placeholder')}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t('landing.preinscription.fields.phone.label')}</Label>
                        <Input
                          value={form.phone}
                          onChange={(e) => updateField('phone', e.target.value)}
                          placeholder={t('landing.preinscription.fields.phone.placeholder')}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t('landing.preinscription.fields.birthDate.label')}</Label>
                        <Input
                          type="date"
                          value={form.birthDate}
                          onChange={(e) => updateField('birthDate', e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t('landing.preinscription.fields.birthPlace.label')}</Label>
                        <Input
                          value={form.birthPlace}
                          onChange={(e) => updateField('birthPlace', e.target.value)}
                          placeholder={t('landing.preinscription.fields.birthPlace.placeholder')}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t('landing.preinscription.fields.nationality.label')}</Label>
                        <Input
                          value={form.nationality}
                          onChange={(e) => updateField('nationality', e.target.value)}
                          placeholder={t('landing.preinscription.fields.nationality.placeholder')}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t('landing.preinscription.fields.currentSituation.label')}</Label>
                        <Input
                          value={form.currentSituation}
                          onChange={(e) => updateField('currentSituation', e.target.value)}
                          placeholder={t('landing.preinscription.fields.currentSituation.placeholder')}
                          required
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label>{t('landing.preinscription.fields.address.label')}</Label>
                        <Input
                          value={form.address}
                          onChange={(e) => updateField('address', e.target.value)}
                          placeholder={t('landing.preinscription.fields.address.placeholder')}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t('landing.preinscription.fields.postalCode.label')}</Label>
                        <Input
                          value={form.postalCode}
                          onChange={(e) => updateField('postalCode', e.target.value)}
                          placeholder={t('landing.preinscription.fields.postalCode.placeholder')}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t('landing.preinscription.fields.city.label')}</Label>
                        <Input
                          value={form.city}
                          onChange={(e) => updateField('city', e.target.value)}
                          placeholder={t('landing.preinscription.fields.city.placeholder')}
                          required
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="compliance">
                    <div className="space-y-4 rounded-md border border-border bg-accent/20 p-4">
                      <p className="text-sm text-muted-foreground">{t('landing.preinscription.compliance.intro')}</p>
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
                            {t('landing.preinscription.compliance.hasValidIdentityDocument')}
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
                            {t('landing.preinscription.compliance.hasNoIncompatibleConviction')}
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
                            {t('landing.preinscription.compliance.meetsFormationPrerequisites')}
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
                            {t('landing.preinscription.compliance.acceptsInternalRules')}
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
                            {t('landing.preinscription.compliance.acknowledgesCnapsHandledBySchool')}
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
                            {t('landing.preinscription.compliance.certifiesInformationAccuracy')}
                          </Label>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="project">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="space-y-2 md:col-span-2">
                        <Label>{t('landing.preinscription.fields.formation.label')}</Label>
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
                            <SelectValue placeholder={t('landing.preinscription.fields.formation.placeholder')} />
                          </SelectTrigger>
                          <SelectContent
                            {...SHEET_SELECT_CONTENT_PROPS}
                            className={SHEET_SELECT_CONTENT_CLASS}
                          >
                            {PREINSCRIPTION_FORMATION_OPTIONS.map((option) => (
                              <SelectItem key={option.slug} value={option.slug}>
                                {t(`landing.pricing.formations.${option.slug}.name`, { defaultValue: option.label })}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label>{t('landing.preinscription.fields.funding.label')}</Label>
                        <Select
                          value={form.fundingMode}
                          onValueChange={(value) => updateField('fundingMode', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={t('landing.preinscription.fields.funding.placeholder')} />
                          </SelectTrigger>
                          <SelectContent
                            {...SHEET_SELECT_CONTENT_PROPS}
                            className={SHEET_SELECT_CONTENT_CLASS}
                          >
                            {FUNDING_OPTION_KEYS.map((key) => (
                              <SelectItem key={key} value={fundingLabelForCrm(key)}>
                                {t(`landing.preinscription.funding.${key}`)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          {t('landing.preinscription.fields.funding.hint')}
                        </p>
                      </div>
                      {form.formationSlug ? (
                        <div className="space-y-2 md:col-span-2">
                          <Label>{t('landing.preinscription.fields.session.label')}</Label>
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
                                    ? t('landing.preinscription.fields.session.loadingPlaceholder')
                                    : t('landing.preinscription.fields.session.placeholder')
                                }
                              />
                            </SelectTrigger>
                            <SelectContent
                              {...SHEET_SELECT_CONTENT_PROPS}
                              className={SHEET_SELECT_CONTENT_CLASS}
                            >
                              <SelectItem value={PREINSCRIPTION_SESSION_FLEXIBLE}>
                                {t('landing.preinscription.fields.session.flexibleOption')}
                              </SelectItem>
                              {catalogSessions.map((session) => (
                                <SelectItem
                                  key={session.id}
                                  value={session.id}
                                  disabled={session.isFull || session.registrationClosed}
                                >
                                  {formatCatalogSessionLabel(session)}
                                  {session.isFull ? t('landing.preinscription.fields.session.fullSuffix') : ''}
                                  {session.registrationClosed
                                    ? t('landing.preinscription.fields.session.closedSuffix')
                                    : ''}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {form.sessionChoice === PREINSCRIPTION_SESSION_FLEXIBLE ? (
                            <Input
                              value={form.sessionLabel}
                              onChange={(e) => updateField('sessionLabel', e.target.value)}
                              placeholder={t('landing.preinscription.fields.session.flexiblePlaceholder')}
                            />
                          ) : null}
                          {!sessionsLoading && catalogSessions.length === 0 ? (
                            <p className="text-xs text-muted-foreground">
                              {t('landing.preinscription.fields.session.noSessionsHint')}
                            </p>
                          ) : null}
                        </div>
                      ) : null}
                      <div className="space-y-2 md:col-span-2">
                        <Label>{t('landing.preinscription.fields.experience.label')}</Label>
                        <Textarea
                          value={form.experience}
                          onChange={(e) => updateField('experience', e.target.value)}
                          rows={4}
                          placeholder={t('landing.preinscription.fields.experience.placeholder')}
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label>{t('landing.preinscription.fields.motivation.label')}</Label>
                        <Textarea
                          value={form.motivation}
                          onChange={(e) => updateField('motivation', e.target.value)}
                          rows={4}
                          placeholder={t('landing.preinscription.fields.motivation.placeholder')}
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
              {t('landing.preinscription.actions.cancel')}
            </Button>
            <Button type="submit" variant="primary" disabled={!canSubmit || isSubmitting}>
              {isSubmitting ? t('landing.preinscription.actions.submitting') : t('landing.preinscription.actions.submit')}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
