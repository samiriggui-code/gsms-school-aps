'use client';

import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Button } from '@repo/ui/button';
import { Boxes } from '@repo/ui/background-boxes';
import Link from 'next/link';
import { useTranslation } from '@/hooks/useTranslation';

const CallToAction = () => {
  const { t } = useTranslation();

  const handleConfetti = () => {
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
  };

  return (
    <section id="call-to-action" className="scroll-mt-24 relative flex h-96 w-full flex-col items-center justify-center overflow-hidden bg-zinc-900">
      <div className="absolute inset-0 w-full h-full bg-zinc-900 z-20 [mask-image:radial-gradient(transparent,white)] pointer-events-none" />
      <Boxes />
      <div className="container mx-auto px-6 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
            className="text-white/80 font-semibold text-sm uppercase tracking-wide mb-6"
          >
            {t('landing.ctaBanner.badge')}
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold text-white mb-10"
          >
            {t('landing.ctaBanner.title')}{' '}
            <span className="font-landing-serif italic font-normal text-primary">
              {t('landing.ctaBanner.titleAccent')}
            </span>
          </motion.h2>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true }}
          >
            <Button variant="outline" size="lg" className="font-semibold" onMouseEnter={handleConfetti} asChild>
              <Link href="#pricing">{t('landing.ctaBanner.cta')}</Link>
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default CallToAction;
