import { Clock3 } from "lucide-react";

import { EmptyState } from "@/components/mvp/ui/EmptyState";
import { Surface, SurfaceHeader } from "@/components/mvp/ui/Surface";

type Props = {
  entries: string[];
  title?: string;
};

export function EventFeed({ entries, title = "最近回响" }: Props) {
  return (
    <Surface tone="soft" className="p-5 md:p-6">
      <SurfaceHeader
        eyebrow="Recent Feedback"
        title={title}
        description="副本不会把所有结论一次性告诉你，它只会把最近几次真实发生过的偏移和反馈留在这里。"
      />

      <div className="mt-4 space-y-3">
        {entries.length === 0 ? (
          <EmptyState title="还没有新的记录" description="当你开始行动、发现冲突或触发异常后，这里会优先沉淀最近的副本反馈。" />
        ) : (
          entries
            .slice(-6)
            .reverse()
            .map((entry, index) => (
              <div key={`${entry}-${index}`} className="rounded-[18px] border border-white/10 bg-[#0d141b] px-4 py-3">
                <div className="flex items-start gap-3">
                  <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-slate-400">
                    <Clock3 className="h-3.5 w-3.5" />
                  </div>
                  <div className="text-sm leading-7 text-slate-300">{entry}</div>
                </div>
              </div>
            ))
        )}
      </div>
    </Surface>
  );
}
