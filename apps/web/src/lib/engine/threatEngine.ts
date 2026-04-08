import type { MvpPsychStats, MvpThreatProfile, MvpVisibleStats, MvpWorldState } from "@/lib/types/game";
import { randomBetween } from "@/lib/utils/random";

export function calculateThreatProfile(
  stats: MvpVisibleStats,
  understanding: number,
  randomFactor = randomBetween(0.92, 1.08),
  psych: Partial<MvpPsychStats> = {},
  world: Partial<MvpWorldState> = {},
): MvpThreatProfile {
  const fear = psych.FEAR ?? 20;
  const will = psych.WILL ?? 55;
  const suspicion = psych.SUSP ?? 40;
  const aggro = world.AGGRO ?? 10;
  const hostile = world.HOSTILE ?? 10;
  const drift = world.DRIFT ?? 10;

  const effectivePower =
    (stats.ATK + stats.DEF + stats.SPD + stats.ACC + stats.RES + stats.COG) *
    (0.52 + stats.HP / 240 + stats.SAN / 300 + stats.STA / 420) *
    (1 - fear / 360 + will / 320 + suspicion / 500) *
    (1 + Math.min(0.18, understanding / 1100));

  const multiplier = randomFactor;
  const threatValue = Number((effectivePower * multiplier).toFixed(2));

  return {
    effectivePower: Number(effectivePower.toFixed(2)),
    multiplier: Number(multiplier.toFixed(2)),
    threatValue,
    breakdown: {
      combatPressure: Number(((stats.ATK + stats.DEF + stats.RES) * multiplier * 0.58).toFixed(2)),
      rulePressure: Number(((stats.COG + understanding * 0.08 + drift) * multiplier * 0.7).toFixed(2)),
      environmentPressure: Number(((100 - stats.STA + hostile) * 0.52).toFixed(2)),
      misleadPressure: Number(((100 - stats.COG + stats.COR + (psych.DEP ?? 20)) * 0.44).toFixed(2)),
      pursuitPressure: Number(((100 - stats.SPD + stats.COR + aggro) * 0.39).toFixed(2)),
    },
  };
}
