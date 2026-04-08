import type { ReactNode } from "react";

import { Surface } from "@/components/mvp/ui/Surface";

export function SidePanel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Surface tone="soft" className="p-5">
      <div className="text-[13px] font-medium tracking-[0.08em] text-slate-200">{title}</div>
      <div className="mt-4">{children}</div>
    </Surface>
  );
}
