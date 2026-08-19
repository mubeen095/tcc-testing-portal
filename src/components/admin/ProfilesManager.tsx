"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, Search, ShieldCheck, ShieldX } from "lucide-react";

import {
  Alert,
  Button,
  Card,
  CardHeader,
  Field,
  Input,
  Modal,
  Textarea,
} from "@/components/ui";
import { AttemptBadge } from "@/components/badges";
import { LoadingScreen } from "@/components/candidate/common";

type ProfileRow = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  college: string;
  branch: string;
  academicYear: string;
  rollNumber: string;
  photoUrl: string | null;
  approvalStatus: "PENDING" | "APPROVED" | "REJECTED";
  rejectionReason: string | null;
  approvedAt: string | null;
  createdAt: string;
  testSetCode: string | null;
  attemptStatus: "IN_PROGRESS" | "COMPLETED" | "TERMINATED" | null;
};

type Counts = { pending: number; approved: number; rejected: number };

const TABS = [
  { key: "PENDING", label: "Pending" },
  { key: "APPROVED", label: "Approved" },
  { key: "REJECTED", label: "Rejected" },
  { key: "ALL", label: "All" },
] as const;

type Tab = (typeof TABS)[number]["key"];

function ApprovalBadge({ status }: { status: ProfileRow["approvalStatus"] }) {
  const styles = {
    PENDING: "bg-amber-100 text-amber-700",
    APPROVED: "bg-emerald-100 text-emerald-700",
    REJECTED: "bg-rose-100 text-rose-700",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${styles[status]}`}
    >
      {status === "APPROVED" ? (
        <ShieldCheck className="h-3.5 w-3.5" />
      ) : status === "REJECTED" ? (
        <ShieldX className="h-3.5 w-3.5" />
      ) : null}
      {status === "PENDING" ? "Pending" : status === "APPROVED" ? "Approved" : "Rejected"}
    </span>
  );
}

export function ProfilesManager() {
  const router = useRouter();
  const [rows, setRows] = useState<ProfileRow[] | null>(null);
  const [counts, setCounts] = useState<Counts>({ pending: 0, approved: 0, rejected: 0 });
  const [tab, setTab] = useState<Tab>("PENDING");
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  const [viewTarget, setViewTarget] = useState<ProfileRow | null>(null);
  const [rejectTarget, setRejectTarget] = useState<ProfileRow | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [acting, setActing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const sp = new URLSearchParams();
    if (tab !== "ALL") sp.set("status", tab);
    if (search) sp.set("search", search);
    try {
      const res = await fetch(`/api/admin/profiles?${sp.toString()}`, { cache: "no-store" });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "Failed to load profiles");
      setRows(body.rows ?? []);
      setCounts(body.counts ?? { pending: 0, approved: 0, rejected: 0 });
    } catch (e) {
      setError((e as Error).message);
    }
  }, [tab, search]);

  useEffect(() => {
    load();
  }, [load]);

  async function review(profile: ProfileRow, action: "approve" | "reject") {
    setActing(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/admin/profiles/${profile.id}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action, reason: action === "reject" ? rejectReason : undefined }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "Update failed");
      setRejectTarget(null);
      setRejectReason("");
      setFlash(
        action === "approve"
          ? `${profile.fullName} approved. You can now assign a paper set.`
          : `${profile.fullName} rejected.`
      );
      setTimeout(() => setFlash(null), 4000);
      load();
      router.refresh();
    } catch (e) {
      setActionError((e as Error).message);
    } finally {
      setActing(false);
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
  if (!rows) return <LoadingScreen label="Loading profiles…" />;

  const activeCount = tab === "ALL" ? rows.length : counts[tab.toLowerCase() as keyof Counts];

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Candidate profiles
          </h1>
          <p className="text-sm text-slate-500">
            Review registrations — approve or reject before a set is assigned.
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, phone, roll no…"
            className="pl-9"
          />
        </div>
      </header>

      {flash ? <Alert tone="success">{flash}</Alert> : null}

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              tab === t.key
                ? "bg-primary-500 text-[#101010] shadow-sm"
                : "bg-white text-slate-600 hover:bg-slate-100"
            }`}
          >
            {t.label}
            <span
              className={`ml-1.5 rounded-full px-1.5 py-0.5 text-xs font-bold ${
                tab === t.key ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
              }`}
            >
              {t.key === "PENDING" ? counts.pending : t.key === "APPROVED" ? counts.approved : t.key === "REJECTED" ? counts.rejected : rows.length}
            </span>
          </button>
        ))}
      </div>

      {activeCount === 0 ? (
        <Card className="p-10 text-center text-sm text-slate-500">
          No profiles {tab === "ALL" ? "yet" : `in ${tab.toLowerCase()}`} match.
        </Card>
      ) : (
        <div className="space-y-3">
          {rows.map((p) => (
            <Card key={p.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  {p.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.photoUrl}
                      alt=""
                      className="h-11 w-11 shrink-0 rounded-2xl object-cover ring-1 ring-slate-200"
                    />
                  ) : (
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-200 text-sm font-bold text-slate-500">
                      {p.fullName.slice(0, 2).toUpperCase()}
                    </span>
                  )}
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-semibold text-slate-900">{p.fullName}</p>
                      <ApprovalBadge status={p.approvalStatus} />
                    </div>
                    <p className="truncate text-xs text-slate-500">
                      {p.email} · {p.phone}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-slate-400">
                      {p.college} · {p.branch} · {p.academicYear} · Roll {p.rollNumber}
                    </p>
                    {p.rejectionReason ? (
                      <p className="mt-1 text-xs font-medium text-rose-600">
                        Reason: {p.rejectionReason}
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span>Registered {new Date(p.createdAt).toLocaleDateString()}</span>
                  {p.testSetCode ? (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 font-mono font-semibold text-slate-600">
                      Set {p.testSetCode}
                    </span>
                  ) : null}
                  {p.attemptStatus ? <AttemptBadge status={p.attemptStatus} /> : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={() => setViewTarget(p)}>
                    <Eye className="h-4 w-4" /> View
                  </Button>
                  {p.approvalStatus === "PENDING" ? (
                    <>
                      <Button size="sm" onClick={() => review(p, "approve")} disabled={acting}>
                        Approve
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => {
                          setRejectTarget(p);
                          setRejectReason("");
                          setActionError(null);
                        }}
                        disabled={acting}
                      >
                        Reject
                      </Button>
                    </>
                  ) : p.approvalStatus === "REJECTED" ? (
                    <Button size="sm" onClick={() => review(p, "approve")} disabled={acting}>
                      Re-approve
                    </Button>
                  ) : null}
                  {p.approvalStatus === "APPROVED" && !p.testSetCode ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => router.push("/admin/candidates")}
                    >
                      Assign a set
                    </Button>
                  ) : null}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={!!viewTarget} onClose={() => setViewTarget(null)} title="Profile details">
        {viewTarget ? (
          <div className="space-y-4">
            <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:text-left">
              {viewTarget.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={viewTarget.photoUrl}
                  alt={`${viewTarget.fullName} photograph`}
                  className="h-24 w-24 rounded-2xl object-cover ring-1 ring-slate-200"
                />
              ) : (
                <span className="flex h-24 w-24 items-center justify-center rounded-2xl bg-slate-200 text-2xl font-bold text-slate-500">
                  {viewTarget.fullName.slice(0, 2).toUpperCase()}
                </span>
              )}
              <div>
                <p className="text-lg font-bold text-slate-900">{viewTarget.fullName}</p>
                <p className="text-sm text-slate-500">{viewTarget.email}</p>
                <div className="mt-1.5 flex justify-center gap-2 sm:justify-start">
                  <ApprovalBadge status={viewTarget.approvalStatus} />
                  {viewTarget.attemptStatus ? (
                    <AttemptBadge status={viewTarget.attemptStatus} />
                  ) : null}
                </div>
              </div>
            </div>
            <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              {[
                ["Phone", viewTarget.phone],
                ["College", viewTarget.college],
                ["Branch", viewTarget.branch],
                ["Academic year", viewTarget.academicYear],
                ["Roll number", viewTarget.rollNumber],
                ["Test set", viewTarget.testSetCode ? `Set ${viewTarget.testSetCode}` : "Not assigned"],
                ["Registered", new Date(viewTarget.createdAt).toLocaleString()],
                [
                  "Decision",
                  viewTarget.approvalStatus === "APPROVED" && viewTarget.approvedAt
                    ? `Approved ${new Date(viewTarget.approvedAt).toLocaleString()}`
                    : viewTarget.approvalStatus,
                ],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="text-xs text-slate-400">{k}</dt>
                  <dd className="mt-0.5 font-medium text-slate-800">{v}</dd>
                </div>
              ))}
            </dl>
            {viewTarget.rejectionReason ? (
              <Alert tone="danger">Reason for rejection: {viewTarget.rejectionReason}</Alert>
            ) : null}
          </div>
        ) : null}
      </Modal>

      <Modal open={!!rejectTarget} onClose={() => setRejectTarget(null)} title="Reject profile">
        {rejectTarget ? (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Reject <strong>{rejectTarget.fullName}</strong>? They will not be able
              to upload a photo, take the assessment or log in as a candidate.
            </p>
            {actionError ? <Alert tone="danger">{actionError}</Alert> : null}
            <Field label="Reason (optional) — shown to the student">
              <Textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Incomplete details provided at registration"
              />
            </Field>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setRejectTarget(null)}>Cancel</Button>
              <Button variant="danger" loading={acting} onClick={() => review(rejectTarget, "reject")}>
                Reject profile
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}