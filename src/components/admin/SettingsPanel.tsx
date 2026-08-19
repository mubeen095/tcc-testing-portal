"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Download, FileDown, Trash2 } from "lucide-react";

import { Alert, Button, Card, CardHeader, Field, Input, Modal } from "@/components/ui";

export function SettingsPanel() {
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  async function deleteData() {
    if (confirm !== "DELETE") {
      setError("Type the word DELETE to continue.");
      return;
    }
    setDeleting(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/admin/delete-assessment-data", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ confirmation: confirm }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "Deletion failed");
      setResult(
        `Assessment data deleted. A fresh assessment window "${body?.assessment?.name ?? ""}" is now active and the platform is ready for a new cycle.`
      );
      setDeleteOpen(false);
      setConfirm("");
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Settings &amp; data
        </h1>
        <p className="text-sm text-slate-500">
          Exports, selected-candidate lists and assessment lifecycle controls.
        </p>
      </header>

      {error ? <Alert tone="danger">{error}</Alert> : null}
      {result ? <Alert tone="success">{result}</Alert> : null}

      <Card>
        <CardHeader
          title="Export results"
          description="Download the full results sheet, including proctoring counts and admin decisions."
        />
        <div className="flex flex-wrap gap-3 px-5 py-4">
          <a href="/api/admin/export?format=csv">
            <Button variant="outline">
              <FileDown className="h-4 w-4" /> Results — CSV
            </Button>
          </a>
          <a href="/api/admin/export?format=xlsx">
            <Button variant="outline">
              <FileDown className="h-4 w-4" /> Results — Excel (XLSX)
            </Button>
          </a>
          <a href="/api/admin/export?format=csv&selected=1">
            <Button>
              <Download className="h-4 w-4" /> Download selected candidates
            </Button>
          </a>
        </div>
        <p className="px-5 pb-4 text-xs text-slate-500">
          The selected-candidates download includes only candidates marked as
          selected, with their scores and admin decision.
        </p>
      </Card>

      <Card className="border-rose-200">
        <CardHeader
          title="Close assessment &amp; delete data"
          description="Run this ONLY after the recruitment process is finished and you have downloaded everything you need."
        />
        <div className="px-5 py-4">
          <Alert tone="warning" className="mb-4">
            This permanently deletes candidate assessments, answers, proctoring
            events, results, candidate photographs and candidate accounts.
            Admin accounts stay, and the question bank (Sets A–C) is preserved so
            a completely new assessment can be conducted later. This cannot be
            undone.
          </Alert>
          <Button variant="danger" onClick={() => setDeleteOpen(true)}>
            <Trash2 className="h-4 w-4" /> CLOSE ASSESSMENT &amp; DELETE DATA
          </Button>
        </div>
      </Card>

      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Permanent data deletion">
        <div className="space-y-4">
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
            <p className="text-sm font-bold text-rose-700">WARNING</p>
            <p className="mt-1 text-sm leading-relaxed text-rose-700">
              This action permanently deletes assessment data. Make sure you have
              downloaded the required candidate lists and results. This action
              cannot be undone.
            </p>
          </div>
          <p className="text-sm text-slate-600">
            Type <span className="font-mono font-bold">DELETE</span> to continue.
          </p>
          <Field label="Confirmation">
            <Input value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="DELETE" autoFocus />
          </Field>
          {error ? <Alert tone="danger">{error}</Alert> : null}
          <div className="flex justify-end gap-3">
            <Button variant="outline" disabled={deleting} onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" loading={deleting} onClick={deleteData}>
              <Trash2 className="h-4 w-4" /> Delete all assessment data
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}