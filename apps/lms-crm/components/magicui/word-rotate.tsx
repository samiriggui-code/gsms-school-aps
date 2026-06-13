"use client";

import { AnimatePresence, motion, MotionProps } from "framer-motion";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

export type WordRotateItem =
  | string
  | {
      text: string;
      className?: string;
    };

function normalizeItem(item: WordRotateItem): { text: string; className?: string } {
  return typeof item === "string" ? { text: item } : item;
}

interface WordRotateProps {
  words: WordRotateItem[];
  duration?: number;
  motionProps?: MotionProps;
  className?: string;
}

export function WordRotate({
  words,
  duration = 2500,
  motionProps = {
    initial: { opacity: 0, y: -50 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 50 },
    transition: { duration: 0.25, ease: "easeOut" },
  },
  className,
}: WordRotateProps) {
  const [index, setIndex] = useState(0);
  const [liteMotion, setLiteMotion] = useState(true);
  const [reduceMotion, setReduceMotion] = useState(false);
  const items = words.map(normalizeItem);
  const current = items[index] ?? items[0];

  useEffect(() => {
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const narrow = window.matchMedia("(max-width: 1023px)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setLiteMotion(coarse || narrow);
    setReduceMotion(reduced);
  }, []);

  useEffect(() => {
    if (reduceMotion || items.length <= 1) return;
    const interval = setInterval(() => {
      setIndex((prevIndex) => (prevIndex + 1) % items.length);
    }, duration);
    return () => clearInterval(interval);
  }, [reduceMotion, items.length, duration]);

  if (!current) return null;

  if (reduceMotion) {
    return (
      <span className={cn("inline-block font-bold", className, current.className)}>
        {current.text}
      </span>
    );
  }

  if (liteMotion) {
    return (
      <span
        className={cn(
          "inline-block min-h-[1.15em] font-bold align-baseline",
          className,
        )}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={current.text}
            className={cn("inline-block", current.className)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          >
            {current.text}
          </motion.span>
        </AnimatePresence>
      </span>
    );
  }

  return (
    <motion.div className="overflow-hidden py-2">
      <AnimatePresence mode="wait">
        <motion.span
          key={current.text}
          className={cn("inline-block font-bold", className, current.className)}
          {...motionProps}
        >
          {current.text}
        </motion.span>
      </AnimatePresence>
    </motion.div>
  );
}

