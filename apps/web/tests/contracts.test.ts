import {
  activeRunPayloadSchema,
  archivesPayloadSchema,
  hallPayloadSchema,
  settlementPayloadSchema,
} from "@/lib/api/client";

function createReward() {
  return {
    item_id: "item-lantern",
    name: "安静提灯",
    rarity: "rare",
    description: "在门后给你一段更稳定的视线。",
    reason: "通过夜班走廊结算获得。",
    quantity: 1,
  };
}

function createUnderstanding() {
  return {
    total: 120,
    level: "trace",
    current_threshold: 0,
    next_threshold: 200,
    next_level: "echo",
    progress_percent: 60,
  };
}

function createInventoryItem() {
  return {
    item_id: "item-bandage",
    name: "备用绷带",
    item_type: "consumable",
    rarity: "common",
    description: "勉强够你再顶一次风险。",
    effect_type: "heal",
    effect_value: 10,
    use_condition: "受伤时使用",
    stackable: true,
    quantity: 2,
    usable_in_lobby: true,
    usable_in_dungeon: true,
    consume_on_use: true,
    tags: ["healing"],
    aliases: ["绷带"],
  };
}

function createSettlement() {
  return {
    report_id: "report-1",
    run_id: "run-1",
    dungeon_id: "hospital_night_shift",
    dungeon_title: "医院夜班",
    outcome: "survived",
    grades: {
      survival: "A",
      mental: "B",
      rules: "A",
      combat: "B",
      choice: "A",
      understanding: "A",
      overall: "A",
    },
    summary: "你带着一份还算完整的答案回到大厅。",
    rewards: [createReward()],
    hidden_behavior_tag: "careful",
    unlocked_features: ["archive:night_shift"],
    metrics: {
      survival_score: 92,
      rule_score: 88,
    },
    understanding_delta: 20,
    total_understanding: 120,
    understanding_level: "trace",
    generated_at: "2026-04-06T10:00:00Z",
  };
}

function createRun(status = "active") {
  return {
    run_id: "run-1",
    dungeon_id: "hospital_night_shift",
    dungeon_title: "医院夜班",
    threat_value: 48,
    matching_multiplier: 1.2,
    current_node_id: "ward-corridor",
    status,
    step_count: 3,
    discovered_rule_ids: ["rule-1"],
    verified_rule_ids: ["rule-1"],
    flags: {
      flashlight: true,
    },
    combat: {
      active: status === "combat",
      monster_id: "ghost-nurse",
      monster_name: "夜班护士",
      options: ["avoid", "probe", "fight"],
      reason: "她在你身后停得太近。",
      weakness_known: status === "combat",
    },
    outcome: null,
    understanding_delta: 10,
    insight_log: ["广播比门牌更早说谎。"],
    false_rule_hits: [],
    hidden_route_triggered: false,
    used_item_ids: ["item-bandage"],
  };
}

function createSession() {
  return {
    session_id: "session-1",
    player: {
      player_name: "无名访客",
      visible_stats: {
        hp: 82,
        san: 70,
        sta: 64,
        cog: 58,
        cor: 12,
        atk: 34,
        defense: 30,
        spd: 28,
        acc: 32,
        res: 26,
      },
      psych_hint: {
        caution: "你暂时还能稳住呼吸。",
      },
      world_state: {
        suspicion: 12,
      },
      inventory: [createInventoryItem()],
      behavior_profile: {
        caution: 0.8,
      },
      hall_permissions: ["task_wall", "archives"],
      understanding: createUnderstanding(),
      recent_rewards: [createReward()],
      obtained_items: ["item-bandage"],
      unlocked_archives: ["archive:night_shift"],
    },
    completed_dungeons: ["prologue"],
    last_settlement: createSettlement(),
    active_run: createRun(),
    flags: {
      tutorial_complete: true,
    },
    updated_at: "2026-04-06T10:00:00Z",
  };
}

