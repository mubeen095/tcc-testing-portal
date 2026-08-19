"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BadgeCheck,
  Camera,
  CheckCircle2,
  FileText,
  ShieldAlert,
  XCircle,
} from "lucide-react";

import {
  Alert,
  Button,
  Card,
  CardHeader,
  Field,
  Input,
  Textarea,
} from "@/components/ui";
import { AttemptBadge, DecisionBadge, SectionBadge, formatDuration } from "@/components/badges";
import { LoadingScreen } from "@/components/candidate/common";

type Section = "COMMUNICATION" | "APTITUDE" | "VIBE";

type Result = {
  candidate: {
    id: string;
    fullName: string;
    email: string;
    phone: string;
    college: string;
    branch: string;
    academicYear: string;
    rollNumber: string;
    photoUrl: string | null;
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
    durationSeconds: number | null;
    communicationScore: number | null;
    aptitudeScore: number | null;
    vibeScore: number | null;
    vibeScoreAdjusted: number | null;
    totalScore: number | null;
    cameraEventCount: number;
  } | null;
  answers: { questionId: string; selectedOptionId: string | null; isCorrect: boolean | null }[];
  questions: {
    id: string;
    section: Section;
    number: number;
    text: string;
    marks: number;
    isActive: boolean;
    options: { id: string; text: string; isCorrect: boolean; order: number }[];
  }[];
  proctoring: { type: string; detail: string | null; createdAt: string }[];
  evaluation: { decision: "PENDING" | "SELECTED" | "REJECTED"; adminNotes: string | null; updatedAt: string } | null;
};

const EVENT_LABELS: Record<string, string> = {
  ASSESSMENT_STARTED: "Assessment started",
  CAMERA_PERMISSION_GRANTED: "Camera permission granted",
  CAMERA_PERMISSION_DENIED: "Camera permission denied",
  CAMERA_DISCONNECTED: "Camera disconnected",
  CAMERA_RECONNECTED: "Camera reconnected",
  TAB_VISIBILITY_CHANGED: "Tab visibility changed",
  BROWSER_LOST_FOCUS: "Browser lost focus",
  TAB_SWITCH_DETECTED: "TAB SWITCH DETECTED",
  ASSESSMENT_SUBMITTED: "Assessment submitted",
  ASSESSMENT_AUTO_SUBMITTED: "Assessment auto-submitted",
  ASSESSMENT_TERMINATED: "Assessment terminated",
};

