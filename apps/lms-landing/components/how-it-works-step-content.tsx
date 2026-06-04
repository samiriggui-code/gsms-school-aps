'use client';

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';

export type HowItWorksStepId = 1 | 2 | 4 | 5;

type HowItWorksStepContentProps = {
  stepId: HowItWorksStepId;
  title: string;
  className?: string;
};

export function HowItWorksStepContent({ stepId, title, className }: HowItWorksStepContentProps) {
  const { t } = useTranslation();
  const base = `landing.howItWorks.steps.${stepId}`;
  const bullets = t(`${base}.bullets`, { returnObjects: true }) as string[] | string;
  const bulletList = Array.isArray(bullets) ? bullets : [];
  const footer = t(`${base}.footer`, { defaultValue: '' });

  return (
    <article
      className={cn('relative p-6 sm:p-8 lg:p-10', className)}
      aria-labelledby={`how-it-works-panel-${stepId}`}
    >
      <div className="flex min-w-0 flex-col gap-5 text-left sm:gap-6">
        <h4
          id={`how-it-works-panel-${stepId}`}
          className="text-2xl font-bold leading-tight text-foreground sm:text-3xl"
        >
          {title}
        </h4>
        <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">{t(`${base}.lead`)}</p>
        <ul className="space-y-3">
          {bulletList.map((item) => (
            <li key={item} className="flex items-start gap-3 text-sm text-foreground/90 sm:text-base">
              <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-950/80">
                <Check className="size-3 text-indigo-600 dark:text-indigo-400" strokeWidth={3} />
              </span>
              <span className="leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>
        {footer ? (
          <p className="text-sm font-medium text-foreground/85 sm:text-base">{footer}</p>
        ) : null}
      </div>
    </article>
  );
}
