export type MonsterType = "lure" | "hunter";

export type MonsterDefinition = {
  id: string;
  name: string;
  type: MonsterType;
  lore: string;
  triggerConditions: string[];
  behaviorDescription: string;
  battleStats: {
    threat: number;
    damage: number;
    speed: number;
    pressure: number;
  };
  ruleWeakness: string;
  sanityDamage: number;
  corruptionImpact: number;
  specialMechanic: string;
};

export type EncounterLogEntry = {
  round: number;
  text: string;
  emphasis?: "neutral" | "success" | "danger";
};
