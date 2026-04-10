import { getUnderstandingSnapshot } from "@game-core/engine/understandingEngine";

export function UnderstandingProgress({ total }: { total: number }) {
  const snapshot = getUnderstandingSnapshot(total);

  return (
    <div className="rounded-[20px] border border-white/10 bg-[#0d141b] p-4 text-slate-100">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-medium text-slate-100">{snapshot.levelName}</span>
        <span className="text-slate-500">
          {snapshot.total} / {snapshot.nextThreshold}
        </span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-[linear-gradient(90deg,#8b7549,#b89a62,#d7c39d)]" style={{ width: `${snapshot.progressPercent}%` }} />
      </div>
      <div className="mt-2 text-xs leading-6 text-slate-500">下一等级：{snapshot.nextLevelName}</div>
    </div>
  );
}
