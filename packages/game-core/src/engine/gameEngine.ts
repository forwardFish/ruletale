import { ENDINGS } from "@game-core/data/endings";
import { evaluateBlackZoneProgress } from "@game-core/data/lobby";
import { MONSTERS } from "@game-core/data/monsters";
import type { MvpCombatAction, MvpDungeonRuntime, MvpParsedAction, MvpPlayerState, MvpProgressState } from "@game-core/types/game";
import type { InventoryEntry } from "@game-core/types/inventory";
import type { NodeOutcome } from "@game-core/types/node";
import type { SettlementResult } from "@game-core/types/score";
import { clamp } from "@game-core/utils/clamp";
import {
  finalizeArchive,
  mergeArchiveEvents,
  mergeArchiveFragments,
  mergeArchiveMonsters,
  mergeArchiveRuleIds,
} from "./archiveEngine";
import { buildMonsterThreat, resolveCombat } from "./combatEngine";
import { addItemById, applyInventoryItem, applyItemEffects, hasItem, resolveInventoryTarget } from "./inventoryEngine";
import { getDungeonConfig, getNode, selectOutcome } from "./nodeEngine";
import { parseInput } from "./inputParser";
import { applyBehaviorDelta, behaviorLabel, DEFAULT_BEHAVIOR_PROFILE, dominantBehavior, inferBehaviorDelta } from "./profileEngine";
import { discoverRules, verifyRules } from "./ruleEngine";
import { applyRewardsToInventory, generateRewards } from "./rewardEngine";
import { breakdownToGrades, calculateScoreBreakdown } from "./scoringEngine";
import { calculateThreatProfile } from "./threatEngine";
import { applyUnderstandingDelta, getUnderstandingSnapshot, nodeUnderstandingBonus } from "./understandingEngine";

const MONSTER_MAP = new Map(MONSTERS.map((monster) => [monster.id, monster]));

function unique(values: string[]) {
  return Array.from(new Set(values));
}

function failureEndingId(dungeonId: string) {
  if (dungeonId === "apartment_night_return") return "apartment_wrong_clear";
  if (dungeonId === "subway_last_train") return "subway_wrong_clear";
  if (dungeonId === "campus_night_patrol") return "campus_wrong_clear";
  return "wrong_clear";
}

function updatePlayerWithDeltas(player: MvpPlayerState, outcome: NodeOutcome) {
  const next: MvpPlayerState = {
    ...player,
    visibleStats: { ...player.visibleStats },
    psych: { ...player.psych },
    world: { ...player.world },
    behaviorProfile: { ...player.behaviorProfile },
  };

  Object.entries(outcome.statDelta ?? {}).forEach(([key, value]) => {
    const statKey = key as keyof MvpPlayerState["visibleStats"];
    next.visibleStats[statKey] = clamp(next.visibleStats[statKey] + (value ?? 0));
  });
  Object.entries(outcome.psychDelta ?? {}).forEach(([key, value]) => {
    const statKey = key as keyof MvpPlayerState["psych"];
    next.psych[statKey] = clamp(next.psych[statKey] + (value ?? 0));
  });
  Object.entries(outcome.worldDelta ?? {}).forEach(([key, value]) => {
    const statKey = key as keyof MvpPlayerState["world"];
    next.world[statKey] = clamp(next.world[statKey] + (value ?? 0));
  });

  next.behaviorProfile = applyBehaviorDelta(
    applyBehaviorDelta(next.behaviorProfile, inferBehaviorDelta(outcome.intents[0])),
    outcome.profileDelta ?? {},
  );

  if (outcome.understandingDelta) {
    next.understanding = applyUnderstandingDelta(next.understanding, outcome.understandingDelta);
  }

  next.contamination = next.visibleStats.COR;
  return next;
}

function buildSystemNotes(outcome: NodeOutcome, itemNotes: string[], extraUnlockNotes: string[]) {
  return [...(outcome.systemNotes ?? []), ...itemNotes, ...extraUnlockNotes];
}

