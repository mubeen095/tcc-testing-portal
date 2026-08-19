"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";

import { Card } from "@/components/ui";
import { LogoutButton } from "@/components/candidate/common";

export function CompletedScreen() {
  const router = useRouter();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/candidate/me", { cache: "no-store" })
      .then(async (r) => {
        const body = await r.json().catch(() => ({}));
        const status = body.attempt?.status;
        if (status === "IN_PROGRESS") {
          router.replace("/candidate/test");
        } else if (status === "TERMINATED") {
          router.replace("/candidate/terminated");
        } else if (status === "COMPLETED") {
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
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <CheckCircle2 className="h-9 w-9" />
        </div>
        <h1 className="mt-5 text-2xl font-bold text-slate-900">
          Assessment Submitted Successfully
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          Thank you for completing the assessment. Your responses have been
          recorded and the 30-minute window is now closed.
        </p>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Your results will be reviewed by our recruitment team. Please keep an
          eye on your email for the next steps.
        </p>
        <div className="mt-7">
          <LogoutButton label="Sign out" />
        </div>
      </Card>
    </div>
  );
}