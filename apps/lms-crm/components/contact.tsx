'use client';

import { useCallback, useId, useState, type ReactNode } from 'react';
import { Mail, MapPin, Phone, type LucideIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@repo/ui/button';
import { Input } from '@repo/ui/input';
import { Textarea } from '@repo/ui/textarea';
import { CustomBadge } from '@/components/custom/badge';
import { CustomSubtitle } from '@/components/custom/subtitle';
import { CustomTitle } from '@/components/custom/title';
import { useTranslation } from '@/hooks/useTranslation';
import { cn } from '@/lib/utils';

/** 16px min on mobile — évite le zoom automatique iOS Safari */
const FIELD_CLASS =
  'text-base touch-manipulation min-h-12 md:min-h-10 md:text-[0.8125rem]';

type FormState = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

type FieldErrors = Partial<Record<keyof FormState, string>>;

const EMPTY_FORM: FormState = { name: '', email: '', subject: '', message: '' };

function validateForm(values: FormState, t: (key: string) => string): FieldErrors {
  const errors: FieldErrors = {};
  if (values.name.trim().length < 2) {
    errors.name = t('landing.contact.validation.nameMin');
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
    errors.email = t('landing.contact.validation.emailInvalid');
  }
  if (values.subject.trim().length < 5) {
    errors.subject = t('landing.contact.validation.subjectMin');
  }
  if (values.message.trim().length < 10) {
    errors.message = t('landing.contact.validation.messageMin');
  }
  return errors;
}

function ContactField({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function ContactForm() {
  const { t } = useTranslation();
  const formId = useId();
  const trapId = `${formId}-trap`;
  const [values, setValues] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [trap, setTrap] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [banner, setBanner] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const setField =
    (key: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setValues((prev) => ({ ...prev, [key]: e.target.value }));
      setErrors((prev) => {
        if (!prev[key]) return prev;
        const next = { ...prev };
        delete next[key];
        return next;
      });
      if (banner) setBanner(null);
    };

  const onSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setBanner(null);

      if (trap.trim()) {
        return;
      }

      const nextErrors = validateForm(values, t);
      if (Object.keys(nextErrors).length > 0) {
        setErrors(nextErrors);
        return;
      }

      setIsSubmitting(true);
      try {
        const res = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: values.name.trim(),
            email: values.email.trim(),
            subject: values.subject.trim(),
            message: values.message.trim(),
            _trap: trap,
          }),
        });
        const data = (await res.json().catch(() => ({}))) as { message?: string };

        if (!res.ok) {
          const msg =
            typeof data.message === 'string'
              ? data.message
              : t('landing.contact.toasts.errorGeneric');
          setBanner({ type: 'error', text: msg });
          toast.error(msg);
          return;
        }

        const successMsg = t('landing.contact.toasts.success');
        setBanner({ type: 'success', text: successMsg });
        toast.success(successMsg);
        setValues(EMPTY_FORM);
        setTrap('');
        setErrors({});
      } catch {
        const msg = t('landing.contact.toasts.errorNetwork');
        setBanner({ type: 'error', text: msg });
        toast.error(msg);
      } finally {
        setIsSubmitting(false);
      }
    },
    [t, trap, values],
  );

  return (
    <div className="rounded-xl border border-border/60 bg-background p-5 sm:p-8 shadow-sm">
      {banner ? (
        <div
          role="status"
          className={cn(
            'mb-6 rounded-lg border px-4 py-3 text-sm',
            banner.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-100'
              : 'border-destructive/30 bg-destructive/5 text-destructive',
          )}
        >
          {banner.text}
        </div>
      ) : null}

      <form
        id={formId}
        onSubmit={onSubmit}
        className="space-y-5"
        autoComplete="on"
        noValidate
      >
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <ContactField
            id={`${formId}-name`}
            label={t('landing.contact.form.name.label')}
            error={errors.name}
          >
            <Input
              id={`${formId}-name`}
              name="name"
              variant="lg"
              autoComplete="name"
              enterKeyHint="next"
              placeholder={t('landing.contact.form.name.placeholder')}
              className={FIELD_CLASS}
              value={values.name}
              onChange={setField('name')}
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? `${formId}-name-error` : undefined}
            />
          </ContactField>

          <ContactField
            id={`${formId}-email`}
            label={t('landing.contact.form.email.label')}
            error={errors.email}
          >
            <Input
              id={`${formId}-email`}
              name="email"
              type="email"
              variant="lg"
              inputMode="email"
              autoComplete="email"
              enterKeyHint="next"
              placeholder={t('landing.contact.form.email.placeholder')}
              className={FIELD_CLASS}
              value={values.email}
              onChange={setField('email')}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? `${formId}-email-error` : undefined}
            />
          </ContactField>
        </div>

        <ContactField
          id={`${formId}-subject`}
          label={t('landing.contact.form.subject.label')}
          error={errors.subject}
        >
          <Input
            id={`${formId}-subject`}
            name="subject"
            variant="lg"
            autoComplete="off"
            enterKeyHint="next"
            placeholder={t('landing.contact.form.subject.placeholder')}
            className={FIELD_CLASS}
            value={values.subject}
            onChange={setField('subject')}
            aria-invalid={Boolean(errors.subject)}
          />
        </ContactField>

        <ContactField
          id={`${formId}-message`}
          label={t('landing.contact.form.message.label')}
          error={errors.message}
        >
          <Textarea
            id={`${formId}-message`}
            name="message"
            variant="lg"
            rows={5}
            enterKeyHint="done"
            autoComplete="off"
            placeholder={t('landing.contact.form.message.placeholder')}
            className={cn(FIELD_CLASS, 'min-h-[8rem] resize-y')}
            value={values.message}
            onChange={setField('message')}
            aria-invalid={Boolean(errors.message)}
          />
        </ContactField>

        {/* Honeypot — hidden natif (plus fiable que position absolute sur iOS) */}
        <input
          id={trapId}
          name="_trap"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={trap}
          onChange={(e) => setTrap(e.target.value)}
          className="hidden"
          aria-hidden
        />

        <Button
          type="submit"
          size="lg"
          className="h-12 w-full touch-manipulation text-base md:h-10 md:text-sm"
          disabled={isSubmitting}
        >
          {isSubmitting ? t('landing.contact.form.submitting') : t('landing.contact.form.submit')}
        </Button>
      </form>
    </div>
  );
}

