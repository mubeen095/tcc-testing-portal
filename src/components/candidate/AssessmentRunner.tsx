"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Circle,
  Flag,
  LayoutGrid,
  Send,
  TimerIcon,
  Video,
  XCircle,
} from "lucide-react";

import { Alert, Button, Modal } from "@/components/ui";
import { SECTION_LABELS } from "@/lib/env";
import { LoadingScreen } from "@/components/candidate/common";

type Section = "COMMUNICATION" | "APTITUDE" | "VIBE";

type Question = {
  id: string;
  section: Section;
  number: number;
  text: string;
  marks: number;
  options: { id: string; text: string; order: number }[];
};

type AttemptState = {
  id: string;
  testSetCode: string | null;
  status: "IN_PROGRESS" | "COMPLETED" | "TERMINATED";
  startedAt: string;
  expiresAt: string;
};

type Payload = {
  attempt: AttemptState;
  questions: Question[];
  answers: Record<string, string>;
  remainingMs: number;
  serverTime: number;
  candidateName: string;
};

function formatClock(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function AssessmentRunner() {
  const router = useRouter();
  const [payload, setPayload] = useState<Payload | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [savingQ, setSavingQ] = useState<string | null>(null);
  const [now, setNow] = useState<number>(() => Date.now());
  const [isTerminated, setIsTerminated] = useState(false);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [cameraStatus, setCameraStatus] = useState<"on" | "off">("on");
  const [navOpen, setNavOpen] = useState(false);

  const streamRef = useRef<MediaStream | null>(null);
  const terminatedRef = useRef(false);
  const completingRef = useRef(false);
  const answersRef = useRef<Record<string, string>>({});
  const mountedRef = useRef(false);

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  const attemptId = payload?.attempt.id ?? null;
  const expiresAtMs = payload ? new Date(payload.attempt.expiresAt).getTime() : null;
  const remainingMs = expiresAtMs !== null ? Math.max(0, expiresAtMs - now) : payload?.remainingMs ?? 0;

  // ---------- initial load ----------
  useEffect(() => {
    mountedRef.current = true;
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/attempts/current", { cache: "no-store" });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body.error ?? "Failed to load assessment");

        if (!body.attempt) {
          router.replace("/candidate");
          return;
        }

        const attempt: AttemptState = body.attempt;
        if (attempt.status === "TERMINATED") {
          router.replace("/candidate/terminated");
          return;
        }
        if (attempt.status === "COMPLETED") {
          router.replace("/candidate/completed");
          return;
        }

        if (!cancelled) {
          setPayload({
            attempt,
            questions: body.questions ?? [],
            answers: body.answers ?? {},
            remainingMs: body.remainingMs ?? 0,
            serverTime: body.serverTime ?? Date.now(),
            candidateName: body.attempt.candidateName ?? "",
          });
          setAnswers(body.answers ?? {});
          setNow(Date.now());
        }
      } catch (e) {
        if (!cancelled) setLoadError((e as Error).message);
      }
    }
    load();
    return () => {
      cancelled = true;
      mountedRef.current = false;
    };
  }, [router]);

  // ---------- timers ----------
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // name + camera events recorded on attempt start
  const finish = useCallback(
    (target: "completed" | "terminated") => {
      if (completingRef.current) return;
      completingRef.current = true;
      router.replace(`/candidate/${target}`);
      router.refresh();
    },
    [router]
  );

  // ---------- camera monitor ----------
  const stopCameraMonitor = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const handleTermination = useCallback(() => {
    if (terminatedRef.current || !attemptId) return;
    terminatedRef.current = true;
    setIsTerminated(true);
    stopCameraMonitor();
    const body = JSON.stringify({ reason: "TAB_SWITCH" });
    fetch(`/api/attempts/${attemptId}/terminate`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
      keepalive: true,
    })
      .catch(() => {})
      .finally(() => {
        finish("terminated");
      });
  }, [attemptId, finish, stopCameraMonitor]);

  // Auto-submit when timer reaches zero
  useEffect(() => {
    if (payload && remainingMs <= 0 && attemptId && !terminatedRef.current) {
      void (async () => {
        if (completingRef.current) return;
        completingRef.current = true;
        try {
          await fetch(`/api/attempts/${attemptId}/submit`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ auto: true }),
          });
        } finally {
          finish("completed");
        }
      })();
    }
  }, [remainingMs, payload, attemptId, finish]);

  // ---------- strict termination listeners ----------
  useEffect(() => {
    if (!attemptId || !payload) return;
    // Ignore initial mount blur/visibility flickers.
    const armedAt = Date.now() + 1200;

    function onVisibilityChange() {
      if (Date.now() < armedAt) return;
      if (document.visibilityState === "hidden") handleTermination();
    }
    function onBlur() {
      if (Date.now() < armedAt) return;
      handleTermination();
    }
    function onPageHide() {
      handleTermination();
    }
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("blur", onBlur);
    window.addEventListener("pagehide", onPageHide);
    window.addEventListener("beforeunload", onPageHide);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("pagehide", onPageHide);
      window.removeEventListener("beforeunload", onPageHide);
    };
  }, [attemptId, payload, handleTermination]);

  // ---------- periodic server sync (catches server-side expiry/termination) ----------
  useEffect(() => {
    if (!attemptId) return;
    const t = setInterval(async () => {
      if (terminatedRef.current || completingRef.current) return;
      try {
        const res = await fetch("/api/attempts/current", { cache: "no-store" });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) return;
        if (!body.attempt) return;
        const st = body.attempt.status;
        if (st === "TERMINATED" && !terminatedRef.current) {
          terminatedRef.current = true;
          setIsTerminated(true);
          finish("terminated");
        } else if (st === "COMPLETED" && !completingRef.current) {
          finish("completed");
        }
      } catch {
        /* transient */
      }
    }, 15000);
    return () => clearInterval(t);
  }, [attemptId, finish]);

  // ---------- camera monitor ----------
  useEffect(() => {
    if (!attemptId) return;
    let cancelled = false;
    let cameraOn = false;

    async function ensureCamera() {
      try {
        if (
          streamRef.current &&
          streamRef.current.getVideoTracks().some((t) => t.readyState === "live")
        ) {
          return true;
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
          audio: false,
        });
        streamRef.current = stream;
        return true;
      } catch {
        return false;
      }
    }

    async function monitor() {
      await ensureCamera().then((ok) => {
        if (!cancelled && !cameraOn) setCameraStatus(ok ? "on" : "off");
      });
      const t = setInterval(async () => {
        if (cancelled || terminatedRef.current || completingRef.current) return;
        const live =
          !!streamRef.current &&
          streamRef.current.getVideoTracks().some((t) => t.readyState === "live");
        if (!live && cameraOn) {
          await fetch(`/api/attempts/${attemptId}/proctoring`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ type: "CAMERA_DISCONNECTED", detail: "Camera track ended or disconnected" }),
          }).catch(() => {});
          cameraOn = false;
          setCameraStatus("off");
          const ok = await ensureCamera();
          if (ok) {
            await fetch(`/api/attempts/${attemptId}/proctoring`, {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ type: "CAMERA_RECONNECTED", detail: "Camera feed re-established" }),
            }).catch(() => {});
            cameraOn = true;
            setCameraStatus("on");
          } else {
            await fetch(`/api/attempts/${attemptId}/proctoring`, {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ type: "CAMERA_PERMISSION_DENIED", detail: "Could not reconnect camera" }),
            }).catch(() => {});
          }
        } else if (live && !cameraOn) {
          cameraOn = true;
          setCameraStatus("on");
        }
      }, 5000);
      return t;
    }

    let timer: ReturnType<typeof setInterval> | undefined;
    monitor().then((t) => {
      timer = t;
    });

    return () => {
      if (timer) clearInterval(timer);
      cancelled = true;
    };
  }, [attemptId]);

  // ---------- answer saving ----------
  async function saveAnswer(questionId: string, optionId: string) {
    if (!attemptId) return;
    const target = answersRef.current[questionId] === optionId ? null : optionId;
    const next = { ...answersRef.current };
    if (target === null) delete next[questionId];
    else next[questionId] = optionId;
    setAnswers(next);
    setSavingQ(questionId);

    try {
      const res = await fetch(`/api/attempts/${attemptId}/answer`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ questionId, optionId: target }),
      });
      if (res.status === 409) {
        const body = await res.json().catch(() => ({}));
        if (body.status === "COMPLETED") finish("completed");
        if (body.status === "TERMINATED") finish("terminated");
      } else if (!res.ok) {
        setAnswers(answersRef.current);
      }
    } catch {
      setAnswers(answersRef.current);
    } finally {
      setSavingQ((q) => (q === questionId ? null : q));
    }
  }

  async function submitNow() {
    if (!attemptId || submitting) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch(`/api/attempts/${attemptId}/submit`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ auto: false }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        if (body.status === "TERMINATED") {
          finish("terminated");
          return;
        }
        setSubmitError(body.error ?? "Submission failed. Please try again.");
        setSubmitting(false);
        return;
      }
      finish("completed");
    } catch {
      setSubmitError("Network error during submission. Please try again.");
      setSubmitting(false);
    }
  }

  // ---------- derived UI state ----------
  const questions = payload?.questions ?? [];
  const totalQuestions = questions.length;
  const currentQuestion = questions[current];
  const answeredCount = Object.keys(answers).length;

  const questionStatus = useMemo(() => {
    const map = new Map<string, "answered" | "current" | "unanswered">();
    const list = payload?.questions ?? [];
    for (const q of list) {
      if (q.id === list[current]?.id) map.set(q.id, "current");
      else if (answers[q.id]) map.set(q.id, "answered");
      else map.set(q.id, "unanswered");
    }
    return map;
  }, [payload, current, answers]);

  const dangerTimer = remainingMs < 5 * 60 * 1000 && payload !== null;

  if (loadError) {
    return (
      <div className="mx-auto w-full max-w-xl px-4 py-20">
        <Alert tone="danger">{loadError}</Alert>
        <div className="mt-4 text-center">
          <Button onClick={() => window.location.reload()} variant="outline">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!payload) return <LoadingScreen label="Loading your assessment…" />;

  if (payload.questions.length === 0) {
    return (
      <div className="mx-auto w-full max-w-xl px-4 py-20 text-center">
        <Alert tone="warning">
          No active questions found. Contact the recruitment team.
        </Alert>
      </div>
    );
  }

  if (isTerminated) {
    return (
      <div className="mx-auto w-full max-w-xl px-4 py-24 text-center">
        <XCircle className="mx-auto h-12 w-12 text-rose-500" />
        <h1 className="mt-4 text-xl font-bold text-slate-900">
          Assessment Terminated
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Your answers have been recorded. Redirecting…</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-800 text-sm font-bold text-white sm:inline-flex">
              TCC
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">
                {payload.candidateName}
              </p>
              <p className="text-xs text-slate-500">
                Set {payload.attempt.testSetCode ?? "—"} · {totalQuestions} questions
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <span
              className={`hidden items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold sm:inline-flex ${
                cameraStatus === "on"
                    ? "bg-emerald-50 text-emerald-600"
                    : "bg-rose-50 text-rose-600"
              }`}
            >
              <Video className="h-3.5 w-3.5" />
              {cameraStatus === "on" ? "Camera on" : "Camera off"}
            </span>
            <span
              className={`inline-flex items-center gap-2 rounded-xl px-3 py-1.5 font-mono text-lg font-bold tabular-nums ${
                dangerTimer ? "bg-rose-600 text-white" : "bg-black text-white"
              }`}
              title="Time remaining"
            >
              <TimerIcon className="h-4 w-4" />
              {formatClock(remainingMs)}
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_260px]">
          {/* Left: question */}
          <section className="min-w-0">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-semibold text-primary-700">
                  Question {currentQuestion.number} of {totalQuestions}
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                    currentQuestion.section === "COMMUNICATION"
                      ? "bg-indigo-50 text-indigo-700"
                      : currentQuestion.section === "APTITUDE"
                      ? "bg-violet-50 text-violet-700"
                      : "bg-teal-50 text-teal-700"
                  }`}
                >
                  {SECTION_LABELS[currentQuestion.section]}
                  <span className="opacity-70">· {currentQuestion.marks} pt</span>
                </span>
              </div>

              <h2 className="text-lg font-medium leading-relaxed text-slate-900">
                {currentQuestion.text}
              </h2>

              <div className="mt-6 space-y-3">
                {currentQuestion.options.map((opt) => {
                  const selected = answers[currentQuestion.id] === opt.id;
                  return (
                    <button
                      key={opt.id}
                      disabled={isTerminated}
                      onClick={() => saveAnswer(currentQuestion.id, opt.id)}
                      className={`group flex w-full items-start gap-3 rounded-xl border-2 px-4 py-3 text-left transition ${
                        selected
                          ? "border-primary-500 bg-primary-50"
                          : "border-slate-200 bg-white hover:border-primary-300 hover:bg-primary-50/40"
                      }`}
                    >
                      <span
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                          selected
                            ? "border-primary-500 bg-primary-500"
                            : "border-slate-300 bg-white group-hover:border-primary-400"
                        }`}
                      >
                        {selected ? (
                          <span className="h-2 w-2 rounded-full bg-[#101010]" />
                        ) : null}
                      </span>
                      <span className="text-sm leading-relaxed text-slate-800">
                        {opt.text}
                      </span>
                      {savingQ === currentQuestion.id && selected ? (
                        <span className="ml-auto shrink-0 text-[11px] text-slate-400">
                          saving…
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>

              <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-5">
                <Button
                  variant="outline"
                  disabled={current === 0}
                  onClick={() => setCurrent((c) => Math.max(0, c - 1))}
                >
                  <ArrowLeft className="h-4 w-4" /> Previous
                </Button>
                <span className="text-sm text-slate-500">
                  {answeredCount} of {totalQuestions} answered
                </span>
                {current < totalQuestions - 1 ? (
                  <Button onClick={() => setCurrent((c) => Math.min(totalQuestions - 1, c + 1))}>
                    Next <ArrowRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button variant="success" onClick={() => setConfirmSubmit(true)}>
                    <Send className="h-4 w-4" /> Submit
                  </Button>
                )}
              </div>
            </div>
          </section>

          {/* Right: navigation */}
          <aside className="lg:sticky lg:top-20 lg:h-[calc(100vh-6rem)]">
            <div
              className={`rounded-2xl border border-slate-200 bg-white shadow-sm ${
                navOpen ? "" : "lg:h-full"
              }`}
            >
              <button
                onClick={() => setNavOpen((o) => !o)}
                className="flex w-full items-center justify-between px-4 py-3 text-sm font-semibold text-slate-900 lg:cursor-default"
              >
                <span className="flex items-center gap-2">
                  <LayoutGrid className="h-4 w-4 text-primary-600" />
                  Question navigator
                </span>
                <span className="lg:hidden">
                  <ChevronDown className={`h-4 w-4 transition ${navOpen ? "rotate-180" : ""}`} />
                </span>
              </button>
              <div
                className={`${
                  navOpen ? "block" : "hidden"
                } px-4 pb-4 lg:block`}
              >
                <div className="mb-3 flex gap-3 text-[11px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Answered
                  </span>
                  <span className="flex items-center gap-1">
                    <Circle className="h-3.5 w-3.5 text-slate-500" /> Unanswered
                  </span>
                  <span className="flex items-center gap-1">
                    <Flag className="h-3.5 w-3.5 text-primary-600" /> Current
                  </span>
                </div>

                {(["COMMUNICATION", "APTITUDE", "VIBE"] as Section[]).map((section) => (
                  <div key={section} className="mb-3">
                    <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                      {SECTION_LABELS[section]}
                    </p>
                    <div className="grid grid-cols-6 gap-1.5 lg:grid-cols-4">
                      {questions
                        .filter((q) => q.section === section)
                        .map((q) => {
                          const status = questionStatus.get(q.id);
                          return (
                            <button
                              key={q.id}
                              onClick={() => {
                                setCurrent(questions.findIndex((x) => x.id === q.id));
                                setNavOpen(false);
                              }}
                              title={`Question ${q.number}`}
                              className={`flex h-9 items-center justify-center rounded-lg text-xs font-semibold transition ${
                                status === "current"
                                  ? "bg-primary-500 text-[#101010] shadow"
                                  : status === "answered"
                                  ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                                  : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                              }`}
                            >
                              {q.number}
                            </button>
                          );
                        })}
                    </div>
                  </div>
                ))}

                <Button
                  variant="success"
                  className="mt-4 w-full"
                  onClick={() => setConfirmSubmit(true)}
                >
                  <Send className="h-4 w-4" /> Submit assessment
                </Button>
              </div>
            </div>
          </aside>
        </div>
      </main>

      <Modal
        open={confirmSubmit}
        onClose={() => !submitting && setConfirmSubmit(false)}
        title="Submit your assessment?"
      >
        <div className="space-y-4">
          <p className="text-sm leading-relaxed text-slate-600">
            You have answered{" "}
            <strong>{answeredCount} of {totalQuestions}</strong> questions.
            {answeredCount < totalQuestions
              ? " Unanswered questions will be marked incorrect."
              : " All questions have been answered."}{" "}
            Once submitted you cannot make any changes.
          </p>
          {submitError ? <Alert tone="danger">{submitError}</Alert> : null}
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              disabled={submitting}
              onClick={() => setConfirmSubmit(false)}
            >
              Keep working
            </Button>
            <Button
              variant="success"
              loading={submitting}
              onClick={submitNow}
            >
              Submit now
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}