function deriveOutcomeItemFeedback(
  outcome: NodeOutcome,
  parsed: MvpParsedAction,
  inventory: InventoryEntry[],
  understanding: number,
) {
  const notes: string[] = [];
  let bonusUnderstanding = 0;
  let neutralizeWrongNpc = false;

  if (outcome.insightTextByItem) {
    Object.entries(outcome.insightTextByItem).forEach(([itemId, text]) => {
      if (hasItem(inventory, itemId)) {
        notes.push(text);
      }
    });
  }

  if ((outcome.verifyRuleIds?.length || parsed.primaryIntent === "verify_rule") && hasItem(inventory, "record_clip_page")) {
    notes.push("记录夹页把冲突信息钉在了一起，你更难被单一线索带偏。");
    bonusUnderstanding += 1;
  }

  if (["inspect_object", "observe", "verify_rule"].includes(parsed.primaryIntent) && hasItem(inventory, "half_broken_flashlight")) {
    bonusUnderstanding += 1;
  }

  if (hasItem(inventory, "nameless_note") && understanding >= 100 && (outcome.verifyRuleIds?.length || outcome.archiveFragmentIds?.length)) {
    notes.push("无名便签边缘浮出了一句补注：不要让熟悉感替你完成最后一步。");
    bonusUnderstanding += 1;
  }

  if (outcome.markWrongNpc && hasItem(inventory, "paper_badge")) {
    notes.push("纸质工牌让对方先迟疑了半拍，你没有完全把身份判断交出去。");
    neutralizeWrongNpc = true;
  }

  return {
    notes,
    bonusUnderstanding,
    neutralizeWrongNpc,
  };
}

function settlementForEnding(
  player: MvpPlayerState,
  runtime: MvpDungeonRuntime,
  progress: MvpProgressState,
  endingId: keyof typeof ENDINGS,
) {
  const ending = ENDINGS[endingId];
  const previousUnderstanding = progress.lastSettlement?.totalUnderstanding ?? Math.max(0, player.understanding - 6);

  const breakdown = calculateScoreBreakdown({
    hp: player.visibleStats.HP,
    san: player.visibleStats.SAN,
    cor: player.visibleStats.COR,
    rulesFound: runtime.discoveredRuleIds.length,
    rulesVerified: runtime.verifiedRuleIds.length,
    falseRuleDiscerned: runtime.falseRuleBreaks,
    falseRuleTrapped: runtime.falseRuleTraps,
    understandingDelta: Math.max(0, player.understanding - previousUnderstanding),
    hiddenRoute: runtime.hiddenRouteTriggered,
    battleCount: runtime.seenMonsterIds.length,
    violentClear: dominantBehavior(player.behaviorProfile) === "aggressive",
    trustedWrongNpc: runtime.trustedWrongNpc,
  });

  const settlement: SettlementResult = {
    dungeonId: runtime.dungeonId,
    dungeonTitle: runtime.dungeonTitle,
    endingId,
    endingTitle: ending.title,
    summary: ending.summary,
    breakdown,
    grades: breakdownToGrades(breakdown),
    hiddenRoute: runtime.hiddenRouteTriggered,
    ruleCount: runtime.discoveredRuleIds.length,
    verifiedRuleCount: runtime.verifiedRuleIds.length,
    falseRuleBreaks: runtime.falseRuleBreaks,
    falseRuleTraps: runtime.falseRuleTraps,
    battleCount: runtime.seenMonsterIds.length,
    trustedWrongNpc: runtime.trustedWrongNpc,
    understandingDelta: Math.max(0, player.understanding - previousUnderstanding),
    totalUnderstanding: player.understanding,
    understandingLevelName: getUnderstandingSnapshot(player.understanding).levelName,
    rewards: [],
    unlockedArchives: [],
    obtainedEvents: runtime.seenEventIds,
    behaviorLabel: behaviorLabel(dominantBehavior(player.behaviorProfile)),
    blackZoneProgressNotes: [],
    blackZoneUnlocked: false,
  };

  return { ...settlement, rewards: generateRewards(settlement) };
}

