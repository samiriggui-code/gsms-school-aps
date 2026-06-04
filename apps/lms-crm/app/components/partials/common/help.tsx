'use client';

import { toAbsoluteUrl } from '@/lib/helpers';
import { useTranslation } from '@/hooks/useTranslation';
import { generalSettings } from '@/config/general.config';
import { Engage } from './engage';

export function Help() {
  const { t } = useTranslation();

  return (
    <div className="grid lg:grid-cols-2 gap-5 lg:gap-7.5">
      <Engage
        title={t('help.questionsTitle')}
        description={t('help.questionsDescription')}
        image={
          <>
            <img
              src={toAbsoluteUrl('/media/illustrations/2.svg')}
              className="dark:hidden max-h-[150px]"
              alt={t('help.imageAlt')}
            />
            <img
              src={toAbsoluteUrl('/media/illustrations/2-dark.svg')}
              className="light:hidden max-h-[150px]"
              alt={t('help.imageAlt')}
            />
          </>
        }
        more={{
          title: t('help.questionsCta'),
          url: generalSettings.docsHelpCatalogLink,
          external: true,
        }}
      />
      <Engage
        title={t('help.supportTitle')}
        description={t('help.supportDescription')}
        image={
          <>
            <img
              src={toAbsoluteUrl('/media/illustrations/4.svg')}
              className="dark:hidden max-h-[150px]"
              alt={t('help.imageAlt')}
            />
            <img
              src={toAbsoluteUrl('/media/illustrations/4-dark.svg')}
              className="light:hidden max-h-[150px]"
              alt={t('help.imageAlt')}
            />
          </>
        }
        more={{
          title: t('help.supportCta'),
          url: '/support-qualite/support/tickets',
        }}
      />
    </div>
  );
}
