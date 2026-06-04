'use client';

import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { CustomBadge } from '@/components/custom/badge';
import { CustomTitle } from '@/components/custom/title';
import { CustomSubtitle } from '@/components/custom/subtitle';
import { Zap, Shield, BarChart3, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';

const FEATURE_IDS = [
  'task-automation',
  'workflow-optimization',
  'intelligent-scheduling',
  'ai-analytics',
] as const;

const FEATURE_ICONS = {
  'task-automation': Zap,
  'workflow-optimization': Shield,
  'intelligent-scheduling': Users,
  'ai-analytics': BarChart3,
} as const;

const FEATURE_COLORS = {
  'task-automation': {
    bg: 'bg-blue-100/40 dark:bg-blue-950/40',
    icon: 'text-blue-600',
    hover: 'hover:border-blue-500',
    gradient: 'from-blue-500 via-blue-600 to-blue-700',
  },
  'workflow-optimization': {
    bg: 'bg-red-100/40 dark:bg-red-950/40',
    icon: 'text-red-600',
    hover: 'hover:border-red-500',
    gradient: 'from-red-500 via-red-600 to-red-700',
  },
  'intelligent-scheduling': {
    bg: 'bg-emerald-100/40 dark:bg-emerald-950/40',
    icon: 'text-emerald-600',
    hover: 'hover:border-emerald-500',
    gradient: 'from-emerald-500 via-emerald-600 to-emerald-700',
  },
  'ai-analytics': {
    bg: 'bg-amber-100/40 dark:bg-amber-950/20',
    icon: 'text-amber-600',
    hover: 'hover:border-amber-500',
    gradient: 'from-amber-500 via-amber-600 to-amber-700',
  },
} as const;

const Features = () => {
  const { t } = useTranslation();

  return (
    <section id="features" className="py-24 bg-background border-b border-border/50">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="flex items-center justify-center flex-col text-center gap-5 mb-16"
        >
          <CustomBadge>{t('landing.features.badge')}</CustomBadge>
          <CustomTitle>{t('landing.features.title')}</CustomTitle>
          <CustomSubtitle>{t('landing.features.subtitle')}</CustomSubtitle>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {FEATURE_IDS.map((id, index) => {
            const Icon = FEATURE_ICONS[id];
            const colors = FEATURE_COLORS[id];
            return (
              <motion.div
                key={id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -8 }}
                className="group"
              >
                <Card
                  className={cn(
                    'h-full bg-background border border-border transition-all duration-500 p-8 relative overflow-hidden hover:shadow-lg',
                    colors.hover,
                  )}
                >
                  <CardContent className="p-0">
                    <div className="flex items-start justify-between mb-8">
                      <div
                        className={cn(
                          'size-12 rounded-full flex items-center justify-center group-hover:scale-110 transition-all duration-500',
                          colors.bg,
                        )}
                      >
                        <Icon className={cn('size-5', colors.icon)} />
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-semibold text-foreground mb-1">
                          {t(`landing.features.items.${id}.stats`)}
                        </div>
                        <div className="text-sm text-muted-foreground font-medium uppercase tracking-wide">
                          {t(`landing.features.items.${id}.metric`)}
                        </div>
                      </div>
                    </div>
                    <h3 className="text-2xl font-bold text-foreground mb-6 leading-tight">
                      {t(`landing.features.items.${id}.title`)}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed font-medium">
                      {t(`landing.features.items.${id}.description`)}
                    </p>
                  </CardContent>
                  <div
                    className={cn(
                      'absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left',
                      colors.gradient,
                    )}
                  />
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Features;
