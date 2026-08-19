"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

import { BrandLogo } from "@/components/brand";
import { env } from "@/lib/env";
import { EASE_PULL } from "./prisma-text";

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
        <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-4 py-3.5 sm:px-5 sm:py-4 md:px-8">
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
                  className="inline-flex h-10 items-center rounded-full px-3 text-sm font-medium text-white/70 transition hover:text-white sm:px-4"
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

        {/* Mobile anchor nav */}
        <nav className="liquid-glass absolute left-1/2 top-[4.75rem] z-10 flex w-max max-w-[calc(100%-1.5rem)] -translate-x-1/2 items-center gap-1 overflow-x-auto whitespace-nowrap rounded-full px-2 py-1.5 sm:hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {NAV.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="shrink-0 rounded-full px-3 py-1.5 text-[10px] font-medium tracking-[0.12em] text-white/80 transition-colors duration-200 hover:text-white"
            >
              {link.label.toUpperCase()}
            </a>
          ))}
        </nav>

        {/* Bottom content */}
        <div className="relative z-20 mt-28 md:mt-0 md:absolute md:inset-x-0 md:bottom-0">
          <div className="mx-auto grid w-full max-w-7xl grid-cols-12 items-end gap-x-4 gap-y-8 px-6 pb-10 sm:px-10 md:gap-x-10 md:px-14 md:pb-12">
            <div className="col-span-12 min-w-0 md:col-span-7">
              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: EASE_PULL, delay: 0.25 }}
                className="mono-label text-primary-400"
              >
                {env.appName} · Internships open right now
              </motion.p>
              <motion.h1
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.9, ease: EASE_PULL, delay: 0.35 }}
                className="mt-5 max-w-3xl text-3xl font-normal leading-[0.98] tracking-[-0.02em] text-[#E1E0CC] sm:text-5xl md:text-6xl lg:text-7xl"
              >
                We hire you for{" "}
                <span className="brand-serif text-primary-500">who you are</span>
                , not what you know.
              </motion.h1>
            </div>

            <div className="col-span-12 flex min-w-0 flex-col gap-8 md:col-span-5">
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: EASE_PULL, delay: 0.5 }}
                className="text-sm leading-relaxed text-[#E1E0CC]/75 sm:text-base md:text-base"
              >
                Here&apos;s the deal — {env.appName} hires curious interns
                for Marketing, Inside Sales and Lead Generation — no
                experience needed. This calm, 30-minute round checks how you
                think and how you carry yourself. Pass it, and we teach you
                the grass roots of business from scratch, on the job.
                Packages go up to ₹4.2–6 LPA.
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