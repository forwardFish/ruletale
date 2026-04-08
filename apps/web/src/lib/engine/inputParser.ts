import type { MvpParsedAction, MvpPsychStats } from "@/lib/types/game";
import type { InventoryEntry } from "@/lib/types/inventory";
import type { ActionIntent } from "@/lib/types/node";
import { includesAny, normalizeText } from "@/lib/utils/text";

import { parserBias } from "./understandingEngine";

type ParserContext = {
  visibleObjects?: string[];
  psych?: Partial<MvpPsychStats>;
  inventory?: InventoryEntry[];
};

const KEYWORDS: Record<ActionIntent, string[]> = {
  observe: ["观察", "看看", "留意", "盯着", "查看", "听听"],
  inspect_object: ["检查", "翻", "摸", "读取", "看一下", "查看", "照一照"],
  move_to_area: ["去", "前往", "走向", "进入", "靠近", "离开", "撤离", "退回"],
  ask_question: ["询问", "问", "问她", "问他", "喊", "叫", "确认一下"],
  verify_rule: ["核对", "验证", "对照", "确认", "求证", "规则", "真假", "是不是", "冲突"],
  respond_voice: ["回应", "回答", "开门", "救", "相信", "跟着", "顺着", "解锁"],
  hide: ["躲", "藏", "避开", "退后", "先别靠近", "先不回应"],
  wait: ["等待", "等一分钟", "停一会", "站着不动", "数到四"],
  use_item: ["使用", "拿出", "掏出", "戴上", "注射", "点亮"],
  fight: ["攻击", "战斗", "撞开", "压制", "反击", "动手"],
  flee: ["逃跑", "撤离", "离开", "快走", "冲出去", "退回楼梯"],
  test_boundary: ["试探", "踩线", "故意", "边界", "碰一碰"],
  open_inventory: ["背包", "物品", "道具栏"],
  check_archive: ["档案", "记录", "规则记录", "笔记"],
};

const TARGET_SYNONYMS: Array<{ canonical: string; tokens: string[] }> = [
  { canonical: "护士站", tokens: ["护士站", "值班台", "前台"] },
  { canonical: "告示牌", tokens: ["告示", "告示牌", "规则牌"] },
  { canonical: "走廊尽头", tokens: ["走廊尽头", "尽头", "东区走廊", "东区"] },
  { canonical: "值班表", tokens: ["值班表", "排班", "名单"] },
  { canonical: "交接本", tokens: ["交接本", "记录本"] },
  { canonical: "护士", tokens: ["护士", "白衣", "白大褂"] },
  { canonical: "107房门", tokens: ["107", "107房", "门口", "房门"] },
  { canonical: "档案室", tokens: ["档案室", "病历", "旧档案室"] },
  { canonical: "镜面", tokens: ["镜面", "镜子", "倒影", "白影"] },
  { canonical: "楼梯", tokens: ["楼梯", "安全门", "楼梯间"] },
  { canonical: "电梯", tokens: ["电梯", "电梯口"] },
  { canonical: "手电", tokens: ["手电", "手电筒"] },
  { canonical: "镇静剂", tokens: ["镇静剂", "针剂", "镇静针"] },
  { canonical: "背包", tokens: ["背包", "物品"] },
  { canonical: "档案", tokens: ["档案", "记录", "笔记"] },
  { canonical: "猫眼", tokens: ["猫眼", "窥孔"] },
  { canonical: "门缝", tokens: ["门缝", "缝隙"] },
  { canonical: "邻居", tokens: ["邻居", "隔壁", "熟人"] },
  { canonical: "信箱", tokens: ["信箱", "便签", "纸条", "信箱口"] },
  { canonical: "门禁", tokens: ["门禁", "单元门"] },
  { canonical: "家门", tokens: ["家门", "自家门", "门链", "钥匙孔"] },
  { canonical: "声音", tokens: ["声音", "催门", "门外声音", "家里人"] },
];

