import type { MvpProgressState } from "@/lib/types/game";

import { Surface, SurfaceHeader } from "@/components/mvp/ui/Surface";

type Props = {
  progress: MvpProgressState;
};

const METRICS = [
  { label: "规则", value: (progress: MvpProgressState) => progress.archive.rules.length },
  { label: "怪物", value: (progress: MvpProgressState) => progress.archive.monsters.length },
  { label: "事件", value: (progress: MvpProgressState) => progress.archive.events.length },
  { label: "结局", value: (progress: MvpProgressState) => progress.archive.endings.length },
];

export function ArchiveRoom({ progress }: Props) {
  return (
    <Surface tone="soft" className="p-5">
      <SurfaceHeader eyebrow="Archive Room" title="档案室" description="长期沉淀的不是剧情文本本身，而是你曾带回大厅的稳定判断与记录。" />

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {METRICS.map((metric) => (
          <div key={metric.label} className="rounded-[18px] border border-white/10 bg-[#0d141b] p-4">
            <div className="text-[11px] uppercase tracking-[0.2em] text-slate-500">{metric.label}</div>
            <div className="mt-2 text-2xl font-semibold text-slate-50">{metric.value(progress)}</div>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-[18px] border border-white/10 bg-[#0d141b] p-4 text-sm leading-7 text-slate-300">
        <div>管理员碎片：{progress.archive.adminFragments.length}</div>
        <div>医院线索：{progress.archive.byDungeon.hospital_night_shift?.events.length ?? 0} 条事件</div>
        <div>公寓线索：{progress.archive.byDungeon.apartment_night_return?.events.length ?? 0} 条事件</div>
      </div>
    </Surface>
  );
}
