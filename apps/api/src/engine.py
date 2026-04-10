from __future__ import annotations

from datetime import datetime
from random import Random
from typing import Any
from urllib.parse import quote

from .game_content import HALL_MODULES, get_dungeon_config, list_dungeon_configs
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


VISIBLE_STAT_KEYS = {"hp", "san", "sta", "cog", "cor", "atk", "defense", "spd", "acc", "res"}
PSYCH_KEYS = {"fear", "suspicion", "dependency", "impulse", "willpower", "empathy", "obsession"}
WORLD_KEYS = {"aggro", "drift", "hostile"}


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


def _player_public_payload(player: PlayerState) -> dict[str, Any]:
    psych = player.psych_state
    return {
        "player_name": player.player_name,
        "visible_stats": player.visible_stats.model_dump(mode="json"),
        "psych_hint": {
            "fear": "高" if psych.fear >= 60 else "中" if psych.fear >= 30 else "低",
            "suspicion": "高" if psych.suspicion >= 60 else "中" if psych.suspicion >= 30 else "低",
            "dependency": "高" if psych.dependency >= 60 else "中" if psych.dependency >= 30 else "低",
            "willpower": "高" if psych.willpower >= 60 else "中" if psych.willpower >= 30 else "低",
            "obsession": "高" if psych.obsession >= 60 else "中" if psych.obsession >= 30 else "低",
        },
        "world_state": player.world_state.model_dump(mode="json"),
        "inventory": list(player.inventory),
        "behavior_profile": dict(player.behavior_profile),
        "hall_permissions": list(player.hall_permissions),
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
        "settlement_report": run.settlement_report.model_dump(mode="json") if run.settlement_report else None,
    }


def _action_label(text: str, *, move: bool = False) -> str:
    if any(text.startswith(prefix) for prefix in ("前往", "去", "回", "进入", "查看", "检查", "观察", "验证规则：")):
        return text
    return f"{'前往' if move else '查看'}{text}"


def _choice_id(kind: str, text: str) -> str:
    return f"{kind}-{quote(text, safe='')}"


