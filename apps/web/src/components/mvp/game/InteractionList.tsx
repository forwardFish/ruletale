"use client";

import type { SceneActionSuggestion } from "@/lib/types/node";

import { StatusPill } from "@/components/mvp/ui/Surface";

const KIND_LABEL: Record<SceneActionSuggestion["kind"], string> = {
  observe: "观察",
  inspect_object: "检查",
  move_to_area: "移动",
  ask_question: "询问",
  verify_rule: "求证",
  respond_voice: "回应",
  hide: "回避",
  wait: "等待",
  use_item: "物品",
  fight: "压制",
  flee: "撤离",
  test_boundary: "试探",
  open_inventory: "背包",
  check_archive: "档案",
};

const RISK_TONE_CLASS: Record<NonNullable<SceneActionSuggestion["riskTone"]>, string> = {
  safe: "border-emerald-300/20 bg-emerald-300/10 text-emerald-50/90",
  balanced: "border-amber-300/18 bg-amber-300/10 text-amber-50/90",
  risky: "border-rose-300/20 bg-rose-300/10 text-rose-50/90",
};

type Props = {
  actions: SceneActionSuggestion[];
  onCommand: (command: string) => void;
  disabled?: boolean;
};

export function InteractionList({ actions, onCommand, disabled = false }: Props) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {actions.map((action) => (
        <button
          key={action.id}
          type="button"
          disabled={disabled}
          onClick={() => onCommand(action.command)}
          className="rounded-[20px] border border-white/10 bg-[#0d141b] p-4 text-left text-slate-100 transition duration-200 hover:border-white/14 hover:bg-[#111922] disabled:cursor-not-allowed disabled:opacity-45"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <StatusPill tone="accent">{KIND_LABEL[action.kind]}</StatusPill>
              {action.riskTone ? (
                <span
                  className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] uppercase tracking-[0.14em] ${RISK_TONE_CLASS[action.riskTone]}`}
                >
                  {action.riskLabel ?? (action.riskTone === "safe" ? "低风险" : action.riskTone === "risky" ? "高压试探" : "稳步推进")}
                </span>
              ) : null}
            </div>
            <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Direct Select</div>
          </div>
          <div className="mt-4 text-base font-semibold leading-7">{action.label}</div>
          <div className="mt-2 text-sm leading-6 text-slate-400">{action.reason}</div>
          <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 px-3 py-3 text-xs leading-5 text-slate-300">
            {action.command}
          </div>
        </button>
      ))}
    </div>
  );
}