function createHall() {
  return {
    modules: [
      {
        module_id: "task_wall",
        title: "任务墙",
        summary: "今晚最危险的门都在这里。",
        status: "available",
        locked: false,
      },
      {
        module_id: "archives",
        title: "档案室",
        summary: "先确认哪些规则还可信。",
        status: "available",
        locked: false,
      },
    ],
    narrative: "大厅今天比昨天更安静。",
    available_dungeons: [
      {
        dungeon_id: "hospital_night_shift",
        title: "医院夜班",
        kind: "追猎",
        difficulty_band: "mid",
        recommended_style: "先试探，再决定信谁。",
        reward_pool: ["安静提灯"],
        locked: false,
        lock_reason: null,
      },
    ],
    admin_hint: "别急着相信先喊出你名字的人。",
    archive_count: 4,
    recent_rewards: [createReward()],
    understanding: createUnderstanding(),
    contamination: 12,
  };
}

function createArchives() {
  return {
    rules: [
      {
        rule_id: "rule-1",
        title: "夜班广播",
        text: "广播先响时，不要立刻回头。",
        rule_type: "explicit" as const,
        source: "ward_speaker",
        confidence: 0.92,
        contradictions: [],
        conditions: [],
        discovered: true,
        verified: true,
        note: "铃声会先一步替你做决定。",
      },
    ],
    notebook_entries: [
      {
        entry_id: "entry-1",
        title: "走廊便签",
        content: "门牌会晚一步说真话。",
        source: "ward-corridor",
        tags: ["corridor"],
        tampered: false,
      },
    ],
    monster_archive: [
      {
        monster_id: "ghost-nurse",
        name: "夜班护士",
        type: "phantom",
        weakness_rule_id: "rule-1",
        weakness_rule_text: "广播先响时，不要立刻回头。",
        archive_hint: "她总在第二次铃声前靠近。",
        special_mechanic: "echo-step",
      },
    ],
    run_history: [createSettlement()],
    recent_rewards: [createReward()],
    unlocked_archives: ["archive:night_shift"],
    obtained_items: ["item-bandage"],
  };
}

function createScene() {
  return {
    node_id: "ward-corridor",
    title: "住院部走廊",
    description: "护士站的灯还亮着，广播先你一步响起。",
    visible_objects: ["护士站", "告示牌"],
    clues: ["门牌上的时间被涂改过一次。"],
    insight: "广播和门牌在抢同一个答案。",
    ai_hint: "先看广播，再决定靠近谁。",
    suggested_actions: [
      {
        choice_id: "choice-1",
        kind: "observe",
        label: "先看广播",
        action_text: "观察广播内容",
        reason: "先确认声音是不是在替谁引路。",
      },
    ],
    inventory_usable: [createInventoryItem()],
  };
}

describe("shared contracts", () => {
  it("parses hall payloads from the shared hall contract", () => {
    const parsed = hallPayloadSchema.parse({
      session: createSession(),
      hall: createHall(),
    });

    expect(parsed.hall.available_dungeons[0]?.title).toBe("医院夜班");
  });

  it("parses archive and settlement payloads from the shared contracts", () => {
    const archives = archivesPayloadSchema.parse({
      session: createSession(),
      archives: createArchives(),
    });
    const settlement = settlementPayloadSchema.parse({
      session: createSession(),
      settlement: createSettlement(),
    });

    expect(archives.archives.rules).toHaveLength(1);
    expect(settlement.settlement.grades.overall).toBe("A");
  });

  it("parses active run payloads from the shared dungeon contract", () => {
    const parsed = activeRunPayloadSchema.parse({
      session: createSession(),
      run: createRun("combat"),
      scene: createScene(),
      settlement_ready: false,
      settlement: null,
    });

    expect(parsed.run.combat.active).toBe(true);
    expect(parsed.scene.suggested_actions[0]?.choice_id).toBe("choice-1");
  });
});
