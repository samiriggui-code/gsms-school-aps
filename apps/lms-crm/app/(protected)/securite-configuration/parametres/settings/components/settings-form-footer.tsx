'use client';

import { LoaderCircleIcon } from 'lucide-react';
import { Button } from '@repo/ui/button';
import { useTranslation } from '@/hooks/useTranslation';

type Props = {
  onReset: () => void;
  isDirty: boolean;
  isSaving: boolean;
};

export function SettingsFormFooter({ onReset, isDirty, isSaving }: Props) {
  const { t } = useTranslation();

  return (
    <div className="flex justify-end gap-2.5 pt-2.5">
      <Button type="button" variant="outline" onClick={onReset}>
        {t('pages.settings.common.reset')}
      </Button>
      <Button type="submit" disabled={!isDirty || isSaving}>
        {isSaving && <LoaderCircleIcon className="animate-spin" />}
        {t('pages.settings.common.save')}
      </Button>
    </div>
  );
}
