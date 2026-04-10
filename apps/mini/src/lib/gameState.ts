import { DEFAULT_LOBBY_STATE, buildDungeonCards, evaluateBlackZoneProgress } from "@game-core/data/lobby";
import { createInitialProfile, createInitialRuntime, resolveCombatAction, submitDungeonAction } from "@game-core/engine/gameEngine";
import { getNode } from "@game-core/engine/nodeEngine";
import type { MvpCombatAction, MvpGameStoreState } from "@game-core/types/game";
import { mvpSaveSchema } from "@game-core/types/game";

import { miniRuntimeCapabilities } from "@/platform/runtime";

export const MINI_SAVE_KEY = "ruletale-mvp-save-v1";

function getLobbySuggestions() {
  return ["查看任务墙", "打开背包", "查看档案", "前往休息区"];
}

function getNodeSuggestions(dungeonId: string, nodeId: string) {
  const node = getNode(dungeonId, nodeId);
  return node?.suggestedActions.map((action) => action.command) ?? [];
}

function syncLobbyState(state: Pick<MvpGameStoreState, "player" | "progress" | "inventory" | "lobby">) {
  const blackZone = evaluateBlackZoneProgress(state.player, state.progress, state.inventory);
  const availableDungeons = ["hospital_night_shift"];
  if (state.progress.completedDungeons.includes("hospital_night_shift")) {
    availableDungeons.push("apartment_night_return");
  }
  if (state.progress.completedDungeons.includes("apartment_night_return")) {
    availableDungeons.push("subway_last_train");
  }
  if (state.progress.completedDungeons.includes("subway_last_train")) {
    availableDungeons.push("campus_night_patrol");
  }

  return {
    ...state.lobby,
    availableDungeons,
    blackMarketUnlocked: blackZone.unlocked,
    blackMarketRequirements: blackZone.conditions,
    blackZone,
  };
}

export function createMiniState(name = "无名访客"): MvpGameStoreState {
  const { player, progress, inventory } = createInitialProfile(name);
  const lobby = syncLobbyState({
    player,
    progress,
    inventory,
    lobby: { ...DEFAULT_LOBBY_STATE },
  });

  return {
    meta: {
      version: 1,
      hasHydrated: true,
      debugMode: false,
      currentView: "lobby",
      currentDrawer: null,
    },
    player,
    progress,
    inventory,
    lobby,
    runtime: null,
    input: {
      text: "",
      suggestions: getLobbySuggestions(),
      lastParsed: null,
    },
  };
}

export function loadMiniState() {
  const saved = miniRuntimeCapabilities.storage.getItem<MvpGameStoreState>(MINI_SAVE_KEY);
  const parsed = mvpSaveSchema.safeParse(saved);
  if (!parsed.success) {
    return createMiniState();
  }

  const restored = parsed.data as MvpGameStoreState;
  return {
    ...restored,
    meta: {
      ...restored.meta,
      hasHydrated: true,
    },
    lobby: syncLobbyState({
      player: restored.player,
      progress: restored.progress,
      inventory: restored.inventory,
      lobby: restored.lobby,
    }),
  };
}

export function saveMiniState(state: MvpGameStoreState) {
  miniRuntimeCapabilities.storage.setItem(MINI_SAVE_KEY, state);
}

export function getMiniDungeonCards(state: MvpGameStoreState) {
  return buildDungeonCards(state.progress, state.lobby, state.player);
}

export function getActiveNode(state: MvpGameStoreState) {
  if (!state.runtime) {
    return null;
  }

  return getNode(state.runtime.dungeonId, state.runtime.currentNodeId);
}

export function enterMiniDungeon(state: MvpGameStoreState, dungeonId: string) {
  const dungeon = getMiniDungeonCards(state).find((entry) => entry.id === dungeonId);
  if (!dungeon || dungeon.locked || dungeonId === "black_zone_entry") {
    return state;
  }

  const runtime = createInitialRuntime(dungeonId, state.player);
  return {
    ...state,
    runtime,
    meta: {
      ...state.meta,
      currentView: "dungeon" as const,
      currentDrawer: null,
    },
    input: {
      text: "",
      suggestions: getNodeSuggestions(dungeonId, runtime.currentNodeId),
      lastParsed: null,
    },
  };
}

export function submitMiniAction(state: MvpGameStoreState, input: string) {
  if (!state.runtime || !input.trim()) {
    return state;
  }

  const result = submitDungeonAction({
    player: state.player,
    progress: state.progress,
    inventory: state.inventory,
    runtime: state.runtime,
    input: input.trim(),
  });

  const runtime = {
    ...result.runtime,
    log: [...result.runtime.log, result.narrative],
  };
  const lobby = syncLobbyState({
    player: result.player,
    progress: result.progress,
    inventory: result.inventory,
    lobby: state.lobby,
  });

  return {
    ...state,
    player: result.player,
    progress: result.progress,
    inventory: result.inventory,
    lobby,
    runtime,
    input: {
      text: "",
      suggestions:
        runtime.status === "combat" ? [] : getNodeSuggestions(runtime.dungeonId, runtime.currentNodeId),
      lastParsed: result.parsed,
    },
  };
}

export function resolveMiniCombat(state: MvpGameStoreState, action: MvpCombatAction) {
  if (!state.runtime) {
    return state;
  }

  const result = resolveCombatAction({
    player: state.player,
    progress: state.progress,
    inventory: state.inventory,
    runtime: state.runtime,
    action,
  });

  const runtime = {
    ...result.runtime,
    log: [...result.runtime.log, result.narrative],
  };
  const lobby = syncLobbyState({
    player: result.player,
    progress: result.progress,
    inventory: result.inventory,
    lobby: state.lobby,
  });

  return {
    ...state,
    player: result.player,
    progress: result.progress,
    inventory: result.inventory,
    lobby,
    runtime,
    input: {
      ...state.input,
      suggestions:
        runtime.status === "exploring" ? getNodeSuggestions(runtime.dungeonId, runtime.currentNodeId) : [],
    },
  };
}

export function returnMiniToHall(state: MvpGameStoreState) {
  const lobby = syncLobbyState({
    player: state.player,
    progress: state.progress,
    inventory: state.inventory,
    lobby: {
      ...state.lobby,
      restUses: 1,
    },
  });

  return {
    ...state,
    runtime: null,
    lobby,
    meta: {
      ...state.meta,
      currentView: "lobby" as const,
      currentDrawer: null,
    },
    input: {
      text: "",
      suggestions: getLobbySuggestions(),
      lastParsed: null,
    },
  };
}