export function createInitialProfile(name = "无名访客") {
  const player: MvpPlayerState = {
    name,
    visibleStats: { HP: 100, SAN: 82, STA: 76, COG: 64, COR: 6, ATK: 18, DEF: 16, SPD: 16, ACC: 17, RES: 16 },
    psych: { FEAR: 18, SUSP: 46, DEP: 20, IMP: 24, WILL: 58, EMP: 44, OBS: 26 },
    world: { AGGRO: 10, DRIFT: 8, HOSTILE: 12 },
    understanding: 24,
    behaviorProfile: { ...DEFAULT_BEHAVIOR_PROFILE },
    contamination: 6,
  };

  const progress: MvpProgressState = {
    completedDungeons: [],
    archive: {
      rules: [],
      monsters: [],
      events: [],
      endings: [],
      adminFragments: [],
      importantItems: [],
      byDungeon: {},
    },
    recentRewards: [],
    lastSettlement: null,
    supplyMarks: 5,
  };

  let inventory: InventoryEntry[] = [];
  inventory = addItemById(inventory, "half_broken_flashlight");
  inventory = addItemById(inventory, "tranquilizer_ampoule");

  return { player, progress, inventory };
}

export function createInitialRuntime(dungeonId: string, player: MvpPlayerState): MvpDungeonRuntime {
  const config = getDungeonConfig(dungeonId);
  return {
    dungeonId,
    dungeonTitle: config.title,
    currentNodeId: config.entryNodeId,
    status: "exploring",
    nodeOrder: config.nodes.map((node) => node.id),
    visitedNodeIds: [config.entryNodeId],
    discoveredRuleIds: [],
    verifiedRuleIds: [],
    falseRuleBreaks: 0,
    falseRuleTraps: 0,
    seenMonsterIds: [],
    seenEventIds: [],
    flags: [],
    log: [config.intro],
    actionHistory: [],
    currentThreat: calculateThreatProfile(player.visibleStats, player.understanding, undefined, player.psych, player.world),
    activeCombat: null,
    hiddenRouteTriggered: false,
    trustedWrongNpc: false,
    pendingSettlement: null,
  };
}

function finalizeRunState(
  player: MvpPlayerState,
  progress: MvpProgressState,
  inventory: InventoryEntry[],
  runtime: MvpDungeonRuntime,
  endingId: keyof typeof ENDINGS,
) {
  const baseSettlement = settlementForEnding(player, runtime, progress, endingId);
  const nextInventory = applyRewardsToInventory(inventory, baseSettlement.rewards);
  const nextProgress = finalizeArchive(
    progress,
    baseSettlement,
    progress.archive.byDungeon[runtime.dungeonId]?.adminFragments ?? [],
    baseSettlement.rewards.map((reward) => reward.itemId),
  );
  nextProgress.supplyMarks += baseSettlement.grades.overall === "S" ? 4 : baseSettlement.grades.overall === "A" ? 3 : 2;

  const beforeBlackZone = evaluateBlackZoneProgress(player, progress, inventory);
  const afterBlackZone = evaluateBlackZoneProgress(player, nextProgress, nextInventory);
  const blackZoneProgressNotes = afterBlackZone.conditions
    .filter((condition, index) => condition.satisfied && !beforeBlackZone.conditions[index]?.satisfied)
    .map((condition) => `黑区条件推进：${condition.label}`);

  if (afterBlackZone.unlocked && !beforeBlackZone.unlocked) {
    blackZoneProgressNotes.push("黑区入口已解锁：大厅终于承认你具备进入资格。");
  }

  const settlement: SettlementResult = {
    ...baseSettlement,
    blackZoneProgressNotes,
    blackZoneUnlocked: afterBlackZone.unlocked,
  };

  nextProgress.lastSettlement = settlement;
  nextProgress.recentRewards = settlement.rewards;

  return {
    progress: nextProgress,
    inventory: nextInventory,
    runtime: {
      ...runtime,
      pendingSettlement: settlement,
      status: "result" as const,
      activeCombat: null,
    },
  };
}

