"use client";

import { useRef } from "react";
import {
  motion,
  useInView,
  useScroll,
  useTransform,
} from "framer-motion";

export const EASE_PULL = [0.16, 1, 0.3, 1] as const;
export const EASE_CARD = [0.22, 1, 0.36, 1] as const;

type WordsPullUpProps = {
  text: string;
  className?: string;
  showAsterisk?: boolean;
  delay?: number;
  style?: React.CSSProperties;
};

export function WordsPullUp({
  text,
  className = "",
  showAsterisk = false,
  delay = 0,
  style,
}: WordsPullUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const words = text.split(" ");

  return (
    <span
      ref={ref}
      className={`inline-flex flex-wrap justify-center ${className}`}
      style={style}
    >
      {words.map((word, i) => (
        <motion.span
          key={i}
          className="relative mr-[0.25em] inline-block"
          initial={{ y: 20, opacity: 0 }}
          animate={isInView ? { y: 0, opacity: 1 } : { y: 20, opacity: 0 }}
          transition={{ duration: 0.6, ease: EASE_PULL, delay: delay + i * 0.08 }}
        >
          {word}
          {showAsterisk && i === words.length - 1 ? (
            <sup className="absolute right-[-0.3em] top-[0.65em] text-[0.26em] font-medium">
              *
            </sup>
          ) : null}
        </motion.span>
      ))}
    </span>
  );
}

type WordsPullUpMultiStyleProps = {
  segments: { text: string; className?: string }[];
  className?: string;
  delay?: number;
};

export function WordsPullUpMultiStyle({
  segments,
  className = "",
  delay = 0,
}: WordsPullUpMultiStyleProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });

  const words: { text: string; className: string }[] = [];
  segments.forEach((seg) => {
    seg.text.split(" ").forEach((w) => {
      if (w.trim()) words.push({ text: w, className: seg.className ?? "" });
    });
  });

  return (
    <span ref={ref} className={`inline-flex flex-wrap justify-center ${className}`}>
      {words.map((word, i) => (
        <motion.span
          key={i}
          className={`mr-[0.25em] inline-block ${word.className}`}
          initial={{ y: 20, opacity: 0 }}
          animate={isInView ? { y: 0, opacity: 1 } : { y: 20, opacity: 0 }}
          transition={{ duration: 0.6, ease: EASE_PULL, delay: delay + i * 0.08 }}
        >
          {word.text}
        </motion.span>
      ))}
    </span>
  );
}

export function RevealParagraph({ text }: { text: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.8", "end 0.2"],
  });
  const chars = text.split("");
  const total = chars.length;

  return (
    <p
      ref={ref}
      className="mx-auto max-w-2xl text-[#DEDBC8] text-xs leading-relaxed sm:text-sm md:text-base"
    >
      {chars.map((char, i) => {
        const charProgress = i / total;
        const opacity = useTransform(
          scrollYProgress,
          [charProgress - 0.1, charProgress + 0.05],
          [0.2, 1]
        );
        return (
          <motion.span key={i} style={{ opacity }}>
            {char === " " ? "\u00A0" : char}
          </motion.span>
        );
      })}
    </p>
  );
}