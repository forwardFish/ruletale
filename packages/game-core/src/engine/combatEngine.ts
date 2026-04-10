import type { MvpCombatAction, MvpPsychStats, MvpVisibleStats, MvpWorldState } from "@game-core/types/game";
import type { MonsterDefinition } from "@game-core/types/monster";
import { clamp } from "@game-core/utils/clamp";

export type CombatInput = {
  action: MvpCombatAction | "avoid" | "probe" | "fight";
  stats: MvpVisibleStats;
  psych?: Partial<MvpPsychStats>;
  world?: Partial<MvpWorldState>;
  understanding: number;
  monsterThreat: number;
  weaknessKnown: boolean;
  itemBonus?: number;
};

export type CombatResolution = {
  effectivePower: number;
  combatSuccess: boolean;
  margin: number;
  firstStrike: boolean;
  damageToPlayer: number;
  sanityLoss: number;
  corruptionGain: number;
  nextWeaknessKnown: boolean;
  narrative: string;
  logs: string[];
};

function effectivePower(input: CombatInput) {
  const fear = input.psych?.FEAR ?? 20;
  const will = input.psych?.WILL ?? 55;
  const susp = input.psych?.SUSP ?? 40;
  const dep = input.psych?.DEP ?? 20;
  const hostile = input.world?.HOSTILE ?? 10;
  const aggro = input.world?.AGGRO ?? 10;

  let power =
    (input.stats.ATK +
      input.stats.DEF +
      input.stats.SPD +
      input.stats.ACC +
      input.stats.RES +
      input.stats.COG) *
    (1 - fear / 340 + will / 300 + susp / 500 - dep / 520) *
    (1 + Math.min(0.24, input.understanding / 1200)) *
    (1 - hostile / 500 + input.stats.SAN / 500 - aggro / 650);

  if (input.itemBonus) {
    power += input.itemBonus;
  }

  switch (input.action) {
    case "exploit_rule":
      power *= input.weaknessKnown ? 1.52 : 0.7;
      break;
    case "attack":
    case "fight":
      power *= input.weaknessKnown ? 1.08 : 0.96;
      break;
    case "defend":
    case "avoid":
      power *= input.weaknessKnown ? 1.04 : 0.9;
      break;
    case "probe":
      power *= 0.84;
      break;
    case "flee":
      power = input.stats.SPD + will * 0.42 + (input.weaknessKnown ? 10 : 0);
      break;
    default:
      break;
  }

  return Number(power.toFixed(2));
}

export function resolveCombat(input: CombatInput): CombatResolution {
  const power = effectivePower(input);
  const firstStrike = power >= input.monsterThreat * 0.94 || input.action === "flee";
  const margin = Number((power - input.monsterThreat).toFixed(2));
  const combatSuccess =
    input.action === "probe"
      ? false
      : input.action === "flee"
        ? power >= input.monsterThreat * 0.36
        : margin >= 0;

  const pressureMultiplier = input.weaknessKnown ? 0.76 : 1;
  const damageToPlayer = combatSuccess
    ? input.action === "defend"
      ? 0
      : clamp(Math.round((input.monsterThreat / 18) * (firstStrike ? 0.4 : 0.7) * pressureMultiplier), 0, 18)
    : clamp(Math.round((input.monsterThreat / 12) * pressureMultiplier), 4, 26);
  const sanityLoss = combatSuccess
    ? input.action === "probe"
      ? 4
      : clamp(Math.round(input.monsterThreat / 28), 1, 8)
    : clamp(Math.round(input.monsterThreat / 20), 4, 12);
  const corruptionGain = combatSuccess
    ? input.action === "exploit_rule"
      ? 1
      : 0
    : input.action === "flee"
      ? 1
      : 3;

  const logs = [
    firstStrike ? "你抢到了节奏的第一拍。" : "它比你先一步靠近了。",
    combatSuccess
      ? input.action === "exploit_rule"
        ? "你利用规则弱点压住了它。"
        : "你没有被它完全拖进它的规则里。"
      : "它逼你为这次误判付出了代价。",
  ];

  const narrative = combatSuccess
    ? input.action === "flee"
      ? "你抓住它节奏失真的瞬间拉开了距离。"
      : input.action === "exploit_rule"
        ? "你不是靠硬拼压住了它，而是让它被自己依附的规则反咬了一口。"
        : "你从这次碰撞里拿回了主动。"
    : "你没能在这一轮里拿回主动，反而被它带着往错误顺序里走了一步。";

  return {
    effectivePower: power,
    combatSuccess,
    margin,
    firstStrike,
    damageToPlayer,
    sanityLoss,
    corruptionGain,
    nextWeaknessKnown: input.weaknessKnown || input.action === "probe",
    narrative,
    logs,
  };
}

export function buildMonsterThreat(monster: MonsterDefinition, stats: MvpVisibleStats) {
  return Number((monster.battleStats.threat * (1 + stats.COR / 260)).toFixed(2));
}
