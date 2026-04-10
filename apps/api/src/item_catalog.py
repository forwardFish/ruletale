from __future__ import annotations

from copy import deepcopy
from typing import Any

from .models import InventoryItem, PlayerState, RewardRecord


UNDERSTANDING_LEVELS: list[tuple[int, str]] = [
    (0, "未知者"),
    (40, "初见者"),
    (90, "旁观者"),
    (150, "记录者"),
    (220, "识破者"),
    (300, "窥界者"),
    (390, "逆读者"),
    (500, "破律者"),
]


ITEM_DEFINITIONS: dict[str, dict[str, Any]] = {
    "tranquilizer_ampoule": {
        "item_id": "tranquilizer_ampoule",
        "name": "镇静针剂",
        "item_type": "recovery",
        "rarity": "consumable",
        "description": "一次性镇静针剂，能在高 FEAR 判定前压低迟疑与惊惧。",
        "effect_type": "reduce_fear",
        "effect_value": 12,
        "use_condition": "高恐惧或广播诱导前使用效果最佳。",
        "stackable": True,
        "quantity": 1,
        "usable_in_lobby": True,
        "usable_in_dungeon": True,
        "consume_on_use": True,
        "tags": ["medical", "calm"],
        "aliases": ["镇静剂", "针剂", "镇静针", "使用镇静剂"],
    },
    "white_noise_earplug": {
        "item_id": "white_noise_earplug",
        "name": "白噪耳塞",
        "item_type": "recovery",
        "rarity": "common",
        "description": "能压住一部分异常广播，让你在声音诱导前多一层缓冲。",
        "effect_type": "lower_aggro",
        "effect_value": 4,
        "use_condition": "面对广播、铃声、门后呼救时有效。",
        "stackable": False,
        "quantity": 1,
        "usable_in_lobby": False,
        "usable_in_dungeon": True,
        "consume_on_use": False,
        "tags": ["audio", "calm"],
        "aliases": ["耳塞", "白噪耳塞", "使用耳塞"],
        "modifies_understanding_check": True,
    },
    "half_broken_flashlight": {
        "item_id": "half_broken_flashlight",
        "name": "半损手电",
        "item_type": "insight",
        "rarity": "rare",
        "description": "灯丝忽明忽暗，但在走廊、门牌和镜面附近总能照出多一层细节。",
        "effect_type": "reveal_clue",
        "effect_value": 1,
        "use_condition": "黑暗、门牌错位、镜面滞后等场景中更容易触发额外洞察。",
        "stackable": False,
        "quantity": 1,
        "usable_in_lobby": False,
        "usable_in_dungeon": True,
        "consume_on_use": False,
        "tags": ["light", "insight"],
        "aliases": ["手电", "半损手电", "使用手电", "手电筒"],
        "unlocks_insight": True,
        "modifies_understanding_check": True,
    },
    "old_duty_key": {
        "item_id": "old_duty_key",
        "name": "旧值班钥匙",
        "item_type": "access",
        "rarity": "rare",
        "description": "旧住院部遗留的钥匙，能让某些本该卡住的门锁对你犹豫半秒。",
        "effect_type": "flag_unlock",
        "effect_value": 1,
        "use_condition": "医院类封锁门、档案柜、后勤门可自动检测。",
        "stackable": False,
        "quantity": 1,
        "usable_in_lobby": False,
        "usable_in_dungeon": True,
        "consume_on_use": False,
        "tags": ["key", "hospital", "access"],
        "aliases": ["钥匙", "值班钥匙", "旧钥匙"],
    },
    "record_clip_page": {
        "item_id": "record_clip_page",
        "name": "记录夹页",
        "item_type": "rule_tool",
        "rarity": "rare",
        "description": "可在记录中额外标记一处冲突来源，让伪规则更难完全骗过你。",
        "effect_type": "stabilize_rule",
        "effect_value": 1,
        "use_condition": "发现规则冲突后使用，会补记一条对照信息。",
        "stackable": True,
        "quantity": 1,
        "usable_in_lobby": True,
        "usable_in_dungeon": True,
        "consume_on_use": True,
        "tags": ["record", "rule"],
        "aliases": ["夹页", "记录夹页", "记录页"],
        "modifies_understanding_check": True,
    },
    "mirror_shard": {
        "item_id": "mirror_shard",
        "name": "镜面碎片",
        "item_type": "corrupted",
        "rarity": "rare",
        "description": "能帮你识别镜像异常，但每次借它看见真相时也会反过来映照你。",
        "effect_type": "mirror_insight",
        "effect_value": 1,
        "use_condition": "镜面、倒影、延迟动作场景效果明显。",
        "stackable": False,
        "quantity": 1,
        "usable_in_lobby": False,
        "usable_in_dungeon": True,
        "consume_on_use": False,
        "tags": ["mirror", "corruption", "insight"],
        "aliases": ["碎片", "镜面碎片", "镜子碎片"],
        "unlocks_insight": True,
        "modifies_understanding_check": True,
    },
    "temporary_black_pass": {
        "item_id": "temporary_black_pass",
        "name": "临时通行证",
        "item_type": "access",
        "rarity": "fragment",
        "description": "黑区入口认得这张临时证件，说明你已经被大厅列入可再次利用的名单。",
        "effect_type": "unlock_access",
        "effect_value": 1,
        "use_condition": "被动生效，可作为黑区解锁条件之一。",
        "stackable": False,
        "quantity": 1,
        "usable_in_lobby": False,
        "usable_in_dungeon": False,
        "consume_on_use": False,
        "tags": ["hall", "black_zone", "pass"],
        "aliases": ["通行证", "临时通行证"],
    },
    "paper_badge": {
        "item_id": "paper_badge",
        "name": "纸质工牌",
        "item_type": "passive",
        "rarity": "common",
        "description": "伪装得并不完美，却足够让某些诱导型怪物把你错认成仍在值班的人。",
        "effect_type": "ward_identity",
        "effect_value": 1,
        "use_condition": "携带即可生效，降低伪装型怪物的初始敌意。",
        "stackable": False,
        "quantity": 1,
        "usable_in_lobby": False,
        "usable_in_dungeon": False,
        "consume_on_use": False,
        "tags": ["badge", "identity"],
        "aliases": ["工牌", "纸质工牌"],
        "passive_modifiers": {"aggro": -4},
    },
    "spare_battery": {
        "item_id": "spare_battery",
        "name": "备用电池",
        "item_type": "insight",
        "rarity": "common",
        "description": "替半损手电多撑一次可靠照明，也能让电子设备类交互多一次稳定读数。",
        "effect_type": "focus_observation",
        "effect_value": 1,
        "use_condition": "与手电或配电装置联动时有效。",
        "stackable": True,
        "quantity": 1,
        "usable_in_lobby": False,
        "usable_in_dungeon": True,
        "consume_on_use": True,
        "tags": ["battery", "light"],
        "aliases": ["电池", "备用电池"],
    },
    "faded_charm": {
        "item_id": "faded_charm",
        "name": "褪色护符",
        "item_type": "passive",
        "rarity": "rare",
        "description": "看起来像过期的护身符，能帮你扛一点污染，却也让你对环境失去部分精确理解。",
        "effect_type": "boost_res",
        "effect_value": 2,
        "use_condition": "携带生效。",
        "stackable": False,
        "quantity": 1,
        "usable_in_lobby": False,
        "usable_in_dungeon": False,
        "consume_on_use": False,
        "tags": ["charm", "resistance"],
        "aliases": ["护符", "褪色护符"],
        "passive_modifiers": {"res": 2, "cog": -1},
    },
    "nameless_note": {
        "item_id": "nameless_note",
        "name": "无名便签",
        "item_type": "story",
        "rarity": "fragment",
        "description": "看起来像真实规则的残页，但落款被刻意刮掉。理解不足时它更像一道陷阱。",
        "effect_type": "stabilize_rule",
        "effect_value": 1,
        "use_condition": "高理解度时更可能给出真实冲突提示，低理解度时只会制造犹豫。",
        "stackable": True,
        "quantity": 1,
        "usable_in_lobby": True,
        "usable_in_dungeon": True,
        "consume_on_use": True,
        "tags": ["note", "story", "rule"],
        "aliases": ["便签", "无名便签"],
        "modifies_understanding_check": True,
    },
    "archive_fragment_107": {
        "item_id": "archive_fragment_107",
        "name": "107 房夹页",
        "item_type": "story",
        "rarity": "fragment",
        "description": "来自 107 房档案的夹页，证明那里被人为删改过一次。",
        "effect_type": "flag_unlock",
        "effect_value": 1,
        "use_condition": "被动生效，可在大厅档案室补出额外管理员侧写。",
        "stackable": False,
        "quantity": 1,
        "usable_in_lobby": False,
        "usable_in_dungeon": False,
        "consume_on_use": False,
        "tags": ["fragment", "hospital", "archives"],
        "aliases": ["107房夹页", "夹页107"],
    },
}


