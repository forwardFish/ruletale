import type {
  DrawerTab,
  DungeonCardView,
  HallModuleId,
  SettlementView,
  VisibleStats,
} from "@/lib/types/game";

export const hallModuleOrder: HallModuleId[] = [
  "task_wall",
  "backpack",
  "archives",
  "rest_area",
  "shop",
  "settlement_desk",
  "black_zone",
];

export const hallModuleCopy: Record<
  HallModuleId,
  {
    label: string;
    action: string;
    teaser: string;
  }
> = {
  task_wall: {
    label: "任务墙",
    action: "查看任务墙",
    teaser: "今晚哪一扇门最先看见你，就从哪扇门开始。",
  },
  backpack: {
    label: "背包",
    action: "翻看背包",
    teaser: "你带回来的不一定全是道具，也可能是代价。",
  },
  archives: {
    label: "档案室",
    action: "翻开档案",
    teaser: "有些记录比记忆先一步改口。",
  },
  rest_area: {
    label: "休息区",
    action: "去休息区",
    teaser: "热水一直温着，像有人算好你会回来。",
  },
  shop: {
    label: "商店",
    action: "去商店",
    teaser: "柜台后的目光从不问你为什么还活着。",
  },
  settlement_desk: {
    label: "结算台",
    action: "查看结算",
    teaser: "大厅会把你的通关方式记得比你更清楚。",
  },
  black_zone: {
    label: "黑区入口",
    action: "望向黑区",
    teaser: "只有被大厅承认的人，才会被那扇门看见。",
  },
};

export const coreMeters: Array<{ key: keyof VisibleStats; label: string }> = [
  { key: "hp", label: "生命" },
  { key: "san", label: "理智" },
  { key: "sta", label: "体力" },
];

export const sideMeters: Array<{ key: keyof VisibleStats; label: string }> = [
  { key: "cog", label: "认知" },
  { key: "cor", label: "污染" },
];

export const dungeonDrawerTabs: Array<{ id: DrawerTab; label: string }> = [
  { id: "inventory", label: "背包" },
  { id: "records", label: "记录" },
  { id: "status", label: "状态" },
];

export const dungeonActionPresets = [
  "观察当前场景",
  "查看背包",
  "验证规则",
  "换一个方向试试",
];

const dungeonCopy: Record<
  string,
  {
    hook: string;
    danger: string;
    button: string;
  }
> = {
  hospital_night_shift: {
    hook: "夜班名单安静得过头，真正危险的是你愿意先信谁。",
    danger: "铃声会先一步替你做决定。",
    button: "推开住院部的门",
  },
  apartment_night_return: {
    hook: "回家忽然变得陌生，门后的人先喊了你的名字。",
    danger: "光亮和声音从不站在同一边。",
    button: "走上旧楼道",
  },
  black_zone_mirror_records: {
    hook: "镜厅会替你保管真相，也会顺手改写你是谁。",
    danger: "你越想确认自己，门后的东西越靠近。",
    button: "靠近镜厅",
  },
};

export function getDungeonCopy(card: DungeonCardView) {
  return (
    dungeonCopy[card.dungeon_id] ?? {
      hook: card.recommended_style,
      danger: "大厅没有给更多提示，只让你自己进去看。",
      button: `进入 ${card.title}`,
    }
  );
}

export function getDungeonDangerTone(card: DungeonCardView) {
  if (card.locked) {
    return "门还没有为你打开";
  }
  if (card.dungeon_id === "black_zone_mirror_records") {
    return "门后已经有东西知道你是谁";
  }
  if (card.kind.includes("误导") || card.kind.includes("追猎")) {
    return "别急着回应任何熟悉的东西";
  }
  return "先观察，再决定要不要进去";
}

export function getSettlementMood(settlement: SettlementView | null) {
  if (!settlement) {
    return "大厅还没有写下你今晚的结尾。";
  }
  return settlement.summary ?? "大厅已经替你记住了这轮余响。";
}

export function formatChoiceKind(kind: string) {
  return (
    {
      observe: "观察",
      inspect: "检查",
      inventory: "背包",
      move: "前往",
      verify: "验证",
      item: "使用道具",
    }[kind] ?? kind
  );
}

export function formatCombatAction(action: string) {
  return (
    {
      avoid: "侧身规避",
      probe: "试探破绽",
      fight: "正面对撞",
      flee: "抽身撤离",
      exploit_rule: "借规则压制",
    }[action] ?? action
  );
}
