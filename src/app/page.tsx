import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight,
  Camera,
  ClipboardCheck,
  Clock,
  FileSpreadsheet,
  ShieldCheck,
  TimerReset,
  Users,
} from "lucide-react";

import { AppFooter, BrandLogo } from "@/components/brand";
import { env } from "@/lib/env";
import { getAuth } from "@/lib/session";

export const metadata: Metadata = { title: "Home" };

export default async function HomePage() {
  const auth = await getAuth();
  const homeHref = auth
    ? auth.role === "ADMIN"
      ? "/admin"
      : "/candidate"
    : null;

  return (
    <div className="flex flex-1 flex-col bg-black">
      <header className="border-b border-slate-800/80">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4">
          <BrandLogo />
          <nav className="flex items-center gap-2">
            {homeHref ? (
              <Link
                href={homeHref}
                className="inline-flex h-10 items-center gap-2 rounded-full bg-primary-600 px-5 text-sm font-medium text-white hover:bg-primary-700"
              >
                Go to dashboard <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="inline-flex h-10 items-center rounded-full px-5 text-sm font-medium text-slate-500 hover:text-slate-300"
                >
                  Sign in
                </Link>
                <Link
                  href="/register"
                  className="inline-flex h-10 items-center rounded-full border border-primary-500/50 bg-primary-500/10 px-5 text-sm font-medium text-primary-400 hover:bg-primary-500/20"
                >
                  Register
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="tcc-glow mx-auto flex w-full max-w-6xl flex-1 flex-col px-4">
        <section className="grid grid-cols-1 items-center gap-12 py-20 lg:grid-cols-2">
          <div>
            <p className="mono-label text-slate-500">
              Patience — you&apos;re about to be impressed.
            </p>
            <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
              Student recruitment,
              <br />
              <span className="brand-serif font-normal text-primary-400">
                assessed with confidence.
              </span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-500">
              The {env.appName} lets candidates take a 30-minute
              three-round assessment — Communication &amp; Grammar,
              Aptitude and Vibe Check — while the recruitment team reviews
              results, proctoring logs and candidate monitoring in one place.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              {!homeHref ? (
                <>
                  <Link
                    href="/register"
                    className="inline-flex h-12 items-center gap-2 rounded-full bg-primary-600 px-7 text-base font-medium text-white hover:bg-primary-700"
                  >
                    Register to take the test <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/login"
                    className="inline-flex h-12 items-center rounded-full border border-slate-700 px-7 text-base font-medium text-slate-300 hover:border-slate-500 hover:text-white"
                  >
                    Sign in
                  </Link>
                </>
              ) : (
                <Link
                  href={homeHref}
                  className="inline-flex h-12 items-center gap-2 rounded-full bg-primary-600 px-7 text-base font-medium text-white hover:bg-primary-700"
                >
                  Open dashboard <ArrowRight className="h-4 w-4" />
                </Link>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              {
                icon: Clock,
                title: "30 minutes",
                text: "36 questions across three timed rounds.",
              },
              {
                icon: Users,
                title: "3 test sets",
                text: "Set A, Set B and Set C — assigned per candidate.",
              },
              {
                icon: Camera,
                title: "Proctored",
                text: "Camera consent and strict tab-switch monitoring.",
              },
              {
                icon: ClipboardCheck,
                title: "Structured results",
                text: "Section scores, exports and selection workflows.",
              },
            ].map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-slate-800 bg-white/5 p-5"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-500/15">
                  <f.icon className="h-5 w-5 text-primary-400" />
                </div>
                <p className="mt-3 text-sm font-semibold text-slate-900">{f.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">{f.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="grid grid-cols-1 gap-6 pb-20 md:grid-cols-3">
          {[
            {
              icon: Camera,
              title: "Photo verification",
              text: "Upload or capture a photograph before starting, securely stored and visible to admins only.",
            },
            {
              icon: TimerReset,
              title: "Server-side timer",
              text: "The 30-minute window is enforced on the server. Expired attempts are auto-submitted.",
            },
            {
              icon: FileSpreadsheet,
              title: "One-click exports",
              text: "Download complete results as CSV or Excel, plus a filtered selected-candidate list.",
            },
          ].map((c) => (
            <div
              key={c.title}
              className="rounded-2xl border border-slate-800 bg-white/5 p-6"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-500/15">
                <c.icon className="h-5 w-5 text-primary-400" />
              </div>
              <p className="mt-3 font-semibold text-slate-900">{c.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-slate-500">{c.text}</p>
            </div>
          ))}
        </section>
      </main>

      <AppFooter>
        © {new Date().getFullYear()} {env.appName}. All rights reserved.
        <span className="mx-2 text-slate-700">·</span>
        <ShieldCheck className="mr-1 inline h-3.5 w-3.5 text-primary-500" />
        Secured &amp; proctored
      </AppFooter>
    </div>
  );
}