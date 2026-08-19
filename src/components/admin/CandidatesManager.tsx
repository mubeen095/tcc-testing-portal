"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, Plus, Search, UserCog } from "lucide-react";

import {
  Alert,
  Button,
  Card,
  Field,
  Input,
  Modal,
  Select,
} from "@/components/ui";
import { AttemptBadge, DecisionBadge } from "@/components/badges";
import { LoadingScreen } from "@/components/candidate/common";

type Row = {
  candidateId: string;
  fullName: string;
  email: string;
  phone: string;
  college: string;
  branch: string;
  academicYear: string;
  rollNumber: string;
  photoUrl: string | null;
  testSetCode: string | null;
  attemptStatus: "IN_PROGRESS" | "COMPLETED" | "TERMINATED" | "NOT_STARTED";
  decision: "PENDING" | "SELECTED" | "REJECTED";
};

type Filters = {
  colleges: string[];
  branches: string[];
  years: string[];
  testSets: { id: string; code: string; name: string }[];
};

const initialCreate = {
  fullName: "",
  email: "",
  phone: "",
  college: "",
  branch: "",
  academicYear: "",
  rollNumber: "",
  password: "",
  testSetId: "",
};

export function CandidatesManager() {
  const router = useRouter();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [filters, setFilters] = useState<Filters>({ colleges: [], branches: [], years: [], testSets: [] });
  const [search, setSearch] = useState("");
  const [college, setCollege] = useState("");
  const [branch, setBranch] = useState("");
  const [year, setYear] = useState("");
  const [testSetId, setTestSetId] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState(initialCreate);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const sp = new URLSearchParams();
    if (search) sp.set("search", search);
    if (college) sp.set("college", college);
    if (branch) sp.set("branch", branch);
    if (year) sp.set("year", year);
    if (testSetId) sp.set("testSetId", testSetId);
    sp.set("page", String(page));
    sp.set("sort", "newest");
    try {
      const [rowsRes, filterRes] = await Promise.all([
        fetch(`/api/admin/candidates?${sp.toString()}`, { cache: "no-store" }),
        fetch("/api/admin/filters", { cache: "no-store" }),
      ]);
      const [rowsBody, filterBody] = await Promise.all([rowsRes.json().catch(() => ({})), filterRes.json().catch(() => ({}))]);
      if (!rowsRes.ok) throw new Error(rowsBody.error ?? "Failed to load");
      setRows(rowsBody.rows ?? []);
      setTotal(rowsBody.total ?? 0);
      setTotalPages(rowsBody.totalPages ?? 1);
      if (filterRes.ok) setFilters(filterBody);
    } catch (e) {
      setError((e as Error).message);
    }
  }, [search, college, branch, year, testSetId, page]);

  useEffect(() => {
    load();
  }, [load]);

  function submitCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreateError(null);
    if (createForm.password.length < 8) {
      setCreateError("Password must be at least 8 characters.");
      return;
    }
    setCreating(true);
    fetch("/api/admin/candidates", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(createForm),
    })
      .then(async (res) => {
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body.error ?? "Failed to create candidate");
        setShowCreate(false);
        setCreateForm(initialCreate);
        load();
        router.refresh();
      })
      .catch((e) => setCreateError(e.message))
      .finally(() => setCreating(false));
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Alert tone="danger">{error}</Alert>
        <Button onClick={load} variant="outline">Retry</Button>
      </div>
    );
  }
  if (!rows) return <LoadingScreen label="Loading candidates…" />;

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Candidates</h1>
          <p className="text-sm text-slate-500">
            {total} registered · Create accounts, edit details or manage access.
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4" /> Add candidate
        </Button>
      </header>

      <Card className="p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <div className="lg:col-span-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search name, email, phone, roll no…"
                className="pl-9"
              />
            </div>
          </div>
          <Select value={college} onChange={(e) => { setCollege(e.target.value); setPage(1); }}>
            <option value="">All colleges</option>
            {filters.colleges.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </Select>
          <Select value={branch} onChange={(e) => { setBranch(e.target.value); setPage(1); }}>
            <option value="">All branches</option>
            {filters.branches.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </Select>
          <Select value={year} onChange={(e) => { setYear(e.target.value); setPage(1); }}>
            <option value="">All years</option>
            {filters.years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </Select>
          <Select value={testSetId} onChange={(e) => { setTestSetId(e.target.value); setPage(1); }}>
            <option value="">All sets</option>
            {filters.testSets.map((t) => (
              <option key={t.id} value={t.id}>{t.code}</option>
            ))}
          </Select>
        </div>
      </Card>

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {rows.length === 0 ? (
          <Card className="p-6 text-center text-sm text-slate-500">
            No candidates match your filters.
          </Card>
        ) : (
          rows.map((r) => (
            <Card key={r.candidateId} className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex min-w-0 items-center gap-3">
                  {r.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={r.photoUrl}
                      alt=""
                      className="h-10 w-10 shrink-0 rounded-full object-cover ring-1 ring-slate-200"
                    />
                  ) : (
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-500">
                      {r.fullName.slice(0, 2).toUpperCase()}
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-900">{r.fullName}</p>
                    <p className="truncate text-xs text-slate-500">{r.email}</p>
                  </div>
                </div>
                <DecisionBadge decision={r.decision} />
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                <AttemptBadge status={r.attemptStatus} />
                {r.testSetCode ? (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-semibold text-slate-600">
                    Set {r.testSetCode}
                  </span>
                ) : null}
                <span className="max-w-full truncate rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                  {r.college} · {r.branch} · {r.academicYear} · {r.rollNumber}
                </span>
              </div>

              <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                <span className="text-xs text-slate-400">{r.phone}</span>
                <Link href={`/admin/candidates/${r.candidateId}`}>
                  <Button variant="outline" size="sm">
                    <Eye className="h-3.5 w-3.5" /> View
                  </Button>
                </Link>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Desktop table */}
      <Card className="hidden overflow-hidden md:block">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3 font-semibold">Candidate</th>
                <th className="px-4 py-3 font-semibold">College</th>
                <th className="px-4 py-3 font-semibold">Branch / Year</th>
                <th className="px-4 py-3 font-semibold">Set</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Decision</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                    No candidates match your filters.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.candidateId} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {r.photoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={r.photoUrl}
                            alt=""
                            className="h-9 w-9 rounded-full object-cover ring-1 ring-slate-200"
                          />
                        ) : (
                          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-500">
                            {r.fullName.slice(0, 2).toUpperCase()}
                          </span>
                        )}
                        <div>
                          <p className="font-medium text-slate-900">{r.fullName}</p>
                          <p className="text-xs text-slate-500">{r.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{r.college}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {r.branch} · {r.academicYear}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs font-semibold text-slate-700">
                        {r.testSetCode ?? "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <AttemptBadge status={r.attemptStatus} />
                    </td>
                    <td className="px-4 py-3">
                      <DecisionBadge decision={r.decision} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/admin/candidates/${r.candidateId}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="h-3.5 w-3.5" /> View
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="flex flex-col gap-3 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <span>
          Page {page} of {totalPages} · {total} candidates
        </span>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
            Previous
          </Button>
          <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
            Next
          </Button>
        </div>
      </div>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Add candidate" wide>
        <form onSubmit={submitCreate} className="space-y-4">
          {createError ? <Alert tone="danger">{createError}</Alert> : null}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Full name" required>
              <Input value={createForm.fullName} onChange={(e) => setCreateForm((f) => ({ ...f, fullName: e.target.value }))} />
            </Field>
            <Field label="Email" required>
              <Input type="email" value={createForm.email} onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))} />
            </Field>
            <Field label="Phone" required>
              <Input value={createForm.phone} onChange={(e) => setCreateForm((f) => ({ ...f, phone: e.target.value }))} />
            </Field>
            <Field label="College" required>
              <Input value={createForm.college} onChange={(e) => setCreateForm((f) => ({ ...f, college: e.target.value }))} />
            </Field>
            <Field label="Branch" required>
              <Input value={createForm.branch} onChange={(e) => setCreateForm((f) => ({ ...f, branch: e.target.value }))} />
            </Field>
            <Field label="Academic year" required>
              <Input value={createForm.academicYear} onChange={(e) => setCreateForm((f) => ({ ...f, academicYear: e.target.value }))} />
            </Field>
            <Field label="Roll number" required>
              <Input value={createForm.rollNumber} onChange={(e) => setCreateForm((f) => ({ ...f, rollNumber: e.target.value }))} />
            </Field>
            <Field label="Initial password" required>
              <Input type="password" value={createForm.password} onChange={(e) => setCreateForm((f) => ({ ...f, password: e.target.value }))} />
            </Field>
            <Field label="Test set" required>
              <Select value={createForm.testSetId} onChange={(e) => setCreateForm((f) => ({ ...f, testSetId: e.target.value }))}>
                <option value="">Select set…</option>
                {filters.testSets.map((t) => (
                  <option key={t.id} value={t.id}>Set {t.code}</option>
                ))}
              </Select>
            </Field>
          </div>
          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
            <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={creating}>
              <UserCog className="h-4 w-4" /> Create candidate
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}