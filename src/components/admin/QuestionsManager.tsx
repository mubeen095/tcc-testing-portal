"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";

import {
  Alert,
  Button,
  Card,
  Field,
  Input,
  Modal,
  Select,
  Textarea,
} from "@/components/ui";
import { SectionBadge } from "@/components/badges";
import { LoadingScreen } from "@/components/candidate/common";

type Question = {
  id: string;
  section: "COMMUNICATION" | "APTITUDE" | "VIBE";
  number: number;
  text: string;
  marks: number;
  isActive: boolean;
  options: { id: string; text: string; order: number; isCorrect: boolean }[];
};

type SetData = {
  id: string;
  code: string;
  name: string;
  sections: { section: "COMMUNICATION" | "APTITUDE" | "VIBE"; questions: Question[] }[];
};

type QuestionForm = {
  testSetId: string;
  section: "COMMUNICATION" | "APTITUDE" | "VIBE";
  text: string;
  marks: string;
  isActive: boolean;
  options: { text: string; isCorrect: boolean }[];
};

const emptyOption = () => ({ text: "", isCorrect: false });

function buildForm(q?: Question, testSetId?: string, section?: Question["section"]): QuestionForm {
  if (q) {
    return {
      testSetId: "",
      section: q.section,
      text: q.text,
      marks: String(q.marks),
      isActive: q.isActive,
      options: q.options.map((o) => ({ text: o.text, isCorrect: o.isCorrect })),
    };
  }
  return {
    testSetId: testSetId ?? "",
    section: section ?? "COMMUNICATION",
    text: "",
    marks: "1",
    isActive: true,
    options: [
      { text: "", isCorrect: true },
      emptyOption(),
      emptyOption(),
      emptyOption(),
    ],
  };
}

