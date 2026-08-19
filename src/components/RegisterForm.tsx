"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Alert, Button, Card, Field, Input } from "@/components/ui";

const initial = {
  fullName: "",
  email: "",
  phone: "",
  college: "",
  branch: "",
  academicYear: "",
  rollNumber: "",
  password: "",
  confirmPassword: "",
};

export function RegisterForm() {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function set<K extends keyof typeof initial>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (!/^\+?[0-9]{7,15}$/.test(form.phone)) {
      setError("Enter a valid phone number.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError("Enter a valid email address.");
      return;
    }
    for (const key of ["fullName", "college", "branch", "academicYear", "rollNumber"] as const) {
      if (!form[key].trim()) {
        setError("All fields are required.");
        return;
      }
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Registration failed");
        return;
      }
      router.push("/candidate");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="p-6 sm:p-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">Create your account</h1>
        <p className="mt-1 text-sm text-slate-500">
          Register to take part in the TCC campus recruitment assessment.
        </p>
      </div>

      {error ? (
        <Alert tone="danger" className="mb-4">
          {error}
        </Alert>
      ) : null}

      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Full name" required>
          <Input
            value={form.fullName}
            onChange={(e) => set("fullName", e.target.value)}
            placeholder="e.g. Ananya Sharma"
            autoComplete="name"
          />
        </Field>
        <Field label="Email address" required>
          <Input
            type="email"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
          />
        </Field>
        <Field label="Phone number" required hint="Digits only, with optional + country code">
          <Input
            inputMode="tel"
            value={form.phone}
            onChange={(e) => set("phone", e.target.value)}
            placeholder="+91 98765 43210"
            autoComplete="tel"
          />
        </Field>
        <Field label="College name" required>
          <Input
            value={form.college}
            onChange={(e) => set("college", e.target.value)}
            placeholder="e.g. National Institute of Technology"
          />
        </Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Branch" required>
            <Input
              value={form.branch}
              onChange={(e) => set("branch", e.target.value)}
              placeholder="e.g. Computer Science"
            />
          </Field>
          <Field label="Academic year" required>
            <Input
              value={form.academicYear}
              onChange={(e) => set("academicYear", e.target.value)}
              placeholder="e.g. 2024"
            />
          </Field>
        </div>
        <Field label="College roll number" required hint="Stored as text">
          <Input
            value={form.rollNumber}
            onChange={(e) => set("rollNumber", e.target.value)}
            placeholder="e.g. 21CSE104"
          />
        </Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Password" required>
            <Input
              type="password"
              value={form.password}
              onChange={(e) => set("password", e.target.value)}
              placeholder="Min 8 chars, upper + lower + digit"
              autoComplete="new-password"
            />
          </Field>
          <Field label="Confirm password" required>
            <Input
              type="password"
              value={form.confirmPassword}
              onChange={(e) => set("confirmPassword", e.target.value)}
              placeholder="Repeat password"
              autoComplete="new-password"
            />
          </Field>
        </div>
        <p className="text-xs leading-relaxed text-slate-500">
          By creating an account you agree that your personal information will be
          used for the recruitment assessment, including identity verification
          via photograph and proctoring monitoring.
        </p>
        <Button type="submit" loading={loading} className="w-full" size="lg">
          Create account
        </Button>
      </form>
    </Card>
  );
}