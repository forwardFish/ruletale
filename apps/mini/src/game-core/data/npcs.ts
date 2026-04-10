import type { NpcDefinition } from "@game-core/types/npc";

export const NPCS: NpcDefinition[] = [
  {
    id: "administrator",
    name: "大厅管理员",
    facade: "礼貌、冷静，像在给你做正常登记。",
    hint: "他从不直接告诉你答案，只会记住你是怎么判断的。",
    relationBias: 0.1,
    trustHooks: ["归档", "登记", "结算"],
  },
  {
    id: "night_nurse",
    name: "夜班护士",
    facade: "看上去像值班人员，但身份总有一处对不上。",
    hint: "如果她比值班表更快给出答案，你就该先怀疑她。",
    relationBias: -0.15,
    trustHooks: ["护士", "值班", "求救"],
  },
  {
    id: "archive_echo",
    name: "档案回声",
    facade: "像是旧记录在对你低声复述曾经发生过的事。",
    hint: "它不是帮你，它只是比广播更想让你读完整页。",
    relationBias: 0,
    trustHooks: ["档案", "病历", "记录"],
  },
];
