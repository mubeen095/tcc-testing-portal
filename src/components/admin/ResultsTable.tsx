"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BadgeCheck,
  Download,
  Eye,
  Search,
  StickyNote,
  XCircle,
} from "lucide-react";

import {
  Alert,
  Button,
  Card,
  Input,
  Select,
  Textarea,
  Modal,
} from "@/components/ui";
import { AttemptBadge, DecisionBadge, formatDuration } from "@/components/badges";
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
  communicationScore: number;
  aptitudeScore: number;
  vibeScore: number;
  totalScore: number;
  durationSeconds: number | null;
  tabSwitchCount: number;
  decision: "PENDING" | "SELECTED" | "REJECTED";
  adminNotes: string | null;
};

type Filters = {
  colleges: string[];
  branches: string[];
  years: string[];
  testSets: { id: string; code: string; name: string }[];
};

export function ResultsTable() {
  const router = useRouter();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [filters, setFilters] = useState<Filters>({ colleges: [], branches: [], years: [], testSets: [] });
  const [search, setSearch] = useState("");
  const [college, setCollege] = useState("");
  const [branch, setBranch] = useState("");
  const [year, setYear] = useState("");
  const [testSetId, setTestSetId] = useState("");
  const [status, setStatus] = useState("");
  const [decision, setDecision] = useState("");
  const [sort, setSort] = useState("score_desc");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const [notesTarget, setNotesTarget] = useState<Row | null>(null);
  const [notes, setNotes] = useState("");
  const [notesSaving, setNotesSaving] = useState(false);
  const [notesError, setNotesError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const sp = new URLSearchParams();
    if (search) sp.set("search", search);
    if (college) sp.set("college", college);
    if (branch) sp.set("branch", branch);
    if (year) sp.set("year", year);
    if (testSetId) sp.set("testSetId", testSetId);
    if (status) sp.set("status", status);
    if (decision) sp.set("decision", decision);
    if (sort) sp.set("sort", sort);
    sp.set("page", String(page));
    try {
      const [rowsRes, filterRes] = await Promise.all([
        fetch(`/api/admin/candidates?${sp.toString()}`, { cache: "no-store" }),
        fetch("/api/admin/filters", { cache: "no-store" }),
      ]);
      const [rowsBody, filterBody] = await Promise.all([rowsRes.json().catch(() => ({})), filterRes.json().catch(() => ({}))]);
      if (!rowsRes.ok) throw new Error(rowsBody.error ?? "Failed to load results");
      setRows(rowsBody.rows ?? []);
      setTotal(rowsBody.total ?? 0);
      setTotalPages(rowsBody.totalPages ?? 1);
      if (filterRes.ok) setFilters(filterBody);
    } catch (e) {
      setError((e as Error).message);
    }
  }, [search, college, branch, year, testSetId, status, decision, sort, page]);

  useEffect(() => {
    load();
  }, [load]);

  async function decide(row: Row, outcome: "SELECTED" | "REJECTED") {
    try {
      const res = await fetch(`/api/admin/results/${row.candidateId}/evaluation`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ decision: outcome }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "Update failed");
      load();
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function saveNotes() {
    if (!notesTarget) return;
    setNotesSaving(true);
    setNotesError(null);
    try {
      const res = await fetch(`/api/admin/results/${notesTarget.candidateId}/evaluation`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ decision: notesTarget.decision, adminNotes: notes }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "Save failed");
      setNotesTarget(null);
      load();
    } catch (e) {
      setNotesError((e as Error).message);
    } finally {
      setNotesSaving(false);
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
  if (!rows) return <LoadingScreen label="Loading results…" />;

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Results</h1>
          <p className="text-sm text-slate-500">{total} candidates · Review, select, reject and export.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href="/api/admin/export?format=csv">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4" /> CSV
            </Button>
          </a>
          <a href="/api/admin/export?format=xlsx">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4" /> Excel
            </Button>
          </a>
          <a href="/api/admin/export?format=xlsx&selected=1">
            <Button variant="success" size="sm">
              <Download className="h-4 w-4" /> Selected only
            </Button>
          </a>
        </div>
      </header>

      <Card className="p-4">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <div className="col-span-2 relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search name, email, phone, roll no…"
              className="pl-9"
            />
          </div>
          <Select value={college} onChange={(e) => { setCollege(e.target.value); setPage(1); }}>
            <option value="">All colleges</option>
            {filters.colleges.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
          <Select value={branch} onChange={(e) => { setBranch(e.target.value); setPage(1); }}>
            <option value="">All branches</option>
            {filters.branches.map((b) => <option key={b} value={b}>{b}</option>)}
          </Select>
          <Select value={testSetId} onChange={(e) => { setTestSetId(e.target.value); setPage(1); }}>
            <option value="">All sets</option>
            {filters.testSets.map((t) => <option key={t.id} value={t.id}>Set {t.code}</option>)}
          </Select>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-5">
          <Select value={year} onChange={(e) => { setYear(e.target.value); setPage(1); }}>
            <option value="">All years</option>
            {filters.years.map((y) => <option key={y} value={y}>{y}</option>)}
          </Select>
          <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
            <option value="">All attempt statuses</option>
            <option value="IN_PROGRESS">In progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="TERMINATED">Terminated</option>
          </Select>
          <Select value={decision} onChange={(e) => { setDecision(e.target.value); setPage(1); }}>
            <option value="">All decisions</option>
            <option value="PENDING">Pending review</option>
            <option value="SELECTED">Selected</option>
            <option value="REJECTED">Rejected</option>
          </Select>
          <Select value={sort} onChange={(e) => { setSort(e.target.value); setPage(1); }}>
            <option value="score_desc">Highest score first</option>
            <option value="score_asc">Lowest score first</option>
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </Select>
        </div>
      </Card>

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {rows.length === 0 ? (
          <Card className="p-6 text-center text-sm text-slate-500">
            No results match your filters.
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
                    <p className="truncate text-xs text-slate-500">
                      {r.email} · {r.phone}
                    </p>
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
                <span className="min-w-0 flex-1 truncate rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                  {r.college} · {r.branch} · {r.academicYear} · {r.rollNumber}
                </span>
              </div>

              <div className="mt-3 grid grid-cols-4 gap-2 text-center">
                <div className="rounded-lg bg-slate-50 px-1 py-2">
                  <p className="text-sm font-bold text-slate-900">
                    {r.attemptStatus === "NOT_STARTED" ? "—" : r.communicationScore}
                  </p>
                  <p className="text-[10px] text-slate-400">Comm</p>
                </div>
                <div className="rounded-lg bg-slate-50 px-1 py-2">
                  <p className="text-sm font-bold text-slate-900">
                    {r.attemptStatus === "NOT_STARTED" ? "—" : r.aptitudeScore}
                  </p>
                  <p className="text-[10px] text-slate-400">Apt</p>
                </div>
                <div className="rounded-lg bg-slate-50 px-1 py-2">
                  <p className="text-sm font-bold text-slate-900">
                    {r.attemptStatus === "NOT_STARTED" ? "—" : r.vibeScore}
                  </p>
                  <p className="text-[10px] text-slate-400">Vibe</p>
                </div>
                <div className="rounded-lg bg-primary-50 px-1 py-2">
                  <p className="text-sm font-bold text-primary-700">
                    {r.attemptStatus === "NOT_STARTED" ? "—" : `${r.totalScore}/36`}
                  </p>
                  <p className="text-[10px] text-primary-500">Overall</p>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 sm:flex-nowrap">
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span>{formatDuration(r.durationSeconds)}</span>
                  <span
                    className={`font-semibold ${
                      r.tabSwitchCount > 0 ? "text-rose-600" : "text-slate-400"
                    }`}
                  >
                    {r.tabSwitchCount} tabs
                  </span>
                </div>
                <div className="flex w-full gap-2 sm:w-auto">
                  <Link
                    href={`/admin/results/${r.candidateId}`}
                    title="View / review"
                    className="flex-1 sm:flex-none"
                  >
                    <Button variant="ghost" size="sm" className="w-full px-3!">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={r.attemptStatus === "NOT_STARTED" || r.decision === "SELECTED"}
                    onClick={() => decide(r, "SELECTED")}
                    className="flex-1 px-3! text-emerald-600 sm:flex-none"
                    title="Select candidate"
                  >
                    <BadgeCheck className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={r.attemptStatus === "NOT_STARTED" || r.decision === "REJECTED"}
                    onClick={() => decide(r, "REJECTED")}
                    className="flex-1 px-3! text-rose-600 sm:flex-none"
                    title="Reject candidate"
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setNotesTarget(r);
                      setNotes(r.adminNotes ?? "");
                      setNotesError(null);
                    }}
                    className="flex-1 px-3! sm:flex-none"
                    title="Add admin notes"
                  >
                    <StickyNote className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Desktop table */}
      <Card className="hidden overflow-hidden md:block">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full min-w-[1200px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <th className="px-3 py-3 font-semibold">Photo</th>
                <th className="px-3 py-3 font-semibold">Candidate</th>
                <th className="px-3 py-3 font-semibold">College</th>
                <th className="px-3 py-3 font-semibold">Branch/Year</th>
                <th className="px-3 py-3 font-semibold">Roll No.</th>
                <th className="px-3 py-3 font-semibold">Set</th>
                <th className="px-3 py-3 text-center font-semibold">Comm</th>
                <th className="px-3 py-3 text-center font-semibold">Apt</th>
                <th className="px-3 py-3 text-center font-semibold">Vibe</th>
                <th className="px-3 py-3 text-center font-semibold">Overall/36</th>
                <th className="px-3 py-3 font-semibold">Status</th>
                <th className="px-3 py-3 font-semibold">Duration</th>
                <th className="px-3 py-3 text-center font-semibold">Tabs</th>
                <th className="px-3 py-3 font-semibold">Decision</th>
                <th className="px-3 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={15} className="px-4 py-12 text-center text-slate-500">
                    No results match your filters.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.candidateId} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-3 py-3">
                      {r.photoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={r.photoUrl} alt="" className="h-9 w-9 rounded-full object-cover ring-1 ring-slate-200" />
                      ) : (
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-500">
                          {r.fullName.slice(0, 2).toUpperCase()}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <p className="font-medium text-slate-900">{r.fullName}</p>
                      <p className="text-xs text-slate-500">{r.email} · {r.phone}</p>
                    </td>
                    <td className="px-3 py-3 text-slate-600">{r.college}</td>
                    <td className="px-3 py-3 text-slate-600">{r.branch}<br /><span className="text-xs text-slate-400">{r.academicYear}</span></td>
                    <td className="px-3 py-3 text-slate-600">{r.rollNumber}</td>
                    <td className="px-3 py-3 font-mono text-xs font-semibold text-slate-700">{r.testSetCode ?? "—"}</td>
                    <td className="px-3 py-3 text-center font-semibold text-slate-700">{r.attemptStatus === "NOT_STARTED" ? "—" : r.communicationScore}</td>
                    <td className="px-3 py-3 text-center font-semibold text-slate-700">{r.attemptStatus === "NOT_STARTED" ? "—" : r.aptitudeScore}</td>
                    <td className="px-3 py-3 text-center font-semibold text-slate-700">{r.attemptStatus === "NOT_STARTED" ? "—" : r.vibeScore}</td>
                    <td className="px-3 py-3 text-center font-bold text-slate-900">{r.attemptStatus === "NOT_STARTED" ? "—" : `${r.totalScore}/36`}</td>
                    <td className="px-3 py-3"><AttemptBadge status={r.attemptStatus} /></td>
                    <td className="px-3 py-3 text-xs text-slate-500">{formatDuration(r.durationSeconds)}</td>
                    <td className={`px-3 py-3 text-center font-bold ${r.tabSwitchCount > 0 ? "text-rose-600" : "text-slate-400"}`}>{r.tabSwitchCount}</td>
                    <td className="px-3 py-3"><DecisionBadge decision={r.decision} /></td>
                    <td className="px-3 py-3">
                      <div className="flex justify-end gap-1">
                        <Link href={`/admin/results/${r.candidateId}`} title="View / review">
                          <Button variant="ghost" size="sm"><Eye className="h-4 w-4" /></Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={r.attemptStatus === "NOT_STARTED" || r.decision === "SELECTED"}
                          onClick={() => decide(r, "SELECTED")}
                          className="text-emerald-600"
                          title="Select candidate"
                        >
                          <BadgeCheck className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={r.attemptStatus === "NOT_STARTED" || r.decision === "REJECTED"}
                          onClick={() => decide(r, "REJECTED")}
                          className="text-rose-600"
                          title="Reject candidate"
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => { setNotesTarget(r); setNotes(r.adminNotes ?? ""); setNotesError(null); }}
                          title="Add admin notes"
                        >
                          <StickyNote className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="flex flex-col gap-3 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <span>Page {page} of {totalPages} · {total} results</span>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Previous</Button>
          <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Next</Button>
        </div>
      </div>

      <Modal open={!!notesTarget} onClose={() => setNotesTarget(null)} title="Admin notes">
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Notes for <strong>{notesTarget?.fullName}</strong>. These are private
            to the recruitment team and never shown to the candidate.
          </p>
          {notesError ? <Alert tone="danger">{notesError}</Alert> : null}
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Selected for final interview. Strong communication…"
            rows={5}
          />
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setNotesTarget(null)}>Cancel</Button>
            <Button onClick={saveNotes} loading={notesSaving}>Save notes</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}