LEGACY_NAME_ALIASES = {
    "镇静剂": "tranquilizer_ampoule",
    "白噪耳塞": "white_noise_earplug",
    "应急荧光笔": "record_clip_page",
    "止血贴": "tranquilizer_ampoule",
    "认知标签": "record_clip_page",
    "值班区通行条": "old_duty_key",
    "楼道钥匙扣": "old_duty_key",
    "静电灯丝": "spare_battery",
    "关系碎片": "archive_fragment_107",
    "黑区通行卡": "temporary_black_pass",
    "镜纹残片": "mirror_shard",
    "管理员侧写": "nameless_note",
}


def understanding_level_for(score: int) -> str:
    current = UNDERSTANDING_LEVELS[0][1]
    for threshold, name in UNDERSTANDING_LEVELS:
        if score >= threshold:
            current = name
    return current


def understanding_progress(score: int) -> dict[str, Any]:
    current_threshold = UNDERSTANDING_LEVELS[0][0]
    current_name = UNDERSTANDING_LEVELS[0][1]
    next_threshold = UNDERSTANDING_LEVELS[-1][0]
    next_name = UNDERSTANDING_LEVELS[-1][1]

    for index, (threshold, name) in enumerate(UNDERSTANDING_LEVELS):
        if score >= threshold:
            current_threshold = threshold
            current_name = name
            if index + 1 < len(UNDERSTANDING_LEVELS):
                next_threshold, next_name = UNDERSTANDING_LEVELS[index + 1]
            else:
                next_threshold, next_name = threshold, name

    span = max(1, next_threshold - current_threshold)
    progress = 100 if next_threshold == current_threshold else int(((score - current_threshold) / span) * 100)
    return {
        "level": current_name,
        "current_threshold": current_threshold,
        "next_threshold": next_threshold,
        "next_level": next_name,
        "progress_percent": max(0, min(100, progress)),
    }


