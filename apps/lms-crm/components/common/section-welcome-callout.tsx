'use client';

import { Fragment, type ReactNode } from 'react';
import Link from 'next/link';
import { toAbsoluteUrl } from '@/lib/helpers';
import { Button } from '@repo/ui/button';
import { Card, CardContent, CardFooter } from '@repo/ui/card';
import { Shield, ArrowRight, Building2, User } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { format } from 'date-fns';
import { useAppContext } from '@/lib/app-context';
import { AvatarGroup } from '@/components/avatar-group';
import { useTranslation } from '@/hooks/useTranslation';
import { getDateFnsLocale } from '@/i18n/date-locale';
import { translateMenuTitle } from '@/lib/menu-i18n';

type Props = {
  className?: string;
  /** Route du menu pour le lien titre (ex. /gestion-ressources). */
  sectionPath: string;
  /** Clé i18n du paragraphe (sections.{id}.welcomeDescription). */
  descriptionKey: string;
  /** Lien du bouton Commencer. */
  ctaHref?: string;
  footerExtra?: ReactNode;
};

export function SectionWelcomeCallout({
  className,
  sectionPath,
  descriptionKey,
  ctaHref,
  footerExtra,
}: Props) {
  const { t, i18n } = useTranslation();
  const { data: session } = useSession();
  const { company: tenant, currentUser: tenantUser } = useAppContext();
  const dateLocale = getDateFnsLocale(i18n.language);
  const sectionTitle = translateMenuTitle({ path: sectionPath, title: '' }, t);
  const href = ctaHref ?? sectionPath;

  const formatLastLogin = () => {
    const lastLogin = (session?.user as { lastLoginAt?: string })?.lastLoginAt;
    if (!lastLogin) return t('welcome.never');
    const date = new Date(lastLogin);
    const now = new Date();
    if (date.toDateString() === now.toDateString()) {
      return t('welcome.todayAt', { time: format(date, 'HH:mm', { locale: dateLocale }) });
    }
    return format(date, 'PPp', { locale: dateLocale });
  };

  return (
    <Fragment>
      <style>
        {`
          .welcome-callout-bg {
            background-image: url('${toAbsoluteUrl('/media/images/2600x1600/bg-2.png')}');
          }
          .dark .welcome-callout-bg {
            background-image: url('${toAbsoluteUrl('/media/images/2600x1600/bg-2-dark.png')}');
          }
        `}
      </style>

      <Card className={`h-full min-w-0 w-full overflow-hidden ${className ?? ''}`}>
        <CardContent className="p-8 sm:p-10 bg-cover bg-center bg-no-repeat welcome-callout-bg">
          <div className="flex min-w-0 flex-col justify-center gap-4 max-w-full sm:max-w-[60%]">
            <div className="flex min-w-0 flex-wrap items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Shield className="size-6 text-primary" />
              </div>
              <AvatarGroup
                size="size-10"
                group={[
                  { filename: '300-1.png' },
                  { filename: '300-2.png' },
                  { filename: '300-3.png' },
                  {
                    fallback: '+12',
                    variant: 'text-white text-xs ring-background bg-primary',
                  },
                ]}
              />
              {tenant ? (
                <div className="flex min-w-0 max-w-full shrink items-center gap-2 px-3 py-1 bg-muted rounded-full">
                  <Building2 className="size-4 shrink-0 text-muted-foreground" />
                  <span className="truncate text-sm font-medium text-foreground">{tenant.name}</span>
                </div>
              ) : null}
            </div>

            <div className="flex flex-col gap-2">
              <h2 className="text-xl font-semibold text-mono">
                {t('welcome.greeting')}{' '}
                {tenantUser?.firstName || tenantUser?.lastName ? (
                  <>
                    <span className="text-primary">
                      {[tenantUser.firstName, tenantUser.lastName].filter(Boolean).join(' ')}
                    </span>
                    <br />
                  </>
                ) : null}
                {t('welcome.onPlatform')}{' '}
                <Button mode="link" asChild className="text-xl font-semibold text-primary hover:text-primary/80">
                  <Link href={sectionPath}>{sectionTitle}</Link>
                </Button>
              </h2>

              {tenantUser?.UserRole ? (
                <div className="flex items-center gap-2 mb-2">
                  <User className="size-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{tenantUser.UserRole.name}</span>
                  {tenant?.billingPlan ? (
                    <>
                      <span className="text-muted-foreground/40">•</span>
                      <span className="text-sm font-medium text-primary">
                        {t('welcome.plan', { plan: tenant.billingPlan })}
                      </span>
                    </>
                  ) : null}
                </div>
              ) : null}
            </div>

            <p className="text-sm font-normal text-secondary-foreground leading-5.5">{t(descriptionKey)}</p>
          </div>
        </CardContent>
        <CardFooter className="justify-between">
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">{t('welcome.lastLogin')}</span>
            <span className="text-sm font-medium">{formatLastLogin()}</span>
          </div>
          <div className="flex items-center gap-3">
            {footerExtra}
            <Button mode="link" underlined="dashed" asChild className="group">
              <Link href={href} className="flex items-center gap-2">
                {t('welcome.getStarted')}
                <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>
        </CardFooter>
      </Card>
    </Fragment>
  );
}
