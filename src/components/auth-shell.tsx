import type { ReactNode } from "react";
import Link from "next/link";
import { AppFooter, BrandLogo } from "@/components/brand";

export function AuthShell({
  children,
  footerLinks = true,
}: {
  children: ReactNode;
  footerLinks?: boolean;
}) {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="relative z-10 border-b border-white/10 bg-black/80 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3">
          <Link href="/" aria-label="Home">
            <BrandLogo />
          </Link>
          <nav className="flex items-center gap-3 text-sm font-medium text-slate-500">
            <Link
              href="/"
              className="rounded-lg px-3 py-1.5 transition hover:bg-slate-100 hover:text-slate-500"
            >
              Home
            </Link>
          </nav>
        </div>
      </header>

      <main className="tcc-glow relative flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">{children}</div>
      </main>

      <AppFooter>
        {footerLinks ? (
          <>
            {new Date().getFullYear()} {process.env.NEXT_PUBLIC_APP_NAME ?? "The Coding Company"} ·
            <Link href="/" className="ml-1 underline-offset-2 hover:underline">
              Home
            </Link>
          </>
        ) : null}
      </AppFooter>
    </div>
  );
}