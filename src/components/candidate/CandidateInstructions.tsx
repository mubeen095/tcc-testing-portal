"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CameraOff,
  Camera as CameraIcon,
  CheckCircle2,
  Info,
  ShieldAlert,
  Video,
} from "lucide-react";

import { Alert, Button, Card } from "@/components/ui";
import { LoadingScreen } from "@/components/candidate/common";

type Me = {
  profile: {
    id: string;
    fullName: string;
    hasPhoto: boolean;
    cameraConsentAt: string | null;
    testSetCode: string | null;
    testSetName: string | null;
    testSetId: string | null;
  };
  attempt: {
    id: string;
    status: "IN_PROGRESS" | "COMPLETED" | "TERMINATED";
    terminationReason: string | null;
  } | null;
};

export function CandidateInstructions() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [me, setMe] = useState<Me | null>(null);
  const [cameraState, setCameraState] = useState<
    "checking" | "on" | "off" | "unsupported"
  >("checking");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const [consented, setConsented] = useState(false);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => {
    fetch("/api/candidate/me", { cache: "no-store" })
      .then(async (r) => {
        const body = await r.json();
        if (!r.ok) throw new Error(body.error ?? "Failed to load");
        return body as Me;
      })
      .then((body) => {
        if (!body.profile.hasPhoto) {
          router.replace("/candidate/photo");
          return;
        }
        if (body.attempt?.status === "COMPLETED") {
          router.replace("/candidate/completed");
          return;
        }
        if (body.attempt?.status === "TERMINATED") {
          router.replace("/candidate/terminated");
          return;
        }
        setMe(body);
        setConsented(!!body.profile.cameraConsentAt);
      })
      .catch(() => {
        setMe(null);
      });
  }, [router]);

  useEffect(() => {
    if (!me || me.profile.cameraConsentAt) {
      setCameraState(me?.profile.cameraConsentAt ? "on" : "checking");
      return;
    }
    setCameraState("checking");
    async function startCam() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraState("unsupported");
        setCameraError(
          "This browser does not support camera access. Use Chrome, Safari or Edge on a mobile phone or desktop."
        );
        await fetch("/api/candidate/checkin", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ denied: true }),
        }).catch(() => {});
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
          audio: false,
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
        setCameraState("on");
        await fetch("/api/candidate/checkin", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ granted: true }),
        }).catch(() => {});
      } catch {
        setCameraState("off");
        setCameraError(
          "Camera access is required for this assessment. Please allow camera access in your browser settings, then refresh."
        );
        await fetch("/api/candidate/checkin", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ denied: true }),
        }).catch(() => {});
      }
    }
    startCam();
    return () => stopStream();
  }, [me, stopStream]);

  function requestAgain() {
    setCameraState("checking");
    setCameraError(null);
    setMe((m) => (m ? { ...m, profile: { ...m.profile, cameraConsentAt: null } } : m));
  }

  async function start() {
    if (cameraState !== "on" || starting) return;
    setStarting(true);
    setStartError(null);
    try {
      const res = await fetch("/api/attempts/start", { method: "POST" });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStartError(body.error ?? "Unable to start the assessment.");
        setStarting(false);
        return;
      }
      router.replace("/candidate/test");
    } catch {
      setStartError("Something went wrong. Please try again.");
      setStarting(false);
    }
  }

  if (!me) return <LoadingScreen label="Preparing your assessment…" />;

  const ready = cameraState === "on";

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-8">
      <Card className="overflow-hidden">
        <div className="border-b border-slate-100 px-6 py-5">
          <h1 className="text-lg font-bold text-slate-900">
            Assessment instructions
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {me.profile.testSetName ?? `Set ${me.profile.testSetCode ?? "—"}`} ·
            Hello, {me.profile.fullName}
          </p>
        </div>

        <div className="space-y-6 px-6 py-6">
          <section>
            <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <ShieldAlert className="h-4 w-4 text-amber-500" />
              Information &amp; consent — please read carefully
            </h2>
            <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-slate-600">
              <li>
                Your personal information is collected solely for the recruitment
                assessment and is reviewed by the recruitment team.
              </li>
              <li>
                Your photograph is used for candidate identity verification only.
              </li>
              <li>
                Camera access is required during the assessment for monitoring.
                No video is recorded or uploaded.
              </li>
              <li>
                Proctoring events (start, camera status, tab switching, submission)
                may be logged and reviewed.
              </li>
              <li>
                <strong>
                  Leaving the assessment window — switching tabs, minimizing the
                  browser or switching apps — results in{" "}
                  <span className="text-rose-600">IMMEDIATE TERMINATION</span> of
                  your assessment. There are no warnings.
                </strong>
              </li>
              <li>
                Your assessment is auto-submitted when the 30-minute timer reaches
                zero.
              </li>
              <li>
                Assessment data may be deleted after the recruitment process per
                the organization&apos;s retention policy.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <Video className="h-4 w-4 text-primary-600" />
              Camera check
            </h2>
            <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="overflow-hidden rounded-2xl border border-slate-200">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full aspect-video bg-black object-cover"
                />
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  {ready ? (
                    <>
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                      <span className="font-medium text-emerald-700">
                        Camera active — monitoring is enabled
                      </span>
                    </>
                  ) : cameraState === "unsupported" ? (
                    <>
                      <CameraOff className="h-5 w-5 text-rose-600" />
                      <span className="font-medium text-rose-700">
                        Camera not supported in this browser
                      </span>
                    </>
                  ) : (
                    <>
                      <CameraIcon className="h-5 w-5 animate-pulse text-amber-600" />
                      <span className="font-medium text-amber-700">
                        Starting camera…
                      </span>
                    </>
                  )}
                </div>
                {cameraError ? (
                  <Alert tone="danger">{cameraError}</Alert>
                ) : null}
                <p className="text-xs leading-relaxed text-slate-500">
                  You must have working camera access to begin. The camera feed is
                  used to confirm you are present; footage is never recorded.
                </p>
                {cameraState === "off" || cameraState === "unsupported" ? (
                  <Button variant="outline" size="sm" onClick={requestAgain}>
                    Try camera again
                  </Button>
                ) : null}
              </div>
            </div>
          </section>

          <section>
            <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <Info className="h-4 w-4 text-primary-600" />
              Test rules
            </h2>
            <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-slate-600">
              <li>
                <strong>Duration:</strong> 30 minutes for all 36 questions.
              </li>
              <li>
                <strong>Sections:</strong> 12 × Communication &amp; Grammar, 12 ×
                Aptitude, 12 × Vibe Check. You can move freely between questions.
              </li>
              <li>
                <strong>A timer</strong> is shown at the top of the screen.
              </li>
              <li>
                Answers are saved as you go. You may change any answer until you
                submit.
              </li>
              <li>
                Submitting early is allowed. At the end of 30 minutes, the test is
                auto-submitted.
              </li>
              <li>
                Keep the test window open and focused at all times. Any tab switch
                or loss of focus terminates the test immediately.
              </li>
            </ul>
          </section>

          {startError ? <Alert tone="danger">{startError}</Alert> : null}

          <div className="flex flex-col items-stretch gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <label className="flex items-start gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={consented}
                onChange={(e) => setConsented(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300"
              />
              <span>
                I have read the notice and agree to the camera access and
                proctoring monitoring requirements.
              </span>
            </label>
            <Button
              size="lg"
              disabled={!ready || !consented || !!me.attempt}
              onClick={start}
              loading={starting}
            >
              {me.attempt ? "Assessment locked" : "Start assessment"}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}