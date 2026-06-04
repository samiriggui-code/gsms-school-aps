'use client';

import { toAbsoluteUrl } from '@/lib/helpers';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';

/**
 * Overlay Metronic (logo + libellé) pendant chargement session ou navigation.
 */
export function RouteTransitionLoader({ className }: { className?: string }) {
  const { t } = useTranslation();

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={cn(
        'fixed inset-0 z-[100] flex flex-col items-center justify-center gap-3',
        'bg-background/85 backdrop-blur-[2px]',
        className,
      )}
    >
      <img
        className="h-8 w-auto max-w-none animate-pulse"
        src={toAbsoluteUrl('/brand/formssi-icon.png')}
        alt="FORM'SSI"
      />
      <p className="text-sm font-medium text-muted-foreground">{t('layout.loading')}</p>
    </div>
  );
}
