"use client";

import { usePathname } from "next/navigation";
import { BrandLogo } from "@/components/brand";
import { LogoutButton } from "@/components/candidate/common";

const HIDDEN_ROUTES = ["/candidate/test", "/candidate/completed", "/candidate/terminated"];

export function CandidateNavbar() {
  const pathname = usePathname();
  if (HIDDEN_ROUTES.includes(pathname)) return null;
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-3">
        <a href="/candidate">
          <BrandLogo size="sm" />
        </a>
        <LogoutButton />
      </div>
    </header>
  );
}