export type NpcId = "administrator" | "night_nurse" | "archive_echo";

export type NpcDefinition = {
  id: NpcId;
  name: string;
  facade: string;
  hint: string;
  relationBias: number;
  trustHooks: string[];
};
