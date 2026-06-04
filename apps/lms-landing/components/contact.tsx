'use client';

import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Mail, Phone, MapPin, type LucideIcon } from 'lucide-react';
import { toast } from 'sonner';
import { CustomBadge } from '@/components/custom/badge';
import { CustomSubtitle } from '@/components/custom/subtitle';
import { CustomTitle } from '@/components/custom/title';
import Link from 'next/link';
import { MOBILE_FORM_FIELD_CLASS } from '@/lib/mobile-form';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';

function ContactFormSkeleton({ label }: { label: string }) {
  return (
    <Card className="border-border/50">
      <CardContent className="p-5 sm:p-8 space-y-6" aria-busy="true" aria-label={label}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-16 rounded-md bg-muted/40 animate-pulse" />
          <div className="h-16 rounded-md bg-muted/40 animate-pulse" />
        </div>
        <div className="h-16 rounded-md bg-muted/40 animate-pulse" />
        <div className="h-28 rounded-md bg-muted/40 animate-pulse" />
        <div className="h-12 rounded-md bg-muted/40 animate-pulse" />
      </CardContent>
    </Card>
  );
}

function ContactFormPanel() {
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formSchema = useMemo(
    () =>
      z.object({
        name: z.string().min(2, t('landing.contact.validation.nameMin')),
        email: z.string().email(t('landing.contact.validation.emailInvalid')),
        subject: z.string().min(5, t('landing.contact.validation.subjectMin')),
        message: z.string().min(10, t('landing.contact.validation.messageMin')),
        _trap: z.string().optional(),
      }),
    [t],
  );

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    defaultValues: { name: '', email: '', subject: '', message: '', _trap: '' },
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const data = (await res.json().catch(() => ({}))) as { message?: string };
      if (!res.ok) {
        toast.error(typeof data.message === 'string' ? data.message : t('landing.contact.toasts.errorGeneric'));
        return;
      }
      toast.success(t('landing.contact.toasts.success'));
      form.reset({ name: '', email: '', subject: '', message: '', _trap: '' });
    } catch {
      toast.error(t('landing.contact.toasts.errorNetwork'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!mounted) {
    return <ContactFormSkeleton label={t('landing.contact.form.loadingLabel')} />;
  }

  return (
    <Card className="border-border/50">
      <CardContent className="p-5 sm:p-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" autoComplete="on">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('landing.contact.form.name.label')}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t('landing.contact.form.name.placeholder')}
                        autoComplete="name"
                        className={MOBILE_FORM_FIELD_CLASS}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('landing.contact.form.email.label')}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t('landing.contact.form.email.placeholder')}
                        type="email"
                        inputMode="email"
                        autoComplete="email"
                        className={MOBILE_FORM_FIELD_CLASS}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('landing.contact.form.subject.label')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('landing.contact.form.subject.placeholder')}
                      autoComplete="off"
                      className={MOBILE_FORM_FIELD_CLASS}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('landing.contact.form.message.label')}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t('landing.contact.form.message.placeholder')}
                      rows={5}
                      enterKeyHint="done"
                      autoComplete="off"
                      className={cn(MOBILE_FORM_FIELD_CLASS, 'min-h-[7.5rem] resize-none')}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="_trap"
              render={({ field }) => (
                <FormItem className="absolute -left-[9999px] h-0 w-0 overflow-hidden p-0 opacity-0" aria-hidden>
                  <FormLabel>{t('landing.contact.form.honeypot.label')}</FormLabel>
                  <FormControl>
                    <Input tabIndex={-1} autoComplete="off" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <Button size="lg" type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? t('landing.contact.form.submitting') : t('landing.contact.form.submit')}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

const Contact = () => {
  const { t } = useTranslation();

  const contactInfo: { icon: LucideIcon; key: 'email' | 'phone' | 'address'; href?: string }[] = [
    { icon: Mail, key: 'email', href: 'mailto:contact-formssi@gmail.com' },
    { icon: Phone, key: 'phone', href: 'tel:+33171113963' },
    { icon: MapPin, key: 'address' },
  ];

  return (
    <section id="contact" className="py-24 bg-zinc-50 dark:bg-zinc-950 border-b border-border/50">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="flex items-center justify-center flex-col text-center gap-5 mb-25"
        >
          <CustomBadge>{t('landing.contact.badge')}</CustomBadge>
          <CustomTitle>{t('landing.contact.title')}</CustomTitle>
          <CustomSubtitle>{t('landing.contact.subtitle')}</CustomSubtitle>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <div>
              <h3 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-gray-100">
                {t('landing.contact.sideTitle')}
              </h3>
              <p className="text-muted-foreground mb-8">{t('landing.contact.sideDescription')}</p>
            </div>
            <div className="space-y-6">
              {contactInfo.map((info, index) => (
                <motion.div
                  key={info.key}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="flex items-start gap-4"
                >
                  <info.icon className="size-4 text-muted-foreground mt-1" />
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">
                      {t(`landing.contact.info.${info.key}.title`)}
                    </h4>
                    {info.href ? (
                      <Link
                        href={info.href}
                        className="text-muted-foreground hover:text-purple-500 whitespace-pre-line"
                      >
                        {t(`landing.contact.info.${info.key}.content`)}
                      </Link>
                    ) : (
                      <p className="text-muted-foreground whitespace-pre-line">
                        {t(`landing.contact.info.${info.key}.content`)}
                      </p>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
          <div className="w-full">
            <ContactFormPanel />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
