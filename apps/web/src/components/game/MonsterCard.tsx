import { Ghost } from "lucide-react";

export function MonsterCard({
  monsterName,
  weaknessKnown,
  reason,
}: {
  monsterName: string;
  weaknessKnown?: boolean;
  reason?: string | null;
}) {
  return (
    <div className="rounded-[2rem] border border-rose-200/80 bg-gradient-to-br from-rose-100/80 via-white to-amber-50 p-5 shadow-sm">
      <div className="flex items-center gap-3 text-rose-700">
        <Ghost className="h-5 w-5" />
        <span className="text-xs uppercase tracking-[0.3em]">Monster Contact</span>
      </div>
      <h3 className="mt-3 text-2xl font-semibold text-stone-900">{monsterName}</h3>
      <p className="mt-2 text-sm leading-6 text-stone-600">{reason ?? "场景已经承认了它的存在。"}</p>
      <p className="mt-3 text-xs text-stone-500">
        {weaknessKnown ? "你已经抓到它会退让的规则。现在更重要的是别被自己的本能抢走顺序。" : "弱点还没完全显影。先别急着把正面对撞当成唯一答案。"}
      </p>
    </div>
  );
}
