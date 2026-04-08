import type { UnderstandingProgress as UnderstandingProgressType } from "@/lib/types/game";

export function UnderstandingProgress({
  understanding,
}: {
  understanding: UnderstandingProgressType;
}) {
  return (
    <div className="rounded-3xl border border-stone-300/70 bg-white/80 p-4 shadow-sm backdrop-blur">
      <div className="flex items-center justify-between text-sm text-stone-600">
        <span>怪谈理解度</span>
        <span>
          {understanding.level} / {understanding.total}
        </span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-stone-200">
        <div
          className="h-full rounded-full bg-gradient-to-r from-amber-500 via-rose-400 to-sky-500"
          style={{ width: `${understanding.progress_percent}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-stone-500">
        下一阶: {understanding.next_level} · {understanding.next_threshold}
      </p>
    </div>
  );
}
