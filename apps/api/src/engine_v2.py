from __future__ import annotations

from datetime import datetime
from random import Random
import re
from typing import Any
from urllib.parse import quote

from .game_content import HALL_MODULES, get_dungeon_config, list_dungeon_configs
from .item_catalog import (
    ITEM_DEFINITIONS,
    add_item,
    consume_item,
    get_item,
    has_item,
    has_tag,
    item_template,
    resolve_item_id,
    starting_inventory,
)
from .models import (
    CombatActionRequest,
    DungeonConfig,
    EncounterState,
    GameSession,
    NotebookEntry,
    PlayerState,
    RuleRecord,
    RunState,
    SceneInteraction,
    SceneNode,
    SettlementGrades,
    SettlementReport,
)
from .persistence import list_run_reports, load_run_report, load_session, load_slot, save_session, save_slot
from .progression import (
    apply_understanding_delta,
    generate_reward_bundle,
    grant_rewards,
    node_insight,
    passive_modifier_total,
    reward_unlocks,
    sync_understanding as sync_player_understanding,
    understanding_parse_bias,
    understanding_snapshot,
)


VISIBLE_STAT_KEYS = {"hp", "san", "sta", "cog", "cor", "atk", "defense", "spd", "acc", "res"}
PSYCH_KEYS = {"fear", "suspicion", "dependency", "impulse", "willpower", "empathy", "obsession"}
WORLD_KEYS = {"aggro", "drift", "hostile"}
FALLBACK_PLAYER_NAME = "无名访客"


def now_iso() -> str:
    return datetime.now().isoformat(timespec="seconds")


def clamp(value: float, low: int = 0, high: int = 100) -> int:
    return int(max(low, min(high, round(value))))


def _grade(score: float) -> str:
    if score >= 92:
        return "S"
    if score >= 82:
        return "A"
    if score >= 70:
        return "B"
    if score >= 56:
        return "C"
    return "D"


def _psych_level(value: int) -> str:
    if value >= 60:
        return "高"
    if value >= 30:
        return "中"
    return "低"


def _effective_visible_stats(player: PlayerState) -> dict[str, int]:
    stats = player.visible_stats.model_dump(mode="json")
    for key in ("res", "cog", "atk", "defense", "spd", "acc"):
        stats[key] = clamp(stats[key] + passive_modifier_total(player, key))
    return stats


def _inventory_payload(player: PlayerState) -> list[dict[str, Any]]:
    return [item.model_dump(mode="json") for item in player.inventory]


def _player_public_payload(player: PlayerState) -> dict[str, Any]:
    psych = player.psych_state
    return {
        "player_name": player.player_name,
        "visible_stats": _effective_visible_stats(player),
        "psych_hint": {
            "fear": _psych_level(psych.fear),
            "suspicion": _psych_level(psych.suspicion),
            "dependency": _psych_level(psych.dependency),
            "willpower": _psych_level(psych.willpower),
            "obsession": _psych_level(psych.obsession),
        },
        "world_state": player.world_state.model_dump(mode="json"),
        "inventory": _inventory_payload(player),
        "behavior_profile": dict(player.behavior_profile),
        "hall_permissions": list(player.hall_permissions),
        "understanding": understanding_snapshot(player),
        "recent_rewards": [reward.model_dump(mode="json") for reward in player.recent_rewards],
        "obtained_items": list(player.obtained_items),
        "unlocked_archives": list(player.unlocked_archives),
    }


def _run_snapshot(run: RunState | None) -> dict[str, Any] | None:
    if run is None:
        return None
    return {
        "run_id": run.run_id,
        "dungeon_id": run.dungeon_id,
        "dungeon_title": run.dungeon_title,
        "threat_value": run.threat_value,
        "matching_multiplier": run.matching_multiplier,
        "current_node_id": run.current_node_id,
        "status": run.status,
        "step_count": run.step_count,
        "discovered_rule_ids": list(run.discovered_rule_ids),
        "verified_rule_ids": list(run.verified_rule_ids),
        "flags": dict(run.flags),
        "combat": run.combat.model_dump(mode="json"),
        "outcome": run.outcome,
        "understanding_delta": run.understanding_delta,
        "insight_log": list(run.insight_log),
        "false_rule_hits": list(run.false_rule_hits),
        "hidden_route_triggered": run.hidden_route_triggered,
        "used_item_ids": list(run.used_item_ids),
        "settlement_report": run.settlement_report.model_dump(mode="json") if run.settlement_report else None,
    }


def _action_label(text: str, *, move: bool = False) -> str:
    if any(text.startswith(prefix) for prefix in ("前往", "去", "回", "进入", "查看", "检查", "观察", "验证规则", "使用")):
        return text
    return f"{'前往' if move else '查看'}{text}"


def _choice_id(kind: str, text: str) -> str:
    return f"{kind}-{quote(text, safe='')}"


def _distort_text(text: str, san: int, cor: int) -> str:
    if san >= 45 and cor < 45:
        return text
    glitched = text
    if san < 35:
        glitched = glitched.replace("规则", "规…则").replace("声音", "声纹")
    if cor >= 45:
        glitched = f"{glitched} 你隐约感觉记录本已经先于你替这一步写下了结论。"
    return glitched


def _tamper_notebook(entries: list[NotebookEntry], cor: int) -> list[dict[str, Any]]:
    payload: list[dict[str, Any]] = []
    for entry in entries:
        item = entry.model_dump(mode="json")
        if cor >= 45 and entry.corruption_sensitive:
            item["content"] = item["content"].replace("不要", "最好").replace("怀疑", "信任")
            item["tampered"] = True
        else:
            item["tampered"] = False
        payload.append(item)
    return payload


def _reward_names(reward_pool: list[str]) -> list[str]:
    names: list[str] = []
    for item_id in reward_pool:
        if item_id in ITEM_DEFINITIONS:
            names.append(item_template(item_id)["name"])
    return names


def _list_dungeon_cards(session: GameSession) -> list[dict[str, Any]]:
    cards: list[dict[str, Any]] = []
    black_zone_ready = "black_zone_access" in session.player_state.hall_permissions
    for config in list_dungeon_configs():
        locked = config.black_zone and not black_zone_ready
        cards.append(
            {
                "dungeon_id": config.dungeon_id,
                "title": config.title,
                "kind": config.kind,
                "difficulty_band": config.difficulty_band,
                "recommended_style": config.recommended_style,
                "reward_pool": _reward_names(config.reward_pool),
                "locked": locked,
                "lock_reason": None
                if not locked
                else "黑区入口仍在观察你。至少要完成医院夜班、公寓夜归，并带回一份有效通行凭证碎片。",
            }
        )
    return cards


def _config_indexes(config: DungeonConfig) -> tuple[dict[str, SceneNode], dict[str, RuleRecord], dict[str, Any]]:
    node_index = {node.node_id: node for node in config.nodes}
    rule_index = {rule.rule_id: rule for rule in config.rules}
    monster_index = {monster.monster_id: monster for monster in config.monsters}
    return node_index, rule_index, monster_index


def _get_current_context(session: GameSession) -> tuple[RunState, DungeonConfig, SceneNode, dict[str, RuleRecord], dict[str, Any]]:
    run = session.current_run
    if run is None:
        raise ValueError("当前没有正在进行中的副本。")
    config = get_dungeon_config(run.dungeon_id)
    node_index, rule_index, monster_index = _config_indexes(config)
    node = node_index[run.current_node_id]
    return run, config, node, rule_index, monster_index