def item_template(item_id: str) -> dict[str, Any]:
    return deepcopy(ITEM_DEFINITIONS[item_id])


def make_inventory_item(item_id: str, quantity: int = 1) -> InventoryItem:
    payload = item_template(item_id)
    payload["quantity"] = quantity
    return InventoryItem.model_validate(payload)


def make_reward_record(item_id: str, reason: str, quantity: int = 1) -> RewardRecord:
    template = ITEM_DEFINITIONS[item_id]
    return RewardRecord(
        item_id=item_id,
        name=template["name"],
        rarity=template["rarity"],
        description=template["description"],
        quantity=quantity,
        reason=reason,
    )


def all_item_aliases(item_id: str) -> set[str]:
    template = ITEM_DEFINITIONS[item_id]
    aliases = {item_id, template["name"], *template.get("aliases", [])}
    return {alias.lower() for alias in aliases}


def resolve_item_id(text: str) -> str | None:
    normalized = text.strip().lower()
    if normalized in ITEM_DEFINITIONS:
        return normalized
    if text in LEGACY_NAME_ALIASES:
        return LEGACY_NAME_ALIASES[text]
    for item_id in ITEM_DEFINITIONS:
        if normalized in all_item_aliases(item_id):
            return item_id
        if any(alias in normalized for alias in all_item_aliases(item_id)):
            return item_id
    return None


