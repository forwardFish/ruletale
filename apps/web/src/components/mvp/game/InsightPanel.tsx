import { Sparkles } from "lucide-react";

import { Surface } from "@/components/mvp/ui/Surface";

export function InsightPanel({ insight }: { insight: string | null | undefined }) {
  if (!insight) {
    return null;
  }

  return (
    <Surface tone="accent" className="p-4">
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.24em] text-amber-100">
        <Sparkles className="h-4 w-4" />
        额外洞察
      </div>
      <p className="mt-3 text-sm leading-7 text-amber-50/90">{insight}</p>
    </Surface>
  );
}
