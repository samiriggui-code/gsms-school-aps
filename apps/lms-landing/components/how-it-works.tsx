'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef, useMemo } from 'react';
import { CustomBadge } from '@/components/custom/badge';
import { CustomTitle } from '@/components/custom/title';
import { CustomSubtitle } from '@/components/custom/subtitle';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Cable, ChartNoAxesCombined, Cog, CloudUpload } from 'lucide-react';
import {
  HowItWorksStepContent,
  type HowItWorksStepId,
} from '@/components/how-it-works-step-content';
import { useTranslation } from '@/hooks/useTranslation';

type HowItWorksProps = {
  onStartJourneyClick?: () => void;
};

const STEP_META: { id: HowItWorksStepId; icon: typeof Cable }[] = [
  { id: 1, icon: Cable },
  { id: 2, icon: ChartNoAxesCombined },
  { id: 4, icon: Cog },
  { id: 5, icon: CloudUpload },
];

const HowItWorks = ({ onStartJourneyClick }: HowItWorksProps) => {
  const { t } = useTranslation();
  const [activeStep, setActiveStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const manuallyTriggered = useRef(false);

  const steps = useMemo(
    () =>
      STEP_META.map((step) => ({
        ...step,
        title: t(`landing.howItWorks.steps.${step.id}.title`),
      })),
    [t],
  );

  const stepDuration = 5000;

  useEffect(() => {
    if (isPaused) return;
    setProgress(0);
    const progressInterval = setInterval(() => {
      setProgress((prev) => (prev >= 100 ? 100 : prev + 100 / (stepDuration / 50)));
    }, 50);
    const stepTimeout = setTimeout(() => {
      setActiveStep((prevStep) => {
        manuallyTriggered.current = false;
        return (prevStep + 1) % steps.length;
      });
    }, stepDuration);
    return () => {
      clearInterval(progressInterval);
      clearTimeout(stepTimeout);
    };
  }, [activeStep, isPaused, steps.length]);

  const handleStepClick = (index: number) => {
    setActiveStep(index);
    manuallyTriggered.current = true;
    setTimeout(() => setIsPaused(false), 4000);
  };

  return (
    <section id="how-it-works" className="scroll-mt-24 py-24 border-b border-border/50">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="flex items-center justify-center flex-col text-center gap-5 mb-16"
        >
          <CustomBadge>{t('landing.howItWorks.badge')}</CustomBadge>
          <CustomTitle>{t('landing.howItWorks.title')}</CustomTitle>
          <CustomSubtitle>{t('landing.howItWorks.subtitle')}</CustomSubtitle>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="mx-auto flex max-w-6xl flex-col gap-12"
        >
          <div className="flex flex-col items-center justify-between gap-8 md:flex-row">
            {steps.map((step, index) => (
              <div
                key={step.id}
                role="button"
                tabIndex={0}
                className="flex cursor-pointer flex-col items-center overflow-hidden transition-all duration-300"
                onClick={() => handleStepClick(index)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleStepClick(index);
                  }
                }}
              >
                <div className="flex size-12 items-center justify-center rounded-full bg-indigo-100/40 dark:bg-indigo-950/60">
                  <step.icon className="size-5 text-indigo-500" />
                </div>
                <h3
                  className={cn(
                    'mb-0 p-5 pb-3 text-center text-xl font-semibold transition-colors duration-300',
                    index === activeStep ? 'text-foreground' : 'text-muted-foreground',
                  )}
                >
                  {step.title}
                </h3>
                <div className="h-0.5 w-full bg-border/60">
                  <AnimatePresence>
                    {index === activeStep && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="h-0.5 w-full overflow-hidden"
                      >
                        <motion.div
                          className="h-0.5 bg-gradient-to-r from-indigo-500 to-purple-400"
                          style={{ width: `${progress}%` }}
                          transition={{ duration: 0.05, ease: 'linear' }}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            ))}
          </div>

          <div className="relative overflow-hidden rounded-xl border border-border bg-background shadow-xs shadow-black/5">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeStep}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35, ease: 'easeInOut' }}
              >
                <HowItWorksStepContent stepId={steps[activeStep].id} title={steps[activeStep].title} />
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>

        <div className="text-center mt-16">
          <p className="text-muted-foreground mb-4">{t('landing.howItWorks.bottomLead')}</p>
          <Button size="lg" onClick={onStartJourneyClick}>
            {t('landing.howItWorks.bottomCta')}
          </Button>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