export function submitDungeonAction(params: {
  player: MvpPlayerState;
  progress: MvpProgressState;
  inventory: InventoryEntry[];
  runtime: MvpDungeonRuntime;
  input: string;
}) {
  const node = getNode(params.runtime.dungeonId, params.runtime.currentNodeId);
  if (!node) {
    throw new Error("Node not found");
  }

  const parsed: MvpParsedAction = parseInput(params.input, params.player.understanding, {
    visibleObjects: [...node.visibleObjects, ...node.suspiciousPoints],
    psych: params.player.psych,
    inventory: params.inventory,
  });

  let player: MvpPlayerState = {
    ...params.player,
    visibleStats: { ...params.player.visibleStats },
    psych: { ...params.player.psych },
    world: { ...params.player.world },
    behaviorProfile: { ...params.player.behaviorProfile },
  };
  let progress: MvpProgressState = {
    ...params.progress,
    archive: {
      ...params.progress.archive,
      byDungeon: { ...params.progress.archive.byDungeon },
    },
  };
  let inventory = [...params.inventory];
  let runtime: MvpDungeonRuntime = {
    ...params.runtime,
    actionHistory: [...params.runtime.actionHistory, params.input],
    log: [...params.runtime.log],
    seenEventIds: [...params.runtime.seenEventIds],
    flags: [...params.runtime.flags],
  };

  if (parsed.primaryIntent === "open_inventory") {
    return { player, progress, inventory, runtime, parsed, narrative: "你快速确认了一遍背包，至少知道自己不是空手进来的。" };
  }

  if (parsed.primaryIntent === "check_archive") {
    return { player, progress, inventory, runtime, parsed, narrative: "你在脑子里把已经掌握的规则碎片重新排了一次序。" };
  }

  if (parsed.primaryIntent === "use_item") {
    const targetItem = resolveInventoryTarget(inventory, parsed.target ?? parsed.rawInput);
    if (targetItem) {
      const result = applyInventoryItem(inventory, targetItem.id, "dungeon");
      if (result.ok) {
        inventory = result.inventory;
        const effect = applyItemEffects(targetItem.id, player.visibleStats, player.psych, player.world);
        player = {
          ...player,
          visibleStats: effect.visibleStats,
          psych: effect.psych,
          world: effect.world,
          contamination: effect.visibleStats.COR,
        };
        runtime.currentThreat = calculateThreatProfile(player.visibleStats, player.understanding, undefined, player.psych, player.world);
        return { player, progress, inventory, runtime, parsed, narrative: effect.appliedEffects.join(" ") };
      }
      return { player, progress, inventory, runtime, parsed, narrative: result.message };
    }
  }

  const outcome = selectOutcome(node, parsed, runtime.flags, inventory, player.understanding, runtime.verifiedRuleIds);
  if (!outcome) {
    player.world.AGGRO = clamp(player.world.AGGRO + 1);
    player.psych.OBS = clamp(player.psych.OBS + 1);
    player.behaviorProfile = applyBehaviorDelta(player.behaviorProfile, inferBehaviorDelta(parsed.primaryIntent));
    runtime.currentThreat = calculateThreatProfile(player.visibleStats, player.understanding, undefined, player.psych, player.world);
    return {
      player,
      progress,
      inventory,
      runtime,
      parsed,
      narrative: "场景没有完全理解你的动作，但它因此多暴露出了一点边缘细节，也顺手记住了你。",
    };
  }

  const itemFeedback = deriveOutcomeItemFeedback(outcome, parsed, inventory, player.understanding);
  player = updatePlayerWithDeltas(player, outcome);

  const extraUnderstanding =
    itemFeedback.bonusUnderstanding +
    ((outcome.verifyRuleIds?.length || outcome.discoverRuleIds?.length) ? nodeUnderstandingBonus(player.understanding, inventory) : 0);
  if (extraUnderstanding > 0) {
    player.understanding = applyUnderstandingDelta(player.understanding, extraUnderstanding);
  }

  runtime.flags = unique([
    ...runtime.flags,
    ...(outcome.setFlags ?? []),
    ...(outcome.triggerMonsterId && outcome.endingId ? [`pending_ending:${outcome.endingId}`] : []),
  ]);
  runtime.seenEventIds = unique([...runtime.seenEventIds, ...(outcome.eventIds ?? [])]);
  runtime.hiddenRouteTriggered = runtime.hiddenRouteTriggered || Boolean(outcome.hiddenRoute);
  runtime.trustedWrongNpc = runtime.trustedWrongNpc || (Boolean(outcome.markWrongNpc) && !itemFeedback.neutralizeWrongNpc);

  if (outcome.verifyRuleIds?.some((rule) => rule.includes("false") || rule === "rule_room_107_safe" || rule === "rule_open_for_family" || rule === "rule_elevator_exit")) {
    runtime.falseRuleBreaks += 1;
  }
  if ((outcome.understandingDelta ?? 0) < 0) {
    runtime.falseRuleTraps += 1;
  }

  if (outcome.discoverRuleIds?.length) {
    progress.archive.rules = discoverRules(progress.archive.rules, outcome.discoverRuleIds);
    progress = mergeArchiveRuleIds(progress, runtime.dungeonId, outcome.discoverRuleIds);
    runtime.discoveredRuleIds = unique([...runtime.discoveredRuleIds, ...outcome.discoverRuleIds]);
  }
  if (outcome.verifyRuleIds?.length) {
    progress.archive.rules = verifyRules(progress.archive.rules, outcome.verifyRuleIds);
    progress = mergeArchiveRuleIds(progress, runtime.dungeonId, outcome.verifyRuleIds);
    runtime.verifiedRuleIds = unique([...runtime.verifiedRuleIds, ...outcome.verifyRuleIds]);
  }

  if (outcome.archiveFragmentIds?.length) {
    progress = mergeArchiveFragments(progress, runtime.dungeonId, outcome.archiveFragmentIds);
  }

  if (outcome.rewardItemIds?.length) {
    for (const rewardItemId of outcome.rewardItemIds) {
      inventory = addItemById(inventory, rewardItemId);
    }
  }

  progress = mergeArchiveEvents(progress, runtime.dungeonId, outcome.eventIds ?? []);

  if (outcome.nextNodeId) {
    runtime.currentNodeId = outcome.nextNodeId;
    runtime.visitedNodeIds = unique([...runtime.visitedNodeIds, outcome.nextNodeId]);
  }

  if (outcome.triggerMonsterId) {
    const monster = MONSTER_MAP.get(outcome.triggerMonsterId);
    if (monster) {
      const weaknessKnown =
        runtime.verifiedRuleIds.includes(monster.ruleWeakness) ||
        (monster.id === "mirror_hunter" || monster.id === "floor_returner") && hasItem(inventory, "mirror_shard");
      runtime.activeCombat = {
        monsterId: monster.id,
        round: 1,
        weaknessKnown,
        canExploitRule: weaknessKnown,
        log: [
          {
            round: 1,
            text: `${monster.name} 靠近了，你得决定是硬顶、拖开，还是把规则当成武器。`,
          },
        ],
      };
      runtime.status = "combat";
      runtime.seenMonsterIds = unique([...runtime.seenMonsterIds, monster.id]);
      progress = mergeArchiveMonsters(progress, [monster]);
    }
  } else {
    runtime.status = "exploring";
  }

  runtime.currentThreat = calculateThreatProfile(player.visibleStats, player.understanding, undefined, player.psych, player.world);

  const unlockNotes = (outcome.unlockConditionProgress ?? []).map((condition) =>
    condition === "story_thread" ? "黑区条件推进：剧情线程前进了一步。" : `黑区条件推进：${condition}`,
  );
  const narrative = [outcome.narrative, ...buildSystemNotes(outcome, itemFeedback.notes, unlockNotes)].join("\n");

  if (outcome.endingId && !runtime.activeCombat) {
    const finalized = finalizeRunState(player, progress, inventory, runtime, outcome.endingId as keyof typeof ENDINGS);
    progress = finalized.progress;
    inventory = finalized.inventory;
    runtime = finalized.runtime;
  }

  return { player, progress, inventory, runtime, parsed, narrative };
}

