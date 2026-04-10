import type { MvpProgressState } from "@game-core/types/game";
import type { MonsterDefinition } from "@game-core/types/monster";
import type { SettlementResult } from "@game-core/types/score";
import { dedupeStrings } from "@game-core/utils/text";

function ensureDungeonBucket(progress: MvpProgressState, dungeonId: string) {
  return (
    progress.archive.byDungeon[dungeonId] ?? {
      rules: [],
      events: [],
      endings: [],
      adminFragments: [],
    }
  );
}

export function mergeArchiveEvents(progress: MvpProgressState, dungeonId: string, eventIds: string[]) {
  const bucket = ensureDungeonBucket(progress, dungeonId);
  return {
    ...progress,
    archive: {
      ...progress.archive,
      events: dedupeStrings([...progress.archive.events, ...eventIds]),
      byDungeon: {
        ...progress.archive.byDungeon,
        [dungeonId]: {
          ...bucket,
          events: dedupeStrings([...bucket.events, ...eventIds]),
        },
      },
    },
  };
}

export function mergeArchiveRuleIds(progress: MvpProgressState, dungeonId: string, ruleIds: string[]) {
  if (ruleIds.length === 0) {
    return progress;
  }

  const bucket = ensureDungeonBucket(progress, dungeonId);
  return {
    ...progress,
    archive: {
      ...progress.archive,
      byDungeon: {
        ...progress.archive.byDungeon,
        [dungeonId]: {
          ...bucket,
          rules: dedupeStrings([...bucket.rules, ...ruleIds]),
        },
      },
    },
  };
}

export function mergeArchiveFragments(progress: MvpProgressState, dungeonId: string, fragmentIds: string[]) {
  if (fragmentIds.length === 0) {
    return progress;
  }

  const bucket = ensureDungeonBucket(progress, dungeonId);
  return {
    ...progress,
    archive: {
      ...progress.archive,
      adminFragments: dedupeStrings([...progress.archive.adminFragments, ...fragmentIds]),
      byDungeon: {
        ...progress.archive.byDungeon,
        [dungeonId]: {
          ...bucket,
          adminFragments: dedupeStrings([...bucket.adminFragments, ...fragmentIds]),
        },
      },
    },
  };
}

export function mergeArchiveMonsters(progress: MvpProgressState, monsters: MonsterDefinition[]) {
  const existingIds = new Set(progress.archive.monsters.map((monster) => monster.id));
  return {
    ...progress,
    archive: {
      ...progress.archive,
      monsters: [...progress.archive.monsters, ...monsters.filter((monster) => !existingIds.has(monster.id))],
    },
  };
}

export function finalizeArchive(
  progress: MvpProgressState,
  settlement: SettlementResult,
  adminFragments: string[],
  importantItems: string[],
) {
  const bucket = ensureDungeonBucket(progress, settlement.dungeonId);
  return {
    ...progress,
    completedDungeons: dedupeStrings([...progress.completedDungeons, settlement.dungeonId]),
    recentRewards: settlement.rewards,
    lastSettlement: settlement,
    archive: {
      ...progress.archive,
      endings: dedupeStrings([...progress.archive.endings, settlement.endingId]),
      adminFragments: dedupeStrings([...progress.archive.adminFragments, ...adminFragments]),
      importantItems: dedupeStrings([...progress.archive.importantItems, ...importantItems]),
      events: dedupeStrings([...progress.archive.events, ...settlement.obtainedEvents]),
      byDungeon: {
        ...progress.archive.byDungeon,
        [settlement.dungeonId]: {
          ...bucket,
          endings: dedupeStrings([...bucket.endings, settlement.endingId]),
          events: dedupeStrings([...bucket.events, ...settlement.obtainedEvents]),
          adminFragments: dedupeStrings([...bucket.adminFragments, ...adminFragments]),
        },
      },
    },
  };
}
