"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

import { Alert, Button, Card, CardHeader, Field, Input, Modal } from "@/components/ui";
import { LoadingScreen } from "@/components/candidate/common";

type Assessment = {
  id: string;
  name: string;
  durationMinutes: number;
  isActive: boolean;
  createdAt: string;
  _count: { attempts: number };
};

export function AssessmentsManager() {
  const router = useRouter();
  const [assessments, setAssessments] = useState<Assessment[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [duration, setDuration] = useState("30");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/assessments", { cache: "no-store" });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "Failed to load assessments");
      setAssessments(body.assessments ?? []);
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function create() {
    setCreating(true);
    setCreateError(null);
    try {
      const res = await fetch("/api/admin/assessments", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, durationMinutes: Number(duration) || 30 }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "Creation failed");
      setShowCreate(false);
      setName("");
      setDuration("30");
      load();
      router.refresh();
    } catch (e) {
      setCreateError((e as Error).message);
    } finally {
      setCreating(false);
    }
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Alert tone="danger">{error}</Alert>
        <Button onClick={load} variant="outline">Retry</Button>
      </div>
    );
  }
  if (!assessments) return <LoadingScreen label="Loading assessments…" />;

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Assessments</h1>
          <p className="text-sm text-slate-500">
            Assessment windows hold candidate attempts. Only one is active at a time.
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4" /> New assessment
        </Button>
      </header>

      <Card>
        <CardHeader
          title="Assessment windows"
          description="Each attempt is tied to the assessment that was active when it started."
        />
        {assessments.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-slate-500">
            No assessments created yet. Create your first assessment window.
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {assessments.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-4 px-5 py-4">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 font-medium text-slate-900">
                    {a.name}
                    {a.isActive ? (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                        ACTIVE
                      </span>
                    ) : null}
                  </p>
                  <p className="text-xs text-slate-500">
                    {a.durationMinutes} minutes · {a._count.attempts} attempts · created{" "}
                    {new Date(a.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create new assessment">
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Creating a new assessment window deactivates all others. Question
            banks (Sets A–C) are reused as-is.
          </p>
          {createError ? <Alert tone="danger">{createError}</Alert> : null}
          <Field label="Assessment name" required>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Campus Drive — Autumn 2026" />
          </Field>
          <Field label="Duration (minutes)" hint="Default 30">
            <Input type="number" min={5} max={180} value={duration} onChange={(e) => setDuration(e.target.value)} />
          </Field>
          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={create} loading={creating}>Create assessment</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}