from __future__ import annotations

from datetime import datetime
from typing import Any, Literal
from uuid import uuid4

from pydantic import BaseModel, Field, field_validator


RuleType = Literal["explicit", "hidden", "false", "conditional"]
MonsterType = Literal["lure", "hunter", "parasite", "judge"]
RunStatus = Literal["idle", "active", "combat", "settlement_ready", "completed", "failed"]
CombatAction = Literal["avoid", "probe", "fight", "flee", "exploit_rule"]
ItemType = Literal["recovery", "insight", "access", "rule_tool", "story", "corrupted", "passive"]
ItemRarity = Literal["common", "rare", "fragment", "consumable", "passive"]
ItemEffectType = Literal[
    "recover_hp",
    "recover_san",
    "recover_sta",
    "reduce_fear",
    "boost_res",
    "boost_cog",
    "reveal_clue",
    "stabilize_rule",
    "unlock_access",
    "focus_observation",
    "lower_aggro",
    "increase_cor",
    "mirror_insight",
    "ward_identity",
    "flag_unlock",
]


class VisibleStats(BaseModel):
    hp: int = 100
    san: int = 100
    sta: int = 100
    cog: int = 60
    cor: int = 0
    atk: int = 18
    defense: int = 16
    spd: int = 15
    acc: int = 16
    res: int = 16


class PsychState(BaseModel):
    fear: int = 18
    suspicion: int = 45
    dependency: int = 20
    impulse: int = 22
    willpower: int = 58
    empathy: int = 42
    obsession: int = 26


class WorldState(BaseModel):
    aggro: int = 10
    drift: int = 8
    hostile: int = 12


class InventoryItem(BaseModel):
    item_id: str
    name: str
    item_type: ItemType
    rarity: ItemRarity
    description: str
    effect_type: ItemEffectType
    effect_value: int = 0
    use_condition: str = ""
    stackable: bool = False
    quantity: int = 1
    usable_in_lobby: bool = False
    usable_in_dungeon: bool = True
    consume_on_use: bool = False
    tags: list[str] = Field(default_factory=list)
    aliases: list[str] = Field(default_factory=list)
    unlocks_insight: bool = False
    modifies_understanding_check: bool = False
    passive_modifiers: dict[str, int] = Field(default_factory=dict)


class RewardRecord(BaseModel):
    item_id: str
    name: str
    rarity: ItemRarity
    description: str
    reason: str
    quantity: int = 1


class RuleRecord(BaseModel):
    rule_id: str
    title: str | None = None
    text: str
    rule_type: RuleType
    source: str
    confidence: float = 0.5
    conflict_info: list[str] = Field(default_factory=list)
    contradictions: list[str] = Field(default_factory=list)
    conditions: list[str] = Field(default_factory=list)
    note: str = ""
    discovered: bool = False
    verified: bool = False
    discovered_at: str | None = None
    verified_at: str | None = None


class NotebookEntry(BaseModel):
    entry_id: str
    title: str
    content: str
    source: str
    tags: list[str] = Field(default_factory=list)
    corruption_sensitive: bool = True
    created_at: str = Field(default_factory=lambda: datetime.now().isoformat(timespec="seconds"))


class MonsterSpec(BaseModel):
    monster_id: str
    name: str
    monster_type: MonsterType
    trigger_condition: str
    weakness_rule_id: str
    threat: int
    combat_bias: str
    psych_hooks: list[str] = Field(default_factory=list)
    archive_hint: str
    sanity_damage: int = 8
    corruption_impact: int = 6
    special_mechanic: str = ""


class SceneInteraction(BaseModel):
    interaction_id: str
    aliases: list[str] = Field(default_factory=list)
    response: str
    discover_rules: list[str] = Field(default_factory=list)
    notebook_entry: NotebookEntry | None = None
    trust_target: str | None = None
    trust_delta: float = 0.0
    status_effects: dict[str, int] = Field(default_factory=dict)
    flag_updates: dict[str, bool] = Field(default_factory=dict)
    understanding_delta: int = 0
    grants_items: list[str] = Field(default_factory=list)
    requires_item_tags: list[str] = Field(default_factory=list)


class SceneNode(BaseModel):
    node_id: str
    title: str
    description: str
    visible_objects: list[str] = Field(default_factory=list)
    clues: list[str] = Field(default_factory=list)
    interactions: list[SceneInteraction] = Field(default_factory=list)
    move_aliases: dict[str, str] = Field(default_factory=dict)
    discoverable_rules: list[str] = Field(default_factory=list)
    encounter_monster_id: str | None = None
    is_exit: bool = False
    recommended_actions: list[str] = Field(default_factory=list)
    event_tags: list[str] = Field(default_factory=list)
    understanding_rewards: dict[str, int] = Field(default_factory=dict)
    understanding_penalty: int = 0
    insight_threshold: int = 0
    bonus_description_by_understanding: str | None = None
    blocked_without_items: list[str] = Field(default_factory=list)


class NpcSpec(BaseModel):
    npc_id: str
    display_name: str
    facade_identity: str
    true_identity: str
    trust_floor: float
    trust_ceiling: float
    readable_psych: list[str] = Field(default_factory=list)
    key_lines: list[str] = Field(default_factory=list)