def _apply_delta(session: GameSession, key: str, delta: int) -> None:
    player = session.player_state
    if key in VISIBLE_STAT_KEYS:
        setattr(player.visible_stats, key, clamp(getattr(player.visible_stats, key) + delta))
    elif key in PSYCH_KEYS:
        setattr(player.psych_state, key, clamp(getattr(player.psych_state, key) + delta))
    elif key in WORLD_KEYS:
        setattr(player.world_state, key, clamp(getattr(player.world_state, key) + delta))


def _remember_notebook(session: GameSession, entry: NotebookEntry | None) -> None:
    if entry is None:
        return
    if any(item.entry_id == entry.entry_id for item in session.player_state.notebook_entries):
        return
    session.player_state.notebook_entries.append(entry)


def _upsert_rule(session: GameSession, run: RunState, config: DungeonConfig, rule_id: str, *, verify: bool = False) -> RuleRecord | None:
    _, rule_index, _ = _config_indexes(config)
    template = rule_index.get(rule_id)
    if template is None:
        return None

    existing = next((item for item in session.player_state.discovered_rules if item.rule_id == rule_id), None)
    if existing is None:
        existing = template.model_copy(deep=True)
        existing.discovered = True
        existing.discovered_at = now_iso()
        if not existing.contradictions:
            existing.contradictions = list(existing.conflict_info)
        if not existing.title:
            existing.title = template.text[:12]
        session.player_state.discovered_rules.append(existing)
    if rule_id not in run.discovered_rule_ids:
        run.discovered_rule_ids.append(rule_id)

    if verify:
        existing.verified = True
        existing.verified_at = now_iso()
        existing.confidence = min(1.0, existing.confidence + 0.25)
        if rule_id not in run.verified_rule_ids:
            run.verified_rule_ids.append(rule_id)
    return existing


def _record_behavior(session: GameSession, label: str, delta: int = 1) -> None:
    session.player_state.behavior_profile[label] = session.player_state.behavior_profile.get(label, 0) + delta


def _match_move_target(node: SceneNode, text: str) -> str | None:
    for alias, target in node.move_aliases.items():
        if alias in text:
            return target
    return None


def _match_interaction(node: SceneNode, text: str) -> SceneInteraction | None:
    for interaction in node.interactions:
        if any(alias in text for alias in interaction.aliases):
            return interaction
    return None


def _text_fragments(text: str) -> list[str]:
    return [fragment for fragment in re.split(r"[，。；：、“”‘’\\s]+", text) if len(fragment) >= 2]


def _match_rule_from_text(text: str, rules: list[RuleRecord]) -> RuleRecord | None:
    fragments = _text_fragments(text)
    for rule in rules:
        if rule.rule_id in text or rule.text in text:
            return rule
        if any(fragment in rule.text for fragment in fragments):
            return rule
    return None


def _inventory_names(player: PlayerState) -> str:
    if not player.inventory:
        return "空空如也"
    formatted: list[str] = []
    for item in player.inventory:
        suffix = f" x{item.quantity}" if item.quantity > 1 else ""
        formatted.append(f"{item.name}{suffix}")
    return "、".join(formatted)


def _scene_insight(session: GameSession, node: SceneNode) -> str | None:
    bonus = node_insight(session.player_state, node.insight_threshold, node.bonus_description_by_understanding)
    if bonus:
        return bonus
    if has_item(session.player_state, "half_broken_flashlight") and any(token in "".join(node.visible_objects) for token in ("门牌", "镜", "走廊", "观察窗")):
        return "半损手电照出的边缘比肉眼更诚实，你能确定这里至少有一处信息被故意摆歪了。"
    if has_item(session.player_state, "mirror_shard") and any(token in node.title for token in ("镜", "出口")):
        return "镜面碎片在掌心发冷，提醒你不要跟任何慢半拍的倒影同步动作。"
    return None


def _scene_ai_hint(session: GameSession, run: RunState, node: SceneNode) -> str:
    visible = _effective_visible_stats(session.player_state)
    if run.combat.active and run.combat.monster_name:
        return f"{run.combat.monster_name} 已经显形。先判断它是否被规则压制，再决定规避、试探还是正面处理。"
    if run.status in {"settlement_ready", "completed", "failed"}:
        return "这次副本已经进入收束阶段，先看结算，再决定要不要带着新信息回大厅。"
    if visible["san"] < 45 or visible["cor"] >= 35:
        return "你的感知正在偏移。优先做低风险观察、验证与背包检查，不要连续赌运气。"
    if node.discoverable_rules:
        return "这个场景仍有规则线索可挖。先观察或检查关键对象，再决定下一步。"
    if node.move_aliases:
        return "这里的静态线索已经快被你榨干了，可以顺着可达区域继续推进。"
    return "别急着给场景答案，先让它多露出一层。"


def _scene_choice_payload(session: GameSession, run: RunState, config: DungeonConfig, node: SceneNode) -> list[dict[str, Any]]:
    choices: list[dict[str, Any]] = []
    if run.combat.active:
        return choices

    choices.append(
        {
            "choice_id": _choice_id("observe", node.node_id),
            "kind": "observe",
            "label": f"观察{node.title}",
            "action_text": f"观察{node.title}",
            "reason": "重新读取当前场景，把可疑点和新增洞察都翻出来。",
        }
    )
    choices.append(
        {
            "choice_id": _choice_id("inventory", "open_bag"),
            "kind": "inventory",
            "label": "查看背包",
            "action_text": "查看背包",
            "reason": "先确认还能动用什么，再决定要不要冒险。",
        }
    )

    for interaction in node.interactions:
        alias = next(
            (
                item
                for item in interaction.aliases
                if any(token in item for token in ("查看", "检查", "观察", "核对"))
            ),
            interaction.aliases[0] if interaction.aliases else interaction.interaction_id,
        )
        choices.append(
            {
                "choice_id": _choice_id("inspect", interaction.interaction_id),
                "kind": "inspect",
                "label": _action_label(alias),
                "action_text": _action_label(alias),
                "reason": "这里有可直接互动的对象，通常会带来规则、笔记或状态变化。",
            }
        )

    seen_targets: set[str] = set()
    for alias, target in node.move_aliases.items():
        if target in seen_targets:
            continue
        seen_targets.add(target)
        choices.append(
            {
                "choice_id": _choice_id("move", target),
                "kind": "move",
                "label": _action_label(alias, move=True),
                "action_text": _action_label(alias, move=True),
                "reason": "继续推进到下一处区域，逼副本把下一层信息暴露出来。",
            }
        )

    candidate_rule_ids = [rule_id for rule_id in run.discovered_rule_ids if rule_id not in run.verified_rule_ids]
    if not candidate_rule_ids:
        candidate_rule_ids = [rule_id for rule_id in node.discoverable_rules if rule_id not in run.verified_rule_ids]
    rule_index = {rule.rule_id: rule for rule in config.rules}
    for rule_id in candidate_rule_ids[:2]:
        rule = rule_index.get(rule_id)
        if rule is None:
            continue
        choices.append(
            {
                "choice_id": _choice_id("verify", rule_id),
                "kind": "verify",
                "label": f"验证规则：{rule.text}",
                "action_text": f"验证规则：{rule.text}",
                "reason": "把线索升级成真正可用的规则判断。",
            }
        )

    usable_items = [item for item in session.player_state.inventory if item.usable_in_dungeon][:2]
    for item in usable_items:
        choices.append(
            {
                "choice_id": _choice_id("item", item.item_id),
                "kind": "item",
                "label": f"使用{item.name}",
                "action_text": f"使用{item.name}",
                "reason": item.use_condition or "让背包里的物品真正参与判断。",
            }
        )

    return choices[:8]


