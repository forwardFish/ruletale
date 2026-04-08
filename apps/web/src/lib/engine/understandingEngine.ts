import type { InventoryEntry } from "@/lib/types/inventory";
import type { SceneNode } from "@/lib/types/node";
import type { RuleArchiveEntry } from "@/lib/types/rule";
import type { UnderstandingLevel, UnderstandingSnapshot } from "@/lib/types/understanding";
import { clamp } from "@/lib/utils/clamp";

export const UNDERSTANDING_LEVELS: UnderstandingLevel[] = [
  { id: "unknown", name: "未知者", min: 0, hintBonus: 0, parserBias: 0, falseRuleSense: 0, monsterTellBonus: 0 },
  { id: "first_witness", name: "初见者", min: 30, hintBonus: 1, parserBias: 0.04, falseRuleSense: 0.03, monsterTellBonus: 0.02 },
  { id: "observer", name: "旁观者", min: 70, hintBonus: 2, parserBias: 0.08, falseRuleSense: 0.08, monsterTellBonus: 0.05 },
  { id: "recorder", name: "记录者", min: 120, hintBonus: 3, parserBias: 0.12, falseRuleSense: 0.14, monsterTellBonus: 0.08 },
  { id: "breaker", name: "识破者", min: 180, hintBonus: 4, parserBias: 0.16, falseRuleSense: 0.2, monsterTellBonus: 0.12 },
  { id: "glimpsewalker", name: "窥界者", min: 250, hintBonus: 5, parserBias: 0.2, falseRuleSense: 0.24, monsterTellBonus: 0.16 },
  { id: "inverse_reader", name: "逆读者", min: 330, hintBonus: 6, parserBias: 0.24, falseRuleSense: 0.28, monsterTellBonus: 0.2 },
  { id: "lawbreaker", name: "破律者", min: 430, hintBonus: 7, parserBias: 0.28, falseRuleSense: 0.34, monsterTellBonus: 0.24 },
];

export function getUnderstandingLevel(total: number) {
  return UNDERSTANDING_LEVELS.reduce((current, level) => (total >= level.min ? level : current), UNDERSTANDING_LEVELS[0]);
}

export function getUnderstandingSnapshot(total: number): UnderstandingSnapshot {
  const current = getUnderstandingLevel(total);
  const currentIndex = UNDERSTANDING_LEVELS.findIndex((level) => level.id === current.id);
  const next = UNDERSTANDING_LEVELS[Math.min(currentIndex + 1, UNDERSTANDING_LEVELS.length - 1)];
  const span = Math.max(1, next.min - current.min);
  const progressPercent = next.min === current.min ? 100 : clamp(((total - current.min) / span) * 100, 0, 100);

  return {
    total,
    levelId: current.id,
    levelName: current.name,
    currentThreshold: current.min,
    nextThreshold: next.min,
    nextLevelName: next.name,
    progressPercent,
  };
}

export function applyUnderstandingDelta(current: number, delta: number) {
  return Math.max(0, current + delta);
}

function itemInsightBonus(inventory: InventoryEntry[]) {
  let bonus = 0;
  if (inventory.some((item) => item.id === "half_broken_flashlight")) bonus += 10;
  if (inventory.some((item) => item.id === "mirror_shard")) bonus += 6;
  if (inventory.some((item) => item.id === "nameless_note")) bonus += 4;
  return bonus;
}

export function getNodeInsight(node: SceneNode, totalUnderstanding: number, inventory: InventoryEntry[]) {
  const level = getUnderstandingLevel(totalUnderstanding);
  const thresholdOffset = level.hintBonus * 8 + itemInsightBonus(inventory);
  if (totalUnderstanding + thresholdOffset >= node.insightThreshold) {
    return node.bonusDescriptionByUnderstanding;
  }
  return null;
}

export function getFalseRuleAnomaly(rule: RuleArchiveEntry, totalUnderstanding: number) {
  if (rule.type !== "false" || !rule.tamperHint) {
    return null;
  }
  const level = getUnderstandingLevel(totalUnderstanding);
  if (totalUnderstanding >= 70 || level.falseRuleSense >= 0.08) {
    return rule.tamperHint;
  }
  return null;
}

export function parserBias(totalUnderstanding: number, inventory: InventoryEntry[] = []) {
  const level = getUnderstandingLevel(totalUnderstanding);
  const itemBias = inventory.some((item) => item.modifiesUnderstandingCheck) ? 0.03 : 0;
  return level.parserBias + itemBias;
}

export function nodeUnderstandingBonus(totalUnderstanding: number, inventory: InventoryEntry[]) {
  let bonus = 0;
  if (totalUnderstanding >= 120) bonus += 1;
  if (inventory.some((item) => item.id === "record_clip_page")) bonus += 1;
  if (inventory.some((item) => item.id === "nameless_note") && totalUnderstanding >= 100) bonus += 1;
  return bonus;
}
