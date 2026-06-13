'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef, useMemo } from 'react';
import { useTheme } from 'next-themes';
import {
  Activity,
  BadgeCheck,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  Shield,
} from 'lucide-react';
import { CustomBadge } from '@/components/custom/badge';
import { CustomTitle } from '@/components/custom/title';
import { CustomSubtitle } from '@/components/custom/subtitle';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';

type StepId = 1 | 2 | 4 | 5;

const STEP_META: { id: StepId; icon: typeof ClipboardCheck }[] = [
  { id: 1, icon: ClipboardCheck },
  { id: 2, icon: BookOpen },
  { id: 4, icon: Shield },
  { id: 5, icon: BadgeCheck },
];

const BG_IMAGE = '/images/bg-2.png';
const STEP_DURATION_MS = 12_000;

const HowItWorks = () => {
  const { t } = useTranslation();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const steps = useMemo(
    () =>
      STEP_META.map((step) => {
        const base = `landing.howItWorks.steps.${step.id}`;
        const bullets = t(`${base}.bullets`, { returnObjects: true }) as string[] | string;
        return {
          ...step,
          title: t(`${base}.title`),
          lead: t(`${base}.lead`),
          footer: t(`${base}.footer`, { defaultValue: '' }),
          bullets: Array.isArray(bullets) ? bullets : [],
        };
      }),
    [t],
  );

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (isPaused) return;

    setProgress(0);
    const progressInterval = setInterval(() => {
      setProgress((prev) => (prev >= 100 ? 100 : prev + 100 / (STEP_DURATION_MS / 50)));
    }, 50);

    const stepTimeout = setTimeout(() => {
      setActiveStep((prev) => (prev + 1) % steps.length);
    }, STEP_DURATION_MS);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(stepTimeout);
    };
  }, [activeStep, isPaused, steps.length]);

  const handleStepClick = (index: number) => {
    setActiveStep(index);
    setProgress(0);
    setIsPaused(true);
    setTimeout(() => setIsPaused(false), STEP_DURATION_MS + 2000);
  };

  const current = steps[activeStep];
  const bgReady = mounted && BG_IMAGE;

  return (
    <section
      id="how-it-works"
      className="relative scroll-mt-24 overflow-hidden border-b border-border/50 py-20 sm:py-28"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      style={
        bgReady
          ? {
              backgroundImage: `url(${BG_IMAGE})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
            }
          : undefined
      }
    >
      <div
        className={cn(
          'pointer-events-none absolute inset-0 backdrop-blur-[2px]',
          resolvedTheme === 'dark' ? 'bg-background/70' : 'bg-background/45',
        )}
        aria-hidden
      />

      <div className="container relative z-10 mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
          className="mx-auto mb-12 flex max-w-3xl flex-col items-center gap-4 text-center sm:mb-16"
        >
          <CustomBadge>{t('landing.howItWorks.badge')}</CustomBadge>
          <CustomTitle>{t('landing.howItWorks.title')}</CustomTitle>
          <CustomSubtitle>{t('landing.howItWorks.subtitle')}</CustomSubtitle>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.05 }}
          viewport={{ once: true }}
          className="mx-auto flex max-w-6xl flex-col gap-10"
        >
          {/* Navigation étapes */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = index === activeStep;
              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => handleStepClick(index)}
                  className={cn(
                    'group flex cursor-pointer flex-col items-center text-center transition-all duration-300',
                    isActive ? 'scale-[1.02]' : 'opacity-70 hover:opacity-100',
                  )}
                >
                  <div
                    className={cn(
                      'flex size-12 items-center justify-center rounded-full transition-all duration-300 sm:size-14',
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-[0_8px_24px_hsl(var(--primary)/0.35)]'
                        : 'bg-indigo-100/50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400',
                    )}
                  >
                    <StepIcon className="size-5 sm:size-6" strokeWidth={1.75} />
                  </div>
                  <h3
                    className={cn(
                      'mt-3 px-1 text-xs font-semibold leading-snug sm:text-sm',
                      isActive ? 'text-foreground' : 'text-muted-foreground',
                    )}
                  >
                    {step.title}
                  </h3>
                  <div className="mt-2 h-0.5 w-full max-w-[8rem] bg-border/60">
                    <AnimatePresence>
                      {isActive && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="h-0.5 overflow-hidden rounded-full"
                        >
                          <motion.div
                            className="h-full bg-gradient-to-r from-primary to-indigo-400"
                            style={{ width: `${progress}%` }}
                            transition={{ duration: 0.05, ease: 'linear' }}
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Panneau type dashboard (gsms-iade) */}
          <div
            className="relative flex min-h-[420px] flex-col overflow-hidden rounded-2xl border border-border shadow-2xl shadow-black/10 dark:shadow-black/40"
            style={
              bgReady
                ? {
                    backgroundImage: `url(${BG_IMAGE})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }
                : undefined
            }
          >
            <div className="pointer-events-none absolute inset-0 bg-background/65 backdrop-blur-sm dark:bg-black/65" />

            <div className="relative z-10 flex items-center gap-2 border-b border-border/80 bg-background/45 px-4 py-3 sm:px-6">
              <div className="flex gap-1.5">
                <div className="size-3 rounded-full border border-red-500/30 bg-red-500/20" />
                <div className="size-3 rounded-full border border-yellow-500/30 bg-yellow-500/20" />
                <div className="size-3 rounded-full border border-green-500/30 bg-green-500/20" />
              </div>
              <div className="ml-3 flex items-center gap-2 font-mono text-[10px] text-muted-foreground sm:text-xs">
                <Activity className="size-3 animate-pulse text-primary" />
                FORM&apos;SSI_PARCOURS_FORMATION
              </div>
            </div>

            <div className="relative z-10 flex-1 p-6 sm:p-10 md:p-12">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeStep}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.55, ease: 'easeInOut' }}
                  className="max-w-3xl"
                >
                  <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-primary sm:text-sm">
                    {t('landing.howItWorks.badge')} · {current.title}
                  </div>

                  <h4 className="mt-6 text-2xl font-bold leading-tight tracking-tight text-foreground sm:text-3xl md:text-4xl">
                    {current.title}
                  </h4>

                  <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base md:text-lg">
                    {current.lead}
                  </p>

                  {current.bullets.length > 0 && (
                    <ul className="mt-6 space-y-3">
                      {current.bullets.map((item) => (
                        <li
                          key={item}
                          className="flex items-start gap-3 rounded-xl border border-border/50 bg-background/50 px-3 py-2.5 text-sm text-foreground/90 backdrop-blur-sm sm:text-base"
                        >
                          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" />
                          <span className="leading-relaxed">{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {current.footer ? (
                    <div className="mt-6 flex items-start gap-4 rounded-2xl border border-primary/15 bg-primary/5 p-4 sm:p-5">
                      <CheckCircle2 className="mt-0.5 size-6 shrink-0 text-primary" />
                      <p className="text-sm font-medium leading-relaxed text-foreground/90 sm:text-base">
                        {current.footer}
                      </p>
                    </div>
                  ) : null}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HowItWorks;
