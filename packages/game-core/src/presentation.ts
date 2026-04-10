import { ITEM_DEFINITIONS } from "./data/items";
import { buildDungeonCards } from "./data/lobby";
import { behaviorLabel, dominantBehavior } from "./engine/profileEngine";
import type { MvpCombatAction, MvpGameStoreState } from "./types/game";
import type { SceneActionSuggestion, SceneNode } from "./types/node";
import type { SettlementResult } from "./types/score";

export type PresentationAction = {
  id: string;
  label: string;
  tone: "primary" | "secondary" | "ghost" | "danger";
  disabled?: boolean;
};

export type PresentationList = {
  title: string;
  items: string[];
  empty: string;
};

export type HallPresentation = {
  hero: {
    eyebrow: string;
    title: string;
    subtitle: string;
    primaryActions: PresentationAction[];
    mood: {
      eyebrow: string;
      title: string;
      description: string;
    };
  };
  statusCards: Array<{
    id: string;
    label: string;
    value: string;
    hint: string;
    accent: string;
  }>;
  taskWall: {
    eyebrow: string;
    title: string;
    description: string;
    playableDungeons: HallDungeonPresentation[];
    blackZone: HallDungeonPresentation | null;
  };
  quickLinks: PresentationAction[];
  recentTraces: {
    rules: PresentationList;
    items: PresentationList;
    fragments: PresentationList;
  };
};

export type HallDungeonPresentation = {
  id: string;
  title: string;
  subtitle: string;
  danger: string;
  recommendedStyle: string;
  recommendationNote: string;
  statusLabel: string;
  riskLabel: string;
  lockReason: string;
  buttonLabel: string;
  locked: boolean;
  isBlackZone: boolean;
  coverImage: string;
  ambientLine: string;
};

export type DungeonPresentation = {
  title: string;
  subtitle: string;
  scene: {
    title: string;
    area: string;
    description: string;
    currentGoal: string;
    visibleObjects: string[];
    suspiciousPoints: string[];
  } | null;
  suggestedActions: SceneActionSuggestion[];
  inputHint: string;
  combatActions: Array<{ label: string; value: MvpCombatAction }>;
  lastLog: string[];
  settlementEntry: SettlementPresentation | null;
  returnAction: PresentationAction;
};

export type ArchivePresentation = {
  title: string;
  subtitle: string;
  rules: PresentationList;
  monsters: PresentationList;
  endings: PresentationList;
  adminFragments: PresentationList;
};

export type SettlementPresentation = {
  title: string;
  subtitle: string;
  endingTitle: string;
  summary: string;
  metrics: Array<{ label: string; value: string }>;
  rewards: string[];
  returnAction: PresentationAction;
};

const FALLBACK_TEXT = "暂无";

export function buildHallPresentation(state: MvpGameStoreState): HallPresentation {
  const dungeonCards = buildDungeonCards(state.progress, state.lobby, state.player);
  const latestReward = state.progress.recentRewards[0];
  const latestRewardName = latestReward ? ITEM_DEFINITIONS[latestReward.itemId]?.name ?? latestReward.itemId : FALLBACK_TEXT;
  const blackTalkValue = String(state.lobby.blackZone.conditions.filter((item) => item.satisfied).length).padStart(2, "0");
  const primaryBehavior = behaviorLabel(dominantBehavior(state.player.behaviorProfile));
  const recentRewardItems =
    state.progress.recentRewards.length > 0
      ? state.progress.recentRewards.slice(0, 4).map((reward) => ITEM_DEFINITIONS[reward.itemId]?.name ?? reward.itemId)
      : state.inventory.slice(0, 4).map((item) => ITEM_DEFINITIONS[item.id]?.name ?? item.id);

  const mappedDungeons = dungeonCards.map(mapHallDungeon);

  return {
    hero: {
      eyebrow: "Ruletale Hall",
      title: "规则之外，才是大厅真正的入口。",
      subtitle:
        "这里不是菜单，而是一处会持续记录你判断方式的外层空间。你带回来的理解、污染、物品与错误，都会在这里留下痕迹。真正危险的从来不是没有规则，而是你开始分不清哪些规则在保护你，哪些规则想把你引向更深处。",
      primaryActions: [
        { id: "continue_hall", label: "继续进入大厅", tone: "primary" },
        { id: "settlement", label: "查看上次结算", tone: "ghost" },
      ],
      mood: {
        eyebrow: "Hall Mood",
        title: "深红压迫感作为背景，而不是单独插画卡片",
        description:
          "背景改为整块 Hero 氛围底图，文字与状态悬浮在其上，让画面更像真正的首页背景，而不是右侧单独摆了一张图。",
      },
    },
    statusCards: [
      {
        id: "understanding",
        label: "理解度",
        value: String(state.player.understanding),
        hint: "窥界者 · 更容易发现规则冲突",
        accent: "from-rose-500/28 via-red-400/10 to-transparent",
      },
      {
        id: "contamination",
        label: "污染值",
        value: String(state.player.contamination).padStart(2, "0"),
        hint: "处于可控范围，但镜面异常更容易靠近",
        accent: "from-orange-500/16 via-red-500/10 to-transparent",
      },
      {
        id: "behavior",
        label: "行为标签",
        value: primaryBehavior,
        hint: "偏向观察、求证与延迟回应",
        accent: "from-white/8 via-white/4 to-transparent",
      },
      {
        id: "supply_marks",
        label: "怪谈币",
        value: String(state.progress.supplyMarks),
        hint: "用于普通商店购买常规道具与补给。",
        accent: "from-amber-400/18 via-transparent to-transparent",
      },
      {
        id: "black_talk",
        label: "怪谈值",
        value: blackTalkValue,
        hint: "用于黑市交易高风险、高收益物品。",
        accent: "from-fuchsia-500/18 via-transparent to-transparent",
      },
      {
        id: "latest_reward",
        label: "最近奖励",
        value: latestRewardName,
        hint: latestReward ? latestReward.reason : "完成正式副本后，这里会记录最近带回大厅的奖励。",
        accent: "from-rose-400/18 via-transparent to-transparent",
      },
    ],
    taskWall: {
      eyebrow: "Task Wall",
      title: "可进入副本",
      description: "大厅不会替你判断哪条路更安全，它只会把已经浮出水面的入口整齐地推到你面前。",
      playableDungeons: mappedDungeons.filter((entry) => !entry.isBlackZone),
      blackZone: mappedDungeons.find((entry) => entry.isBlackZone) ?? null,
    },
    quickLinks: [
      { id: "archive", label: "打开档案", tone: "ghost" },
      { id: "settlement", label: "最近结算", tone: "ghost" },
    ],
    recentTraces: {
      rules: {
        title: "最近发现规则",
        items: state.progress.archive.rules.slice(-3).reverse().map((rule) => rule.title || rule.text),
        empty: "你还没有掌握足够稳定的规则线索。",
      },
      items: {
        title: "最近获得物品",
        items: recentRewardItems,
        empty: "完成一轮正式探索后，这里会出现最新带回大厅的物品。",
      },
      fragments: {
        title: "管理员碎片记录",
        items: state.progress.archive.adminFragments.slice(-3).reverse(),
        empty: "管理员相关碎片还没有足够完整地浮出水面。",
      },
    },
  };
}

