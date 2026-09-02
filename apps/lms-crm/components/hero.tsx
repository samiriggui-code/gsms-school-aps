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

const ROTATING_WORD_CLASSES = [
  'text-indigo-600 dark:text-indigo-400',
  'text-red-600 dark:text-red-400',
  'text-emerald-600 dark:text-emerald-400',
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
  const showHeavyFx = useAnimatedBackground && !ios;

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

  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    setMouse({
      x: (e.clientX - rect.left - rect.width / 2) / rect.width,
      y: (e.clientY - rect.top - rect.height / 2) / rect.height,
    });
  };
  const handleMouseLeave = () => setMouse({ x: 0, y: 0 });

  return (
    <section
      className={`relative lg:min-h-screen pt-25 pb-20 lg:pt-40 lg:pb-20 overflow-hidden group ${useAnimatedBackground ? 'bg-gradient-to-br from-gray-50 dark:from-zinc-950 via-indigo-50 dark:via-black to-indigo-50 dark:to-zinc-950' : 'bg-transparent'}`}
      onMouseMove={showHeavyFx ? handleMouseMove : undefined}
      onMouseLeave={showHeavyFx ? handleMouseLeave : undefined}
    >
      {showHeavyFx && (
        <div className="hidden lg:block absolute inset-0 pointer-events-none">
          <motion.div
            className="absolute left-[10%] top-[15%] w-[320px] h-[320px] dark:w-[160px] dark:h-[160px] rounded-full bg-indigo-200 dark:bg-indigo-900 opacity-90 blur-[60px]"
            animate={{ scale: [1, 1.13, 1], opacity: [0.85, 1, 0.85], x: mouse.x * 70, y: mouse.y * 40 }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute left-[18%] top-[23%] w-[90px] h-[90px] rounded-full bg-indigo-100 dark:bg-indigo-950 opacity-95 blur-[10px]"
            animate={{ scale: [1, 1.08, 1], opacity: [0.92, 1, 0.92], x: mouse.x * 90, y: mouse.y * 60 }}
            transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute right-[12%] top-[30%] w-[220px] h-[220px] rounded-full bg-indigo-300 dark:bg-indigo-950 opacity-80 blur-[40px]"
            animate={{ scale: [1, 1.08, 1], opacity: [0.75, 0.95, 0.75], x: mouse.x * -60, y: mouse.y * 30 }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>
      )}

      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center max-w-5xl mx-auto">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mb-4 flex flex-col items-center justify-center gap-0.5 text-2xl font-bold leading-tight tracking-tight md:flex-row md:gap-1.5 md:text-4xl lg:mb-6 lg:text-5xl"
          >
            <span className="bg-gradient-to-r from-indigo-900 via-indigo-900 to-indigo-900 dark:from-gray-50 dark:via-indigo-300 dark:to-indigo-900 bg-clip-text text-transparent">
              {t('landing.hero.titlePrefix')}
            </span>
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
                    <div className="bg-indigo-600/10 dark:bg-indigo-300/10 backdrop-blur-md rounded-full p-4 shadow-lg">
                      <div className="bg-background rounded-full p-3 shadow-lg">
                        <Play className="size-6 text-indigo-600 dark:text-indigo-400 fill-indigo-600 dark:fill-indigo-400 ml-0.5" />
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
