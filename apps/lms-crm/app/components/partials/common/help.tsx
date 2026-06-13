'use client';

import { toAbsoluteUrl } from '@/lib/helpers';
import { useTranslation } from '@/hooks/useTranslation';
import { generalSettings } from '@/config/general.config';
import { Engage } from './engage';

export type HelpAudience = 'crm' | 'instructor' | 'portal';

type HelpProps = {
  audience?: HelpAudience;
};

function supportLinkFor(audience: HelpAudience) {
  if (audience === 'crm') {
    return { url: '/support-qualite/support/tickets', external: false as const };
  }
  return { url: '/#contact', external: false as const };
}

export function Help({ audience = 'crm' }: HelpProps) {
  const { t } = useTranslation();
  const supportLink = supportLinkFor(audience);

  const questionsDescription =
    audience === 'portal'
      ? t('help.questionsDescriptionPortal')
      : audience === 'instructor'
        ? t('help.questionsDescriptionInstructor')
        : t('help.questionsDescription');

  const supportDescription =
    audience === 'portal'
      ? t('help.supportDescriptionPortal')
      : audience === 'instructor'
        ? t('help.supportDescriptionInstructor')
        : t('help.supportDescription');

  return (
    <div className="grid lg:grid-cols-2 gap-5 lg:gap-7.5">
      <Engage
        title={t('help.questionsTitle')}
        description={questionsDescription}
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
        description={supportDescription}
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
          url: supportLink.url,
          external: supportLink.external,
        }}
      />
    </div>
  );
}