const CONTACT_LINKS: {
  icon: LucideIcon;
  key: 'email' | 'phone' | 'address';
  href?: string;
}[] = [
  { icon: Mail, key: 'email', href: 'mailto:contact-formssi@gmail.com' },
  { icon: Phone, key: 'phone', href: 'tel:+33171113963' },
  { icon: MapPin, key: 'address' },
];

const Contact = () => {
  const { t } = useTranslation();

  return (
    <section
      id="contact"
      className="scroll-mt-24 overflow-x-clip border-b border-border/50 bg-zinc-50 py-16 sm:py-24 dark:bg-zinc-950"
    >
      <div className="container mx-auto px-4 sm:px-6">
        <header className="mb-12 flex flex-col items-center gap-4 text-center sm:mb-16">
          <CustomBadge>{t('landing.contact.badge')}</CustomBadge>
          <CustomTitle>{t('landing.contact.title')}</CustomTitle>
          <CustomSubtitle>{t('landing.contact.subtitle')}</CustomSubtitle>
        </header>

        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-12">
          <div className="space-y-8">
            <div>
              <h3 className="mb-4 text-xl font-semibold text-foreground sm:text-2xl">
                {t('landing.contact.sideTitle')}
              </h3>
              <p className="text-muted-foreground text-pretty">
                {t('landing.contact.sideDescription')}
              </p>
            </div>

            <ul className="space-y-6">
              {CONTACT_LINKS.map(({ icon: Icon, key, href }) => (
                <li key={key} className="flex gap-4">
                  <Icon className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-hidden />
                  <div className="min-w-0">
                    <p className="mb-1 font-semibold text-foreground">
                      {t(`landing.contact.info.${key}.title`)}
                    </p>
                    {href ? (
                      <a
                        href={href}
                        className="text-muted-foreground hover:text-primary break-words whitespace-pre-line underline-offset-4 hover:underline"
                      >
                        {t(`landing.contact.info.${key}.content`)}
                      </a>
                    ) : (
                      <p className="text-muted-foreground whitespace-pre-line text-pretty">
                        {t(`landing.contact.info.${key}.content`)}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <ContactForm />
        </div>
      </div>
    </section>
  );
};

export default Contact;
