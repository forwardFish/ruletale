export type ItemType =
  | "recovery"
  | "insight"
  | "access"
  | "rule_tool"
  | "story"
  | "corrupted"
  | "passive";

export type ItemRarity =
  | "common"
  | "rare"
  | "fragment"
  | "consumable"
  | "passive";

export type ItemEffectType =
  | "recover_hp"
  | "recover_san"
  | "recover_sta"
  | "reduce_fear"
  | "boost_res"
  | "boost_cog"
  | "reveal_clue"
  | "stabilize_rule"
  | "unlock_access"
  | "focus_observation"
  | "lower_aggro"
  | "increase_cor"
  | "mirror_insight"
  | "ward_identity"
  | "flag_unlock";

export type ItemDefinition = {
  id: string;
  name: string;
  type: ItemType;
  rarity: ItemRarity;
  description: string;
  effectType: ItemEffectType;
  effectValue: number;
  useCondition: string;
  stackable: boolean;
  usableInLobby: boolean;
  usableInDungeon: boolean;
  consumeOnUse: boolean;
  tags: string[];
  aliases: string[];
  unlocksInsight?: boolean;
  modifiesUnderstandingCheck?: boolean;
  passiveBonuses?: Partial<Record<"ATK" | "DEF" | "SPD" | "ACC" | "RES" | "COG", number>>;
};
