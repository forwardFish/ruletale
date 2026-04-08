import { REWARD_POOLS } from "@/lib/data/rewards";
import type { SettlementResult } from "@/lib/types/score";
import type { InventoryEntry } from "@/lib/types/inventory";
import { addItemById } from "./inventoryEngine";

export function generateRewards(settlement: SettlementResult) {
  const pool = REWARD_POOLS[settlement.dungeonId as keyof typeof REWARD_POOLS];
  if (!pool) {
    return [];
  }

  const isWrongClear = settlement.endingId === "wrong_clear" || settlement.endingId.endsWith("_wrong_clear");
  const isInsightClear = settlement.endingId === "insight_clear" || settlement.endingId.endsWith("_insight_clear");

  const rewards: SettlementResult["rewards"] = [];
  const grant = (itemId: string, reason: string) => {
    if (rewards.some((reward) => reward.itemId === itemId)) return;
    rewards.push({ itemId, reason, quantity: 1 });
  };

  grant(pool.baseline[0][0], pool.baseline[0][1]);
  if (settlement.grades.mental === "S" || settlement.grades.mental === "A") {
    grant(pool.stableMind[0][0], pool.stableMind[0][1]);
  }
  if (settlement.grades.rules === "S" || settlement.grades.understanding === "A" || settlement.grades.understanding === "S") {
    grant(pool.ruleSharp[0][0], pool.ruleSharp[0][1]);
  }
  if (isWrongClear) {
    grant(pool.highRisk[0][0], pool.highRisk[0][1]);
  }
  if (isInsightClear) {
    grant(pool.premium[0][0], pool.premium[0][1]);
  }

  return rewards;
}

export function applyRewardsToInventory(inventory: InventoryEntry[], rewards: SettlementResult["rewards"]) {
  return rewards.reduce((items, reward) => addItemById(items, reward.itemId, reward.quantity), inventory);
}
