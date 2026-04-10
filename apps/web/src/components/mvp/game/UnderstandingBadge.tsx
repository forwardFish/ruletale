import { Eye } from "lucide-react";

import { getUnderstandingSnapshot } from "@game-core/engine/understandingEngine";

export function UnderstandingBadge({ total }: { total: number }) {
  const snapshot = getUnderstandingSnapshot(total);

  return (
    <div className="flex items-center gap-3 rounded-[20px] border border-white/10 bg-white/[0.05] px-4 py-3 text-slate-100">
      <div className="rounded-[14px] bg-amber-200/[0.12] p-2 text-amber-100">
        <Eye className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <div className="text-[11px] uppercase tracking-[0.22em] text-slate-500">理解度</div>
        <div className="truncate text-sm font-semibold text-slate-50">{snapshot.levelName}</div>
      </div>
      <div className="ml-auto text-right">
        <div className="text-lg font-semibold text-slate-50">{snapshot.total}</div>
      </div>
    </div>
  );
}
