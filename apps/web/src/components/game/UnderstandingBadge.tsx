import { Eye } from "lucide-react";

export function UnderstandingBadge({
  level,
  total,
}: {
  level: string;
  total: number;
}) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-stone-300/70 bg-white/80 px-3 py-1 text-sm text-stone-700 shadow-sm backdrop-blur">
      <Eye className="h-4 w-4 text-amber-700" />
      <span>{level}</span>
      <span className="text-stone-500">UNDERSTANDING {total}</span>
    </div>
  );
}
