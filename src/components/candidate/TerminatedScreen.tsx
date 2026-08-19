"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MailQuestion, ShieldAlert } from "lucide-react";

import { Card } from "@/components/ui";
import { LogoutButton } from "@/components/candidate/common";

export function TerminatedScreen() {
  const router = useRouter();
  const [loaded, setLoaded] = useState(false);
  const [reason, setReason] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/candidate/me", { cache: "no-store" })
      .then(async (r) => {
        const body = await r.json().catch(() => ({}));
        const status = body.attempt?.status;
        if (status === "IN_PROGRESS") {
          router.replace("/candidate/test");
        } else if (status === "COMPLETED") {
          router.replace("/candidate/completed");
        } else if (status === "TERMINATED") {
          setReason(body.attempt?.terminationReason ?? null);
          setLoaded(true);
        } else {
          router.replace("/candidate");
        }
      })
      .catch(() => router.replace("/candidate"));
  }, [router]);

  if (!loaded) return null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <Card className="w-full max-w-lg p-8 text-center sm:p-10">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-100 text-rose-600">
          <ShieldAlert className="h-9 w-9" />
        </div>
        <h1 className="mt-5 text-2xl font-bold text-slate-900">
          Assessment Terminated
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          Your assessment has been terminated because the test window was left
          during the assessment.
        </p>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Your submission has been recorded.
        </p>
        {reason ? (
          <span className="mt-3 inline-flex rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-600">
            Reason: {reason.replace("_", " ")}
          </span>
        ) : null}
        <p className="mt-4 text-sm leading-relaxed text-slate-600">
          Please contact the recruitment team if you believe this happened in
          error.
        </p>
        <div className="mt-7 flex items-center justify-center gap-3">
          <LogoutButton label="Sign out" />
        </div>
        <p className="mt-4 inline-flex items-center gap-1.5 text-xs text-slate-400">
          <MailQuestion className="h-3.5 w-3.5" /> This assessment is locked and
          cannot be restarted.
        </p>
      </Card>
    </div>
  );
}