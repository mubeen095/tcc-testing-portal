"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

import { BrandLogo } from "@/components/brand";
import { EASE_PULL, WordsPullUp } from "./prisma-text";

const HERO_VIDEO =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260405_170732_8a9ccda6-5cff-4628-b164-059c500a2b41.mp4";

const NAV = [
  { label: "Our story", href: "#story" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Roles", href: "#roles" },
  { label: "FAQ", href: "#faq" },
];

export function LandingHero({ homeHref }: { homeHref: string | null }) {
  return (
    <section className="min-h-screen p-4 md:p-6">
      <div className="relative h-full min-h-[calc(100vh-2rem)] overflow-hidden rounded-2xl md:min-h-[calc(100vh-3rem)] md:rounded-[2rem]">
        <video
          src={HERO_VIDEO}
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="noise-overlay pointer-events-none absolute inset-0 z-[1] opacity-[0.7] mix-blend-overlay" />
        <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-b from-black/30 via-transparent to-black/60" />

        {/* Floating navbar */}
        <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-5 py-4 md:px-8">
          <Link href="#" aria-label="Home">
            <BrandLogo size="sm" />
          </Link>

          <nav className="liquid-glass hidden items-center gap-1 rounded-full px-2 py-2 sm:flex">
            {NAV.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="rounded-full px-3 py-1.5 text-[11px] font-medium tracking-[0.12em] text-white/80 transition-colors duration-200 hover:text-white"
              >
                {link.label.toUpperCase()}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {homeHref ? (
              <Link
                href={homeHref}
                className="inline-flex h-10 items-center rounded-full bg-primary-500 px-5 text-sm font-medium text-[#101010] transition hover:bg-primary-600"
              >
                Open dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="hidden h-10 items-center rounded-full px-4 text-sm font-medium text-white/70 transition hover:text-white sm:inline-flex"
                >
                  Sign in
                </Link>
                <Link
                  href="/register"
                  className="inline-flex h-10 items-center rounded-full bg-primary-500 px-5 text-sm font-medium text-[#101010] transition hover:bg-primary-600"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Bottom content */}
        <div className="absolute bottom-0 left-0 right-0 z-20">
          <div className="grid grid-cols-12 items-end gap-6 px-6 pb-8 sm:px-10 md:px-14 md:pb-12">
            <div className="col-span-12 md:col-span-8">
              <p className="mono-label text-primary-300">
                We&apos;ll teach you, from zero.
              </p>
              <h1
                className="mt-3 text-white"
                style={{ color: "#E1E0CC" }}
              >
                <span className="block !text-[#E1E0CC]">
                  <WordsPullUp
                    text="Business"
                    showAsterisk
                    className="text-[26vw] font-medium !leading-[0.85] tracking-[-0.07em] sm:text-[24vw] md:text-[22vw] lg:text-[20vw]"
                  />
                </span>
                <span
                  className="block text-[26vw] font-medium leading-[0.85] tracking-[-0.07em] sm:text-[24vw] md:text-[22vw] lg:text-[20vw]"
                  style={{ color: "rgba(225,224,204,0.55)" }}
                >
                  <WordsPullUp text="unfiltered." delay={0.16} />
                </span>
              </h1>
            </div>

            <div className="col-span-12 flex flex-col gap-8 md:col-span-4">
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: EASE_PULL, delay: 0.5 }}
                className="text-primary/70 text-xs leading-[1.2] sm:text-sm md:text-base"
              >
                Wondering what we&apos;re about? One calm, 30-minute check of
                how you think, express yourself and carry yourself. Three
                rounds, zero stress — and we teach you the rest from scratch.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: EASE_PULL, delay: 0.7 }}
                className="flex flex-wrap items-center gap-4"
              >
                <Link
                  href={homeHref ?? "/register"}
                  className="group inline-flex items-center gap-4 rounded-full bg-primary-500 px-6 py-2.5 text-sm font-medium text-[#101010] transition-all duration-300 hover:gap-6 sm:px-7 sm:py-3 sm:text-base"
                >
                  {homeHref ? "Open dashboard" : "Start the assessment"}
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#101010] transition-transform duration-300 group-hover:scale-110 sm:h-9 sm:w-9">
                    <ArrowRight size={15} className="text-primary-500" strokeWidth={1.75} />
                  </span>
                </Link>
                {!homeHref ? (
                  <Link
                    href="/login"
                    className="text-xs font-medium text-white/60 underline-offset-4 transition hover:text-white hover:underline sm:text-sm"
                  >
                    I already have an account
                  </Link>
                ) : null}
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}