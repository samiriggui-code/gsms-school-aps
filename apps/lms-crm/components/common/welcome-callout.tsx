'use client';

import { Fragment } from 'react';
import Link from 'next/link';
import { toAbsoluteUrl } from '@/lib/helpers';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Shield, ArrowRight, Building2, User } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useAppContext } from '@/lib/app-context';
import { AvatarGroup } from '@/components/avatar-group';
import { useTranslation } from '@/hooks/useTranslation';
import { getDateFnsLocale } from '@/i18n/date-locale';
import { format } from 'date-fns';

interface IWelcomeCalloutProps {
  className?: string;
}

const WelcomeCallout = ({ className }: IWelcomeCalloutProps) => {
  const { t, i18n } = useTranslation();
  const { data: session } = useSession();
  const { company: tenant, currentUser: tenantUser } = useAppContext();
  const dateLocale = getDateFnsLocale(i18n.language);

  const formatLastLogin = () => {
    const lastLogin = (session?.user as { lastLoginAt?: string })?.lastLoginAt;
    if (!lastLogin) return t('welcome.firstLogin');

    const date = new Date(lastLogin);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
      return t('welcome.todayAt', {
        time: format(date, 'HH:mm', { locale: dateLocale }),
      });
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

      <Card className={`h-full min-w-0 w-full overflow-hidden ${className}`}>
        <CardContent className="p-8 sm:p-10 bg-cover bg-center bg-no-repeat welcome-callout-bg">
          <div className="flex min-w-0 flex-col justify-center gap-4 max-w-full sm:max-w-[60%]">
            <div className="flex min-w-0 flex-wrap items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900">
                <Shield className="size-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <AvatarGroup
                size="size-10"
                group={[
                  { filename: '300-1.png' },
                  { filename: '300-2.png' },
                  { filename: '300-3.png' },
                  {
                    fallback: '+12',
                    variant: 'text-white text-xs ring-background bg-primary'
                  }
                ]}
              />
              {tenant && (
                <div className="flex min-w-0 max-w-full shrink items-center gap-2 px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full">
                  <Building2 className="size-4 shrink-0 text-gray-600 dark:text-gray-400" />
                  <span className="truncate text-sm font-medium text-gray-700 dark:text-gray-300">
                    {tenant.name}
                  </span>
                </div>
              )}
            </div>
            
            <div className="flex flex-col gap-2">
              <h2 className="text-xl font-semibold text-mono">
                {t('welcome.greeting')}{' '}
                {(tenantUser?.firstName || tenantUser?.lastName) ? (
                  <>
                    <span className="text-indigo-600">{[tenantUser.firstName, tenantUser.lastName].filter(Boolean).join(' ')}</span>
                    <br />
                  </>
                ) : ''}
                {t('welcome.onPlatform')}{' '}
                <span className="text-indigo-600">{tenant?.name || 'LMS'}</span>
              </h2>
              
              {tenantUser?.UserRole && (
                <div className="flex items-center gap-2 mb-2">
                  <User className="size-4 text-gray-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {tenantUser.UserRole.name}
                  </span>
                  {tenant?.billingPlan && (
                    <>
                      <span className="text-gray-400">•</span>
                      <span className="text-sm font-medium text-indigo-600">
                        {t('welcome.plan', { plan: tenant.billingPlan })}
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>
            
            <p className="text-sm font-normal text-secondary-foreground leading-5.5">
              {t('welcome.description')}
            </p>
          </div>
        </CardContent>
        <CardFooter className="justify-between">
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">{t('welcome.lastLogin')}</span>
            <span className="text-sm font-medium">{formatLastLogin()}</span>
          </div>
          <Button mode="link" underlined="dashed" asChild className="group">
            <Link href="/" className="flex items-center gap-2">
              {t('welcome.getStarted')}
              <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </Fragment>
  );
};

export { WelcomeCallout, type IWelcomeCalloutProps };
