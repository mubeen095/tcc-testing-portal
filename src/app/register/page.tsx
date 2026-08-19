import { redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";

import { AppFooter, BrandLogo } from "@/components/brand";
import { RegisterForm } from "@/components/RegisterForm";
import { getAuth } from "@/lib/session";

export const metadata: Metadata = { title: "Register" };

export default async function RegisterPage() {
  const auth = await getAuth();
  if (auth) {
    redirect(auth.role === "ADMIN" ? "/admin" : "/candidate");
  }
  return (
    <div className="flex min-h-full flex-col bg-black">
      <header className="border-b border-white/10">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-4 py-3">
          <Link href="/">
            <BrandLogo size="sm" />
          </Link>
          <Link
            href="/login"
            className="text-sm font-medium text-primary-400 hover:text-primary-300"
          >
            Already have an account? Sign in
          </Link>
        </div>
      </header>
      <main className="tcc-glow mx-auto w-full max-w-3xl flex-1 px-4 py-10">
        <RegisterForm />
      </main>
      <AppFooter>
        © {new Date().getFullYear()}. New candidate onboarding.
      </AppFooter>
    </div>
  );
}