def _scene_payload(session: GameSession, run: RunState, config: DungeonConfig, node: SceneNode) -> dict[str, Any]:
    insight = _scene_insight(session, node)
    clues = list(node.clues)
    if insight and insight not in clues:
        clues = clues + [insight]

    return {
        "node_id": node.node_id,
        "title": node.title,
        "description": _distort_text(node.description, session.player_state.visible_stats.san, session.player_state.visible_stats.cor),
        "visible_objects": list(node.visible_objects),
        "clues": clues,
        "insight": insight,
        "ai_hint": _scene_ai_hint(session, run, node),
        "suggested_actions": _scene_choice_payload(session, run, config, node),
        "inventory_usable": [item.model_dump(mode="json") for item in session.player_state.inventory if item.usable_in_dungeon],
    }


def _session_snapshot(session: GameSession) -> dict[str, Any]:
    return {
        "session_id": session.session_id,
        "player": _player_public_payload(session.player_state),
        "completed_dungeons": list(session.completed_dungeons),
        "last_settlement": session.last_settlement.model_dump(mode="json") if session.last_settlement else None,
        "active_run": _run_snapshot(session.current_run) if session.current_run else None,
        "flags": dict(session.flags),
        "updated_at": session.updated_at,
    }


def _threat_breakdown(session: GameSession, multiplier: float, config: DungeonConfig) -> dict[str, float]:
    player = session.player_state
    stats = _effective_visible_stats(player)
    psych = player.psych_state
    return {
        "combat_pressure": round((stats["atk"] + stats["defense"] + stats["res"]) * multiplier * 0.55, 2),
        "rule_pressure": round((stats["cog"] + player.understanding * 0.08) * multiplier * 0.7, 2),
        "environment_pressure": round((100 - stats["sta"] + player.world_state.hostile) * 0.55, 2),
        "mislead_pressure": round((100 - psych.suspicion + psych.dependency) * 0.45, 2),
        "pursuit_pressure": round((100 - stats["spd"] + player.world_state.aggro) * 0.38 + (6 if config.black_zone else 0), 2),
    }


def classify_intent(session: GameSession, text: str) -> dict[str, Any]:
    normalized = text.strip().lower()
    player = session.player_state
    parse_bias = understanding_parse_bias(player)
    intent = "observe"

    if any(token in text for token in ("前往", "去", "进入", "走到", "move", "go ")):
        intent = "move_to_area"
    elif any(token in text for token in ("查看背包", "打开背包", "检查背包", "看包", "查看包")):
        intent = "inspect_inventory"
    elif any(token in text for token in ("验证", "核对", "确认规则", "确认门牌", "对照", "verify")):
        intent = "verify_rule"
    elif any(token in text for token in ("询问", "问", "ask", "交谈", "搭话")):
        intent = "ask_question"
    elif any(token in text for token in ("使用", "拿出", "戴上", "use")):
        intent = "use_item"
    elif any(token in text for token in ("躲", "藏", "hide")):
        intent = "hide"
    elif any(token in text for token in ("等待", "停一会", "等一分钟", "wait")):
        intent = "wait"
    elif any(token in text for token in ("攻击", "战斗", "fight")):
        intent = "fight"
    elif any(token in text for token in ("逃", "撤", "flee", "run")):
        intent = "flee"
    elif any(token in text for token in ("试探", "边界", "probe", "test")):
        intent = "test_boundary"
    elif any(token in text for token in ("回应", "回答", "应声", "respond")):
        intent = "respond_voice"
    elif any(token in text for token in ("查看", "检查", "inspect", "看看")):
        intent = "inspect_object"

    if intent == "observe" and parse_bias >= 0.1 and any(token in text for token in ("广播", "值班表", "门牌", "冲突", "记录", "规则")):
        intent = "verify_rule"
    elif intent == "observe" and parse_bias < 0.06 and any(token in text for token in ("救命", "有人吗", "回应", "开门")):
        intent = "respond_voice"

    target = ""
    trust_target = "none"
    item_target = resolve_item_id(text)
    risk_tendency = 0.25
    cautious_level = 0.65

    if session.current_run:
        _, config, node, _, _ = _get_current_context(session)
        target = _match_move_target(node, text) or ""
        if not target:
            interaction = _match_interaction(node, text)
            target = interaction.interaction_id if interaction else ""
        if not target and item_target:
            target = item_target
        for npc in config.npcs:
            if npc.display_name in text:
                trust_target = npc.npc_id

    if any(token in normalized for token in ("直接", "马上", "立刻", "冲", "硬")):
        risk_tendency = 0.82
        cautious_level = 0.22
    elif any(token in normalized for token in ("先", "小心", "确认", "观察")):
        risk_tendency = 0.25
        cautious_level = 0.82 + min(0.1, parse_bias)
    elif intent in {"fight", "flee", "test_boundary"}:
        risk_tendency = 0.72
        cautious_level = 0.32

    return {
        "primary_intent": target or intent,
        "secondary_intent": intent,
        "target": target or item_target,
        "risk_tendency": round(risk_tendency, 2),
        "cautious_level": round(cautious_level, 2),
        "trust_target": trust_target,
        "raw_input": text,
    }


def _player_power(session: GameSession) -> float:
    stats = _effective_visible_stats(session.player_state)
    psych = session.player_state.psych_state
    player = session.player_state
    base = stats["atk"] + stats["defense"] + stats["spd"] + stats["acc"] + stats["res"] + stats["cog"]
    state_coeff = 0.55 + (stats["hp"] / 100) * 0.2 + (stats["san"] / 100) * 0.15 + (stats["sta"] / 100) * 0.1
    psych_coeff = 1.0 - psych.fear / 400 + psych.willpower / 320 + psych.suspicion / 500 - psych.dependency / 600
    inventory_bonus = 1.0 + min(len(player.inventory), 4) * 0.03
    understanding_bonus = 1.0 + min(0.16, player.understanding / 1200)
    return base * state_coeff * psych_coeff * inventory_bonus * understanding_bonus


def _matching_multiplier(session: GameSession, dungeon_id: str) -> float:
    early_game = len(session.completed_dungeons) < 1
    low, high = (0.88, 1.05) if early_game else (0.92, 1.08)
    seed = f"{session.session_id}:{dungeon_id}:{len(session.run_history)}"
    rng = Random(seed)
    return round(rng.uniform(low, high), 3)


def _bootstrap_player(player_name: str) -> PlayerState:
    player = PlayerState(player_name=player_name or FALLBACK_PLAYER_NAME, inventory=starting_inventory())
    sync_player_understanding(player)
    player.obtained_items = [item.item_id for item in player.inventory]
    return player


def start_session(player_name: str) -> GameSession:
    session = GameSession(player_state=_bootstrap_player(player_name))
    session.flags["hall_safe"] = False
    save_session(session)
    return session


def get_session(session_id: str) -> GameSession:
    session = load_session(session_id)
    sync_player_understanding(session.player_state)
    return session


def hall_view(session_id: str) -> dict[str, Any]:
    session = get_session(session_id)
    black_zone_unlocked = "black_zone_access" in session.player_state.hall_permissions
    modules = []
    for module in HALL_MODULES:
        item = dict(module)
        if item["module_id"] == "black_zone":
            item["locked"] = not black_zone_unlocked
            item["status"] = "已准入" if black_zone_unlocked else "仍锁定"
        else:
            item["locked"] = False
            item["status"] = "开放"
        modules.append(item)
    return {
        "session": _session_snapshot(session),
        "hall": {
            "modules": modules,
            "narrative": "大厅从不真正安全。管理员只是比怪谈更擅长把不安全整理得像秩序。",
            "available_dungeons": _list_dungeon_cards(session),
            "admin_hint": "别急着把每条线索都当真。大厅奖励的从来不是幸运，而是能把错误带回来的脑子。",
            "archive_count": len(session.player_state.discovered_rules) + len(session.player_state.monster_archive) + len(session.player_state.unlocked_archives),
            "recent_rewards": [reward.model_dump(mode="json") for reward in session.player_state.recent_rewards],
            "understanding": understanding_snapshot(session.player_state),
            "contamination": session.player_state.visible_stats.cor,
        },
    }


