import { formatCombatAction } from "@/lib/copy";

export function CombatPanel({
  options,
  monsterName,
  weaknessKnown,
  onResolve,
  loading,
}: {
  options: string[];
  monsterName: string;
  weaknessKnown?: boolean;
  onResolve: (action: string) => void;
  loading?: boolean;
}) {
  return (
    <div className="grid gap-3">
      {options.map((action) => (
        <button
          key={action}
          type="button"
          disabled={loading}
          onClick={() => onResolve(action)}
          className="rounded-[2rem] border border-rose-200/80 bg-white/90 p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-rose-300"
        >
          <p className="text-xs uppercase tracking-[0.3em] text-rose-500">{formatCombatAction(action)}</p>
          <h4 className="mt-2 text-lg font-semibold text-stone-900">{monsterName}</h4>
          <p className="mt-2 text-sm leading-6 text-stone-600">
            {weaknessKnown ? "你已经抓到它退让的规则，现在关键是顺序和代价控制。" : "弱点还没有完全显影，仓促硬拼通常不会是最优解。"}
          </p>
        </button>
      ))}
    </div>
  );
}
