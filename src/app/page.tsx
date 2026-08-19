import Link from "next/link";
import type { Metadata } from "next";

import { AppFooter, BrandLogo } from "@/components/brand";
import { Faq, type FaqItem } from "@/components/Faq";
import { env } from "@/lib/env";
import { getAuth } from "@/lib/session";

export const metadata: Metadata = { title: "Candidate Landing" };

const FAQS: FaqItem[] = [
  {
    q: "What is the salary / package?",
    a: "Packages range from ₹4.2 LPA to ₹6 LPA depending on the role you're offered and your performance in the assessment and interviews.",
  },
  {
    q: "Who can attend?",
    a: "Anyone — students and graduates from any stream, branch or college. There are no domain restrictions and no need for prior experience. If you're ready to learn, you can apply.",
  },
  {
    q: "Will you actually teach us?",
    a: "100%. We don't expect you to know sales or marketing already. We teach you the grass roots of business from scratch — how companies find customers, pitch, sell and grow — so you join us ready to do real work.",
  },
  {
    q: "What will you look at in this round?",
    a: "Your confidence, communication and attitude. This isn't a grueling exam — it's a friendly, 30-minute check of how you think, express yourself and carry yourself.",
  },
  {
    q: "How long is the assessment?",
    a: "30 minutes, 36 questions across three sections: Communication & Grammar, Aptitude and a Vibe Check.",
  },
  {
    q: "Is the test proctored?",
    a: "Yes. You'll be asked for camera permission and tab-switching is monitored — please don't open other tabs during the test.",
  },
  {
    q: "Do I need to prepare or study anything?",
    a: "No. Just show up with a clear head and good energy. Take a deep breath before you begin — we're rooting for you.",
  },
  {
    q: "What happens after I submit?",
    a: "Your results go to the recruitment team. Shortlisted candidates are contacted for the next round. You can track your status from your candidate dashboard.",
  },
];

const ROLES = [
  {
    title: "Marketing Intern",
    blurb: "Learn to plan and run real campaigns that get people talking.",
    jd: [
      "Assist in social media, content and brand marketing",
      "Help plan and execute campaigns & creative assets",
      "Track performance and learn what actually converts",
      "Grow into owning channels end-to-end",
    ],
  },
  {
    title: "Inside Sales Intern",
    blurb: "Learn the art of opening conversations and closing deals.",
    jd: [
      "Reach out to leads, pitch, handle objections and follow up",
      "Learn consultative selling and CRM discipline",
      "Own your targets with a mentor guiding you daily",
      "Build communication skills used for life",
    ],
  },
  {
    title: "Lead Generation Intern",
    blurb: "Become the person who finds the people who'll buy.",
    jd: [
      "Research markets and build targeted lead lists",
      "Reach out via email, LinkedIn and calls to qualify leads",
      "Learn prospecting frameworks and data tools",
      "Feed clean, qualified pipeline to the sales team",
    ],
  },
  {
    title: "SLO (Sales & Lead Officer)",
    blurb: "Own the funnel from first touch to signed deal.",
    jd: [
      "Combine lead generation and sales into one growth track",
      "Manage end-to-end outreach, follow-ups and closing",
      "Work with strategy on targets, scripts and process",
      "Fast track to team leadership for top performers",
    ],
  },
];

const STEPS = [
  {
    title: "Create your account",
    text: "Register in under two minutes with your email and basic details.",
  },
  {
    title: "Add your photo",
    text: "Upload or capture a clear photo of yourself — it goes to the recruitment team only.",
  },
  {
    title: "Camera consent",
    text: "Allow camera access and read the short instructions. We keep an eye on focus, not on judging you.",
  },
  {
    title: "30 minutes, 3 rounds",
    text: "Communication & Grammar, Aptitude and a Vibe Check. A test set is assigned to you automatically.",
  },
  {
    title: "Stay in one tab",
    text: "Your answers auto-save. Switching tabs can end your test early, so stay focused.",
  },
  {
    title: "Submit & relax",
    text: "Hit submit and you're done. Our team reviews your results and reaches out for the next round.",
  },
];