def visit_hall_module(session_id: str, module_id: str) -> dict[str, Any]:
    session = get_session(session_id)
    player = session.player_state
    narrative = {
        "task_wall": "任务墙上的纸条总比你刚完成的副本多一张，像大厅总比你先一步知道哪里会出事。",
        "archives": "档案室的抽屉夹着你自己写过却不记得的笔迹，像有人替你预留了未来的备注。",
        "backpack": f"你翻开背包。里面现在有 {len(player.inventory)} 件物品：{_inventory_names(player)}。",
        "shop": "商店只收能活着回来的人。货架上最贵的从来不是药，而是被允许知道的东西。",
        "rest_area": "休息区的热水永远烫不到舌头，像温度本身也被某条大厅规则限制住了。",
        "settlement_desk": "结算台不只写你有没有活着回来，它更在意你是怎么判断的。",
        "black_zone": "黑区入口后面没有灯，但你能听见镜面彼此轻碰的响动。",
    }.get(module_id, "大厅没有回应你的访问。")

    if module_id == "rest_area":
        player.visible_stats.san = clamp(player.visible_stats.san + 8)
        player.visible_stats.sta = clamp(player.visible_stats.sta + 10)
        player.psych_state.fear = clamp(player.psych_state.fear - 6)
        if player.understanding >= 150:
            narrative += " 管理员在你离开前提醒了一句：别把通关和理解混为一谈。"
    elif module_id == "shop":
        if not has_item(player, "spare_battery"):
            add_item(player, "spare_battery")
            narrative += " 你用结算印记换到了一节备用电池。"
        else:
            add_item(player, "record_clip_page")
            narrative += " 货架深处滑出了一页记录夹页。"
    elif module_id == "black_zone" and "black_zone_access" not in player.hall_permissions:
        return {
            "session": _session_snapshot(session),
            "visit": {"module_id": module_id, "allowed": False, "narrative": "黑区入口像一堵还没承认你的墙。"},
        }

    save_session(session)
    return {"session": _session_snapshot(session), "visit": {"module_id": module_id, "allowed": True, "narrative": narrative}}


def dungeon_catalog(session_id: str) -> dict[str, Any]:
    session = get_session(session_id)
    return {"session": _session_snapshot(session), "dungeons": _list_dungeon_cards(session)}


def enter_dungeon(session_id: str, dungeon_id: str) -> dict[str, Any]:
    session = get_session(session_id)
    config = get_dungeon_config(dungeon_id)
    if config.black_zone and "black_zone_access" not in session.player_state.hall_permissions:
        raise ValueError("黑区入口尚未解锁。")

    multiplier = _matching_multiplier(session, dungeon_id)
    threat_value = round(_player_power(session) * multiplier, 2)
    run = RunState(
        dungeon_id=dungeon_id,
        dungeon_title=config.title,
        threat_value=threat_value,
        matching_multiplier=multiplier,
        current_node_id=config.entry_node_id,
        flags={
            "entered_from_hall": True,
            "threat_breakdown": _threat_breakdown(session, multiplier, config),
            "flashlight_ready": False,
            "mirror_shard_ready": False,
            "record_overlay_ready": False,
        },
    )
    session.current_run = run
    session.last_action_text = None
    session.last_action_result = None
    session.player_state.world_state.drift = clamp(session.player_state.world_state.drift + (10 if config.black_zone else 4))
    session.player_state.world_state.hostile = clamp(session.player_state.world_state.hostile + 6)
    session.player_state.world_state.aggro = clamp(session.player_state.world_state.aggro + passive_modifier_total(session.player_state, "aggro"))
    if has_item(session.player_state, "paper_badge"):
        session.player_state.world_state.aggro = clamp(session.player_state.world_state.aggro - 4)
    save_session(session)
    _, _, node, _, _ = _get_current_context(session)
    return {
        "session": _session_snapshot(session),
        "run": _run_snapshot(run),
        "scene": _scene_payload(session, run, config, node),
    }


def _action_response(session: GameSession, node: SceneNode, config: DungeonConfig, classification: dict[str, Any], narrative: str, *, illegal: bool = False) -> dict[str, Any]:
    run = session.current_run
    response = {
        "session": _session_snapshot(session),
        "run": _run_snapshot(run),
        "scene": _scene_payload(session, run, config, node) if run else None,
        "classification": classification,
        "narrative": _distort_text(narrative, session.player_state.visible_stats.san, session.player_state.visible_stats.cor),
        "combat": run.combat.model_dump(mode="json") if run else {},
        "illegal_action": illegal,
        "settlement_ready": bool(run and run.status in {"settlement_ready", "completed", "failed"}),
        "rules": [rule.model_dump(mode="json") for rule in session.player_state.discovered_rules],
        "inventory": _inventory_payload(session.player_state),
        "understanding": understanding_snapshot(session.player_state),
    }
    session.last_action_result = response
    return response


def active_run_view(session_id: str) -> dict[str, Any]:
    session = get_session(session_id)
    run, config, node, _, _ = _get_current_context(session)
    return {
        "session": _session_snapshot(session),
        "run": _run_snapshot(run),
        "scene": _scene_payload(session, run, config, node),
        "settlement_ready": run.status in {"settlement_ready", "completed", "failed"},
        "settlement": run.settlement_report.model_dump(mode="json") if run.settlement_report else None,
    }


def _enter_combat(run: RunState, monster_id: str, monster_index: dict[str, Any], *, weakness_known: bool = False) -> None:
    monster = monster_index[monster_id]
    run.combat = EncounterState(
        active=True,
        monster_id=monster.monster_id,
        monster_name=monster.name,
        reason=monster.trigger_condition,
        weakness_known=weakness_known,
    )
    run.status = "combat"
    if monster.monster_type == "hunter":
        run.flags["pursuit_started"] = True


def _hidden_route_check(session: GameSession, run: RunState, config: DungeonConfig) -> bool:
    player = session.player_state
    if run.dungeon_id == "hospital_night_shift":
        return config.success_rule_id in run.verified_rule_ids and "h_rule_mask" in run.discovered_rule_ids and config.failure_rule_id not in run.false_rule_hits
    if run.dungeon_id == "apartment_night_return":
        return config.success_rule_id in run.verified_rule_ids and "a_rule_nameplate" in run.discovered_rule_ids and config.failure_rule_id not in run.false_rule_hits
    if run.dungeon_id == "black_zone_mirror_records":
        return config.success_rule_id in run.verified_rule_ids and "b_rule_reverse_reading" in run.discovered_rule_ids and player.understanding >= 150
    return False


def _apply_node_understanding(session: GameSession, run: RunState, node: SceneNode, intent: str) -> None:
    reward = node.understanding_rewards.get(intent, 0)
    if reward:
        apply_understanding_delta(session.player_state, run, reward, f"在 {node.title} 通过 {intent} 看出更多层。")


