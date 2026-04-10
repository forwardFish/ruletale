import { APARTMENT_DUNGEON } from "@game-core/data/dungeon_apartment_night_return";
import { CAMPUS_DUNGEON } from "@game-core/data/dungeon_campus_night_patrol";
import { HOSPITAL_DUNGEON } from "@game-core/data/dungeon_hospital_night";
import { SUBWAY_DUNGEON } from "@game-core/data/dungeon_subway_last_train";
import type { MvpParsedAction } from "@game-core/types/game";
import type { InventoryEntry } from "@game-core/types/inventory";
import type { NodeCondition, NodeOutcome, SceneNode } from "@game-core/types/node";
import { getNodeInsight } from "./understandingEngine";

const DUNGEONS = new Map([
  [HOSPITAL_DUNGEON.id, HOSPITAL_DUNGEON],
  [APARTMENT_DUNGEON.id, APARTMENT_DUNGEON],
  [SUBWAY_DUNGEON.id, SUBWAY_DUNGEON],
  [CAMPUS_DUNGEON.id, CAMPUS_DUNGEON],
]);

export function getDungeonConfig(dungeonId: string) {
  const config = DUNGEONS.get(dungeonId);
  if (!config) {
    throw new Error(`Unknown dungeon ${dungeonId}`);
  }
  return config;
}

export function getNode(dungeonId: string, nodeId: string) {
  return getDungeonConfig(dungeonId).nodes.find((node) => node.id === nodeId) ?? null;
}

function meetsCondition(
  condition: NodeCondition,
  flags: string[],
  inventory: InventoryEntry[],
  understanding: number,
  verifiedRules: string[],
) {
  if (condition.requireFlags?.some((flag) => !flags.includes(flag))) return false;
  if (condition.forbidFlags?.some((flag) => flags.includes(flag))) return false;
  if (condition.requireItems?.some((item) => !inventory.some((entry) => entry.id === item))) return false;
  if (condition.minUnderstanding && understanding < condition.minUnderstanding) return false;
  if (condition.requireRules?.some((rule) => !verifiedRules.includes(rule))) return false;
  return true;
}

export function selectOutcome(
  node: SceneNode,
  parsed: MvpParsedAction,
  flags: string[],
  inventory: InventoryEntry[],
  understanding: number,
  verifiedRules: string[],
): NodeOutcome | null {
  const parsedTarget = parsed.target;
  const candidates = node.interactions
    .filter((outcome) => meetsCondition(outcome, flags, inventory, understanding, verifiedRules))
    .map((outcome) => {
      let score = outcome.intents.includes(parsed.primaryIntent) ? 4 : 0;
      if (parsedTarget && outcome.targetKeywords?.some((keyword) => parsedTarget.includes(keyword) || keyword.includes(parsedTarget))) {
        score += 4;
      }
      if (outcome.targetKeywords?.some((keyword) => parsed.rawInput.includes(keyword))) {
        score += 2;
      }
      if (parsed.primaryIntent === "verify_rule" && outcome.verifyRuleIds?.length) {
        score += 1;
      }
      return { outcome, score };
    })
    .filter((candidate) => candidate.score > 0)
    .sort((a, b) => b.score - a.score);

  return candidates[0]?.outcome ?? null;
}

export function buildSceneNode(node: SceneNode, totalUnderstanding: number, inventory: InventoryEntry[]) {
  const insight = getNodeInsight(node, totalUnderstanding, inventory);
  return {
    ...node,
    bonusInsight: insight,
  };
}
