'use client';

import { useTranslation as useI18nextTranslation } from 'react-i18next';

export const useTranslation = (namespace?: string) => {
  return useI18nextTranslation(namespace);
};

export const useTypedTranslation = () => {
  const { t, i18n } = useI18nextTranslation();

  return {
    t,
    i18n,
    tButton: (key: string) => t(`common.buttons.${key}`),
    tLabel: (key: string) => t(`common.labels.${key}`),
    tMessage: (key: string) => t(`common.messages.${key}`),
    tNav: (key: string) => t(`navigation.${key}`),
  };
};

export default useTranslation;