def _resolve_item_use(session: GameSession, run: RunState, node: SceneNode, text: str) -> tuple[str, bool]:
    player = session.player_state
    item = get_item(player, text)
    if item is None:
        return "你现在没有能与场景产生有效联动的物品。", True
    if not item.usable_in_dungeon:
        return f"{item.name} 更适合留在大厅或作为被动持有物，不适合在这里直接使用。", True

    run.used_item_ids.append(item.item_id)
    narrative = f"你使用了 {item.name}。"

    if item.item_id == "tranquilizer_ampoule":
        _apply_delta(session, "fear", -12)
        _apply_delta(session, "san", 4)
        narrative = "镇静针剂让你的呼吸重新慢下来，至少这一刻，你没有被场景抢走判断节奏。"
    elif item.item_id == "white_noise_earplug":
        run.flags["audio_guard"] = True
        _apply_delta(session, "fear", -4)
        _apply_delta(session, "aggro", -4)
        narrative = "白噪耳塞压住了广播和求救声的尖锐部分，声音暂时没那么容易越过你的判断。"
    elif item.item_id == "half_broken_flashlight":
        run.flags["flashlight_ready"] = True
        apply_understanding_delta(player, run, 2, "你借着半损手电确认了场景边缘的细节。")
        narrative = "半损手电把门牌和玻璃边缘照得发白，像替你撬开了本来会被忽略的那一层。"
    elif item.item_id == "old_duty_key":
        run.flags["service_key_ready"] = True
        _apply_delta(session, "hostile", -4)
        narrative = "旧值班钥匙让某些门锁对你犹豫了一瞬，足够你抢回一次主动。"
    elif item.item_id == "record_clip_page":
        run.flags["record_overlay_ready"] = True
        apply_understanding_delta(player, run, 4, "你用记录夹页把冲突信息补成了可回看的对照。")
        narrative = "记录夹页把零散线索压成了同一页，你终于能把互相打架的说法并排看。"
    elif item.item_id == "mirror_shard":
        run.flags["mirror_shard_ready"] = True
        _apply_delta(session, "cor", 4)
        apply_understanding_delta(player, run, 3, "你借镜面碎片确认了异常延迟。")
        narrative = "镜面碎片照出了慢半拍的影子，但它也顺手把一点污染留回了你身上。"
    elif item.item_id == "paper_badge":
        run.flags["paper_badge_shown"] = True
        _apply_delta(session, "aggro", -3)
        narrative = "纸质工牌在昏光里像真的，至少足够让伪装型怪物先多看你一秒。"
    elif item.item_id == "spare_battery":
        if has_item(player, "half_broken_flashlight"):
            run.flags["flashlight_ready"] = True
            run.flags["flashlight_boost"] = True
            apply_understanding_delta(player, run, 2, "备用电池让你的照明短暂可靠起来。")
            narrative = "备用电池把半损手电撑稳了一会儿，场景边缘的错位也因此更难藏住。"
        else:
            narrative = "你握着备用电池，却发现眼下没有值得它立刻接上的设备。"
            return narrative, True
    elif item.item_id == "faded_charm":
        run.flags["charm_ward"] = True
        _apply_delta(session, "fear", -2)
        narrative = "褪色护符压住了一点污染带来的刺痛，但也让你的思路短暂变钝。"
    elif item.item_id == "nameless_note":
        if player.understanding >= 150:
            apply_understanding_delta(player, run, 3, "你没有被无名便签带着跑，反而从它身上看出了不自然之处。")
            narrative = "无名便签没有直接给你答案，但它露出的删改痕迹足够说明谁在故意拼接错误规则。"
        else:
            _apply_delta(session, "fear", 3)
            narrative = "你盯着无名便签看了太久，它没有给出真相，只让你更犹豫哪一句才像真的。"
    else:
        narrative = f"{item.name} 现在没有和场景形成有效联动。"
        return narrative, True

    if item.consume_on_use:
        consume_item(player, item.item_id)
    return narrative, False


