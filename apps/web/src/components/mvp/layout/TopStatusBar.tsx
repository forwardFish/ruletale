import type { ReactNode } from "react";

import { StatusPill, Surface } from "@/components/mvp/ui/Surface";

type Props = {
  eyebrow: string;
  title: string;
  subtitle: string;
  right?: ReactNode;
};

export function TopStatusBar({ eyebrow, title, subtitle, right }: Props) {
  return (
    <Surface tone="hero" className="overflow-hidden p-6 md:p-7">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <StatusPill>{eyebrow}</StatusPill>
          <h1 className="mt-4 text-[2rem] font-semibold tracking-tight text-slate-50 md:text-[2.6rem]">{title}</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-400 md:text-[15px]">{subtitle}</p>
        </div>
        {right ? <div className="min-w-[260px] max-w-[320px] lg:pt-1">{right}</div> : null}
      </div>
    </Surface>
  );
}
