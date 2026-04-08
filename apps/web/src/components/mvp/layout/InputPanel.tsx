"use client";

import { useState } from "react";
import { Keyboard, SendHorizonal, Sparkles } from "lucide-react";

import { Button } from "@/components/mvp/ui/Button";
import { Surface } from "@/components/mvp/ui/Surface";

type Props = {
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void | Promise<void>;
  disabled?: boolean;
  isSubmitting?: boolean;
};

export function InputPanel({
  value,
  placeholder,
  onChange,
  onSubmit,
  disabled = false,
  isSubmitting = false,
}: Props) {
  const [isComposing, setIsComposing] = useState(false);

  return (
    <Surface tone="soft" className="p-5 md:p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.24em] text-slate-500">
            <Keyboard className="h-4 w-4" />
            Action Composer
          </div>
          <div className="mt-2 text-lg font-semibold text-slate-100">你现在想做什么</div>
          <div className="mt-2 text-sm leading-6 text-slate-400">
            输入会先交给模型理解，再交给本地规则引擎决定节点推进、规则解锁和奖励结算。
          </div>
        </div>
        <div className="text-xs leading-6 text-slate-500">按 Enter 提交，Shift + Enter 换行</div>
      </div>

      <textarea
        value={value}
        disabled={disabled || isSubmitting}
        placeholder={placeholder ?? "例如：观察护士站、核对值班表、看猫眼、去楼梯间、使用手电"}
        onChange={(event) => onChange(event.target.value)}
        onCompositionStart={() => setIsComposing(true)}
        onCompositionEnd={() => setIsComposing(false)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey && !isComposing) {
            event.preventDefault();
            void onSubmit(value);
          }
        }}
        className="mt-4 min-h-[140px] w-full rounded-[22px] border border-white/10 bg-[#0b0f15] px-4 py-4 text-sm leading-7 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-amber-200/18 focus:bg-[#0d131b] disabled:cursor-not-allowed disabled:opacity-55"
      />

      <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="rounded-[18px] border border-white/10 bg-black/20 px-4 py-3 text-xs leading-6 text-slate-500">
          模型负责把你的表述收束成动作，并补一组下一步选项；真正的规则、奖励和结局仍由当前副本引擎判定。
        </div>
        <Button
          type="button"
          variant="primary"
          disabled={disabled || isSubmitting || !value.trim()}
          onClick={() => void onSubmit(value)}
          className="min-w-[168px] gap-2"
        >
          {isSubmitting ? <Sparkles className="h-4 w-4 animate-pulse" /> : <SendHorizonal className="h-4 w-4" />}
          {isSubmitting ? "模型处理中" : "提交动作"}
        </Button>
      </div>
    </Surface>
  );
}
