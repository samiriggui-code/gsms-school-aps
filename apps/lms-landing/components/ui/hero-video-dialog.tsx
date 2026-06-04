/* eslint-disable @next/next/no-img-element */

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export type HeroThumbnailSlide = {
  src: string;
  alt: string;
};

interface HeroVideoDialogProps {
  className?: string;
  animationStyle?: "from-bottom" | "from-center" | "from-top" | "from-left" | "from-right" | "fade" | "top-in-bottom-out" | "left-in-right-out";
  videoSrc: string;
  /** @deprecated PrÃ©fÃ©rer thumbnailSlides */
  thumbnailSrc?: string;
  thumbnailSlides?: HeroThumbnailSlide[];
  slideIntervalMs?: number;
  thumbnailAlt?: string;
  trigger?: React.ReactNode;
}

const animationVariants = {
  "from-bottom": {
    initial: { y: "100%", opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: "100%", opacity: 0 },
  },
  "from-center": {
    initial: { scale: 0.5, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0.5, opacity: 0 },
  },
  "from-top": {
    initial: { y: "-100%", opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: "-100%", opacity: 0 },
  },
  "from-left": {
    initial: { x: "-100%", opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: "-100%", opacity: 0 },
  },
  "from-right": {
    initial: { x: "100%", opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: "100%", opacity: 0 },
  },
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  "top-in-bottom-out": {
    initial: { y: "-100%", opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: "100%", opacity: 0 },
  },
  "left-in-right-out": {
    initial: { x: "-100%", opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: "100%", opacity: 0 },
  },
};

function HeroThumbnailSlideshow({
  slides,
  intervalMs,
  fallbackAlt,
}: {
  slides: HeroThumbnailSlide[];
  intervalMs: number;
  fallbackAlt: string;
}) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % slides.length);
    }, intervalMs);
    return () => clearInterval(timer);
  }, [slides.length, intervalMs]);

  const current = slides[index] ?? slides[0];

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-border bg-muted shadow-2xl">
      <AnimatePresence mode="wait">
        <motion.img
          key={current.src}
          src={current.src}
          alt={current.alt || fallbackAlt}
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 0.85, ease: "easeInOut" }}
          className="absolute inset-0 h-full w-full object-cover"
        />
      </AnimatePresence>
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-black/5 to-black/15"
        aria-hidden
      />
      {slides.length > 1 ? (
        <div
          className="pointer-events-none absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5"
          aria-hidden
        >
          {slides.map((slide, i) => (
            <span
              key={slide.src}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                i === index ? "w-6 bg-white" : "w-1.5 bg-white/50",
              )}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default function HeroVideoDialog({
  trigger,
  className,
  animationStyle = "from-center",
  videoSrc,
  thumbnailSrc,
  thumbnailSlides,
  slideIntervalMs = 5500,
  thumbnailAlt = "VidÃ©o de prÃ©sentation Form'SSI",
}: HeroVideoDialogProps) {
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const selectedAnimation = animationVariants[animationStyle];

  const slides: HeroThumbnailSlide[] =
    thumbnailSlides ??
    (thumbnailSrc ? [{ src: thumbnailSrc, alt: thumbnailAlt }] : []);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className={cn("relative", className)}>
      <div
        className="group relative cursor-pointer"
        onClick={() => setIsVideoOpen(true)}
        role="button"
        tabIndex={-1}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setIsVideoOpen(true);
          }
        }}
        aria-label="Lire la vidÃ©o de prÃ©sentation"
      >
        <HeroThumbnailSlideshow
          slides={slides}
          intervalMs={slideIntervalMs}
          fallbackAlt={thumbnailAlt}
        />
        <div className="absolute inset-0 flex items-center justify-center transition-transform duration-200 group-hover:scale-110">
          {trigger}
        </div>
      </div>
      {mounted &&
        createPortal(
          <AnimatePresence>
            {isVideoOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md"
                onClick={() => setIsVideoOpen(false)}
              >
                <motion.div
                  {...selectedAnimation}
                  transition={{ type: "spring", damping: 30, stiffness: 300 }}
                  className="relative mx-4 aspect-video w-full max-w-4xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  <motion.button
                    type="button"
                    className="absolute -top-16 right-0 rounded-full bg-neutral-900/50 p-2 text-xl text-white ring-1 backdrop-blur-md dark:bg-neutral-100/50 dark:text-black"
                    onClick={() => setIsVideoOpen(false)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    aria-label="Fermer la vidÃ©o"
                  >
                    <X className="size-5" />
                  </motion.button>
                  <div className="size-full overflow-hidden rounded-2xl border-2 border-white isolate">
                    <iframe
                      src={videoSrc}
                      title={thumbnailAlt}
                      className="size-full rounded-2xl"
                      allowFullScreen
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    />
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </div>
  );
}