def _scene_ai_hint(session: GameSession, run: RunState, node: SceneNode) -> str:
    visible = session.player_state.visible_stats
    if run.combat.active and run.combat.monster_name:
        return f"{run.combat.monster_name} 已经显形。先判断弱点是否明确，再决定规避、试探还是正面处理。"
    if run.status in {"settlement_ready", "completed", "failed"}:
        return "当前副本已经进入收束阶段，先查看结算，再决定是否回到大厅继续下一轮。"
    if visible.san < 45 or visible.cor >= 35:
        return "你的感知已经开始失真。优先做低风险观察和规则验证，不要连续冲刺到下一个节点。"
    if node.discoverable_rules:
        return "这个场景仍有规则线索可挖。先观察或检查关键物件，再根据确认过的规则继续移动。"
    if node.move_aliases:
        return "当前场景的静态线索已经不多了，可以顺着可达区域继续推进。"
    return "先稳住，再根据场景反馈做下一步选择。"


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
            "reason": "先让系统重新读取当前场景，补齐可疑线索与可发现规则。",
        }
    )
    choices.append(
        {
            "choice_id": _choice_id("inventory", "open_bag"),
            "kind": "inventory",
            "label": "查看背包",
            "action_text": "查看背包",
            "reason": "确认当前可用道具，再决定是继续推进还是先用物品应对风险。",
        }
    )

    for interaction in node.interactions:
        alias = next((item for item in interaction.aliases if any(token in item for token in ("查看", "检查", "观察", "检视"))), interaction.aliases[0] if interaction.aliases else interaction.interaction_id)
        action_text = _action_label(alias)
        choices.append(
            {
                "choice_id": _choice_id("inspect", interaction.interaction_id),
                "kind": "inspect",
                "label": action_text,
                "action_text": action_text,
                "reason": "这个对象在当前节点可直接交互，通常会带来规则、笔记或状态变化。",
            }
        )

    seen_targets: set[str] = set()
    for alias, target in node.move_aliases.items():
        if target in seen_targets:
            continue
        seen_targets.add(target)
        action_text = _action_label(alias, move=True)
        choices.append(
            {
                "choice_id": _choice_id("move", target),
                "kind": "move",
                "label": action_text,
                "action_text": action_text,
                "reason": "推进到下一处场景，让副本继续演化。",
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
        action_text = f"验证规则：{rule.text}"
        choices.append(
            {
                "choice_id": _choice_id("verify", rule_id),
                "kind": "verify",
                "label": action_text,
                "action_text": action_text,
                "reason": "把已经掌握的规则从线索升级成可用于推进和压制风险的已验证规则。",
            }
        )

    return choices


def _scene_payload(session: GameSession, run: RunState, config: DungeonConfig, node: SceneNode) -> dict[str, Any]:
    return {
        "node_id": node.node_id,
        "title": node.title,
        "description": _distort_text(node.description, session.player_state.visible_stats.san, session.player_state.visible_stats.cor),
        "visible_objects": list(node.visible_objects),
        "clues": list(node.clues),
        "ai_hint": _scene_ai_hint(session, run, node),
        "suggested_actions": _scene_choice_payload(session, run, config, node),
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


def _distort_text(text: str, san: int, cor: int) -> str:
    if san >= 45 and cor < 45:
        return text
    glitched = text.replace("你", "你/它").replace("规则", "规...则").replace("声音", "声纹")
    if san < 30:
        glitched = glitched.replace("门", "门[缺失]").replace("名字", "名字(被刮去)")
    if cor >= 45:
        glitched = f"{glitched} 你意识到记录本似乎提前替你改写了一部分结论。"
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


def _list_dungeon_cards(session: GameSession) -> list[dict[str, Any]]:
    cards: list[dict[str, Any]] = []
    for config in list_dungeon_configs():
        locked = config.black_zone and "black_zone_access" not in session.player_state.hall_permissions
        cards.append(
            {
                "dungeon_id": config.dungeon_id,
                "title": config.title,
                "kind": config.kind,
                "difficulty_band": config.difficulty_band,
                "recommended_style": config.recommended_style,
                "reward_pool": list(config.reward_pool),
                "locked": locked,
                "lock_reason": None if not locked else "需要先完成医院夜班与公寓夜归，并在大厅获得黑区通行权限。",
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
        raise ValueError("当前没有进行中的副本。")
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
        session.player_state.discovered_rules.append(existing)
    if rule_id not in run.discovered_rule_ids:
        run.discovered_rule_ids.append(rule_id)

    if verify:
        existing.verified = True
        existing.verified_at = now_iso()
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


def classify_intent(session: GameSession, text: str) -> dict[str, Any]:
    normalized = text.strip().lower()
    intent = "observe"
    if any(token in text for token in ("前往", "去", "进入", "走到", "move", "go ")):
        intent = "move_to_area"
    elif any(token in text for token in ("查看背包", "打开背包", "检查背包", "看包", "查看包")):
        intent = "inspect_inventory"
    elif any(token in text for token in ("验证", "核对", "确认规则", "verify")):
        intent = "verify_rule"
    elif any(token in text for token in ("询问", "问", "ask", "交谈", "搭话")):
        intent = "ask_question"
    elif any(token in text for token in ("使用", "拿出", "戴上", "use")):
        intent = "use_item"
    elif any(token in text for token in ("躲", "藏", "hide")):
        intent = "hide"
    elif any(token in text for token in ("等待", "停一会", "wait")):
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

    target = ""
    trust_target = "none"
    risk_tendency = 0.25
    cautious_level = 0.65

    if session.current_run:
        _, config, node, _, _ = _get_current_context(session)
        target = _match_move_target(node, text) or ""
        if not target:
            interaction = _match_interaction(node, text)
            target = interaction.interaction_id if interaction else ""
        for npc in config.npcs:
            if npc.display_name in text:
                trust_target = npc.npc_id

    if any(token in normalized for token in ("直接", "马上", "立刻", "冲", "硬")):
        risk_tendency = 0.8
        cautious_level = 0.25
    elif any(token in normalized for token in ("先", "小心", "确认", "观察")):
        risk_tendency = 0.25
        cautious_level = 0.82
    elif intent in {"fight", "flee", "test_boundary"}:
        risk_tendency = 0.7
        cautious_level = 0.3

    return {
        "primary_intent": intent if not target else target,
        "secondary_intent": intent,
        "risk_tendency": round(risk_tendency, 2),
        "cautious_level": round(cautious_level, 2),
        "trust_target": trust_target,
    }


def _player_power(session: GameSession) -> float:
    stats = session.player_state.visible_stats
    psych = session.player_state.psych_state
    base = stats.atk + stats.defense + stats.spd + stats.acc + stats.res + stats.cog
    state_coeff = 0.55 + (stats.hp / 100) * 0.2 + (stats.san / 100) * 0.15 + (stats.sta / 100) * 0.1
    psych_coeff = 1.0 - psych.fear / 400 + psych.willpower / 320 + psych.suspicion / 500 - psych.dependency / 600
    inventory_bonus = 1.0 + min(len(session.player_state.inventory), 4) * 0.03
    return base * state_coeff * psych_coeff * inventory_bonus


def _matching_multiplier(session: GameSession, dungeon_id: str) -> float:
    early_game = len(session.completed_dungeons) < 1
    low, high = (0.88, 1.05) if early_game else (0.92, 1.08)
    seed = f"{session.session_id}:{dungeon_id}:{len(session.run_history)}"
    rng = Random(seed)
    return round(rng.uniform(low, high), 3)


def start_session(player_name: str) -> GameSession:
    session = GameSession(player_state=PlayerState(player_name=player_name))
    session.flags["hall_safe"] = False
    save_session(session)
    return session


def get_session(session_id: str) -> GameSession:
    return load_session(session_id)


def hall_view(session_id: str) -> dict[str, Any]:
    session = load_session(session_id)
    black_zone_unlocked = "black_zone_access" in session.player_state.hall_permissions
    modules = []
    for module in HALL_MODULES:
        item = dict(module)
        if item["module_id"] == "black_zone":
            item["locked"] = not black_zone_unlocked
            item["status"] = "解锁" if black_zone_unlocked else "未解锁"
        else:
            item["locked"] = False
            item["status"] = "开放"
        modules.append(item)
    return {
        "session": _session_snapshot(session),
        "hall": {
            "modules": modules,
            "narrative": "大厅并不真正安全。管理员不会直接告诉你哪条规则正在失效。",
            "available_dungeons": _list_dungeon_cards(session),
            "admin_hint": "黑区入口只有在你证明自己能活着带回错误认知之后才会开。",
        },
    }


def visit_hall_module(session_id: str, module_id: str) -> dict[str, Any]:
    session = load_session(session_id)
    player = session.player_state
    narrative = {
        "task_wall": "任务墙上的纸条总比你刚完成的副本多一张，像大厅提前知道你会回来。",
        "archives": "档案室的柜门里夹着你自己写过却不记得的笔迹。",
        "backpack": f"你翻开了背包。里面现在有 {len(player.inventory)} 件物品：{'、'.join(player.inventory) if player.inventory else '空空如也'}。",
        "shop": "商店只收结算印记，不问你是怎么活下来的。",
        "rest_area": "休息区的热水永远烫不到舌头，像温度也被某条规则限制了。",
        "settlement_desk": "结算台会把你的通关方式写得比结果更详细。",
        "black_zone": "黑区入口后面没有灯，但你能听见镜面彼此碰撞的轻响。",
    }.get(module_id, "大厅没有回应你的访问。")

    if module_id == "rest_area":
        player.visible_stats.san = clamp(player.visible_stats.san + 8)
        player.visible_stats.sta = clamp(player.visible_stats.sta + 10)
        player.psych_state.fear = clamp(player.psych_state.fear - 6)
    elif module_id == "shop" and "应急荧光笔" not in player.inventory:
        player.inventory.append("应急荧光笔")
    elif module_id == "black_zone" and "black_zone_access" not in player.hall_permissions:
        return {
            "session": _session_snapshot(session),
            "visit": {"module_id": module_id, "allowed": False, "narrative": "黑区入口像一堵还没承认你的墙。"},
        }

    save_session(session)
    return {"session": _session_snapshot(session), "visit": {"module_id": module_id, "allowed": True, "narrative": narrative}}


def dungeon_catalog(session_id: str) -> dict[str, Any]:
    session = load_session(session_id)
    return {"session": _session_snapshot(session), "dungeons": _list_dungeon_cards(session)}


def enter_dungeon(session_id: str, dungeon_id: str) -> dict[str, Any]:
    session = load_session(session_id)
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
        flags={"entered_from_hall": True},
    )
    session.current_run = run
    session.last_action_text = None
    session.last_action_result = None
    session.player_state.world_state.drift = clamp(session.player_state.world_state.drift + (10 if config.black_zone else 4))
    session.player_state.world_state.hostile = clamp(session.player_state.world_state.hostile + 6)
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
    }
    session.last_action_result = response
    return response


def active_run_view(session_id: str) -> dict[str, Any]:
    session = load_session(session_id)
    run, config, node, _, _ = _get_current_context(session)
    return {
        "session": _session_snapshot(session),
        "run": _run_snapshot(run),
        "scene": _scene_payload(session, run, config, node),
        "settlement_ready": run.status in {"settlement_ready", "completed", "failed"},
        "settlement": run.settlement_report.model_dump(mode="json") if run.settlement_report else None,
    }


def _enter_combat(run: RunState, monster_id: str, monster_index: dict[str, Any]) -> None:
    monster = monster_index[monster_id]
    run.combat = EncounterState(
        active=True,
        monster_id=monster.monster_id,
        monster_name=monster.name,
        reason=monster.trigger_condition,
        weakness_known=monster.weakness_rule_id in run.verified_rule_ids,
    )
    run.status = "combat"
    if monster.monster_type == "hunter":
        run.flags["pursuit_started"] = True


def interpret_action(session_id: str, text: str) -> dict[str, Any]:
    session = load_session(session_id)
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
        narrative = f"你观察了 {node.title}。{node.description} 线索包括: {'；'.join(node.clues) if node.clues else '暂无更多可疑细节。'}"
        _record_behavior(session, "试探型")
        _apply_delta(session, "suspicion", 2)

    elif intent == "inspect_object":
        interaction = _match_interaction(node, text)
        if interaction is None:
            illegal = True
            narrative = "这里没有与你描述相符的可检查对象。"
        else:
            for rule_id in interaction.discover_rules:
                _upsert_rule(session, run, config, rule_id)
            _remember_notebook(session, interaction.notebook_entry)
            for key, delta in interaction.status_effects.items():
                _apply_delta(session, key, delta)
            for key, value in interaction.flag_updates.items():
                run.flags[key] = value
            narrative = interaction.response
            if interaction.trust_target:
                run.npc_trust[interaction.trust_target] = round(run.npc_trust.get(interaction.trust_target, 0.3) + interaction.trust_delta, 2)
            _record_behavior(session, "试探型")

    elif intent == "inspect_inventory":
        if session.player_state.inventory:
            narrative = f"你在 {node.title} 快速翻看背包：{'、'.join(session.player_state.inventory)}。至少现在，你还没把这些保命物件弄丢。"
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
            run.current_node_id = target_node.node_id
            narrative = f"你从 {node.title} 移动到了 {target_node.title}。{target_node.description}"
            if target_node.encounter_monster_id:
                _enter_combat(run, target_node.encounter_monster_id, monster_index)
                session.player_state.world_state.aggro = clamp(session.player_state.world_state.aggro + 10)
                narrative += f" 你刚站稳，{run.combat.monster_name} 就从规则缝隙里逼近了。"
            elif target_node.is_exit:
                run.status = "settlement_ready"
                run.outcome = "normal_clear"
            _record_behavior(session, "规避型")
            node = target_node

    elif intent == "verify_rule":
        matched_rule: RuleRecord | None = None
        for discovered in session.player_state.discovered_rules:
            if discovered.rule_id in text or any(fragment in text for fragment in discovered.text.replace("，", "").replace("。", "").split()):
                matched_rule = discovered
                break
        if matched_rule is None:
            for rule_id in node.discoverable_rules:
                rule = rule_index.get(rule_id)
                if rule and any(fragment in text for fragment in rule.text.replace("，", "").replace("。", "").split()):
                    matched_rule = rule
                    break

        if matched_rule is None:
            illegal = True
            narrative = "你试图验证一条尚未成型的规则，但线索还不够。"
        else:
            verified = _upsert_rule(session, run, config, matched_rule.rule_id, verify=True)
            if verified and verified.rule_type == "false":
                _apply_delta(session, "cor", 8)
                _apply_delta(session, "fear", 6)
                _apply_delta(session, "aggro", 8)
                narrative = f"你验证了伪规则 `{verified.text}`，场景像立刻把这个错误记在了你身上。"
            else:
                _apply_delta(session, "cog", 2)
                _apply_delta(session, "san", -2 if config.black_zone else 0)
                narrative = f"你确认了规则: {verified.text if verified else matched_rule.text}"
                if run.combat.active:
                    run.combat.weakness_known = True
            _record_behavior(session, "试探型")

    elif intent == "ask_question":
        if config.npcs:
            npc = config.npcs[0]
            trust = run.npc_trust.get(npc.npc_id, 0.35)
            line = npc.key_lines[0] if trust < 0.5 else npc.key_lines[-1]
            narrative = f"{npc.display_name} 低声说: {line}"
            run.npc_trust[npc.npc_id] = round(min(npc.trust_ceiling, trust + 0.08), 2)
            _record_behavior(session, "救援型")
        else:
            illegal = True
            narrative = "这里没有会回答你的对象。"

    elif intent == "respond_voice":
        _apply_delta(session, "dependency", 6)
        _apply_delta(session, "aggro", 5)
        narrative = "你做出了回应，周围的声音像因此确认了你的位置。"
        _record_behavior(session, "救援型")

    elif intent == "hide":
        _apply_delta(session, "sta", -6)
        _apply_delta(session, "hostile", -3)
        narrative = "你暂时隐蔽下来，场景的敌意略微回落，但你的体力也被拉扯走了一截。"
        _record_behavior(session, "规避型")

    elif intent == "wait":
        _apply_delta(session, "sta", 3)
        _apply_delta(session, "fear", 2)
        narrative = "你选择等待，时间没有站在你这边，但你至少捕捉到了环境节奏。"
        _record_behavior(session, "规避型")

    elif intent == "use_item":
        if "口罩" in text and run.dungeon_id == "hospital_night_shift":
            run.flags["hospital_has_mask"] = True
            narrative = "你戴上旧院徽口罩，病房窗里的重影立刻减少了一层。"
            _apply_delta(session, "cog", 3)
        elif "耳塞" in text or "白噪耳塞" in text:
            narrative = "耳塞压住了一部分异常广播，你的恐惧微微回落。"
            _apply_delta(session, "fear", -4)
            _apply_delta(session, "san", 2)
        else:
            illegal = True
            narrative = "你现在没有能与场景产生有效联动的道具。"

    elif intent == "fight":
        if run.combat.active:
            return resolve_combat(session_id, CombatActionRequest(action="fight").action)
        _apply_delta(session, "impulse", 5)
        _apply_delta(session, "aggro", 8)
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
        narrative = "你主动试探了边界，场景没有立刻惩罚你，但它显然记住了你。"
        _record_behavior(session, "执念型")

    if run.status == "active" and node.is_exit and not run.combat.active:
        run.status = "settlement_ready"
        run.outcome = run.outcome or "normal_clear"

    response = _action_response(session, node, config, classification, narrative, illegal=illegal)
    save_session(session)
    return response


def _effective_combat_value(session: GameSession, run: RunState, monster: Any) -> tuple[float, float]:
    stats = session.player_state.visible_stats
    psych = session.player_state.psych_state
    world = session.player_state.world_state
    base = stats.atk + stats.defense + stats.spd + stats.acc + stats.res + stats.cog
    psych_coeff = 1.0
    psych_coeff -= psych.fear / 300
    psych_coeff += psych.willpower / 350
    psych_coeff += psych.suspicion / 450 if monster.monster_type in {"lure", "parasite", "judge"} else 0.0
    psych_coeff -= psych.dependency / 500 if "dependency" in monster.psych_hooks else 0.0
    if stats.hp <= 35:
        psych_coeff += psych.willpower / 300
    state_coeff = 0.5 + stats.hp / 250 + stats.san / 300 + stats.sta / 400
    scene_coeff = 1.0 - world.hostile / 240 - world.aggro / 320 + world.drift / 500
    monster_threat = monster.threat * run.matching_multiplier * (1.0 + stats.cor / 220 + world.aggro / 220)
    return base * psych_coeff * state_coeff * scene_coeff, monster_threat


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
        }
    )


def resolve_combat(session_id: str, action: str) -> dict[str, Any]:
    session = load_session(session_id)
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
        narrative = f"你先试探了 {monster.name} 的反应，它确实会被对应规则压制。"
        outcome = "probe_success"
        _record_behavior(session, "试探型")

    elif action == "exploit_rule":
        _record_behavior(session, "试探型")
        if weakness_known:
            effective_power *= 1.55
            _apply_delta(session, "san", -3)
            narrative = f"你利用 `{rule_index[monster.weakness_rule_id].text}` 压制了 {monster.name}，它的形体明显松散。"
            outcome = "rule_break"
        else:
            effective_power *= 0.68
            _apply_delta(session, "hp", -16)
            _apply_delta(session, "san", -9)
            _apply_delta(session, "cor", 8)
            narrative = f"你想强行利用一条尚未确认的规则，结果 {monster.name} 先一步利用了你的迟疑。"
            outcome = "rule_fail"

    elif action == "flee":
        _record_behavior(session, "规避型")
        escape_score = session.player_state.visible_stats.spd + session.player_state.psych_state.willpower * 0.4 - monster_threat * 0.35
        if weakness_known:
            escape_score += 12
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
        narrative = f"你与 {monster.name} 正面碰撞，硬碰硬地争夺出口。"
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
    if {"hospital_night_shift", "apartment_night_return"}.issubset(set(session.completed_dungeons)) and "black_zone_access" not in player.hall_permissions:
        player.hall_permissions.append("black_zone_access")
        unlocked.append("黑区入口")
    return unlocked


def finalize_settlement(session_id: str) -> dict[str, Any]:
    session = load_session(session_id)
    run, config, _, _, _ = _get_current_context(session)
    if run.settlement_report is not None:
        return {"session": _session_snapshot(session), "settlement": run.settlement_report.model_dump(mode="json")}
    if run.status not in {"settlement_ready", "completed", "failed"}:
        raise ValueError("当前副本尚未到达可结算节点。")

    player = session.player_state
    stats = player.visible_stats
    rules_found = len(run.discovered_rule_ids)
    verified_rules = len(run.verified_rule_ids)
    combat_penalty = 16 if "强攻型" == _best_behavior_tag(player.behavior_profile) and run.outcome == "violent_clear" else 0
    survival_score = max(0, stats.hp - (20 if run.outcome == "failed" else 0))
    mental_score = max(0, stats.san - stats.cor * 0.35 - player.psych_state.fear * 0.2)
    rules_score = min(100.0, 38 + rules_found * 12 + verified_rules * 16 + (10 if config.success_rule_id in run.verified_rule_ids else 0))
    combat_score = max(0.0, 85 - combat_penalty - (18 if run.outcome == "failed" else 0) + (10 if run.outcome == "perfect_clear" else 0))
    choice_score = 62 + (12 if "试探型" == _best_behavior_tag(player.behavior_profile) else 0) + (8 if run.outcome == "perfect_clear" else 0)
    overall_score = (survival_score + mental_score + rules_score + combat_score + choice_score) / 5

    outcome = run.outcome or ("failed" if run.status == "failed" else "normal_clear")
    if outcome == "failed":
        summary = "你没能带着完整的自我离开副本。大厅会记住这次失败。"
    elif stats.cor >= 45 or outcome == "corrupted_clear":
        outcome = "corrupted_clear"
        summary = "你通关了，但污染比奖励先一步跟你回到了大厅。"
    elif config.black_zone and stats.san < 45 and verified_rules >= 2:
        outcome = "hidden_clear"
        summary = "你带着足够接近真相的代价离开黑区，管理员不会再把你当普通幸存者。"
    elif verified_rules >= 2 and stats.hp >= 70 and stats.san >= 65:
        outcome = "perfect_clear"
        summary = "你不是靠硬打，而是靠判断赢下了这次怪谈。"
    else:
        summary = "你活着回到了大厅，但大厅显然比之前更了解你。"

    grades = SettlementGrades(
        survival=_grade(survival_score),
        mental=_grade(mental_score),
        rules=_grade(rules_score),
        combat=_grade(combat_score),
        choice=_grade(choice_score),
        overall=_grade(overall_score),
    )
    rewards = list(config.reward_pool[:2])
    if grades.rules in {"S", "A"}:
        rewards.append("规则压制凭证")
    if grades.mental in {"S", "A"}:
        rewards.append("镇静标签")
    if config.black_zone:
        rewards.append("管理员侧写碎片")

    if outcome != "failed":
        if run.dungeon_id not in session.completed_dungeons:
            session.completed_dungeons.append(run.dungeon_id)
        stats.hp = clamp(stats.hp + 10)
        stats.sta = clamp(stats.sta + 12)
        stats.san = clamp(stats.san + 6)
        if "规则压制凭证" in rewards:
            stats.cog = clamp(stats.cog + 4)
        if "镇静标签" in rewards:
            stats.res = clamp(stats.res + 3)
    else:
        stats.hp = clamp(max(stats.hp, 12))
        stats.san = clamp(max(stats.san, 18))

    unlocked = _unlock_progression(session)
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
        metrics={
            "survival_score": round(survival_score, 2),
            "mental_score": round(mental_score, 2),
            "rules_score": round(rules_score, 2),
            "combat_score": round(combat_score, 2),
            "choice_score": round(choice_score, 2),
            "overall_score": round(overall_score, 2),
            "rules_found": float(rules_found),
            "rules_verified": float(verified_rules),
        },
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
    session = load_session(session_id)
    reports = []
    for run_id in session.run_history:
        payload = load_run_report(run_id)
        if payload:
            reports.append(payload)
    return {"session": _session_snapshot(session), "runs": reports}


def archives_view(session_id: str) -> dict[str, Any]:
    session = load_session(session_id)
    player = session.player_state
    history = []
    for run_id in session.run_history:
        payload = load_run_report(run_id)
        if payload:
            history.append(payload)
    return {
        "session": _session_snapshot(session),
        "archives": {
            "rules": [rule.model_dump(mode="json") for rule in player.discovered_rules],
            "notebook_entries": _tamper_notebook(player.notebook_entries, player.visible_stats.cor),
            "monster_archive": list(player.monster_archive),
            "run_history": history,
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
    session = load_session(session_id)
    path = save_slot(session, slot_id)
    return {"session": _session_snapshot(session), "saved": True, "slot_id": slot_id, "path": str(path)}


def load_progress(session_id: str, slot_id: str) -> dict[str, Any]:
    session = load_slot(session_id, slot_id)
    return {"session": _session_snapshot(session), "loaded": True, "slot_id": slot_id}
