"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  BarChart3,
  ClipboardList,
  FileSpreadsheet,
  GraduationCap,
  LogOut,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";

import { BrandLogo } from "@/components/brand";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: BarChart3 },
  { href: "/admin/candidates", label: "Candidates", icon: Users },
  { href: "/admin/profiles", label: "Profiles", icon: ShieldCheck },
  { href: "/admin/questions", label: "Questions", icon: ClipboardList },
  { href: "/admin/assessments", label: "Assessments", icon: GraduationCap },
  { href: "/admin/results", label: "Results", icon: FileSpreadsheet },
  { href: "/admin/settings", label: "Settings & Data", icon: Settings },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-slate-200 bg-white lg:flex">
        <div className="flex h-16 items-center border-b border-slate-100 px-5">
          <Link href="/admin">
            <BrandLogo size="sm" />
          </Link>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {NAV.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/admin" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  active
                    ? "bg-primary-50 text-primary-700"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-slate-100 p-3">
          <Link
            href="/"
            className="mb-1 flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100"
          >
            View public site
          </Link>
          <button
            onClick={async () => {
              await fetch("/api/auth/logout", { method: "POST" });
              router.push("/");
              router.refresh();
            }}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="fixed inset-x-0 top-0 z-30 flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4 lg:hidden">
        <Link href="/admin">
          <BrandLogo size="sm" />
        </Link>
        <button
          onClick={async () => {
            await fetch("/api/auth/logout", { method: "POST" });
            router.push("/");
          }}
          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-rose-600 hover:bg-rose-50"
        >
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex items-stretch overflow-x-auto border-t border-slate-200 bg-white lg:hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {NAV.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/admin" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex min-w-[76px] flex-col items-center justify-center gap-1 px-2 py-2 text-[10px] font-medium ${
                active ? "text-primary-700" : "text-slate-500"
              }`}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <main className="flex-1 px-4 pb-20 pt-16 lg:ml-60 lg:px-8 lg:pb-8 lg:pt-8">
        <div className="mx-auto w-full max-w-6xl">{children}</div>
      </main>
    </div>
  );
}