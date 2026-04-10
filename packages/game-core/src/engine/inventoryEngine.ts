import { ITEM_DEFINITIONS } from "@game-core/data/items";
import type { MvpPsychStats, MvpVisibleStats, MvpWorldState } from "@game-core/types/game";
import type { InventoryEntry, InventoryScope, InventoryUseResult } from "@game-core/types/inventory";

function cloneInventoryEntry(itemId: string, quantity = 1): InventoryEntry {
  const definition = ITEM_DEFINITIONS[itemId];
  if (!definition) {
    throw new Error(`Unknown item: ${itemId}`);
  }
  return { ...definition, quantity };
}

export function addInventoryItem(items: InventoryEntry[], item: InventoryEntry): InventoryEntry[] {
  const existing = items.find((entry) => entry.id === item.id && entry.stackable);
  if (existing) {
    return items.map((entry) => (entry.id === item.id ? { ...entry, quantity: entry.quantity + item.quantity } : entry));
  }
  return [...items, item];
}

export function addItemById(items: InventoryEntry[], itemId: string, quantity = 1) {
  return addInventoryItem(items, cloneInventoryEntry(itemId, quantity));
}

export function resolveInventoryTarget(items: InventoryEntry[], raw: string | null) {
  if (!raw) {
    return null;
  }
  const normalized = raw.toLowerCase();
  return (
    items.find(
      (item) =>
        item.id === normalized ||
        item.name.includes(raw) ||
        item.aliases.some((alias) => raw.includes(alias) || normalized.includes(alias.toLowerCase())),
    ) ?? null
  );
}

export function hasItem(items: InventoryEntry[], itemId: string) {
  return items.some((item) => item.id === itemId && item.quantity > 0);
}

export function findUsableItems(items: InventoryEntry[], scope: InventoryScope) {
  return items.filter((item) => (scope === "lobby" ? item.usableInLobby : item.usableInDungeon));
}

export function useInventoryItem(items: InventoryEntry[], itemId: string): InventoryEntry[] {
  return items
    .map((item) => (item.id === itemId && item.consumeOnUse ? { ...item, quantity: item.quantity - 1 } : item))
    .filter((item) => item.quantity > 0);
}

export function applyInventoryItem(items: InventoryEntry[], itemId: string, scope: InventoryScope): InventoryUseResult {
  const item = items.find((entry) => entry.id === itemId);
  if (!item) {
    return { ok: false, message: "你手里没有这个东西。", inventory: items };
  }
  if ((scope === "lobby" && !item.usableInLobby) || (scope === "dungeon" && !item.usableInDungeon)) {
    return { ok: false, message: "这个物品不适合在当前场景使用。", inventory: items };
  }
  return {
    ok: true,
    message: `${item.name} 已经被你拿到手里了。`,
    inventory: useInventoryItem(items, item.id),
    consumedItemId: item.consumeOnUse ? item.id : undefined,
  };
}

export function applyItemEffects(itemId: string, visibleStats: MvpVisibleStats, psych: MvpPsychStats, world: MvpWorldState) {
  const stats = { ...visibleStats };
  const nextPsych = { ...psych };
  const nextWorld = { ...world };
  const appliedEffects: string[] = [];

  switch (itemId) {
    case "tranquilizer_ampoule":
      nextPsych.FEAR = Math.max(0, nextPsych.FEAR - 12);
      nextPsych.IMP = Math.max(0, nextPsych.IMP - 8);
      stats.SAN = Math.min(100, stats.SAN + 6);
      appliedEffects.push("恐惧和冲动被暂时压低，你重新拿回了一点判断节奏。");
      break;
    case "spare_battery":
      stats.COG = Math.min(100, stats.COG + 4);
      nextPsych.SUSP = Math.min(100, nextPsych.SUSP + 2);
      appliedEffects.push("照明稳定下来，观察与核对都更容易聚焦。");
      break;
    case "record_clip_page":
      stats.COG = Math.min(100, stats.COG + 2);
      nextPsych.SUSP = Math.min(100, nextPsych.SUSP + 4);
      appliedEffects.push("你把冲突信息固定在了同一页上，伪规则不那么容易把顺序冲散。");
      break;
    case "mirror_shard":
      stats.COR = Math.min(100, stats.COR + 2);
      nextPsych.OBS = Math.min(100, nextPsych.OBS + 4);
      appliedEffects.push("镜面碎片让错位细节更容易暴露，但污染也随之贴近。");
      break;
    case "old_duty_key":
      nextWorld.HOSTILE = Math.max(0, nextWorld.HOSTILE - 2);
      appliedEffects.push("钥匙在锁孔附近发出了一声很轻的确认。");
      break;
    case "half_broken_flashlight":
      stats.COG = Math.min(100, stats.COG + 3);
      nextPsych.SUSP = Math.min(100, nextPsych.SUSP + 3);
      appliedEffects.push("手电把边缘、痕迹和反光都提亮了一层。");
      break;
    case "nameless_note":
      nextPsych.SUSP = Math.min(100, nextPsych.SUSP + 5);
      appliedEffects.push("无名便签让你更愿意把熟悉感也当成需要验证的东西。");
      break;
    default:
      appliedEffects.push("你摸了摸物品的边缘，它提醒你自己还不是完全赤手空拳。");
      break;
  }

  return {
    visibleStats: stats,
    psych: nextPsych,
    world: nextWorld,
    appliedEffects,
  };
}

export function passiveStatBonus(items: InventoryEntry[], stat: keyof NonNullable<InventoryEntry["passiveBonuses"]>) {
  return items.reduce((acc, item) => acc + (item.passiveBonuses?.[stat] ?? 0), 0);
}