class DungeonConfig(BaseModel):
    dungeon_id: str
    title: str
    kind: str
    difficulty_band: str
    recommended_style: str
    reward_pool: list[str] = Field(default_factory=list)
    entry_node_id: str
    nodes: list[SceneNode]
    rules: list[RuleRecord]
    monsters: list[MonsterSpec]
    npcs: list[NpcSpec] = Field(default_factory=list)
    failure_rule_id: str | None = None
    success_rule_id: str | None = None
    black_zone: bool = False


class EncounterState(BaseModel):
    active: bool = False
    monster_id: str | None = None
    monster_name: str | None = None
    options: list[CombatAction] = Field(default_factory=lambda: ["avoid", "probe", "fight", "flee", "exploit_rule"])
    reason: str | None = None
    weakness_known: bool = False


class SettlementGrades(BaseModel):
    survival: str
    mental: str
    rules: str
    combat: str
    choice: str
    understanding: str
    overall: str


class SettlementReport(BaseModel):
    report_id: str = Field(default_factory=lambda: f"settlement-{uuid4().hex[:10]}")
    run_id: str
    dungeon_id: str
    dungeon_title: str
    outcome: str
    grades: SettlementGrades
    summary: str
    rewards: list[RewardRecord] = Field(default_factory=list)
    hidden_behavior_tag: str = "规避型"
    unlocked_features: list[str] = Field(default_factory=list)
    metrics: dict[str, float] = Field(default_factory=dict)
    understanding_delta: int = 0
    total_understanding: int = 0
    understanding_level: str = "未知者"
    generated_at: str = Field(default_factory=lambda: datetime.now().isoformat(timespec="seconds"))


class PlayerState(BaseModel):
    player_name: str
    visible_stats: VisibleStats = Field(default_factory=VisibleStats)
    psych_state: PsychState = Field(default_factory=PsychState)
    world_state: WorldState = Field(default_factory=WorldState)
    inventory: list[InventoryItem] = Field(default_factory=list)
    discovered_rules: list[RuleRecord] = Field(default_factory=list)
    notebook_entries: list[NotebookEntry] = Field(default_factory=list)
    monster_archive: list[dict[str, Any]] = Field(default_factory=list)
    hall_permissions: list[str] = Field(default_factory=list)
    behavior_profile: dict[str, int] = Field(
        default_factory=lambda: {
            "规避型": 0,
            "试探型": 0,
            "强攻型": 0,
            "救援型": 0,
            "执念型": 0,
        }
    )
    understanding: int = 0
    understanding_level: str = "未知者"
    obtained_items: list[str] = Field(default_factory=list)
    recent_rewards: list[RewardRecord] = Field(default_factory=list)
    unlocked_archives: list[str] = Field(default_factory=list)

    @field_validator("inventory", mode="before")
    @classmethod
    def _normalize_inventory(cls, value: Any) -> Any:
        if value in (None, ""):
            return []
        from .item_catalog import normalize_inventory_payload

        return normalize_inventory_payload(value)


class RunState(BaseModel):
    run_id: str = Field(default_factory=lambda: f"run-{uuid4().hex[:12]}")
    dungeon_id: str
    dungeon_title: str
    threat_value: float
    matching_multiplier: float
    current_node_id: str
    status: RunStatus = "active"
    step_count: int = 0
    discovered_rule_ids: list[str] = Field(default_factory=list)
    verified_rule_ids: list[str] = Field(default_factory=list)
    npc_trust: dict[str, float] = Field(default_factory=dict)
    events: list[str] = Field(default_factory=list)
    choice_log: list[str] = Field(default_factory=list)
    flags: dict[str, Any] = Field(default_factory=dict)
    combat: EncounterState = Field(default_factory=EncounterState)
    outcome: str | None = None
    settlement_report: SettlementReport | None = None
    understanding_delta: int = 0
    insight_log: list[str] = Field(default_factory=list)
    false_rule_hits: list[str] = Field(default_factory=list)
    hidden_route_triggered: bool = False
    used_item_ids: list[str] = Field(default_factory=list)
    started_at: str = Field(default_factory=lambda: datetime.now().isoformat(timespec="seconds"))
    ended_at: str | None = None


class GameSession(BaseModel):
    session_id: str = Field(default_factory=lambda: f"session-{uuid4().hex[:12]}")
    player_state: PlayerState
    current_run: RunState | None = None
    run_history: list[str] = Field(default_factory=list)
    completed_dungeons: list[str] = Field(default_factory=list)
    flags: dict[str, Any] = Field(default_factory=dict)
    last_action_text: str | None = None
    last_action_result: dict[str, Any] | None = None
    last_settlement: SettlementReport | None = None
    created_at: str = Field(default_factory=lambda: datetime.now().isoformat(timespec="seconds"))
    updated_at: str = Field(default_factory=lambda: datetime.now().isoformat(timespec="seconds"))


class StartSessionRequest(BaseModel):
    player_name: str = Field(min_length=1)


class HallVisitRequest(BaseModel):
    module_id: str = Field(min_length=1)


class EnterDungeonRequest(BaseModel):
    session_id: str = Field(min_length=1)


class InterpretActionRequest(BaseModel):
    text: str = Field(min_length=1)


class CombatActionRequest(BaseModel):
    action: CombatAction


class SaveSlotRequest(BaseModel):
    slot_id: str = Field(default="autosave", min_length=1)


class LoadSlotRequest(BaseModel):
    slot_id: str = Field(default="autosave", min_length=1)
