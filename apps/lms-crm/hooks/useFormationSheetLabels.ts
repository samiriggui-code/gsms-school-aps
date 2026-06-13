import { useTranslation } from '@/hooks/useTranslation';

export function useFormationSheetLabels() {
  const { t } = useTranslation();

  return {
    detailsTitle: (name: string) => t('landing.sheets.detailsTitle', { name }),
    detailsDescription: (name: string) => t('landing.sheets.detailsDescription', { name }),
    active: t('landing.sheets.active'),
    parcours: t('landing.sheets.parcours'),
    type: t('landing.sheets.type'),
    duration: t('landing.sheets.duration'),
    close: t('landing.sheets.close'),
    tabs: {
      overview: t('landing.sheets.tabs.overview'),
      program: t('landing.sheets.tabs.program'),
      prerequisites: t('landing.sheets.tabs.prerequisites'),
      financing: t('landing.sheets.tabs.financing'),
      sessions: t('landing.sheets.tabs.sessions'),
      certification: t('landing.sheets.tabs.certification'),
    },
  };
}
