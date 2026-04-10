from __future__ import annotations

from typing import Any

from .item_catalog import add_item, has_item, has_tag, make_reward_record, sync_understanding, understanding_progress
from .models import DungeonConfig, PlayerState, RewardRecord, RunState, SettlementGrades


def passive_modifier_total(player: PlayerState, stat_key: str) -> int:
    total = 0
    for item in player.inventory:
        total += int(item.passive_modifiers.get(stat_key, 0))
    return total


def understanding_scene_bonus(player: PlayerState) -> int:
    bonus = 0
    if player.understanding >= 220:
        bonus += 2
    elif player.understanding >= 90:
        bonus += 1
    if has_tag(player, "insight"):
        bonus += 1
    return bonus


def understanding_parse_bias(player: PlayerState) -> float:
    bias = 0.0
    if player.understanding >= 300:
        bias += 0.18
    elif player.understanding >= 150:
        bias += 0.1
    elif player.understanding >= 40:
        bias += 0.05
    if has_tag(player, "rule"):
        bias += 0.05
    return bias


def apply_understanding_delta(player: PlayerState, run: RunState, delta: int, reason: str) -> None:
    if delta == 0:
        return
    player.understanding = max(0, player.understanding + delta)
    run.understanding_delta += delta
    if reason:
        run.insight_log.append(reason)
    sync_understanding(player)


def node_insight(player: PlayerState, node_threshold: int, bonus_description: str | None) -> str | None:
    if not bonus_description:
        return None
    threshold = max(0, node_threshold - understanding_scene_bonus(player) * 15)
    if player.understanding >= threshold:
        return bonus_description
    return None


def reward_unlocks(player: PlayerState, rewards: list[RewardRecord]) -> list[str]:
    unlocked: list[str] = []
    reward_ids = {reward.item_id for reward in rewards}
    if "temporary_black_pass" in reward_ids and "black_zone_key_frag" not in player.hall_permissions:
        player.hall_permissions.append("black_zone_key_frag")
        unlocked.append("黑区通行凭证碎片")
    if "archive_fragment_107" in reward_ids and "archive_107_fragment" not in player.unlocked_archives:
        player.unlocked_archives.append("archive_107_fragment")
        unlocked.append("107 房档案碎片")
    return unlocked


def grant_rewards(player: PlayerState, rewards: list[RewardRecord]) -> None:
    for reward in rewards:
        add_item(player, reward.item_id, quantity=reward.quantity)
    player.recent_rewards = rewards


def _reward_reason(text: str) -> str:
    return text


def generate_reward_bundle(
    config: DungeonConfig,
    player: PlayerState,
    run: RunState,
    grades: SettlementGrades,
    metrics: dict[str, float],
    outcome: str,
) -> list[RewardRecord]:
    reward_ids: list[tuple[str, str]] = []

    def grant(item_id: str, reason: str) -> None:
        if any(existing_id == item_id for existing_id, _ in reward_ids):
            return
        reward_ids.append((item_id, reason))

    base_pool = list(config.reward_pool)
    if base_pool:
        grant(base_pool[0], _reward_reason("你把这处怪谈真正留下来的遗物带回了大厅。"))

    if grades.mental in {"S", "A"}:
        grant("tranquilizer_ampoule", _reward_reason("你保住了心智稳定，大厅给了你可复用的镇定资源。"))
    if grades.rules in {"S", "A"}:
        grant("record_clip_page", _reward_reason("你抓住了规则冲突，适合得到能补记对照信息的夹页。"))
    if grades.understanding in {"S", "A"}:
        grant("half_broken_flashlight", _reward_reason("你不是靠运气走出来的，这盏手电会更偏向愿意思考的人。"))
    if grades.combat in {"S", "A"} and outcome not in {"violent_clear", "failed"}:
        grant("paper_badge", _reward_reason("你克制了正面冲突，诱导型怪物以后会更晚锁定你。"))
    if grades.choice in {"S", "A"}:
        grant("old_duty_key", _reward_reason("你在关键节点没有被第一反应带跑，大厅愿意给你一把旧钥匙。"))
    if metrics.get("false_rule_breaks", 0) >= 1:
        grant("nameless_note", _reward_reason("你识破过伪规则，所以这张便签现在更像线索而不是陷阱。"))
    if run.hidden_route_triggered or outcome in {"perfect_clear", "hidden_clear"}:
        grant("temporary_black_pass", _reward_reason("你触碰到了比普通通关更深的一层，黑区因此暂时承认你。"))
    if config.black_zone:
        grant("mirror_shard", _reward_reason("黑区不会空手让你离开，它一定会在你身上留一块镜面。"))
    if outcome == "corrupted_clear":
        grant("faded_charm", _reward_reason("你带回来的不只是奖励，还有能替你扛一点污染的代价物。"))
    if metrics.get("hidden_route", 0) > 0 and not has_item(player, "archive_fragment_107"):
        grant("archive_fragment_107", _reward_reason("你摸到了 107 房被剪掉的一页。"))
    if metrics.get("survival_score", 0) < 55 and grades.mental not in {"S", "A"}:
        grant("white_noise_earplug", _reward_reason("你是险些被拖走才回来，大厅补给了更稳的听觉缓冲。"))
    if has_item(player, "half_broken_flashlight"):
        grant("spare_battery", _reward_reason("你已经有手电了，电池会比第二盏灯更实用。"))

    rewards = [make_reward_record(item_id, reason) for item_id, reason in reward_ids[:4]]
    return rewards


def understanding_snapshot(player: PlayerState) -> dict[str, Any]:
    progress = understanding_progress(player.understanding)
    return {
        "total": player.understanding,
        "level": player.understanding_level,
        "current_threshold": progress["current_threshold"],
        "next_threshold": progress["next_threshold"],
        "next_level": progress["next_level"],
        "progress_percent": progress["progress_percent"],
    }