def interpret_action(session_id: str, text: str) -> dict[str, Any]:
    session = get_session(session_id)
    run, config, node, rule_index, monster_index = _get_current_context(session)
    classification = classify_intent(session, text)

    if (
        session.last_action_text == text
        and bool(session.last_action_result)
        and str(session.flags.get("last_action_node") or "") == node.node_id
        and not run.combat.active
    ):
        replay = dict(session.last_action_result)
        replay["idempotent_replay"] = True
        return replay

    run.step_count += 1
    run.choice_log.append(text)
    session.last_action_text = text
    session.flags["last_action_node"] = node.node_id

    narrative = "你暂时没有从这一步得到新的信息。"
    illegal = False
    intent = classification["secondary_intent"]

    if intent == "observe":
        for rule_id in node.discoverable_rules:
            _upsert_rule(session, run, config, rule_id)
        detail = "；".join(node.clues) if node.clues else "暂无更多可疑细节。"
        insight = _scene_insight(session, node)
        if insight:
            detail = f"{detail}；{insight}"
        narrative = f"你观察了 {node.title}。{node.description} 线索包括：{detail}"
        _record_behavior(session, "试探型")
        _apply_delta(session, "suspicion", 2)
        _apply_node_understanding(session, run, node, "observe")

    elif intent == "inspect_object":
        interaction = _match_interaction(node, text)
        if interaction is None:
            illegal = True
            narrative = "这里没有与你描述相符的可检查对象。"
        else:
            if interaction.requires_item_tags and not any(has_tag(session.player_state, tag) for tag in interaction.requires_item_tags):
                illegal = True
                narrative = "你知道该看哪里，但还缺少能把这层信息掀开的工具。"
            else:
                for rule_id in interaction.discover_rules:
                    _upsert_rule(session, run, config, rule_id)
                _remember_notebook(session, interaction.notebook_entry)
                for key, delta in interaction.status_effects.items():
                    _apply_delta(session, key, delta)
                for key, value in interaction.flag_updates.items():
                    run.flags[key] = value
                for item_id in interaction.grants_items:
                    add_item(session.player_state, item_id)
                narrative = interaction.response
                if run.flags.get("flashlight_ready") and any(token in interaction.interaction_id for token in ("window", "notice", "nameplate", "logbook")):
                    narrative += " 半损手电让你更清楚地看见了边角的错位痕迹。"
                    apply_understanding_delta(session.player_state, run, 2, f"你借着道具补看了 {interaction.interaction_id} 的异常边角。")
                if interaction.trust_target:
                    run.npc_trust[interaction.trust_target] = round(run.npc_trust.get(interaction.trust_target, 0.3) + interaction.trust_delta, 2)
                if interaction.understanding_delta:
                    apply_understanding_delta(session.player_state, run, interaction.understanding_delta, f"你从 {interaction.interaction_id} 提取到了更接近规则本质的信息。")
                _record_behavior(session, "试探型")
                _apply_node_understanding(session, run, node, "inspect_object")

    elif intent == "inspect_inventory":
        if session.player_state.inventory:
            narrative = f"你在 {node.title} 快速翻看背包：{_inventory_names(session.player_state)}。至少现在，你还没把这些保命物件弄丢。"
        else:
            narrative = "你摸了一遍背包，里面已经空了。接下来的每一步都得更谨慎。"

    elif intent == "move_to_area":
        target = _match_move_target(node, text)
        if target is None:
            illegal = True
            narrative = "你找不到这条路，像有某部分走廊被规则临时折叠了。"
        else:
            node_index, _, _ = _config_indexes(config)
            target_node = node_index[target]
            missing_items = [item_id for item_id in target_node.blocked_without_items if not has_item(session.player_state, item_id)]
            if missing_items:
                illegal = True
                narrative = "你知道出口方向，但眼下还缺少某个能让门、锁或编号服从的东西。"
            else:
                run.current_node_id = target_node.node_id
                run.events.append(target_node.node_id)
                narrative = f"你从 {node.title} 移动到了 {target_node.title}。{target_node.description}"
                if target_node.encounter_monster_id:
                    monster = monster_index[target_node.encounter_monster_id]
                    weakness_known = monster.weakness_rule_id in run.verified_rule_ids or session.player_state.understanding >= 220
                    _enter_combat(run, target_node.encounter_monster_id, monster_index, weakness_known=weakness_known)
                    session.player_state.world_state.aggro = clamp(session.player_state.world_state.aggro + 10)
                    if has_item(session.player_state, "paper_badge") and monster.monster_type in {"judge", "lure"}:
                        session.player_state.world_state.aggro = clamp(session.player_state.world_state.aggro - 4)
                        narrative += f" {monster.name} 在纸质工牌前明显迟疑了一瞬。"
                    narrative += f" 你刚站稳，{run.combat.monster_name} 就从规则缝隙里逼近了。"
                elif target_node.is_exit:
                    run.status = "settlement_ready"
                    run.hidden_route_triggered = _hidden_route_check(session, run, config)
                    if config.failure_rule_id and config.failure_rule_id in run.false_rule_hits:
                        run.outcome = "wrong_clear"
                    elif run.hidden_route_triggered:
                        run.outcome = "perfect_clear"
                    else:
                        run.outcome = "normal_clear"
                _record_behavior(session, "规避型")
                node = target_node
                _apply_node_understanding(session, run, target_node, "move_to_area")

    elif intent == "verify_rule":
        discovered_rules = session.player_state.discovered_rules
        matched_rule = _match_rule_from_text(text, discovered_rules)
        if matched_rule is None:
            matched_rule = _match_rule_from_text(text, [rule_index[rule_id] for rule_id in node.discoverable_rules if rule_id in rule_index])

        if matched_rule is None:
            illegal = True
            narrative = "你试图验证一条尚未成形的规则，但线索还不够。"
        else:
            verified = _upsert_rule(session, run, config, matched_rule.rule_id, verify=True)
            if verified and verified.rule_type == "false":
                if verified.rule_id not in run.false_rule_hits:
                    run.false_rule_hits.append(verified.rule_id)
                _apply_delta(session, "cor", 8)
                _apply_delta(session, "fear", 6)
                _apply_delta(session, "aggro", 8)
                apply_understanding_delta(session.player_state, run, -2, "你把伪规则当成了可执行规则。")
                narrative = f"你验证了伪规则“{verified.text}”，场景立刻把这次误判记在了你身上。"
            else:
                _apply_delta(session, "cog", 2)
                _apply_delta(session, "san", -2 if config.black_zone else 0)
                bonus = 4 if verified and verified.rule_id == config.success_rule_id else 2
                apply_understanding_delta(session.player_state, run, bonus, f"你确认了规则“{verified.text if verified else matched_rule.text}”。")
                narrative = f"你确认了规则：{verified.text if verified else matched_rule.text}"
                if run.combat.active:
                    run.combat.weakness_known = True
            _record_behavior(session, "试探型")
            _apply_node_understanding(session, run, node, "verify_rule")

    elif intent == "ask_question":
        if config.npcs:
            npc = config.npcs[0]
            trust = run.npc_trust.get(npc.npc_id, 0.35)
            line = npc.key_lines[0] if trust < 0.5 else npc.key_lines[-1]
            if session.player_state.understanding >= 150 and npc.true_identity and npc.facade_identity != npc.true_identity:
                line += " 你几乎能听出这句话里有不属于活人的停顿。"
            narrative = f"{npc.display_name} 低声说：{line}"
            run.npc_trust[npc.npc_id] = round(min(npc.trust_ceiling, trust + 0.08), 2)
            _record_behavior(session, "救援型")
        else:
            illegal = True
            narrative = "这里没有会回应你的对象。"

    elif intent == "respond_voice":
        _apply_delta(session, "dependency", 6)
        _apply_delta(session, "aggro", 5)
        apply_understanding_delta(session.player_state, run, -2, "你过早回应了声音诱导。")
        narrative = "你做出了回应，周围的声音像因此确认了你的位置。"
        _record_behavior(session, "救援型")

    elif intent == "hide":
        _apply_delta(session, "sta", -6)
        _apply_delta(session, "hostile", -3)
        narrative = "你暂时隐蔽下来，场景的敌意略微回落，但体力也被扯走了一截。"
        _record_behavior(session, "规避型")

    elif intent == "wait":
        _apply_delta(session, "sta", 3)
        _apply_delta(session, "fear", 2)
        narrative = "你选择等待，时间没有站在你这边，但你至少捕捉到了环境节奏。"
        _record_behavior(session, "规避型")

    elif intent == "use_item":
        item_narrative, item_illegal = _resolve_item_use(session, run, node, text)
        narrative = item_narrative
        illegal = item_illegal

    elif intent == "fight":
        if run.combat.active:
            return resolve_combat(session_id, CombatActionRequest(action="fight").action)
        _apply_delta(session, "impulse", 5)
        _apply_delta(session, "aggro", 8)
        apply_understanding_delta(session.player_state, run, -1, "你在还没识别代价时先摆出了正面对抗姿态。")
        narrative = "你抢先摆出了战斗姿态，但真正的敌意还没有完全显形。"
        _record_behavior(session, "强攻型")

    elif intent == "flee":
        if run.combat.active:
            return resolve_combat(session_id, CombatActionRequest(action="flee").action)
        _apply_delta(session, "sta", -10)
        narrative = "你试图提前撤离，却发现出口的距离像被场景重新丈量过。"
        _record_behavior(session, "规避型")

    elif intent == "test_boundary":
        _apply_delta(session, "cor", 4)
        _apply_delta(session, "obsession", 6)
        apply_understanding_delta(session.player_state, run, 2, "你主动测试了边界并记住了场景如何反咬。")
        narrative = "你主动试探了边界，场景没有立刻惩罚你，但它显然记住了你。"
        _record_behavior(session, "执念型")

    if run.status == "active" and node.is_exit and not run.combat.active:
        run.status = "settlement_ready"
        run.hidden_route_triggered = _hidden_route_check(session, run, config)
        run.outcome = run.outcome or ("perfect_clear" if run.hidden_route_triggered else "normal_clear")

    response = _action_response(session, node, config, classification, narrative, illegal=illegal)
    save_session(session)
    return response


def _effective_combat_value(session: GameSession, run: RunState, monster: Any) -> tuple[float, float]:
    player = session.player_state
    stats = _effective_visible_stats(player)
    psych = player.psych_state
    world = player.world_state
    base = stats["atk"] + stats["defense"] + stats["spd"] + stats["acc"] + stats["res"] + stats["cog"]
    psych_coeff = 1.0
    psych_coeff -= psych.fear / 300
    psych_coeff += psych.willpower / 350
    psych_coeff += psych.suspicion / 450 if monster.monster_type in {"lure", "parasite", "judge"} else 0.0
    psych_coeff -= psych.dependency / 500 if "dependency" in monster.psych_hooks else 0.0
    if stats["hp"] <= 35:
        psych_coeff += psych.willpower / 300

    state_coeff = 0.5 + stats["hp"] / 250 + stats["san"] / 300 + stats["sta"] / 400
    scene_coeff = 1.0 - world.hostile / 240 - world.aggro / 320 + world.drift / 500
    understanding_coeff = 1.0 + min(0.22, player.understanding / 1400)

    monster_threat = monster.threat * run.matching_multiplier * (1.0 + stats["cor"] / 220 + world.aggro / 220)
    if has_item(player, "paper_badge") and monster.monster_type in {"judge", "lure"}:
        monster_threat *= 0.92
    if player.understanding >= 150 and monster.monster_type in {"judge", "lure", "parasite"}:
        monster_threat *= 0.94
    if run.flags.get("mirror_shard_ready") and monster.monster_type in {"parasite", "judge"}:
        monster_threat *= 0.9

    return base * psych_coeff * state_coeff * scene_coeff * understanding_coeff, monster_threat


