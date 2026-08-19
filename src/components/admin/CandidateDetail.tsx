"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, KeyRound, Save, Trash2 } from "lucide-react";

import {
  Alert,
  Button,
  Card,
  CardHeader,
  Field,
  Input,
  Modal,
  Select,
} from "@/components/ui";
import { AttemptBadge, DecisionBadge } from "@/components/badges";
import { LoadingScreen } from "@/components/candidate/common";

type Data = {
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
    createdAt: string;
    testSetId: string | null;
    testSetCode: string | null;
    testSetName: string | null;
  };
  attempt: {
    id: string;
    status: "IN_PROGRESS" | "COMPLETED" | "TERMINATED";
  } | null;
  evaluation: { decision: "PENDING" | "SELECTED" | "REJECTED" } | null;
};

export function CandidateDetail({
  candidateId,
  testSets,
}: {
  candidateId: string;
  testSets: { id: string; code: string }[];
}) {
  const router = useRouter();
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [edit, setEdit] = useState<Record<string, string> | null>(null);
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const [resetOpen, setResetOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSaving, setResetSaving] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/results/${candidateId}`, { cache: "no-store" });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "Failed to load candidate");
      setData(body);
    } catch (e) {
      setError((e as Error).message);
    }
  }, [candidateId]);

  useEffect(() => {
    load();
  }, [load]);

  if (error) {
    return (
      <div className="space-y-4">
        <Alert tone="danger">{error}</Alert>
        <Button onClick={load} variant="outline">Retry</Button>
      </div>
    );
  }
  if (!data) return <LoadingScreen label="Loading candidate…" />;

  const c = data.candidate;

  function openEdit() {
    setEdit({
      fullName: c.fullName,
      phone: c.phone,
      college: c.college,
      branch: c.branch,
      academicYear: c.academicYear,
      rollNumber: c.rollNumber,
      testSetId: c.testSetId ?? "",
    });
    setEditError(null);
  }

  async function saveEdit() {
    if (!edit) return;
    setSaving(true);
    setEditError(null);
    const payload: Record<string, string> = { ...edit };
    if (!payload.testSetId) delete payload.testSetId;
    try {
      const res = await fetch(`/api/admin/candidates/${candidateId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "Update failed");
      setEdit(null);
      load();
      router.refresh();
    } catch (e) {
      setEditError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function resetPassword() {
    setResetSaving(true);
    setResetError(null);
    try {
      const res = await fetch(`/api/admin/candidates/${candidateId}/reset-password`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ newPassword }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "Reset failed");
      setResetOpen(false);
      setNewPassword("");
    } catch (e) {
      setResetError((e as Error).message);
    } finally {
      setResetSaving(false);
    }
  }

  async function deleteCandidate() {
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/admin/candidates/${candidateId}`, { method: "DELETE" });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "Delete failed");
      router.push("/admin/candidates");
      router.refresh();
    } catch (e) {
      setDeleteError((e as Error).message);
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <Link
        href="/admin/candidates"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" /> Back to candidates
      </Link>

      {data.attempt ? (
        <Alert tone="info">
          Candidate has an assessment attempt.{" "}
          <a
            href={`/admin/results/${candidateId}`}
            className="font-semibold underline underline-offset-2"
          >
            Open full result &amp; evaluation →
          </a>
        </Alert>
      ) : null}

      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {c.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={c.photoUrl}
              alt={`${c.fullName} photograph`}
              className="h-16 w-16 rounded-2xl object-cover ring-1 ring-slate-200"
            />
          ) : (
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-200 text-xl font-bold text-slate-500">
              {c.fullName.slice(0, 2).toUpperCase()}
            </span>
          )}
          <div>
            <h1 className="text-xl font-bold text-slate-900">{c.fullName}</h1>
            <p className="text-sm text-slate-500">{c.email}</p>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {data.attempt ? <AttemptBadge status={data.attempt.status} /> : null}
              {data.evaluation ? <DecisionBadge decision={data.evaluation.decision} /> : null}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={openEdit} variant="outline">
            <Save className="h-4 w-4" /> Edit details
          </Button>
          <Button onClick={() => setResetOpen(true)} variant="outline">
            <KeyRound className="h-4 w-4" /> Reset password
          </Button>
          <Button onClick={() => setDeleteOpen(true)} variant="danger">
            <Trash2 className="h-4 w-4" /> Delete
          </Button>
        </div>
      </header>

      <Card>
        <CardHeader title="Candidate information" description="Stored profile data used for identification." />
        <dl className="grid grid-cols-1 gap-4 px-5 py-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
          {[
            ["Full name", c.fullName],
            ["Email", c.email],
            ["Phone", c.phone],
            ["College", c.college],
            ["Branch", c.branch],
            ["Academic year", c.academicYear],
            ["Roll number", c.rollNumber],
            ["Assigned test set", c.testSetCode ? `Set ${c.testSetCode}` : "Not assigned"],
            ["Registered", new Date(c.createdAt).toLocaleString()],
          ].map(([k, v]) => (
            <div key={k}>
              <dt className="text-xs text-slate-400">{k}</dt>
              <dd className="mt-0.5 font-medium text-slate-800">{v}</dd>
            </div>
          ))}
        </dl>
      </Card>

      <Modal open={!!edit} onClose={() => setEdit(null)} title="Edit candidate">
        {edit ? (
          <div className="space-y-4">
            {editError ? <Alert tone="danger">{editError}</Alert> : null}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Full name">
                <Input value={edit.fullName} onChange={(e) => setEdit((f) => f && { ...f, fullName: e.target.value })} />
              </Field>
              <Field label="Phone">
                <Input value={edit.phone} onChange={(e) => setEdit((f) => f && { ...f, phone: e.target.value })} />
              </Field>
              <Field label="College">
                <Input value={edit.college} onChange={(e) => setEdit((f) => f && { ...f, college: e.target.value })} />
              </Field>
              <Field label="Branch">
                <Input value={edit.branch} onChange={(e) => setEdit((f) => f && { ...f, branch: e.target.value })} />
              </Field>
              <Field label="Academic year">
                <Input value={edit.academicYear} onChange={(e) => setEdit((f) => f && { ...f, academicYear: e.target.value })} />
              </Field>
              <Field label="Roll number">
                <Input value={edit.rollNumber} onChange={(e) => setEdit((f) => f && { ...f, rollNumber: e.target.value })} />
              </Field>
              <Field label="Test set">
                <Select value={edit.testSetId} onChange={(e) => setEdit((f) => f && { ...f, testSetId: e.target.value })}>
                  <option value="">Not assigned</option>
                  {testSets.map((t) => (
                    <option key={t.id} value={t.id}>Set {t.code}</option>
                  ))}
                </Select>
              </Field>
            </div>
            <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
              <Button variant="outline" onClick={() => setEdit(null)}>Cancel</Button>
              <Button onClick={saveEdit} loading={saving}>Save changes</Button>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal open={resetOpen} onClose={() => setResetOpen(false)} title="Reset password">
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Set a new password for <strong>{c.fullName}</strong>. The candidate
            must use this password on next login.
          </p>
          {resetError ? <Alert tone="danger">{resetError}</Alert> : null}
          <Field label="New password" hint="8+ chars, upper, lower, digit">
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New password"
            />
          </Field>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setResetOpen(false)}>Cancel</Button>
            <Button onClick={resetPassword} loading={resetSaving}>Reset password</Button>
          </div>
        </div>
      </Modal>

      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Delete candidate?">
        <div className="space-y-4">
          <p className="text-sm leading-relaxed text-slate-600">
            This permanently removes <strong>{c.fullName}</strong> including any
            assessment attempt, answers and proctoring data. This cannot be
            undone.
          </p>
          {deleteError ? <Alert tone="danger">{deleteError}</Alert> : null}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button variant="danger" onClick={deleteCandidate} loading={deleting}>
              <Trash2 className="h-4 w-4" /> Delete candidate
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}