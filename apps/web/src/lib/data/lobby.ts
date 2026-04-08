import type { MvpBlackZoneConditionProgress, MvpBlackZoneProgress, MvpLobbyState, MvpPlayerState, MvpProgressState } from "@/lib/types/game";
import type { InventoryEntry } from "@/lib/types/inventory";

import { SHOP_STOCK_IDS } from "./items";

export const BLACK_ZONE_UNDERSTANDING_THRESHOLD = 120;

export const LOBBY_DUNGEONS = [
  {
    id: "hospital_night_shift",
    title: "医院夜班",
    subtitle: "住院部东区，广播、门牌和排班记录正在彼此冲突。",
    danger: "它优先利用同情心和熟悉感，让你自己把错误逻辑补完整。",
    recommendedStyle: "先核对，再回应；先确认身份，再决定要不要救。",
    unlockHint: "初始开放",
    coverImage: "/mvp/cover-hospital.svg",
    riskLabel: "高误导",
    ambientLine: "白灯、空走廊、值班表与错误护士的错位感会先于危险本身出现。",
  },
  {
    id: "apartment_night_return",
    title: "公寓夜归",
    subtitle: "深夜归家，门禁、楼层、猫眼与熟悉声线开始互相错位。",
    danger: "它把“回家”伪装成安全感本身，越熟悉的日常越可能是入口。",
    recommendedStyle: "先确认楼层和门牌，再确认门外是谁；不要先把家当成答案。",
    unlockHint: "完成医院夜班后开放",
    coverImage: "/mvp/cover-apartment.svg",
    riskLabel: "高心理压迫",
    ambientLine: "真正的危险不是陌生，而是过分熟悉的秩序突然开始替你做判断。",
  },
  {
    id: "black_zone_entry",
    title: "黑区入口",
    subtitle: "大厅更深处，一扇仍未完全承认你的门。",
    danger: "这里不缺钥匙，缺的是被规则承认的判断成本。",
    recommendedStyle: "需要理解度、关键物品与剧情碎片同时到位。",
    unlockHint: "满足三条件联动后可见真实入口",
    coverImage: "/mvp/cover-blackzone.svg",
    riskLabel: "长期目标",
    ambientLine: "它不急着放你进去，它更在意你是不是已经学会不被入口本身诱导。",
  },
] as const;

export const HALL_MODULES = [
  { id: "task_wall", title: "任务墙", summary: "选择今晚要进入的副本。" },
  { id: "archive_room", title: "档案室", summary: "查看已发现规则、怪物、事件与管理员碎片。" },
  { id: "rest_area", title: "休息区", summary: "恢复部分状态，并听到一句不一定可靠的大厅提示。" },
  { id: "settlement_desk", title: "结算台", summary: "复看上一局结算、奖励和黑区推进。" },
  { id: "shop", title: "商店", summary: "用供给点换取规则型道具。" },
  { id: "black_zone", title: "黑区入口", summary: "大厅尚未完全拒绝你，但也还没有放你进去。" },
] as const;

export const HALL_ADMIN_NOTES = [
  "管理员没有问你刚才看见了什么，只问你为什么相信了它。",
  "休息区的灯今天比昨天更暗，像是大厅提前知道你会把污染带回来。",
  "大厅看上去像缓冲区，但它真正记录下来的从来不是伤口，而是判断方式。",
  "你每带回一种更有效的判断，大厅就会少替你解释一句。",
] as const;

