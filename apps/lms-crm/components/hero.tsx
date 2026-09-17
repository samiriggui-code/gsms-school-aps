'use client';

import { motion } from 'framer-motion';
import { Button } from '@repo/ui/button';
import { ArrowRight, Play, GraduationCap } from 'lucide-react';
import HeroVideoDialog from '@repo/ui/hero-video-dialog';
import { WordRotate, type WordRotateItem } from '@/components/magicui/word-rotate';
import { useState, useEffect, useMemo } from 'react';
import { useIsIOS } from '@/lib/platform';
import Link from 'next/link';
import { AnimatedTooltip } from '@repo/ui/animated-tooltip';
import { Star } from '@/components/custom/star';
import { useTranslation } from '@/hooks/useTranslation';

/** Un seul accent (le primary du thème landing), pas un mot par couleur. */
const ROTATING_WORD_CLASSES = [
  'font-landing-serif italic font-normal text-primary',
  'font-landing-serif italic font-normal text-primary',
  'font-landing-serif italic font-normal text-primary',
] as const;

interface HeroProps {
  showVideo?: boolean;
  videoThumbnailSrc?: string;
  videoSrc?: string;
  useAnimatedBackground?: boolean;
  onPrimaryCtaClick?: () => void;
}

const Hero = ({
  showVideo = true,
  videoThumbnailSrc = '/screens/hero/sst-formation.jpg',
  videoSrc = 'https://www.youtube.com/embed/VIbMn0QHBlw?si=uV9MFOqt6dmBs0vW',
  useAnimatedBackground = true,
  onPrimaryCtaClick,
}: HeroProps) => {
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const ios = useIsIOS();

  const rotatingWords = useMemo((): WordRotateItem[] => {
    const raw = t('landing.hero.rotatingWords', { returnObjects: true }) as { text: string }[];
    if (!Array.isArray(raw)) return [];
    return raw.map((item, index) => ({
      text: item.text,
      className: ROTATING_WORD_CLASSES[index] ?? ROTATING_WORD_CLASSES[0],
    }));
  }, [t]);

  const videoThumbnailSlides = useMemo(() => {
    const slides = t('landing.hero.videoSlides', { returnObjects: true }) as { alt: string }[];
    const sources = [
      '/screens/hero/sst-formation.jpg',
      '/screens/hero/incendie-ssi.jpg',
      '/screens/hero/securite-privee.jpg',
      '/screens/hero/extincteur.jpg',
    ];
    if (!Array.isArray(slides)) return [];
    return slides.map((slide, index) => ({
      src: sources[index] ?? sources[0],
      alt: slide.alt,
    }));
  }, [t]);

  useEffect(() => setMounted(true), []);

  const people = [
    { id: 1, name: 'Sophie M.', designation: t('landing.hero.people.1'), image: '/media/avatars/300-1.png' },
    { id: 2, name: 'Karim B.', designation: t('landing.hero.people.2'), image: '/media/avatars/300-2.png' },
    { id: 3, name: 'Nadia L.', designation: t('landing.hero.people.3'), image: '/media/avatars/300-3.png' },
    { id: 4, name: 'Thomas R.', designation: t('landing.hero.people.4'), image: '/media/avatars/300-4.png' },
    { id: 5, name: 'Amina K.', designation: t('landing.hero.people.5'), image: '/media/avatars/300-5.png' },
  ];

  return (
    <section className="relative lg:min-h-screen pt-25 pb-20 lg:pt-40 lg:pb-20 overflow-hidden bg-background">
      {useAnimatedBackground && !ios && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(ellipse_60%_100%_at_50%_0%,color-mix(in_oklch,var(--primary),transparent_88%),transparent_70%)]"
        />
      )}

      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center max-w-5xl mx-auto">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mb-4 flex flex-col items-center justify-center gap-0.5 text-[clamp(28px,5.2vw,56px)]/[1.05] font-[650] tracking-[-0.03em] text-foreground md:flex-row md:gap-2 lg:mb-6"
          >
            <span>{t('landing.hero.titlePrefix')}</span>
            <WordRotate words={rotatingWords} className="w-[min(100%,18rem)] md:w-[22rem]" />
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-sm md:text-lg font-medium text-muted-foreground mb-6 md:mb-10 max-w-[600px] mx-auto leading-relaxed"
          >
            {t('landing.hero.description')}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-3 mb-10"
          >
            <Button
              size="lg"
              type="button"
              className="w-46 cursor-pointer hover:[&_svg]:translate-x-1"
              onClick={onPrimaryCtaClick}
            >
              {t('landing.hero.primaryCta')}
              <ArrowRight className="h-5 w-5 transition-transform" />
            </Button>
            <Button size="lg" variant="outline" className="w-46 cursor-pointer hover:[&_svg]:-translate-y-1" asChild>
              <Link href="#how-it-works">
                <GraduationCap className="h-5 w-5 opacity-60 transition-transform" />
                {t('landing.hero.secondaryCta')}
              </Link>
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-center gap-2.5 mb-10"
          >
            <div className="flex gap-2.5">
              <div className="flex -space-x-2 me-2.5">
                <AnimatedTooltip items={people} />
              </div>
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, idx) => (
                  <Star key={idx} className="h-5 w-5 transition-transform opacity-60 text-yellow-500" />
                ))}
              </div>
            </div>
            <div className="text-center text-muted-foreground text-sm font-medium">{t('landing.hero.trustText')}</div>
          </motion.div>

          {showVideo && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="relative max-w-5xl mx-auto"
            >
              {mounted && (
                <HeroVideoDialog
                  trigger={
                    <div className="bg-primary/10 backdrop-blur-md rounded-full p-4 shadow-lg">
                      <div className="bg-background rounded-full p-3 shadow-lg">
                        <Play className="size-6 text-primary fill-primary ml-0.5" />
                      </div>
                    </div>
                  }
                  animationStyle="from-center"
                  videoSrc={videoSrc}
                  thumbnailSlides={videoThumbnailSlides}
                  thumbnailSrc={videoThumbnailSrc}
                  thumbnailAlt={t('landing.hero.videoThumbnailAlt')}
                />
              )}
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
};

export default Hero;
