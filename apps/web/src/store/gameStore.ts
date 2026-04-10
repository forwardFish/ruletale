"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import { ITEM_DEFINITIONS, SHOP_PRICES } from "@game-core/data/items";
import { buildDungeonCards, DEFAULT_LOBBY_STATE, evaluateBlackZoneProgress, HALL_ADMIN_NOTES } from "@game-core/data/lobby";
import { createInitialProfile, createInitialRuntime, resolveCombatAction, submitDungeonAction } from "@game-core/engine/gameEngine";
import { addItemById } from "@game-core/engine/inventoryEngine";
import { getNode } from "@game-core/engine/nodeEngine";
import { behaviorLabel, dominantBehavior } from "@game-core/engine/profileEngine";
import type { MvpCombatAction, MvpGameStoreState } from "@game-core/types/game";
import { mvpSaveSchema } from "@game-core/types/game";
import type { InventoryEntry } from "@game-core/types/inventory";
import { createPersistStorage, webGameStorageAdapter } from "@/platform/web/storage";

export const MVP_SAVE_KEY = "ruletale-mvp-save-v1";

type GameStoreActions = {
  startNewProfile: (name?: string) => void;
  hydrateSave: () => void;
  setCurrentView: (view: "lobby" | "dungeon") => void;
  setDrawer: (drawer: "inventory" | "archives" | "shop" | null) => void;
  setInputText: (text: string) => void;
  enterDungeon: (dungeonId: string) => void;
  submitAction: (input?: string) => void;
  resolveCombatAction: (action: MvpCombatAction) => void;
  applySettlement: () => void;
  returnToLobby: () => void;
  resetRun: () => void;
  useRestArea: () => void;
  purchaseItem: (itemId: string) => void;
  clearSave: () => void;
};

export type GameStore = MvpGameStoreState & GameStoreActions;

