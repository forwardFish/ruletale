import { describe, expect, it } from "vitest";

import { buildDungeonCards, DEFAULT_LOBBY_STATE, evaluateBlackZoneProgress } from "@game-core/data/lobby";
import { createInitialProfile } from "@game-core/engine/gameEngine";
import { addItemById } from "@game-core/engine/inventoryEngine";
import { getDungeonConfig } from "@game-core/engine/nodeEngine";

describe("dungeon registry", () => {
  it("registers subway and campus dungeons in the shared core", () => {
    expect(getDungeonConfig("subway_last_train").title).toBeTruthy();
    expect(getDungeonConfig("campus_night_patrol").title).toBeTruthy();
  });

  it("unlocks subway after apartment and campus after subway", () => {
    const { player, progress } = createInitialProfile();

    const initialCards = buildDungeonCards(progress, DEFAULT_LOBBY_STATE, player);
    expect(initialCards.find((card) => card.id === "subway_last_train")?.locked).toBe(true);
    expect(initialCards.find((card) => card.id === "campus_night_patrol")?.locked).toBe(true);

    progress.completedDungeons.push("hospital_night_shift", "apartment_night_return");
    const subwayLobby = {
      ...DEFAULT_LOBBY_STATE,
      availableDungeons: ["hospital_night_shift", "apartment_night_return", "subway_last_train"],
    };
    const subwayCards = buildDungeonCards(progress, subwayLobby, player);
    expect(subwayCards.find((card) => card.id === "subway_last_train")?.locked).toBe(false);
    expect(subwayCards.find((card) => card.id === "campus_night_patrol")?.locked).toBe(true);

    progress.completedDungeons.push("subway_last_train");
    const campusLobby = {
      ...subwayLobby,
      availableDungeons: [...subwayLobby.availableDungeons, "campus_night_patrol"],
    };
    const campusCards = buildDungeonCards(progress, campusLobby, player);
    expect(campusCards.find((card) => card.id === "campus_night_patrol")?.locked).toBe(false);
    expect(campusCards.find((card) => card.id === "black_zone_entry")?.locked).toBe(true);
  });

  it("treats subway and campus insight clears as black-zone story progress", () => {
    const { player, progress, inventory } = createInitialProfile();
    player.understanding = 130;

    const withPass = addItemById(inventory, "temporary_pass");
    progress.archive.endings.push("subway_insight_clear");
    expect(evaluateBlackZoneProgress(player, progress, withPass).unlocked).toBe(true);

    progress.archive.endings = ["campus_insight_clear"];
    expect(evaluateBlackZoneProgress(player, progress, withPass).unlocked).toBe(true);
  });
});