function inferIntent(text: string, understanding: number, inventory: InventoryEntry[] = []) {
  const weighted: Array<{ intent: ActionIntent; score: number; matched: string[] }> = [];
  const bias = parserBias(understanding, inventory);

  (Object.keys(KEYWORDS) as ActionIntent[]).forEach((intent) => {
    const matched = KEYWORDS[intent].filter((token) => text.includes(token));
    let score = matched.length * 2;

    if (intent === "verify_rule" && includesAny(text, ["广播", "门牌", "值班表", "规则", "楼层", "门缝"])) {
      score += 1 + bias * 10;
    }
    if (intent === "inspect_object" && includesAny(text, ["胸牌", "边缘", "反光", "痕迹", "猫眼", "钥匙", "按钮"])) {
      score += 1 + bias * 6;
    }
    if (intent === "respond_voice" && includesAny(text, ["求救", "孩子", "熟悉声音", "家里人", "赶紧开门"])) {
      score += understanding >= 120 ? -1 : 1;
    }
    if (intent === "move_to_area" && includesAny(text, ["楼梯", "电梯", "走廊", "家门"])) {
      score += 1;
    }

    weighted.push({ intent, score, matched });
  });

  weighted.sort((a, b) => b.score - a.score);
  const winner = weighted[0];

  if (!winner || winner.score <= 0) {
    return {
      intent: (includesAny(text, ["看看", "观察", "检查"]) ? "inspect_object" : "observe") as ActionIntent,
      matched: [],
      confidence: 0.2,
    };
  }

  return {
    intent: winner.intent as ActionIntent,
    matched: winner.matched,
    confidence: Math.min(0.98, 0.42 + winner.score * 0.12),
  };
}

function inferTarget(text: string, visibleObjects: string[]) {
  for (const target of TARGET_SYNONYMS) {
    if (target.tokens.some((token) => text.includes(token))) {
      return target.canonical;
    }
  }

  const matchingVisible = visibleObjects.find((item) => text.includes(item));
  return matchingVisible ?? null;
}

export function parseInput(rawInput: string, understanding = 0, context: ParserContext = {}): MvpParsedAction {
  const normalized = normalizeText(rawInput);
  const { intent, matched, confidence } = inferIntent(normalized, understanding, context.inventory);
  const target = inferTarget(normalized, context.visibleObjects ?? []);
  const psych = context.psych ?? {};
  const impulse = psych.IMP ?? 20;
  const empathy = psych.EMP ?? 20;
  const fear = psych.FEAR ?? 20;

  let riskTendency = 0.25;
  if (["fight", "respond_voice", "test_boundary"].includes(intent)) {
    riskTendency += 0.3;
  }
  if (includesAny(normalized, ["立刻", "马上", "直接", "赶紧"])) {
    riskTendency += 0.18;
  }
  riskTendency += impulse / 240 + empathy / 400 - understanding / 900;

  let cautiousLevel = 0.62;
  if (["verify_rule", "inspect_object", "observe", "hide"].includes(intent)) {
    cautiousLevel += 0.16;
  }
  if (includesAny(normalized, ["核对", "确认", "先看", "观察", "小心"])) {
    cautiousLevel += 0.18;
  }
  cautiousLevel += understanding / 700 - fear / 500;

  const trustTarget = includesAny(normalized, ["护士", "管理员", "广播", "邻居", "家里人"])
    ? includesAny(normalized, ["护士", "白衣"])
      ? "night_nurse"
      : includesAny(normalized, ["邻居", "家里人"])
        ? "doorstep_neighbor"
        : "administrator"
    : null;

  return {
    primaryIntent: intent,
    target,
    riskTendency: Number(Math.max(0, Math.min(1, riskTendency)).toFixed(2)),
    cautiousLevel: Number(Math.max(0, Math.min(1, cautiousLevel)).toFixed(2)),
    trustTarget,
    rawInput,
    confidence: Number(confidence.toFixed(2)),
    matchedKeywords: matched,
  };
}