def _record_monster_archive(session: GameSession, run: RunState, config: DungeonConfig, monster_id: str) -> None:
    _, rule_index, monster_index = _config_indexes(config)
    monster = monster_index[monster_id]
    if any(item.get("monster_id") == monster_id for item in session.player_state.monster_archive):
        return
    session.player_state.monster_archive.append(
        {
            "monster_id": monster.monster_id,
            "name": monster.name,
            "type": monster.monster_type,
            "weakness_rule_id": monster.weakness_rule_id,
            "weakness_rule_text": rule_index[monster.weakness_rule_id].text if monster.weakness_rule_id in rule_index else "",
            "archive_hint": monster.archive_hint,
            "special_mechanic": monster.special_mechanic,
        }
    )


def resolve_combat(session_id: str, action: str) -> dict[str, Any]:
    session = get_session(session_id)
    run, config, _, rule_index, monster_index = _get_current_context(session)
    if not run.combat.active or not run.combat.monster_id:
        raise ValueError("当前没有可结算的战斗。")

    monster = monster_index[run.combat.monster_id]
    effective_power, monster_threat = _effective_combat_value(session, run, monster)
    weakness_known = run.combat.weakness_known or monster.weakness_rule_id in run.verified_rule_ids
    outcome = "stalled"
    narrative = f"{monster.name} 正在逼近。"

    if action == "probe":
        run.combat.weakness_known = True
        _upsert_rule(session, run, config, monster.weakness_rule_id, verify=True)
        _apply_delta(session, "san", -4)
        _apply_delta(session, "fear", 3)
        apply_understanding_delta(session.player_state, run, 3, f"你在与 {monster.name} 的交锋里先确认了它真正会退让的规则。")
        narrative = f"你先试探了 {monster.name} 的反应，它确实会被对应规则压制。"
        outcome = "probe_success"
        _record_behavior(session, "试探型")

    elif action == "exploit_rule":
        _record_behavior(session, "试探型")
        if weakness_known:
            effective_power *= 1.55
            _apply_delta(session, "san", -3)
            apply_understanding_delta(session.player_state, run, 4, f"你在正面冲突中优先利用了 {monster.name} 的规则弱点。")
            narrative = f"你利用“{rule_index[monster.weakness_rule_id].text}”压制了 {monster.name}，它的形体明显松散了。"
            outcome = "rule_break"
        else:
            effective_power *= 0.68
            _apply_delta(session, "hp", -16)
            _apply_delta(session, "san", -9)
            _apply_delta(session, "cor", 8)
            apply_understanding_delta(session.player_state, run, -2, "你在没确认规则前就强行借题发挥。")
            narrative = f"你想强行利用一条尚未确认的规则，结果 {monster.name} 先一步利用了你的迟疑。"
            outcome = "rule_fail"

    elif action == "flee":
        _record_behavior(session, "规避型")
        escape_score = _effective_visible_stats(session.player_state)["spd"] + session.player_state.psych_state.willpower * 0.4 - monster_threat * 0.35
        if weakness_known:
            escape_score += 12
        if session.player_state.understanding >= 150:
            escape_score += 6
        if escape_score >= 10:
            _apply_delta(session, "sta", -10)
            narrative = f"你抓住规则制造的空档甩开了 {monster.name}。"
            outcome = "escaped"
        else:
            _apply_delta(session, "hp", -12)
            _apply_delta(session, "sta", -16)
            _apply_delta(session, "fear", 8)
            narrative = f"你没能完全摆脱 {monster.name}，它在你离开前仍留下了代价。"
            outcome = "escape_wounded"

    elif action == "avoid":
        _record_behavior(session, "规避型")
        effective_power *= 0.92 + (0.12 if weakness_known else 0.0)
        _apply_delta(session, "sta", -8)
        _apply_delta(session, "san", -3)
        narrative = f"你没有正面接战，而是沿着场景允许的缝隙避开了 {monster.name}。"
        outcome = "avoided"

    else:
        _record_behavior(session, "强攻型")
        effective_power *= 1.08 if weakness_known else 0.95
        _apply_delta(session, "hp", -8)
        _apply_delta(session, "san", -5)
        _apply_delta(session, "fear", 5)
        apply_understanding_delta(session.player_state, run, -1, "你把正面硬拼当成了更优先的解法。")
        narrative = f"你与 {monster.name} 正面碰撞，硬挤着争出一条路。"
        outcome = "direct_fight"

    margin = effective_power - monster_threat
    if outcome in {"probe_success"}:
        combat_success = False
    elif outcome in {"escaped", "avoided"}:
        combat_success = True
    else:
        combat_success = margin >= 0

    if combat_success:
        if outcome in {"escaped", "avoided"}:
            run.outcome = "normal_clear"
        elif action == "exploit_rule" and weakness_known:
            run.hidden_route_triggered = True
            run.outcome = "perfect_clear" if session.player_state.visible_stats.cor < 35 else "corrupted_clear"
        elif action == "fight":
            run.outcome = "violent_clear"
        else:
            run.outcome = "normal_clear"
        run.status = "settlement_ready"
        run.combat.active = False
        _record_monster_archive(session, run, config, monster.monster_id)
        narrative += " 你成功越过了它留下的最后一道检查。"
    else:
        if session.player_state.visible_stats.hp <= 0 or session.player_state.visible_stats.san <= 0:
            run.status = "failed"
            run.outcome = "failed"
            run.combat.active = False
            narrative += " 你的状态先一步崩了，副本开始把你当作失败样本处理。"
        else:
            run.status = "combat"
            narrative += " 它仍然没有放你离开。"

    save_session(session)
    return {
        "session": _session_snapshot(session),
        "run": _run_snapshot(run),
        "combat_result": {
            "action": action,
            "outcome": outcome,
            "combat_success": combat_success,
            "effective_power": round(effective_power, 2),
            "monster_threat": round(monster_threat, 2),
            "margin": round(margin, 2),
            "weakness_known": weakness_known or run.combat.weakness_known,
            "narrative": _distort_text(narrative, session.player_state.visible_stats.san, session.player_state.visible_stats.cor),
        },
        "settlement_ready": run.status in {"settlement_ready", "completed", "failed"},
    }


def _best_behavior_tag(profile: dict[str, int]) -> str:
    return max(profile.items(), key=lambda item: item[1])[0] if profile else "规避型"


def _unlock_progression(session: GameSession) -> list[str]:
    unlocked: list[str] = []
    player = session.player_state
    if len(session.completed_dungeons) >= 1 and "archives_plus" not in player.hall_permissions:
        player.hall_permissions.append("archives_plus")
        unlocked.append("档案室二级检索")
    if (
        {"hospital_night_shift", "apartment_night_return"}.issubset(set(session.completed_dungeons))
        and "black_zone_access" not in player.hall_permissions
    ):
        player.hall_permissions.append("black_zone_access")
        unlocked.append("黑区入口")
    if player.understanding >= 150 and "insight_board" not in player.hall_permissions:
        player.hall_permissions.append("insight_board")
        unlocked.append("洞察备忘层")
    return unlocked


