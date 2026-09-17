'use client';

import { motion } from 'framer-motion';
import { CustomBadge } from '@/components/custom/badge';
import { CustomTitle } from '@/components/custom/title';
import { CustomSubtitle } from '@/components/custom/subtitle';
import { Crosshair, ShieldCheck, Users, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';

const FEATURE_IDS = [
  'task-automation',
  'workflow-optimization',
  'intelligent-scheduling',
  'ai-analytics',
] as const;

const FEATURE_ICONS = {
  'task-automation': Crosshair,
  'workflow-optimization': ShieldCheck,
  'intelligent-scheduling': Users,
  'ai-analytics': TrendingUp,
} as const;

/** Un seul accent pour les 4 cartes — pas une couleur par feature (cf. pattern landing). */
const FEATURE_THEME = {
  iconBg: 'from-primary/20 to-primary/5',
  iconText: 'text-primary',
  ring: 'group-hover:ring-primary/30',
  orb: 'bg-primary/15',
} as const;

const Features = () => {
  const { t } = useTranslation();

  return (
    <section
      id="features"
      className="relative scroll-mt-24 overflow-hidden border-b border-border/50 bg-background py-20 sm:py-28"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,hsl(var(--primary)/0.06),transparent_45%),radial-gradient(circle_at_80%_20%,hsl(var(--primary)/0.05),transparent_40%)]"
        aria-hidden
      />

      <div className="container relative mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mx-auto mb-12 flex max-w-3xl flex-col items-center gap-4 text-center sm:mb-16"
        >
          <CustomBadge>{t('landing.features.badge')}</CustomBadge>
          <CustomTitle accent={t('landing.features.titleAccent')}>
            {t('landing.features.title')}
          </CustomTitle>
          <CustomSubtitle>{t('landing.features.subtitle')}</CustomSubtitle>
        </motion.div>

        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-5 sm:gap-6 md:grid-cols-2">
          {FEATURE_IDS.map((id, index) => {
            const Icon = FEATURE_ICONS[id];
            const theme = FEATURE_THEME;
            const stat = t(`landing.features.items.${id}.stats`);
            const metric = t(`landing.features.items.${id}.metric`);

            return (
              <motion.article
                key={id}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: index * 0.08 }}
                viewport={{ once: true }}
                whileHover={{ y: -4 }}
                className="group"
              >
                <div
                  className={cn(
                    'relative h-full overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-background via-background to-muted/20 p-6 shadow-sm transition-all duration-300 sm:p-8',
                    'ring-1 ring-transparent hover:border-border hover:shadow-lg hover:shadow-black/[0.06]',
                    theme.ring,
                  )}
                >
                  <div
                    className={cn(
                      'pointer-events-none absolute -end-8 -top-8 size-32 rounded-full blur-2xl transition-opacity duration-300 group-hover:opacity-100',
                      theme.orb,
                    )}
                    aria-hidden
                  />

                  <div className="relative flex items-start justify-between gap-4">
                    <div
                      className={cn(
                        'flex size-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ring-1 ring-border/40 transition-transform duration-300 group-hover:scale-105',
                        theme.iconBg,
                      )}
                    >
                      <Icon className={cn('size-6', theme.iconText)} strokeWidth={1.75} />
                    </div>

                    <div className="text-right">
                      <div className="text-3xl font-bold tabular-nums tracking-tight text-foreground sm:text-4xl">
                        {stat}
                      </div>
                      <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground sm:text-xs">
                        {metric}
                      </p>
                    </div>
                  </div>

                  <h3 className="relative mt-6 text-lg font-bold leading-snug tracking-tight text-foreground sm:text-xl">
                    {t(`landing.features.items.${id}.title`)}
                  </h3>
                  <p className="relative mt-3 text-sm leading-relaxed text-muted-foreground">
                    {t(`landing.features.items.${id}.description`)}
                  </p>

                  <div
                    className="absolute bottom-0 left-0 h-1 w-0 bg-primary transition-all duration-500 group-hover:w-full"
                    aria-hidden
                  />
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Features;