export function ResultDetail({ candidateId }: { candidateId: string }) {
  const router = useRouter();
  const [data, setData] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [vibe, setVibe] = useState("");
  const [vibeSaving, setVibeSaving] = useState(false);
  const [notes, setNotes] = useState("");
  const [notesChanged, setNotesChanged] = useState(false);
  const [decisionSaving, setDecisionSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/results/${candidateId}`, { cache: "no-store" });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "Failed to load result");
      setData(body);
      setVibe(body.attempt?.vibeScoreAdjusted ?? body.attempt?.vibeScore ?? "");
      setNotes(body.evaluation?.adminNotes ?? "");
      setNotesChanged(false);
    } catch (e) {
      setError((e as Error).message);
    }
  }, [candidateId]);

  useEffect(() => {
    load();
  }, [load]);

  const effectiveTotal = useMemo(() => {
    if (!data?.attempt) return null;
    const comm = data.attempt.communicationScore ?? 0;
    const apt = data.attempt.aptitudeScore ?? 0;
    const vibeScore = data.attempt.vibeScoreAdjusted ?? data.attempt.vibeScore ?? 0;
    return comm + apt + vibeScore;
  }, [data]);

  if (error) {
    return (
      <div className="space-y-4">
        <Alert tone="danger">{error}</Alert>
        <Button onClick={load} variant="outline">Retry</Button>
      </div>
    );
  }
  if (!data) return <LoadingScreen label="Loading result…" />;

  const a = data.attempt;
  const comm = a?.communicationScore ?? "—";
  const apt = a?.aptitudeScore ?? "—";
  const vibeScore = a?.vibeScoreAdjusted ?? a?.vibeScore ?? "—";

  async function saveDecision(decision: "SELECTED" | "REJECTED" | "PENDING") {
    setDecisionSaving(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/admin/results/${candidateId}/evaluation`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ decision, adminNotes: notes }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "Update failed");
      setNotesChanged(false);
      load();
      router.refresh();
    } catch (e) {
      setActionError((e as Error).message);
    } finally {
      setDecisionSaving(false);
    }
  }

  async function saveVibe() {
    const score = Number(vibe);
    if (!Number.isInteger(score) || score < 0 || score > 12) {
      setActionError("Vibe Check score must be a whole number from 0 to 12.");
      return;
    }
    setVibeSaving(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/admin/results/${candidateId}/evaluation`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ score }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "Update failed");
      load();
    } catch (e) {
      setActionError((e as Error).message);
    } finally {
      setVibeSaving(false);
    }
  }

  async function saveNotesOnly() {
    setDecisionSaving(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/admin/results/${candidateId}/evaluation`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          decision: data?.evaluation?.decision ?? "PENDING",
          adminNotes: notes,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "Save failed");
      setNotesChanged(false);
      load();
    } catch (e) {
      setActionError((e as Error).message);
    } finally {
      setDecisionSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <Link
        href="/admin/results"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" /> Back to results
      </Link>

      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {data.candidate.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={data.candidate.photoUrl}
              alt={`${data.candidate.fullName} photograph`}
              className="h-16 w-16 rounded-2xl object-cover ring-1 ring-slate-200"
            />
          ) : (
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-200 text-xl font-bold text-slate-500">
              {data.candidate.fullName.slice(0, 2).toUpperCase()}
            </span>
          )}
          <div>
            <h1 className="text-xl font-bold text-slate-900">{data.candidate.fullName}</h1>
            <p className="text-sm text-slate-500">
              {data.candidate.email} · {data.candidate.phone}
            </p>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {a ? <AttemptBadge status={a.status} /> : null}
              {data.evaluation ? <DecisionBadge decision={data.evaluation.decision} /> : null}
            </div>
          </div>
        </div>
      </header>

      {a?.status === "TERMINATED" ? (
        <Alert tone="danger">
          <p className="font-semibold">STATUS: TERMINATED</p>
          <p>REASON: {a.terminationReason ?? "UNKNOWN"} · {a.terminatedAt ? new Date(a.terminatedAt).toLocaleString() : ""}</p>
          <p className="mt-1 text-xs">
            This candidate is not treated as a normal completed candidate. Their
            responses were recorded and are shown below for reference.
          </p>
        </Alert>
      ) : null}

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Candidate information" />
          <dl className="grid grid-cols-2 gap-4 px-5 py-4 text-sm sm:grid-cols-3">
            {[
              ["Name", data.candidate.fullName],
              ["Email", data.candidate.email],
              ["Phone", data.candidate.phone],
              ["College", data.candidate.college],
              ["Branch", data.candidate.branch],
              ["Academic year", data.candidate.academicYear],
              ["Roll number", data.candidate.rollNumber],
              ["Test set", data.candidate.testSetCode ? `Set ${data.candidate.testSetCode}` : "—"],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="text-xs text-slate-400">{k}</dt>
                <dd className="mt-0.5 font-medium text-slate-800">{v}</dd>
              </div>
            ))}
          </dl>
        </Card>

        <Card>
          <CardHeader title="Assessment" />
          <dl className="space-y-2 px-5 py-4 text-sm">
            {[
              ["Started at", a?.startedAt ? new Date(a.startedAt).toLocaleString() : "—"],
              ["Submitted at", a?.submittedAt ? new Date(a.submittedAt).toLocaleString() : "—"],
              ["Terminated at", a?.terminatedAt ? new Date(a.terminatedAt).toLocaleString() : "—"],
              ["Time taken", formatDuration(a?.durationSeconds)],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-3">
                <dt className="text-slate-400">{k}</dt>
                <dd className="text-right font-medium text-slate-800">{v}</dd>
              </div>
            ))}
          </dl>
        </Card>
      </section>

      <Card>
        <CardHeader
          title="Scores"
          description={
            a?.status === "TERMINATED"
              ? "Objective scores from responses saved at termination."
              : "Section-wise scores on 12 marks each."
          }
        />
        <div className="px-5 py-4">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <ScoreBox label="Communication & Grammar" value={comm} max={12} />
            <ScoreBox label="Aptitude" value={apt} max={12} />
            <ScoreBox label="Vibe Check" value={vibeScore} max={12} />
            <ScoreBox label="Overall" value={effectiveTotal ?? "—"} max={36} highlight />
          </div>

          {a ? (
            <div className="mt-5 flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <Field label="Vibe Check — admin-adjusted score (0–12)">
                <Input
                  type="number"
                  min={0}
                  max={12}
                  value={String(vibe)}
                  onChange={(e) => setVibe(e.target.value)}
                  className="w-28"
                />
              </Field>
              <Button variant="outline" size="sm" onClick={saveVibe} loading={vibeSaving}>
                Apply adjusted score
              </Button>
              <p className="text-xs text-slate-500">
                Objective score: {a.vibeScore ?? "—"}/12. Override updates the overall total.
              </p>
            </div>
          ) : null}
        </div>
      </Card>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Answers" description="Admin only — correct/incorrect highlighted." />
          {data.questions.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-slate-500">
              No questions loaded for this candidate&apos;s test set.
            </div>
          ) : (
            <ul className="max-h-[560px] divide-y divide-slate-100 overflow-y-auto px-2 scrollbar-thin">
              {data.questions.map((q) => {
                const answer = data.answers.find((x) => x.questionId === q.id);
                const selected = q.options.find((o) => o.id === answer?.selectedOptionId);
                const correct = q.options.find((o) => o.isCorrect);
                return (
                  <li key={q.id} className="px-3 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-slate-400">Q{q.number}</span>
                      <SectionBadge section={q.section} />
                      {answer?.isCorrect === true ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                          <CheckCircle2 className="h-3 w-3" /> Correct +{q.marks}
                        </span>
                      ) : answer !== undefined ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-semibold text-rose-700">
                          <XCircle className="h-3 w-3" /> Incorrect
                        </span>
                      ) : (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">
                          Not answered
                        </span>
                      )}
                      {!q.isActive ? (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                          Inactive at scoring
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1.5 text-sm font-medium text-slate-900">{q.text}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1">
                        <span className="font-semibold text-emerald-700">✓ {correct?.text}</span>
                      </span>
                      {selected && selected.id !== correct?.id ? (
                        <span className="ml-3 inline-flex items-center gap-1">
                          Candidate: <span className="font-semibold text-rose-700">{selected.text}</span>
                        </span>
                      ) : null}
                      {!selected ? <span className="ml-3 text-slate-400">No answer selected</span> : null}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader
              title="Proctoring log"
              action={
                a ? (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500">
                    <Camera className="h-3.5 w-3.5" /> {a.cameraEventCount} camera events ·{" "}
                    {data.proctoring.filter((e) => e.type === "TAB_SWITCH_DETECTED").length} tab switch(es)
                  </span>
                ) : null
              }
            />
            {data.proctoring.length === 0 ? (
              <div className="px-5 py-10 text-center text-sm text-slate-500">
                No proctoring events recorded.
              </div>
            ) : (
              <ol className="max-h-[380px] space-y-1 overflow-y-auto px-5 py-4 scrollbar-thin">
                {data.proctoring.map((ev, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center">
                      {EVENT_LABELS[ev.type]?.toUpperCase().includes("TERMINATE") ||
                      ev.type === "TAB_SWITCH_DETECTED" ? (
                        <ShieldAlert className="h-4 w-4 text-rose-500" />
                      ) : (
                        <span className="h-1.5 w-1.5 rounded-full bg-primary-400" />
                      )}
                    </span>
                    <div className="min-w-0">
                      <p className="text-slate-700">
                        <span className="font-mono text-xs text-slate-400">
                          {new Date(ev.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })}
                        </span>{" "}
                        <span className={ev.type === "TAB_SWITCH_DETECTED" || EVENT_LABELS[ev.type]?.toUpperCase().includes("TERMINATE") ? "font-semibold text-rose-700" : "font-medium"}>
                          {EVENT_LABELS[ev.type] ?? ev.type}
                        </span>
                      </p>
                      {ev.detail ? <p className="text-xs text-slate-400">{ev.detail}</p> : null}
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </Card>

          <Card>
            <CardHeader title="Admin evaluation" description="Internal notes and recruitment decision." />
            <div className="space-y-4 px-5 py-4">
              {actionError ? <Alert tone="danger">{actionError}</Alert> : null}
              <Field label="Admin notes" hint="Private — never shown to the candidate">
                <Textarea
                  value={notes}
                  onChange={(e) => { setNotes(e.target.value); setNotesChanged(true); }}
                  placeholder="e.g. Selected for final interview. Strong communication and good attitude."
                  rows={4}
                />
              </Field>
              {notesChanged ? (
                <Button variant="outline" size="sm" loading={decisionSaving} onClick={saveNotesOnly}>
                  Save notes
                </Button>
              ) : data.evaluation?.updatedAt ? (
                <p className="flex items-center gap-1.5 text-xs text-slate-400">
                  <FileText className="h-3.5 w-3.5" />
                  Last updated {new Date(data.evaluation.updatedAt).toLocaleString()}
                </p>
              ) : null}
              <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                <Button
                  variant="success"
                  loading={decisionSaving}
                  disabled={a?.status === "IN_PROGRESS" || !a}
                  onClick={() => saveDecision("SELECTED")}
                >
                  <BadgeCheck className="h-4 w-4" /> Select candidate
                </Button>
                <Button
                  variant="danger"
                  loading={decisionSaving}
                  disabled={a?.status === "IN_PROGRESS" || !a}
                  onClick={() => saveDecision("REJECTED")}
                >
                  <XCircle className="h-4 w-4" /> Reject candidate
                </Button>
                {data.evaluation?.decision !== "PENDING" ? (
                  <Button variant="outline" loading={decisionSaving} onClick={() => saveDecision("PENDING")}>
                    Reset to pending
                  </Button>
                ) : null}
              </div>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}

function ScoreBox({
  label,
  value,
  max,
  highlight,
}: {
  label: string;
  value: number | string;
  max: number;
  highlight?: boolean;
}) {
  return (
    <div className={`rounded-xl border px-4 py-3 ${highlight ? "border-primary-200 bg-primary-50" : "border-slate-200"}`}>
      <p className={`text-2xl font-bold ${highlight ? "text-primary-700" : "text-slate-900"}`}>
        {value}
        <span className="text-sm font-medium text-slate-400"> / {max}</span>
      </p>
      <p className="mt-0.5 text-xs font-medium text-slate-500">{label}</p>
    </div>
  );
}