def finalize_settlement(session_id: str) -> dict[str, Any]:
    session = get_session(session_id)
    run, config, _, _, _ = _get_current_context(session)
    if run.settlement_report is not None:
        return {"session": _session_snapshot(session), "settlement": run.settlement_report.model_dump(mode="json")}
    if run.status not in {"settlement_ready", "completed", "failed"}:
        raise ValueError("当前副本尚未到达可结算节点。")

    player = session.player_state
    stats = _effective_visible_stats(player)
    rules_found = len(run.discovered_rule_ids)
    verified_rules = len(run.verified_rule_ids)
    false_rule_trapped = float(1 if config.failure_rule_id and config.failure_rule_id in run.false_rule_hits else 0)
    false_rule_discerned = float(1 if config.failure_rule_id and config.failure_rule_id in run.discovered_rule_ids and config.failure_rule_id not in run.false_rule_hits else 0)
    combat_penalty = 16 if "强攻型" == _best_behavior_tag(player.behavior_profile) and run.outcome == "violent_clear" else 0
    survival_score = max(0.0, stats["hp"] - (20 if run.outcome == "failed" else 0))
    mental_score = max(0.0, stats["san"] - stats["cor"] * 0.35 - player.psych_state.fear * 0.2)
    rules_score = min(100.0, 36 + rules_found * 10 + verified_rules * 15 + false_rule_discerned * 10 - false_rule_trapped * 12)
    combat_score = max(0.0, 84 - combat_penalty - (18 if run.outcome == "failed" else 0) + (10 if run.outcome == "perfect_clear" else 0))
    choice_score = max(0.0, 60 + (12 if "试探型" == _best_behavior_tag(player.behavior_profile) else 0) + (8 if run.hidden_route_triggered else 0) - false_rule_trapped * 10)
    understanding_score = min(
        100.0,
        max(
            0.0,
            42
            + run.understanding_delta * 6
            + verified_rules * 6
            + false_rule_discerned * 12
            + (10 if run.hidden_route_triggered else 0)
            - false_rule_trapped * 14,
        ),
    )
    overall_score = (survival_score + mental_score + rules_score + combat_score + choice_score + understanding_score) / 6

    outcome = run.outcome or ("failed" if run.status == "failed" else "normal_clear")
    if outcome == "failed":
        summary = "你没能带着完整的自我离开副本。大厅会记住这次失败。"
    elif false_rule_trapped >= 1 and outcome not in {"corrupted_clear", "failed"}:
        outcome = "wrong_clear"
        summary = "你活着回来了，但你带回来的判断里有一部分仍然站错了边。"
    elif stats["cor"] >= 45 or outcome == "corrupted_clear":
        outcome = "corrupted_clear"
        summary = "你通关了，但污染比奖励先一步跟你回到了大厅。"
    elif config.black_zone and stats["san"] < 45 and verified_rules >= 2:
        outcome = "hidden_clear"
        summary = "你带着足够接近真相的代价离开黑区，管理员不会再把你当普通幸存者。"
    elif verified_rules >= 2 and stats["hp"] >= 70 and stats["san"] >= 65 and run.hidden_route_triggered:
        outcome = "perfect_clear"
        summary = "你不是靠硬拼，而是靠判断赢下了这次怪谈。"
    else:
        summary = "你活着回到了大厅，但大厅显然比之前更了解你。"

    grades = SettlementGrades(
        survival=_grade(survival_score),
        mental=_grade(mental_score),
        rules=_grade(rules_score),
        combat=_grade(combat_score),
        choice=_grade(choice_score),
        understanding=_grade(understanding_score),
        overall=_grade(overall_score),
    )

    metrics = {
        "survival_score": round(survival_score, 2),
        "mental_score": round(mental_score, 2),
        "rules_score": round(rules_score, 2),
        "combat_score": round(combat_score, 2),
        "choice_score": round(choice_score, 2),
        "understanding_score": round(understanding_score, 2),
        "overall_score": round(overall_score, 2),
        "rules_found": float(rules_found),
        "rules_verified": float(verified_rules),
        "false_rule_breaks": false_rule_discerned,
        "false_rule_trapped": false_rule_trapped,
        "hidden_route": float(1 if run.hidden_route_triggered else 0),
        "battle_count": float(sum(1 for action_text in run.choice_log if "攻击" in action_text or "战斗" in action_text)),
    }

    rewards = generate_reward_bundle(config, player, run, grades, metrics, outcome)
    grant_rewards(player, rewards)

    if outcome != "failed":
        if run.dungeon_id not in session.completed_dungeons:
            session.completed_dungeons.append(run.dungeon_id)
        player.visible_stats.hp = clamp(player.visible_stats.hp + 10)
        player.visible_stats.sta = clamp(player.visible_stats.sta + 12)
        player.visible_stats.san = clamp(player.visible_stats.san + 6)
    else:
        player.visible_stats.hp = clamp(max(player.visible_stats.hp, 12))
        player.visible_stats.san = clamp(max(player.visible_stats.san, 18))

    unlocked = reward_unlocks(player, rewards)
    unlocked.extend(_unlock_progression(session))
    hidden_tag = _best_behavior_tag(player.behavior_profile)

    report = SettlementReport(
        run_id=run.run_id,
        dungeon_id=run.dungeon_id,
        dungeon_title=run.dungeon_title,
        outcome=outcome,
        grades=grades,
        summary=summary,
        rewards=rewards,
        hidden_behavior_tag=hidden_tag,
        unlocked_features=unlocked,
        metrics=metrics,
        understanding_delta=run.understanding_delta,
        total_understanding=player.understanding,
        understanding_level=player.understanding_level,
    )

    run.settlement_report = report
    run.status = "completed" if outcome != "failed" else "failed"
    run.ended_at = now_iso()
    session.last_settlement = report
    if run.run_id not in session.run_history:
        session.run_history.append(run.run_id)
    save_session(session)
    return {"session": _session_snapshot(session), "settlement": report.model_dump(mode="json")}


def session_runs(session_id: str) -> dict[str, Any]:
    session = get_session(session_id)
    reports = []
    for run_id in session.run_history:
        payload = load_run_report(run_id)
        if payload:
            reports.append(payload)
    return {"session": _session_snapshot(session), "runs": reports}


def archives_view(session_id: str) -> dict[str, Any]:
    session = get_session(session_id)
    player = session.player_state
    history = []
    for run_id in session.run_history:
        payload = load_run_report(run_id)
        if payload:
            history.append(payload)

    rules_payload = []
    for rule in player.discovered_rules:
        item = rule.model_dump(mode="json")
        if player.understanding >= 150 and rule.rule_type == "false":
            item["anomaly_hint"] = "这条规则的措辞有一层故意贴上去的平滑感。"
        rules_payload.append(item)

    return {
        "session": _session_snapshot(session),
        "archives": {
            "rules": rules_payload,
            "notebook_entries": _tamper_notebook(player.notebook_entries, player.visible_stats.cor),
            "monster_archive": list(player.monster_archive),
            "run_history": history,
            "recent_rewards": [reward.model_dump(mode="json") for reward in player.recent_rewards],
            "unlocked_archives": list(player.unlocked_archives),
            "obtained_items": list(player.obtained_items),
        },
    }


def list_archived_runs(limit: int = 12) -> dict[str, Any]:
    return {"runs": list_run_reports(limit=limit)}


def get_archived_run(run_id: str) -> dict[str, Any]:
    payload = load_run_report(run_id)
    if payload is None:
        raise FileNotFoundError(run_id)
    return payload


def save_progress(session_id: str, slot_id: str) -> dict[str, Any]:
    session = get_session(session_id)
    path = save_slot(session, slot_id)
    return {"session": _session_snapshot(session), "saved": True, "slot_id": slot_id, "path": str(path)}


def load_progress(session_id: str, slot_id: str) -> dict[str, Any]:
    session = load_slot(session_id, slot_id)
    sync_player_understanding(session.player_state)
    return {"session": _session_snapshot(session), "loaded": True, "slot_id": slot_id}