export function evaluateBlackZoneProgress(
  player: MvpPlayerState,
  progress: MvpProgressState,
  inventory: InventoryEntry[],
): MvpBlackZoneProgress {
  const hasUnderstanding = player.understanding >= BLACK_ZONE_UNDERSTANDING_THRESHOLD;
  const hasTemporaryPass = inventory.some((item) => item.id === "temporary_pass" && item.quantity > 0);
  const storySatisfied =
    progress.archive.endings.includes("insight_clear") ||
    progress.archive.endings.includes("apartment_insight_clear") ||
    progress.archive.adminFragments.length >= 2;

  const conditions: MvpBlackZoneConditionProgress[] = [
    {
      id: "understanding",
      label: `理解度达到 ${BLACK_ZONE_UNDERSTANDING_THRESHOLD}`,
      satisfied: hasUnderstanding,
      detail: hasUnderstanding ? "你已经具备被更高层规则注意到的敏感度。" : "还需要更多高质量判断来提高长期理解度。",
    },
    {
      id: "temporary_pass",
      label: "持有临时通行证",
      satisfied: hasTemporaryPass,
      detail: hasTemporaryPass ? "大厅已经承认你带回了一张不属于普通通关的凭证。" : "你还没有带回足以让大厅改口的通行证明。",
    },
    {
      id: "story_thread",
      label: "满足剧情线程条件",
      satisfied: storySatisfied,
      detail: storySatisfied ? "你已经通过高理解结局或管理员碎片触及了更深的叙事层。" : "需要达成任一高理解结局，或继续收集管理员碎片。",
    },
  ];

  const unlocked = conditions.every((condition) => condition.satisfied);
  const summary = unlocked
    ? "黑区入口已经开始承认你。它仍然危险，但不再把你当成纯粹的门外人。"
    : `黑区仍在锁定中：已满足 ${conditions.filter((condition) => condition.satisfied).length}/3 条前置条件。`;

  return {
    unlocked,
    conditions,
    summary,
  };
}

export function buildDungeonCards(progress: MvpProgressState, lobby: MvpLobbyState, player: MvpPlayerState) {
  const dominantHint =
    player.behaviorProfile.avoidant >= player.behaviorProfile.aggressive
      ? "你目前更适合先观察、后试探的路径。"
      : "你有强攻倾向，黑区会更容易反制这种节奏。";

  return LOBBY_DUNGEONS.map((entry) => {
    if (entry.id === "hospital_night_shift") {
      return {
        ...entry,
        locked: false,
        statusLabel: "可进入副本",
        lockReason: "",
        recommendationNote: dominantHint,
      };
    }

    if (entry.id === "apartment_night_return") {
      const unlocked = lobby.availableDungeons.includes("apartment_night_return") || progress.completedDungeons.includes("hospital_night_shift");
      return {
        ...entry,
        locked: !unlocked,
        statusLabel: unlocked ? "可进入副本" : "锁定",
        lockReason: unlocked ? "" : "先完成一次医院夜班，让大厅承认你已经看过第一层错位。",
        recommendationNote: player.understanding >= 70 ? "你已经足够擅长发现冲突信息，适合进入第二副本。" : "理解度偏低时，公寓会更容易把熟悉感伪装成安全感。",
      };
    }

    return {
      ...entry,
      locked: true,
      statusLabel: lobby.blackZone.unlocked ? "已解锁" : "锁定",
      lockReason: lobby.blackZone.unlocked ? "黑区入口已被承认，但当前版本只开放解锁态与入口档案。" : lobby.blackZone.summary,
      recommendationNote: dominantHint,
    };
  });
}

export const DEFAULT_LOBBY_STATE: MvpLobbyState = {
  availableDungeons: ["hospital_night_shift"],
  restUses: 1,
  shopStockIds: SHOP_STOCK_IDS,
  blackMarketUnlocked: false,
  blackMarketRequirements: [],
  blackMarketInventory: ["mirror_shard", "faded_charm"],
  blackZone: {
    unlocked: false,
    conditions: [
      {
        id: "understanding",
        label: `理解度达到 ${BLACK_ZONE_UNDERSTANDING_THRESHOLD}`,
        satisfied: false,
        detail: "需要更多高质量判断。",
      },
      {
        id: "temporary_pass",
        label: "持有临时通行证",
        satisfied: false,
        detail: "需要带回非常规出口的凭证。",
      },
      {
        id: "story_thread",
        label: "满足剧情线程条件",
        satisfied: false,
        detail: "需要高理解结局或管理员碎片。",
      },
    ],
    summary: "黑区仍未开放。",
  },
};
