import type {
  MvpBlackZoneConditionProgress,
  MvpBlackZoneProgress,
  MvpLobbyState,
  MvpPlayerState,
  MvpProgressState,
} from "@game-core/types/game";
import type { InventoryEntry } from "@game-core/types/inventory";

import { SHOP_STOCK_IDS } from "./items";

export const BLACK_ZONE_UNDERSTANDING_THRESHOLD = 120;

export const LOBBY_DUNGEONS = [
  {
    id: "hospital_night_shift",
    title: "医院夜班",
    subtitle: "住院部东区，广播、门牌与值班记录开始互相撒谎。",
    danger: "它优先利用同情心和熟悉感，让你自己把错误逻辑补完整。",
    recommendedStyle: "先核对，再回应；先确认身份，再决定要不要救。",
    unlockHint: "初始开放",
    coverImage: "/mvp/cover-hospital.svg",
    riskLabel: "高误导",
    ambientLine: "白灯、空走廊和值班记录的错位，会先于真正危险本身浮出水面。",
  },
  {
    id: "apartment_night_return",
    title: "公寓夜归",
    subtitle: "深夜归家，门禁、楼层、猫眼与熟悉声音开始错位。",
    danger: "它把“回家”伪装成安全感本身，越熟悉的日常越可能是入口。",
    recommendedStyle: "先确认楼层和门牌，再确认门外是谁；不要先把家当成答案。",
    unlockHint: "完成医院夜班后开放",
    coverImage: "/mvp/cover-apartment.svg",
    riskLabel: "高压迫",
    ambientLine: "真正危险的不是陌生，而是过分熟悉的秩序突然开始替你做判断。",
  },
  {
    id: "subway_last_train",
    title: "末班地铁",
    subtitle: "报站、列车编号、车窗倒影与终点站顺序开始互相打架。",
    danger: "它想让你把“赶上最后一班车”误认成“已经上对车”。",
    recommendedStyle: "先核对编号和报站，再确认是不是该上这节车厢。",
    unlockHint: "完成公寓夜归后开放",
    coverImage: "/mvp/cover-subway.svg",
    riskLabel: "高错序",
    ambientLine: "末班车最危险的从来不是晚，而是它如何替你把顺序写成标准答案。",
  },
  {
    id: "campus_night_patrol",
    title: "校园夜巡",
    subtitle: "巡夜名单、点名广播、亮灯教室与带路教师开始对不上。",
    danger: "它借最像校规、最像职责的东西，逼你省掉最后一次确认。",
    recommendedStyle: "先核对值班名单，再确认教室位置，不要先跟着带路者走。",
    unlockHint: "完成末班地铁后开放",
    coverImage: "/mvp/cover-campus.svg",
    riskLabel: "高秩序伪装",
    ambientLine: "越像规则、越像老师、越像职责的东西，今夜越值得先怀疑。",
  },
  {
    id: "black_zone_entry",
    title: "黑区入口",
    subtitle: "大厅更深处，一扇尚未完全承认你的门。",
    danger: "这里不缺钥匙，缺的是被更高层规则承认的判断成本。",
    recommendedStyle: "需要理解度、关键物品与剧情碎片同时到位。",
    unlockHint: "满足黑区前置条件后可见真实入口",
    coverImage: "/mvp/cover-blackzone.svg",
    riskLabel: "长期目标",
    ambientLine: "它不急着放你进去，它更在意你是否已经学会不被入口本身诱导。",
  },
] as const;

export const HALL_MODULES = [
  { id: "task_wall", title: "任务墙", summary: "选择今夜要进入的副本。" },
  { id: "archive_room", title: "档案室", summary: "查看已发现规则、怪物、事件与管理员碎片。" },
  { id: "rest_area", title: "休息区", summary: "恢复部分状态，并听到一句不一定可靠的大厅提示。" },
  { id: "settlement_desk", title: "结算台", summary: "复看上一局结算、奖励与黑区推进。" },
  { id: "shop", title: "商店", summary: "用怪谈币换取规则型道具。" },
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
    progress.archive.endings.includes("subway_insight_clear") ||
    progress.archive.endings.includes("campus_insight_clear") ||
    progress.archive.adminFragments.length >= 2;

  const conditions: MvpBlackZoneConditionProgress[] = [
    {
      id: "understanding",
      label: `理解度达到 ${BLACK_ZONE_UNDERSTANDING_THRESHOLD}`,
      satisfied: hasUnderstanding,
      detail: hasUnderstanding ? "你已经具备被更高层规则注意到的敏感度。" : "还需要更多高质量判断来抬升长期理解度。",
    },
    {
      id: "temporary_pass",
      label: "持有临时通行证",
      satisfied: hasTemporaryPass,
      detail: hasTemporaryPass ? "大厅承认你带回了一张不属于普通幸存者的凭证。" : "你还没有带回足以让大厅改口的通行证明。",
    },
    {
      id: "story_thread",
      label: "满足剧情线索条件",
      satisfied: storySatisfied,
      detail: storySatisfied ? "你已经通过高理解结局或管理员碎片触及了更深的叙事层。" : "需要达成任一高理解结局，或继续收集管理员碎片。",
    },
  ];

  const unlocked = conditions.every((condition) => condition.satisfied);
  const summary = unlocked
    ? "黑区入口已经开始承认你。它仍然危险，但不再把你当成纯粹的门外人。"
    : `黑区仍处于锁定中：已满足 ${conditions.filter((condition) => condition.satisfied).length}/3 条前置条件。`;

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
        recommendationNote: player.understanding >= 70 ? "你已经足够擅长发现冲突信息，适合进入第二副本。" : "理解度偏低时，公寓更容易把熟悉感伪装成安全感。",
      };
    }

    if (entry.id === "subway_last_train") {
      const unlocked = lobby.availableDungeons.includes("subway_last_train") || progress.completedDungeons.includes("apartment_night_return");
      return {
        ...entry,
        locked: !unlocked,
        statusLabel: unlocked ? "可进入副本" : "锁定",
        lockReason: unlocked ? "" : "先通过公寓夜归，确认你已经学会把熟悉感和位置判断拆开。",
        recommendationNote: player.understanding >= 90 ? "你已经足够适应顺序错位类副本。" : "末班地铁会专门利用“赶上最后一次”的急迫感。",
      };
    }

    if (entry.id === "campus_night_patrol") {
      const unlocked = lobby.availableDungeons.includes("campus_night_patrol") || progress.completedDungeons.includes("subway_last_train");
      return {
        ...entry,
        locked: !unlocked,
        statusLabel: unlocked ? "可进入副本" : "锁定",
        lockReason: unlocked ? "" : "先完成末班地铁，再进入更擅长伪装成秩序的校园副本。",
        recommendationNote: player.behaviorProfile.investigative >= player.behaviorProfile.rescue ? "你已经更适合处理身份与规则冲突。" : "校园夜巡会不断测试你会不会先顺从最像校规的声音。",
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
        detail: "需要带回非普通出口层级的凭证。",
      },
      {
        id: "story_thread",
        label: "满足剧情线索条件",
        satisfied: false,
        detail: "需要高理解结局或管理员碎片。",
      },
    ],
    summary: "黑区仍未开放。",
  },
};