def normalize_inventory_payload(value: Any) -> list[InventoryItem]:
    if isinstance(value, InventoryItem):
        return [value]
    if isinstance(value, dict):
        return [InventoryItem.model_validate(value)]
    if isinstance(value, str):
        item_id = resolve_item_id(value)
        return [make_inventory_item(item_id)] if item_id else []
    if not isinstance(value, list):
        return []

    normalized: list[InventoryItem] = []
    for item in value:
        if isinstance(item, InventoryItem):
            normalized.append(item)
            continue
        if isinstance(item, dict):
            normalized.append(InventoryItem.model_validate(item))
            continue
        if isinstance(item, str):
            item_id = resolve_item_id(item)
            if item_id:
                normalized.append(make_inventory_item(item_id))
    return merge_inventory(normalized)


def merge_inventory(items: list[InventoryItem]) -> list[InventoryItem]:
    merged: dict[str, InventoryItem] = {}
    ordered: list[str] = []
    for item in items:
        if item.item_id not in merged:
            merged[item.item_id] = item.model_copy(deep=True)
            ordered.append(item.item_id)
            continue
        if merged[item.item_id].stackable:
            merged[item.item_id].quantity += item.quantity
        else:
            ordered.append(f"{item.item_id}:{len(ordered)}")
            merged[ordered[-1]] = item.model_copy(deep=True)
    return [merged[key] for key in ordered]


def starting_inventory() -> list[InventoryItem]:
    return [
        make_inventory_item("tranquilizer_ampoule", quantity=1),
        make_inventory_item("white_noise_earplug", quantity=1),
        make_inventory_item("half_broken_flashlight", quantity=1),
    ]


def sync_understanding(player: PlayerState) -> None:
    player.understanding = max(0, player.understanding)
    player.understanding_level = understanding_level_for(player.understanding)


def add_item(player: PlayerState, item_id: str, quantity: int = 1) -> InventoryItem:
    for item in player.inventory:
        if item.item_id == item_id and item.stackable:
            item.quantity += quantity
            if item_id not in player.obtained_items:
                player.obtained_items.append(item_id)
            return item
    new_item = make_inventory_item(item_id, quantity=quantity)
    player.inventory.append(new_item)
    if item_id not in player.obtained_items:
        player.obtained_items.append(item_id)
    return new_item


def get_item(player: PlayerState, item_id_or_text: str) -> InventoryItem | None:
    item_id = resolve_item_id(item_id_or_text) or item_id_or_text
    for item in player.inventory:
        if item.item_id == item_id:
            return item
    return None


def has_item(player: PlayerState, item_id_or_text: str) -> bool:
    return get_item(player, item_id_or_text) is not None


def has_tag(player: PlayerState, tag: str) -> bool:
    return any(tag in item.tags for item in player.inventory)


def consume_item(player: PlayerState, item_id_or_text: str, quantity: int = 1) -> bool:
    item = get_item(player, item_id_or_text)
    if item is None:
        return False
    if not item.consume_on_use:
        return True
    item.quantity -= quantity
    if item.quantity <= 0:
        player.inventory = [candidate for candidate in player.inventory if candidate.item_id != item.item_id]
    return True