export function resolveCombatAction(params: {
  player: MvpPlayerState;
  progress: MvpProgressState;
  inventory: InventoryEntry[];
  runtime: MvpDungeonRuntime;
  action: MvpCombatAction;
}) {
  if (!params.runtime.activeCombat) {
    return { ...params, narrative: "当前没有正在结算的战斗。" };
  }

  const monster = MONSTER_MAP.get(params.runtime.activeCombat.monsterId);
  if (!monster) {
    throw new Error("Monster not found");
  }

  const result = resolveCombat({
    action: params.action,
    stats: params.player.visibleStats,
    psych: params.player.psych,
    world: params.player.world,
    understanding: params.player.understanding,
    monsterThreat: buildMonsterThreat(monster, params.player.visibleStats),
    weaknessKnown: params.runtime.activeCombat.weaknessKnown,
  });

  const player: MvpPlayerState = {
    ...params.player,
    visibleStats: {
      ...params.player.visibleStats,
      HP: clamp(params.player.visibleStats.HP - result.damageToPlayer),
      SAN: clamp(params.player.visibleStats.SAN - result.sanityLoss),
      COR: clamp(params.player.visibleStats.COR + result.corruptionGain),
    },
    psych: {
      ...params.player.psych,
      FEAR: clamp(params.player.psych.FEAR + (result.combatSuccess ? 1 : 4)),
      WILL: clamp(params.player.psych.WILL + (result.combatSuccess ? 2 : 0)),
    },
    world: {
      ...params.player.world,
      AGGRO: clamp(params.player.world.AGGRO + (result.combatSuccess ? 1 : 3)),
      HOSTILE: clamp(params.player.world.HOSTILE + 2),
      DRIFT: clamp(params.player.world.DRIFT + (monster.type === "lure" ? 2 : 3)),
    },
    contamination: clamp(params.player.visibleStats.COR + result.corruptionGain),
    behaviorProfile: applyBehaviorDelta(params.player.behaviorProfile, inferBehaviorDelta("fight")),
    understanding: params.player.understanding,
  };

  let progress = params.progress;
  let inventory = params.inventory;
  let runtime: MvpDungeonRuntime = {
    ...params.runtime,
    activeCombat: result.combatSuccess
      ? null
      : {
          ...params.runtime.activeCombat,
          round: params.runtime.activeCombat.round + 1,
          weaknessKnown: result.nextWeaknessKnown,
          canExploitRule: result.nextWeaknessKnown,
          log: [
            ...params.runtime.activeCombat.log,
            { round: params.runtime.activeCombat.round + 1, text: result.narrative, emphasis: result.combatSuccess ? "success" : "danger" },
          ],
        },
    status: result.combatSuccess ? "exploring" : params.runtime.status,
    pendingSettlement: params.runtime.pendingSettlement,
    currentThreat: calculateThreatProfile(player.visibleStats, player.understanding, undefined, player.psych, player.world),
  };

  const pendingEndingFlag = runtime.flags.find((flag) => flag.startsWith("pending_ending:"));
  if (result.combatSuccess && pendingEndingFlag) {
    const endingId = pendingEndingFlag.replace("pending_ending:", "") as keyof typeof ENDINGS;
    runtime.flags = runtime.flags.filter((flag) => flag !== pendingEndingFlag);
    const finalized = finalizeRunState(player, progress, inventory, runtime, endingId);
    progress = finalized.progress;
    inventory = finalized.inventory;
    runtime = finalized.runtime;
  } else if (player.visibleStats.HP <= 0 || player.visibleStats.SAN <= 0) {
    const finalized = finalizeRunState(player, progress, inventory, runtime, failureEndingId(runtime.dungeonId) as keyof typeof ENDINGS);
    progress = finalized.progress;
    inventory = finalized.inventory;
    runtime = finalized.runtime;
  }

  return { player, progress, inventory, runtime, narrative: result.narrative };
}