function getLobbySuggestions() {
  return ["查看任务墙", "打开背包", "查看档案", "去休息区"];
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

function buildInitialState(name?: string): MvpGameStoreState {
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
      hasHydrated: false,
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

const initialState = buildInitialState();

function persistSlice(state: GameStore): MvpGameStoreState {
  return {
    meta: { ...state.meta, hasHydrated: false },
    player: state.player,
    progress: state.progress,
    inventory: state.inventory,
    lobby: state.lobby,
    runtime: state.runtime,
    input: state.input,
  };
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      startNewProfile(name) {
        const nextState = buildInitialState(name);
        set({
          ...nextState,
          meta: {
            ...nextState.meta,
            hasHydrated: true,
          },
        });
      },

      hydrateSave() {
        set((state) => ({
          meta: {
            ...state.meta,
            hasHydrated: true,
          },
        }));
      },

      setCurrentView(view) {
        set((state) => ({
          meta: {
            ...state.meta,
            currentView: view,
          },
        }));
      },

      setDrawer(drawer) {
        set((state) => ({
          meta: {
            ...state.meta,
            currentDrawer: drawer,
          },
        }));
      },

      setInputText(text) {
        set((state) => ({
          input: {
            ...state.input,
            text,
          },
        }));
      },

      enterDungeon(dungeonId) {
        const cards = buildDungeonCards(get().progress, get().lobby, get().player);
        const dungeon = cards.find((entry) => entry.id === dungeonId);
        if (!dungeon || dungeon.locked || dungeonId === "black_zone_entry") {
          return;
        }

        const runtime = createInitialRuntime(dungeonId, get().player);
        set((state) => ({
          ...state,
          runtime,
          meta: {
            ...state.meta,
            currentView: "dungeon",
            currentDrawer: null,
          },
          input: {
            text: "",
            suggestions: getNodeSuggestions(dungeonId, runtime.currentNodeId),
            lastParsed: null,
          },
        }));
      },

      submitAction(input) {
        const state = get();
        if (!state.runtime) {
          return;
        }

        const actionText = (input ?? state.input.text).trim();
        if (!actionText) {
          return;
        }

        const result = submitDungeonAction({
          player: state.player,
          progress: state.progress,
          inventory: state.inventory,
          runtime: state.runtime,
          input: actionText,
        });

        const runtimeWithNarrative = {
          ...result.runtime,
          log: [...result.runtime.log, result.narrative],
        };

        const lobby = syncLobbyState({
          player: result.player,
          progress: result.progress,
          inventory: result.inventory,
          lobby: state.lobby,
        });

        const suggestions =
          runtimeWithNarrative.status === "combat"
            ? []
            : getNodeSuggestions(runtimeWithNarrative.dungeonId, runtimeWithNarrative.currentNodeId);

        set((current) => ({
          ...current,
          player: result.player,
          progress: result.progress,
          inventory: result.inventory,
          lobby,
          runtime: runtimeWithNarrative,
          input: {
            text: "",
            suggestions,
            lastParsed: result.parsed,
          },
        }));
      },

      resolveCombatAction(action) {
        const state = get();
        if (!state.runtime) {
          return;
        }

        const result = resolveCombatAction({
          player: state.player,
          progress: state.progress,
          inventory: state.inventory,
          runtime: state.runtime,
          action,
        });

        const runtimeWithNarrative = {
          ...result.runtime,
          log: [...result.runtime.log, result.narrative],
        };

        const lobby = syncLobbyState({
          player: result.player,
          progress: result.progress,
          inventory: result.inventory,
          lobby: state.lobby,
        });

        const suggestions =
          runtimeWithNarrative.status === "exploring"
            ? getNodeSuggestions(runtimeWithNarrative.dungeonId, runtimeWithNarrative.currentNodeId)
            : [];

        set((current) => ({
          ...current,
          player: result.player,
          progress: result.progress,
          inventory: result.inventory,
          lobby,
          runtime: runtimeWithNarrative,
          input: {
            ...current.input,
            text: "",
            suggestions,
          },
        }));
      },

      applySettlement() {
        set((state) => {
          if (!state.runtime?.pendingSettlement) {
            return state;
          }
          const progress = {
            ...state.progress,
            lastSettlement: state.runtime.pendingSettlement,
          };
          return {
            ...state,
            progress,
            lobby: syncLobbyState({
              player: state.player,
              progress,
              inventory: state.inventory,
              lobby: state.lobby,
            }),
          };
        });
      },

      returnToLobby() {
        set((state) => {
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
              currentView: "lobby",
              currentDrawer: null,
            },
            input: {
              text: "",
              suggestions: getLobbySuggestions(),
              lastParsed: null,
            },
          };
        });
      },

      resetRun() {
        set((state) => ({
          ...state,
          runtime: null,
          meta: {
            ...state.meta,
            currentView: "lobby",
            currentDrawer: null,
          },
          input: {
            text: "",
            suggestions: getLobbySuggestions(),
            lastParsed: null,
          },
        }));
      },

      useRestArea() {
        const state = get();
        if (state.lobby.restUses <= 0) {
          return;
        }

        const note =
          HALL_ADMIN_NOTES[
            (state.progress.completedDungeons.length + state.progress.archive.events.length) % HALL_ADMIN_NOTES.length
          ];

        const player = {
          ...state.player,
          visibleStats: {
            ...state.player.visibleStats,
            HP: Math.min(100, state.player.visibleStats.HP + 12),
            SAN: Math.min(100, state.player.visibleStats.SAN + 10),
            STA: Math.min(100, state.player.visibleStats.STA + 10),
          },
        };

        const progress = {
          ...state.progress,
          archive: {
            ...state.progress.archive,
            events: Array.from(new Set([...state.progress.archive.events, note])),
            byDungeon: { ...state.progress.archive.byDungeon },
          },
        };

        const lobby = syncLobbyState({
          player,
          progress,
          inventory: state.inventory,
          lobby: {
            ...state.lobby,
            restUses: Math.max(0, state.lobby.restUses - 1),
          },
        });

        set((current) => ({
          ...current,
          player,
          progress,
          lobby,
        }));
      },

      purchaseItem(itemId) {
        const state = get();
        if (!state.lobby.shopStockIds.includes(itemId)) {
          return;
        }

        const price = SHOP_PRICES[itemId] ?? 999;
        if (state.progress.supplyMarks < price || !ITEM_DEFINITIONS[itemId]) {
          return;
        }

        const inventory = addItemById(state.inventory, itemId);
        const progress = {
          ...state.progress,
          supplyMarks: state.progress.supplyMarks - price,
          recentRewards: [{ itemId, reason: `在商店花费 ${price} 供给点购入`, quantity: 1 }, ...state.progress.recentRewards].slice(0, 4),
        };
        const lobby = syncLobbyState({
          player: state.player,
          progress,
          inventory,
          lobby: state.lobby,
        });

        set((current) => ({
          ...current,
          inventory,
          progress,
          lobby,
        }));
      },

      clearSave() {
        useGameStore.persist.clearStorage();
        const nextState = buildInitialState();
        set({
          ...nextState,
          meta: {
            ...nextState.meta,
            hasHydrated: true,
          },
        });
      },
    }),
    {
      name: MVP_SAVE_KEY,
      storage: createPersistStorage<MvpGameStoreState>(webGameStorageAdapter),
      partialize: (state) => persistSlice(state),
      merge: (persistedState, currentState) => {
        const parsed = mvpSaveSchema.safeParse(persistedState);
        if (!parsed.success) {
          return {
            ...currentState,
            meta: {
              ...currentState.meta,
              hasHydrated: true,
            },
          };
        }

        const restored = parsed.data as MvpGameStoreState;
        return {
          ...currentState,
          ...restored,
          lobby: syncLobbyState({
            player: restored.player,
            progress: restored.progress,
            inventory: restored.inventory,
            lobby: restored.lobby,
          }),
          meta: {
            ...currentState.meta,
            ...restored.meta,
            hasHydrated: true,
          },
        };
      },
      onRehydrateStorage: () => (state) => {
        state?.hydrateSave();
      },
    },
  ),
);

export function usePrimaryBehaviorLabel() {
  const profile = useGameStore((state) => state.player.behaviorProfile);
  return behaviorLabel(dominantBehavior(profile));
}

export function useInventoryTotal(items: InventoryEntry[]) {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}
