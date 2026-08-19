import type { ReactNode } from "react";
import { BadgeCheck } from "lucide-react";
import Image from "next/image";
import { env } from "@/lib/env";

export function BrandLogo({
  size = "md",
  showWordmark = true,
}: {
  size?: "sm" | "md" | "lg";
  showWordmark?: boolean;
}) {
  const dims =
    size === "lg" ? "h-12 w-12" : size === "sm" ? "h-7 w-7" : "h-9 w-9";
  const text =
    size === "lg" ? "text-2xl" : size === "sm" ? "text-base" : "text-xl";
  return (
    <span className="inline-flex items-center gap-2.5">
      <span
        className={`${dims} relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-black`}
      >
        <Image
          src="/tcc-logo.png"
          alt={env.appName}
          fill
          sizes="48px"
          className="object-cover"
          priority
        />
      </span>
      {showWordmark ? (
        <span
          className={`${text} brand-serif hidden font-bold leading-none text-slate-900 min-[381px]:inline`}
        >
          thecodingcompany
        </span>
      ) : null}
    </span>
  );
}

export function AppFooter({ children }: { children?: ReactNode }) {
  return (
    <footer className="border-t border-white/10 bg-black">
      <div className="mx-auto w-full max-w-6xl px-4 py-6 text-center text-sm text-slate-500">
        {children ?? (
          <>
            <span className="brand-serif text-base text-slate-400">
              {env.appName}
            </span>
            <span className="mx-2 text-slate-700">·</span>
            Recruitment assessment
            <span className="mx-2 text-slate-700">·</span>
            <BadgeCheck className="mr-1 inline h-3.5 w-3.5 text-primary-500" />
            Proctored
          </>
        )}
      </div>
    </footer>
  );
}