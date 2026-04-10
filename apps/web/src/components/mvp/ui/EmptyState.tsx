import type { ReactNode } from "react";

import { cn } from "@game-core/utils/cn";

type Props = {
  title: string;
  description: string;
  tone?: "default" | "warning";
  action?: ReactNode;
  className?: string;
};

export function EmptyState({ title, description, tone = "default", action, className }: Props) {
  return (
    <div
      className={cn(
        "rounded-[22px] border border-dashed px-5 py-5",
        tone === "warning"
          ? "border-amber-300/20 bg-amber-200/[0.05] text-amber-50/90"
          : "border-white/10 bg-white/[0.03] text-slate-300",
        className,
      )}
    >
      <div className="text-sm font-medium text-slate-100">{title}</div>
      <p className="mt-2 text-sm leading-7 text-inherit/80">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