export function buildDungeonPresentation({
  state,
  activeNode,
}: {
  state: MvpGameStoreState;
  activeNode: SceneNode | null;
}): DungeonPresentation {
  const runtime = state.runtime;
  const settlement = runtime?.pendingSettlement ?? null;

  return {
    title: runtime?.dungeonTitle ?? "副本载入中",
    subtitle: "纯本地模式，不请求任何在线模型。",
    scene: activeNode
      ? {
          title: activeNode.title,
          area: activeNode.area,
          description: activeNode.description,
          currentGoal: activeNode.currentGoal,
          visibleObjects: activeNode.visibleObjects,
          suspiciousPoints: activeNode.suspiciousPoints,
        }
      : null,
    suggestedActions: activeNode?.suggestedActions ?? [],
    inputHint: "例如: 观察广播 / 核对门牌 / 使用手电",
    combatActions: [
      { label: "强攻", value: "attack" },
      { label: "防守", value: "defend" },
      { label: "撤离", value: "flee" },
      { label: "利用规则", value: "exploit_rule" },
    ],
    lastLog: runtime?.log.slice(-5) ?? [],
    settlementEntry: settlement ? buildSettlementPresentation(settlement) : null,
    returnAction: { id: "return_hall", label: "返回大厅", tone: "ghost" },
  };
}

export function buildArchivePresentation(state: MvpGameStoreState): ArchivePresentation {
  return {
    title: "怪谈档案",
    subtitle: "按副本沉淀规则、怪物、结局和管理员碎片。",
    rules: {
      title: "规则记录",
      items: state.progress.archive.rules.map((rule) => rule.text),
      empty: "暂无已确认规则。",
    },
    monsters: {
      title: "怪物",
      items: state.progress.archive.monsters.map((monster) => monster.name),
      empty: FALLBACK_TEXT,
    },
    endings: {
      title: "结局",
      items: state.progress.archive.endings,
      empty: FALLBACK_TEXT,
    },
    adminFragments: {
      title: "管理员碎片",
      items: state.progress.archive.adminFragments,
      empty: FALLBACK_TEXT,
    },
  };
}

export function buildSettlementPresentation(settlement: SettlementResult | null): SettlementPresentation {
  return {
    title: "结算台",
    subtitle: "结局摘要、六维评分、奖励和理解度变化都会保留在本地存档中。",
    endingTitle: settlement?.endingTitle ?? "暂无结算",
    summary: settlement?.summary ?? "完成任一副本后，这里会显示最近一次结算。",
    metrics: settlement
      ? [
          { label: "总理解度", value: String(settlement.totalUnderstanding) },
          { label: "理解度变化", value: `+${settlement.understandingDelta}` },
          { label: "综合评分", value: settlement.grades.overall },
        ]
      : [],
    rewards: settlement?.rewards.map((reward) => `${ITEM_DEFINITIONS[reward.itemId]?.name ?? reward.itemId} x${reward.quantity}`) ?? [],
    returnAction: { id: "return_hall", label: "返回大厅", tone: "ghost" },
  };
}

function mapHallDungeon(card: ReturnType<typeof buildDungeonCards>[number]): HallDungeonPresentation {
  const isBlackZone = card.id === "black_zone_entry";

  return {
    id: card.id,
    title: card.title,
    subtitle: isBlackZone ? "需要更高理解度与关键物品后才可进入。" : card.subtitle,
    danger: card.danger,
    recommendedStyle: card.recommendedStyle,
    recommendationNote: card.recommendationNote || "当前建议：先观察，再回应，最后决定是否接近。",
    statusLabel: card.statusLabel || (card.locked ? "锁定" : "可进入副本"),
    riskLabel: card.riskLabel,
    lockReason: card.lockReason || "",
    buttonLabel: isBlackZone ? "尚未开放" : card.locked ? card.lockReason || "未解锁" : "进入副本",
    locked: card.locked || isBlackZone,
    isBlackZone,
    coverImage: card.coverImage,
    ambientLine: card.ambientLine,
  };
}
