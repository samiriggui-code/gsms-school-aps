'use client';

import { motion } from 'framer-motion';
import Marquee from '@/components/ui/marquee';
import { CustomBadge } from '@/components/custom/badge';
import { CustomTitle } from '@/components/custom/title';
import { CustomSubtitle } from '@/components/custom/subtitle';
import Image from 'next/image';
import { useTranslation } from '@/hooks/useTranslation';

const TESTIMONIAL_IDS = [
  'sarah-chen',
  'marcus-johnson',
  'emily-rodriguez',
  'david-kim',
  'lisa-thompson',
  'alex-martinez',
  'jennifer-park',
  'michael-brown',
  'rachel-green',
  'john-doe',
] as const;

const AVATARS: Record<(typeof TESTIMONIAL_IDS)[number], string> = {
  'sarah-chen': 'https://images.unsplash.com/photo-1649972904349-6e44c42644a7?w=100&h=100&fit=crop&crop=face',
  'marcus-johnson': 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=100&h=100&fit=crop&crop=face',
  'emily-rodriguez': 'https://images.unsplash.com/photo-1581092795360-fd1ca04f0952?w=100&h=100&fit=crop&crop=face',
  'david-kim': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
  'lisa-thompson': 'https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?w=100&h=100&fit=crop&crop=face',
  'alex-martinez': 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
  'jennifer-park': 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face',
  'michael-brown': 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face',
  'rachel-green': 'https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?w=100&h=100&fit=crop&crop=face',
  'john-doe': 'https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?w=100&h=100&fit=crop&crop=face',
};

const Testimonials = () => {
  const { t } = useTranslation();
  const firstColumn = TESTIMONIAL_IDS.slice(0, 5);
  const secondColumn = TESTIMONIAL_IDS.slice(5, 10);

  const TestimonialCard = ({ id }: { id: (typeof TESTIMONIAL_IDS)[number] }) => (
    <div className="flex-shrink-0 w-[350px] bg-gradient-to-br from-indigo-50 to-indigo-50 dark:from-indigo-900/15 dark:to-indigo-900/15 rounded-xl p-6 border border-border/50 shadow-sm mx-1.5">
      <p className="text-muted-foreground mb-4 font-medium">{t(`landing.testimonials.items.${id}.content`)}</p>
      <div className="flex items-center gap-3">
        <Image
          src={AVATARS[id]}
          alt={t(`landing.testimonials.items.${id}.name`)}
          width={40}
          height={40}
          className="rounded-full object-cover"
        />
        <div>
          <div className="font-semibold text-foreground">{t(`landing.testimonials.items.${id}.name`)}</div>
          <div className="text-sm text-muted-foreground">{t(`landing.testimonials.items.${id}.role`)}</div>
        </div>
      </div>
    </div>
  );

  return (
    <section id="testimonials" className="scroll-mt-24 overflow-hidden border-b border-border/50 bg-background py-24">
      <div className="container mx-auto px-6 lg:px-12 mb-16">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="flex items-center justify-center flex-col text-center gap-5 mb-16"
        >
          <CustomBadge>{t('landing.testimonials.badge')}</CustomBadge>
          <CustomTitle>{t('landing.testimonials.title')}</CustomTitle>
          <CustomSubtitle>{t('landing.testimonials.subtitle')}</CustomSubtitle>
        </motion.div>
      </div>

      <div className="w-full mx-auto px-6">
        <motion.div
          className="relative flex w-full flex-col items-center justify-center overflow-hidden gap-1.5 mx-auto"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <Marquee pauseOnHover className="[--duration:40s] grow">
            {firstColumn.map((id) => (
              <TestimonialCard key={id} id={id} />
            ))}
          </Marquee>
          <Marquee reverse pauseOnHover className="[--duration:40s] grow">
            {secondColumn.map((id) => (
              <TestimonialCard key={id} id={id} />
            ))}
          </Marquee>
          <div className="pointer-events-none absolute inset-y-0 start-0 w-1/12 bg-gradient-to-r from-background" />
          <div className="pointer-events-none absolute inset-y-0 end-0 w-1/12 bg-gradient-to-l from-background" />
        </motion.div>
      </div>
    </section>
  );
};

export default Testimonials;