const QUALITIES = [
  {
    title: "Confidence",
    text: "Will you raise your hand? We want the student who says 'I'll figure it out.'",
  },
  {
    title: "Communication",
    text: "Clear, warm, structured. Grammar and vocabulary matter less than being understood.",
  },
  {
    title: "Aptitude",
    text: "Basic problem-solving and logic. Nothing beyond what you already know.",
  },
  {
    title: "Vibe / Attitude",
    text: "Energy, curiosity and coachability. Attitude determines altitude.",
  },
];

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
                className="inline-flex h-10 items-center rounded-full bg-primary-600 px-5 text-sm font-medium text-white hover:bg-primary-700"
              >
                Go to dashboard
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
        {/* Hero */}
        <section className="flex flex-col items-center py-20 text-center">
          <p className="mono-label text-primary-400">
            Patience — you&apos;re about to be impressed.
          </p>
          <h1 className="mt-5 max-w-4xl text-4xl font-extrabold tracking-tight text-slate-900 sm:text-6xl">
            We&apos;ll teach you the{" "}
            <span className="brand-serif font-normal text-primary-400">
              grass roots of business.
            </span>
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-slate-500 sm:text-lg">
            {env.appName} is hiring curious students as interns — and we don&apos;t
            expect you to know everything. This first round is a friendly
            30-minute check of how you think and how you carry yourself.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            {!homeHref ? (
              <>
                <Link
                  href="/register"
                  className="inline-flex h-12 items-center rounded-full bg-primary-600 px-7 text-base font-medium text-white hover:bg-primary-700"
                >
                  Start the assessment
                </Link>
                <Link
                  href="/login"
                  className="inline-flex h-12 items-center rounded-full border border-slate-700 px-7 text-base font-medium text-slate-300 hover:border-slate-500 hover:text-white"
                >
                  I already have an account
                </Link>
              </>
            ) : (
              <Link
                href={homeHref}
                className="inline-flex h-12 items-center rounded-full bg-primary-600 px-7 text-base font-medium text-white hover:bg-primary-700"
              >
                Open dashboard
              </Link>
            )}
          </div>
        </section>

        {/* Deep breath */}
        <section className="mx-auto mb-20 w-full max-w-3xl overflow-hidden rounded-3xl border border-slate-800 bg-white/5">
          <div className="flex flex-col items-center gap-4 px-6 py-10 text-center sm:px-10">
            <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              Before you begin — take a deep breath.
            </h2>
            <p className="max-w-xl text-sm leading-relaxed text-slate-500 sm:text-base">
              In… for four seconds. Hold. Out… for four seconds. Now feel better?
              That&apos;s the person we want to meet — calm, confident, ready. This
              assessment measures your potential, not your perfection.
            </p>
            <span className="mono-label mt-1 text-slate-500">
              Inhale · Hold · Exhale
            </span>
          </div>
        </section>

        {/* What this round looks at */}
        <section className="mb-20">
          <div className="mb-8 flex flex-col items-center text-center">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">
              What this round looks for
            </h2>
            <p className="mt-3 max-w-2xl text-sm text-slate-500 sm:text-base">
              We&apos;re not looking for a perfect score. We&apos;re looking for the
              things that make someone great in business.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {QUALITIES.map((c) => (
              <div
                key={c.title}
                className="rounded-2xl border border-slate-800 bg-white/5 p-6"
              >
                <p className="font-semibold text-slate-900">{c.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-slate-500">{c.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Test instructions */}
        <section className="mb-20">
          <div className="mb-8 flex flex-col items-center text-center">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">
              How the assessment works
            </h2>
            <p className="mt-3 max-w-2xl text-sm text-slate-500 sm:text-base">
              Six simple steps, 30 minutes of your time, zero stress.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {STEPS.map((s, i) => (
              <div
                key={s.title}
                className="rounded-2xl border border-slate-800 bg-white/5 p-6"
              >
                <span className="mono-label text-primary-400">
                  {(i + 1).toString().padStart(2, "0")}
                </span>
                <p className="mt-3 font-semibold text-slate-900">{s.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-slate-500">{s.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Roles & JDs */}
        <section className="mb-20">
          <div className="mb-8 flex flex-col items-center text-center">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">
              Roles we&apos;re offering
            </h2>
            <p className="mt-3 max-w-2xl text-sm text-slate-500 sm:text-base">
              Four internship tracks. One goal: teach you business from the
              ground up. Packages range from ₹4.2 to ₹6 LPA.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {ROLES.map((r) => (
              <div
                key={r.title}
                className="rounded-2xl border border-slate-800 bg-white/5 p-6"
              >
                <p className="font-semibold text-slate-900">{r.title}</p>
                <p className="text-sm text-slate-500">{r.blurb}</p>
                <ul className="mt-4 space-y-2">
                  {r.jd.map((line) => (
                    <li
                      key={line}
                      className="flex items-start gap-2 text-sm text-slate-500"
                    >
                      <span className="mt-[9px] h-px w-3 shrink-0 bg-primary-400" />
                      {line}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="mb-20">
          <div className="mb-8 flex flex-col items-center text-center">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">
              Questions students ask us
            </h2>
            <p className="mt-3 text-sm text-slate-500">
              If it&apos;s on your mind, it&apos;s probably here.
            </p>
          </div>
          <div className="mx-auto max-w-3xl">
            <Faq items={FAQS} />
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto mb-20 w-full max-w-3xl overflow-hidden rounded-3xl border border-slate-800 tcc-glow">
          <div className="flex flex-col items-center gap-4 px-6 py-12 text-center sm:px-10">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">
              Ready to show us your best self?
            </h2>
            <p className="max-w-xl text-sm leading-relaxed text-slate-500 sm:text-base">
              Another deep breath in… and out. Then press start. We&apos;re honestly
              excited to meet you.
            </p>
            {!homeHref ? (
              <Link
                href="/register"
                className="mt-2 inline-flex h-12 items-center rounded-full bg-primary-600 px-7 text-base font-medium text-white hover:bg-primary-700"
              >
                Register to take the test
              </Link>
            ) : (
              <Link
                href={homeHref}
                className="mt-2 inline-flex h-12 items-center rounded-full bg-primary-600 px-7 text-base font-medium text-white hover:bg-primary-700"
              >
                Open dashboard
              </Link>
            )}
          </div>
        </section>
      </main>

      <AppFooter>
        © {new Date().getFullYear()} {env.appName}. Internship recruitment.
        <span className="mx-2 text-slate-700">·</span>
        Secured &amp; proctored
      </AppFooter>
    </div>
  );
}