"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  CircleDot,
  Timer,
} from "lucide-react";

import { Alert, Button, Card } from "@/components/ui";
import { AttemptBadge } from "@/components/badges";
import { LoadingScreen, LogoutButton } from "@/components/candidate/common";

type DashboardData = {
  profile: {
    id: string;
    fullName: string;
    email: string;
    phone: string;
    college: string;
    branch: string;
    academicYear: string;
    rollNumber: string;
    photoUrl: string | null;
    hasPhoto: boolean;
    cameraConsentAt: string | null;
    testSetId: string | null;
    testSetCode: string | null;
    testSetName: string | null;
  };
  attempt: {
    id: string;
    status: "IN_PROGRESS" | "COMPLETED" | "TERMINATED";
    terminationReason: string | null;
    startedAt: string | null;
    expiresAt: string | null;
    submittedAt: string | null;
    terminatedAt: string | null;
  } | null;
};

export function CandidateDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/candidate/me", { cache: "no-store" })
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) throw new Error(body.error ?? "Failed to load dashboard");
        setData(body);
      })
      .catch((e) => setError(e.message));
  }, []);

  if (error) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-10">
        <Alert tone="danger">{error}</Alert>
      </div>
    );
  }
  if (!data) return <LoadingScreen label="Loading your dashboard…" />;

  const { profile, attempt } = data;
  const started = attempt ? !["IN_PROGRESS"].includes(attempt.status) : false;
  const canTakeTest =
    attempt === null && profile.hasPhoto && profile.cameraConsentAt && profile.testSetId;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-primary-800 text-lg font-bold text-white shadow">
            {profile.fullName
              .split(" ")
              .slice(0, 2)
              .map((s) => s[0])
              .join("")
              .toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              Hello, {profile.fullName}
            </h1>
            <p className="text-sm text-slate-500">{profile.email}</p>
          </div>
        </div>
        <LogoutButton />
      </header>

      {!profile.testSetId && !attempt ? (
        <Alert tone="warning">
          <strong>No test set assigned yet.</strong> The recruitment team will
          assign your paper set (A, B or C). Check back shortly.
        </Alert>
      ) : null}

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
            Your details
          </h2>
          <dl className="mt-3 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
            {[
              ["College", profile.college],
              ["Branch", profile.branch],
              ["Academic year", profile.academicYear],
              ["Roll number", profile.rollNumber],
              ["Phone", profile.phone],
              ["Test set", profile.testSetCode ?? "Not assigned"],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="text-xs text-slate-400">{k}</dt>
                <dd className="mt-0.5 font-medium text-slate-800">{v}</dd>
              </div>
            ))}
          </dl>
        </Card>

        <Card className="p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
            Assessment status
          </h2>
          <div className="mt-3 flex items-center gap-2">
            {attempt ? (
              <AttemptBadge status={attempt.status} />
            ) : (
              <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                Not Started
              </span>
            )}
          </div>
          {attempt?.status === "IN_PROGRESS" && (
            <div className="mt-3 space-y-2 text-sm text-slate-600">
              <p className="flex items-center gap-1.5 text-amber-700">
                <Timer className="h-4 w-4" /> Started, time is running.
              </p>
              <Link href="/candidate/test">
                <Button className="w-full" variant="outline">
                  Resume assessment
                </Button>
              </Link>
            </div>
          )}
          {attempt?.status === "COMPLETED" && (
            <div className="mt-3">
              <Link href="/candidate/completed">
                <Button className="w-full">View completion screen</Button>
              </Link>
            </div>
          )}
          {attempt?.status === "TERMINATED" && (
            <div className="mt-3">
              <Link href="/candidate/terminated">
                <Button className="w-full" variant="danger">
                  View termination notice
                </Button>
              </Link>
            </div>
          )}
          {started ? (
            <p className="mt-3 text-xs text-slate-500">
              Your results are being reviewed by the recruitment team.
            </p>
          ) : null}
        </Card>
      </section>

      {attempt === null ? (
        <Card>
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="text-base font-semibold text-slate-900">
              Prepare for your assessment
            </h2>
            <p className="mt-0.5 text-sm text-slate-500">
              Follow these steps to unlock your 30-minute, three-round
              assessment.
            </p>
          </div>
          <ol className="divide-y divide-slate-100 px-5">
            <Step
              done={profile.hasPhoto}
              title="Submit your photograph"
              description="Capture or upload a recent photo for identity verification. A photo is required before you can start."
              href="/candidate/photo"
              cta={profile.hasPhoto ? "Change photo" : "Upload photo"}
            />
            <Step
              done={!!profile.cameraConsentAt}
              title="Camera check & assessment instructions"
              description="You must grant camera access and read the consent notice and rules before starting."
              href="/candidate/instructions"
              cta={!!profile.cameraConsentAt ? "Review instructions" : "Continue"}
            />
          </ol>
          <div className="border-t border-slate-100 px-5 py-4">
            {canTakeTest ? (
              <Link href="/candidate/test">
                <Button size="lg" className="w-full sm:w-auto">
                  Start assessment
                </Button>
              </Link>
            ) : (
              <Button size="lg" className="w-full sm:w-auto" disabled variant="secondary">
                Complete the steps above to start
              </Button>
            )}
          </div>
        </Card>
      ) : null}
    </div>
  );
}

function Step({
  done,
  title,
  description,
  href,
  cta,
}: {
  done: boolean;
  title: string;
  description: string;
  href: string;
  cta: string;
}) {
  return (
    <li className="flex items-start justify-between gap-4 py-4">
      <div className="flex items-start gap-3">
        <span
          className={`mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
            done ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400"
          }`}
        >
          {done ? <CheckCircle2 className="h-5 w-5" /> : <CircleDot className="h-5 w-5" />}
        </span>
        <div>
          <p className="text-sm font-semibold text-slate-900">{title}</p>
          <p className="mt-0.5 text-sm text-slate-500">{description}</p>
        </div>
      </div>
      <Link href={href} className="shrink-0">
        <Button variant="outline" size="sm">
          {cta}
        </Button>
      </Link>
    </li>
  );
}