export function QuestionsManager() {
  const [data, setData] = useState<SetData[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<QuestionForm>(() => buildForm());
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Question | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/questions", { cache: "no-store" });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "Failed to load questions");
      setData(body.testSets ?? []);
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function submit() {
    setSaving(true);
    setFormError(null);

    if (!form.testSetId) {
      setFormError("Select a test set.");
      setSaving(false);
      return;
    }
    if (form.text.trim().length < 3) {
      setFormError("Question text is required.");
      setSaving(false);
      return;
    }
    const options = form.options.map((o) => o.text.trim());
    if (options.length < 2 || options.some((o) => o === "")) {
      setFormError("Every option must have text.");
      setSaving(false);
      return;
    }
    if (form.options.filter((o) => o.isCorrect).length !== 1) {
      setFormError("Select exactly one correct option.");
      setSaving(false);
      return;
    }
    if (!form.marks || Number(form.marks) < 1 || Number(form.marks) > 5) {
      setFormError("Marks must be between 1 and 5.");
      setSaving(false);
      return;
    }

    try {
      const url = editingId
        ? `/api/admin/questions/${editingId}`
        : "/api/admin/questions";
      const method = editingId ? "PATCH" : "POST";
      const body = {
        ...(editingId ? {} : { testSetId: form.testSetId, section: form.section }),
        text: form.text.trim(),
        marks: Number(form.marks),
        isActive: form.isActive,
        options: options.map((text, i) => ({ text, isCorrect: form.options[i].isCorrect })),
      };
      const res = await fetch(url, {
        method,
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      setShowForm(false);
      setEditingId(null);
      load();
    } catch (e) {
      setFormError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function mutate(id: string, patch: Record<string, unknown>) {
    try {
      const res = await fetch(`/api/admin/questions/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(patch),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "Update failed");
      load();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/questions/${deleteTarget.id}`, { method: "DELETE" });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "Delete failed");
      setDeleteTarget(null);
      load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setDeleting(false);
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
  if (!data) return <LoadingScreen label="Loading question bank…" />;

  const counts = data.map((set) => {
    const total = set.sections.reduce((n, s) => n + s.questions.length, 0);
    return { set, total };
  });

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Question bank</h1>
        <p className="text-sm text-slate-500">
          36 questions per set (12 × Communication &amp; Grammar, 12 × Aptitude,
          12 × Vibe Check), 1 mark each.
        </p>
      </header>

      {counts.map(({ set, total }) => (
        <Card key={set.id} className="overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/60 px-5 py-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Set {set.code} <span className="font-normal text-slate-500">— {set.name}</span>
              </h2>
              <p className="text-xs text-slate-500">{total} questions</p>
            </div>
            <Button
              size="sm"
              onClick={() => {
                setEditingId(null);
                const firstSection = set.sections[0]?.section ?? "COMMUNICATION";
                setForm(buildForm(undefined, set.id, firstSection));
                setFormError(null);
                setShowForm(true);
              }}
            >
              <Plus className="h-4 w-4" /> Add question
            </Button>
          </div>

          {set.sections.map((section) => (
            <div key={section.section} className="border-b border-slate-100">
              <div className="flex items-center justify-between px-5 pt-4 pb-2">
                <SectionBadge section={section.section} />
                <span className="text-xs text-slate-400">{section.questions.length}/12</span>
              </div>
              {section.questions.length === 0 ? (
                <p className="px-5 pb-4 text-sm text-slate-400">No questions in this section yet.</p>
              ) : (
                <ul className="px-4 pb-3">
                  {section.questions.map((q) => (
                    <li
                      key={q.id}
                      className={`mb-2 rounded-xl border border-slate-200 px-4 py-3 ${
                        q.isActive ? "bg-white" : "bg-slate-50 opacity-70"
                      }`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-slate-900">
                            <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
                              {q.number}
                            </span>
                            {q.text}
                            {!q.isActive ? (
                              <span className="ml-2 inline-flex items-center rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                                INACTIVE
                              </span>
                            ) : null}
                          </p>
                          <div className="mt-1.5 flex flex-wrap gap-1.5">
                            {q.options.map((o) => (
                              <span
                                key={o.id}
                                className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] ${
                                  o.isCorrect
                                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                    : "border-slate-200 bg-slate-50 text-slate-500"
                                }`}
                              >
                                {o.isCorrect ? <span className="font-bold">✓</span> : null}
                                {o.text.length > 40 ? o.text.slice(0, 40) + "…" : o.text}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => mutate(q.id, { number: q.number - 1 })}
                            disabled={q.number <= 1}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 disabled:opacity-30"
                            aria-label="Move up"
                          >
                            <ArrowUp className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => mutate(q.id, { number: q.number + 1 })}
                            disabled={q.number >= 12}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 disabled:opacity-30"
                            aria-label="Move down"
                          >
                            <ArrowDown className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => mutate(q.id, { isActive: !q.isActive })}
                            className={`rounded-lg px-2 py-1 text-[11px] font-semibold ${
                              q.isActive
                                ? "text-slate-500 hover:bg-slate-100"
                                : "text-emerald-600 hover:bg-emerald-50"
                            }`}
                            title={q.isActive ? "Deactivate" : "Activate"}
                          >
                            {q.isActive ? "Deactivate" : "Activate"}
                          </button>
                          <button
                            onClick={() => {
                              setEditingId(q.id);
                              setForm(buildForm(q, set.id, q.section));
                              setFormError(null);
                              setShowForm(true);
                            }}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-primary-600"
                            aria-label="Edit question"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(q)}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-rose-600"
                            aria-label="Delete question"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </Card>
      ))}

      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title={editingId ? "Edit question" : "Add question"}
        wide
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          className="space-y-4"
        >
          {formError ? <Alert tone="danger">{formError}</Alert> : null}

          {!editingId ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Test set" required>
                <Select
                  value={form.testSetId}
                  onChange={(e) => setForm((f) => ({ ...f, testSetId: e.target.value }))}
                >
                  <option value="">Select set…</option>
                  {data.map((s) => (
                    <option key={s.id} value={s.id}>Set {s.code}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Section" required>
                <Select
                  value={form.section}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, section: e.target.value as Question["section"] }))
                  }
                >
                  <option value="COMMUNICATION">Communication &amp; Grammar</option>
                  <option value="APTITUDE">Aptitude</option>
                  <option value="VIBE">Vibe Check</option>
                </Select>
              </Field>
            </div>
          ) : null}

          <Field label="Question text" required>
            <Textarea
              value={form.text}
              onChange={(e) => setForm((f) => ({ ...f, text: e.target.value }))}
              placeholder="Enter the question…"
            />
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="Marks" required>
              <Input
                type="number"
                min={1}
                max={5}
                value={form.marks}
                onChange={(e) => setForm((f) => ({ ...f, marks: e.target.value }))}
              />
            </Field>
            <label className="col-span-2 inline-flex items-end gap-2 pb-1.5 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                className="h-4 w-4 rounded border-slate-300"
              />
              Question active (included in attempts)
            </label>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-slate-700">
              Options <span className="text-xs font-normal text-slate-400">(mark exactly one correct)</span>
            </p>
            <div className="space-y-2">
              {form.options.map((opt, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="correct-option"
                    checked={opt.isCorrect}
                    onChange={() =>
                      setForm((f) => ({
                        ...f,
                        options: f.options.map((o, i) => ({ ...o, isCorrect: i === idx })),
                      }))
                    }
                    className="h-4 w-4 shrink-0 accent-emerald-600"
                    title="Mark as correct"
                  />
                  <Input
                    value={opt.text}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        options: f.options.map((o, i) => (i === idx ? { ...o, text: e.target.value } : o)),
                      }))
                    }
                    placeholder={`Option ${idx + 1}`}
                  />
                  {form.options.length > 2 ? (
                    <button
                      type="button"
                      onClick={() =>
                        setForm((f) => ({
                          ...f,
                          options: f.options.filter((_, i) => i !== idx),
                        }))
                      }
                      className="rounded-lg p-1.5 text-slate-400 hover:text-rose-600"
                      aria-label={`Remove option ${idx + 1}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>
              ))}
            </div>
            <div className="mt-2 flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={form.options.length >= 6}
                onClick={() =>
                  setForm((f) => ({ ...f, options: [...f.options, emptyOption()] }))
                }
              >
                <Plus className="h-3.5 w-3.5" /> Add option
              </Button>
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
            <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              {editingId ? "Save changes" : "Create question"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete question?">
        <div className="space-y-4">
          <p className="text-sm leading-relaxed text-slate-600">
            Deleting this question also removes candidate answers tied to it. The
            remaining questions are renumbered. This cannot be undone.
          </p>
          {deleteTarget ? (
            <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              Q{deleteTarget.number}: {deleteTarget.text}
            </p>
          ) : null}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="danger" loading={deleting} onClick={confirmDelete}>
              <Trash2 className="h-4 w-4" /> Delete question
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}