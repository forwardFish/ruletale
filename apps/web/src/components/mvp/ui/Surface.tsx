import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@game-core/utils/cn";

type SurfaceTone = "default" | "soft" | "hero" | "accent" | "danger";

type SurfaceProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  tone?: SurfaceTone;
};

const TONE_CLASS: Record<SurfaceTone, string> = {
  default: "border-white/10 bg-[#111922]/88 shadow-[0_18px_48px_rgba(0,0,0,0.24)]",
  soft: "border-white/[0.07] bg-white/[0.04] shadow-[0_10px_28px_rgba(0,0,0,0.18)]",
  hero: "border-white/10 bg-[linear-gradient(180deg,rgba(18,26,36,0.98),rgba(13,19,28,0.92))] shadow-[0_24px_60px_rgba(0,0,0,0.28)]",
  accent: "border-amber-300/15 bg-amber-200/[0.06] shadow-[0_16px_40px_rgba(0,0,0,0.22)]",
  danger: "border-rose-300/18 bg-rose-300/[0.06] shadow-[0_16px_40px_rgba(0,0,0,0.22)]",
};

export function Surface({ children, tone = "default", className, ...props }: SurfaceProps) {
  return (
    <div className={cn("rounded-[24px] border p-5 text-slate-100", TONE_CLASS[tone], className)} {...props}>
      {children}
    </div>
  );
}

type SurfaceHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
};

export function SurfaceHeader({ eyebrow, title, description, action, className }: SurfaceHeaderProps) {
  return (
    <div className={cn("flex items-start justify-between gap-4", className)}>
      <div className="min-w-0">
        {eyebrow ? <div className="text-[11px] uppercase tracking-[0.24em] text-slate-500">{eyebrow}</div> : null}
        <div className={cn(eyebrow ? "mt-3" : "", "text-base font-semibold text-slate-100")}>{title}</div>
        {description ? <p className="mt-2 text-sm leading-7 text-slate-400">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function StatusPill({ children, tone = "default", className }: { children: ReactNode; tone?: "default" | "accent" | "success"; className?: string }) {
  const tones = {
    default: "border-white/10 bg-white/[0.04] text-slate-300",
    accent: "border-amber-300/20 bg-amber-200/[0.10] text-amber-50",
    success: "border-emerald-300/20 bg-emerald-200/[0.10] text-emerald-50",
  } as const;

  return <span className={cn("inline-flex items-center rounded-full border px-3 py-1 text-xs", tones[tone], className)}>{children}</span>;
}
