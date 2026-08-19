import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { AuthShell } from "@/components/auth-shell";
import { LoginForm } from "@/components/LoginForm";
import { getAuth } from "@/lib/session";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const auth = await getAuth();
  if (auth) {
    redirect(auth.role === "ADMIN" ? "/admin" : "/candidate");
  }
  const { next } = await searchParams;
  return (
    <AuthShell>
      <LoginForm next={next} />
    </AuthShell>
  );
}