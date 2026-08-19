"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import {
  ArrowRight,
  Check,
  MessageSquare,
  Sparkles,
  Target,
} from "lucide-react";

import { EASE_CARD, RevealParagraph, WordsPullUpMultiStyle } from "./prisma-text";

const CANVAS_VIDEO =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260406_133058_0504132a-0cf3-4450-a370-8ea3b05c95d4.mp4";

export function About() {
  return (
    <section id="story" className="scroll-mt-24 bg-black px-4 py-24 sm:px-6 md:py-32">
      <div className="mx-auto max-w-6xl rounded-[2rem] bg-[#101010] px-6 py-16 text-center sm:px-10 md:py-24 lg:py-28">
        <p className="mono-label text-primary-400">The Coding Company</p>

        <h2 className="mx-auto mt-6 max-w-3xl text-3xl leading-[0.95] sm:text-4xl sm:leading-[0.9] md:text-5xl lg:text-6xl xl:text-7xl">
          <WordsPullUpMultiStyle
            className="text-[#E1E0CC]"
            segments={[
              { text: "We hire curious students,", className: "font-normal" },
              {
                text: "hungry from day one,",
                className: "font-serif italic",
              },
              {
                text: "and teach them business from the ground up.",
                className: "font-normal",
              },
            ]}
          />
        </h2>

        <div className="mt-10">
          <RevealParagraph
            text="We're not looking for a perfect score, a fancy resume or prior experience. We're looking for confidence, communication and drive — the things that make someone great in business. Selected interns get real campaigns, real targets and mentors who teach the grass roots of how companies find customers, pitch, sell and grow. Packages range from ₹4.2 LPA to ₹6 LPA."
          />
        </div>
      </div>
    </section>
  );
}

const FEATURES = [
  {
    number: "01",
    title: "Communication.",
    icon: MessageSquare,
    items: [
      "Grammar & clarity",
      "Confident, warm expression",
      "Structured ideas",
      "Following instructions",
    ],
  },
  {
    number: "02",
    title: "Aptitude.",
    icon: Target,
    items: [
      "Basic logic & numbers",
      "Everyday problem solving",
      "Quick, calm thinking",
    ],
  },
  {
    number: "03",
    title: "Vibe Check.",
    icon: Sparkles,
    items: [
      "Energy & curiosity",
      "Coachability & attitude",
      "The 'I'll figure it out' spirit",
    ],
  },
];

function FeatureCard({
  feature,
  index,
}: {
  feature: (typeof FEATURES)[number];
  index: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={isInView ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.7, ease: EASE_CARD, delay: index * 0.15 }}
      className="flex flex-col rounded-3xl bg-[#212121] p-6 lg:h-full"
    >
      <div className="flex items-start justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded bg-white/5 sm:h-12 sm:w-12">
          <feature.icon size={20} strokeWidth={1.5} className="text-primary-400" />
        </div>
        <span className="mono-label text-primary-500/70">
          ({feature.number})
        </span>
      </div>

      <h3 className="mt-6 text-lg font-normal" style={{ color: "#E1E0CC" }}>
        {feature.title}
      </h3>

      <ul className="mt-4 flex-1 space-y-2.5">
        {feature.items.map((item) => (
          <li key={item} className="flex items-start gap-2.5">
            <Check size={15} strokeWidth={2.25} className="mt-0.5 shrink-0 text-primary" />
            <span className="text-sm text-gray-400">{item}</span>
          </li>
        ))}
      </ul>

      <a
        href="#how-it-works"
        className="group mt-6 inline-flex w-fit items-center gap-2 text-sm font-medium"
        style={{ color: "#E1E0CC" }}
      >
        Learn more
        <ArrowRight
          size={15}
          strokeWidth={1.75}
          className="-rotate-45 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:translate-y-0.5"
        />
      </a>
    </motion.div>
  );
}

export function Features() {
  const videoRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(videoRef, { once: true, margin: "-100px" });

  return (
    <section
      id="how-it-works"
      className="relative min-h-screen scroll-mt-24 bg-black py-24 md:py-32"
    >
      <div className="bg-noise pointer-events-none absolute inset-0 opacity-[0.15]" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <WordsPullUpMultiStyle
            className="text-xl font-normal text-[#E1E0CC] sm:text-2xl md:text-3xl lg:text-4xl"
            segments={[{ text: "Three rounds. Thirty minutes. Zero stress.", className: "" }]}
          />
          <WordsPullUpMultiStyle
            className="mt-4 text-xl font-normal text-slate-500 sm:text-2xl md:text-3xl lg:text-4xl"
            segments={[{ text: "Built to find real talent. Powered by human instinct.", className: "" }]}
          />
        </div>

        <div className="mt-14 grid grid-cols-1 gap-3 sm:gap-2 md:grid-cols-2 md:gap-2 lg:h-[480px] lg:grid-cols-4 lg:gap-1">
          <motion.div
            ref={videoRef}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.7, ease: EASE_CARD, delay: 0 }}
            className="relative min-h-[260px] overflow-hidden rounded-3xl sm:min-h-[320px] lg:h-full"
          >
            <video
              src={CANVAS_VIDEO}
              autoPlay
              loop
              muted
              playsInline
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="noise-overlay pointer-events-none absolute inset-0 opacity-[0.4] mix-blend-overlay" />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-6">
              <p className="text-[15px]" style={{ color: "#E1E0CC" }}>
                A calm, proctored space to do your best.
              </p>
            </div>
          </motion.div>

          {FEATURES.map((feature, i) => (
            <FeatureCard key={feature.number} feature={feature} index={i + 1} />
          ))}
        </div>
      </div>
    </section>
  );
}