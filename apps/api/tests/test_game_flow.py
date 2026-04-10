from __future__ import annotations

from fastapi.testclient import TestClient

from apps.api.src.main import app


client = TestClient(app)


def _start_session(name: str = "测试玩家") -> str:
    response = client.post("/api/v1/session/start", json={"player_name": name})
    response.raise_for_status()
    return response.json()["session"]["session_id"]


def _enter(session_id: str, dungeon_id: str) -> None:
    response = client.post(f"/api/v1/dungeons/{dungeon_id}/enter", json={"session_id": session_id})
    response.raise_for_status()


def _act(session_id: str, text: str) -> dict:
    response = client.post(f"/api/v1/actions/{session_id}/interpret", json={"text": text})
    response.raise_for_status()
    return response.json()


def _combat(session_id: str, action: str) -> dict:
    response = client.post(f"/api/v1/combat/{session_id}/resolve", json={"action": action})
    response.raise_for_status()
    return response.json()


def _suggested_action(session_id: str, kind: str, contains: str | None = None) -> str:
    response = client.get(f"/api/v1/runs/{session_id}/active")
    response.raise_for_status()
    choices = response.json()["scene"]["suggested_actions"]
    for item in choices:
        if item["kind"] != kind:
            continue
        action_text = item["action_text"]
        if contains is None or contains in item["label"] or contains in action_text:
            return action_text
    raise AssertionError(f"missing suggested action kind={kind!r} contains={contains!r}")


def test_two_core_dungeons_unlock_black_zone_and_support_save_load() -> None:
    session_id = _start_session()

    _enter(session_id, "hospital_night_shift")
    assert _act(session_id, "观察大厅和告示牌")["classification"]["secondary_intent"] == "observe"
    assert _act(session_id, "前往护士站")["scene"]["node_id"] == "nurse_station"
    assert _act(session_id, "查看值班表")["classification"]["secondary_intent"] == "inspect_object"
    assert _act(session_id, "前往隔离病房")["scene"]["node_id"] == "isolation_ward"
    verify = _act(session_id, "验证规则：听到双响铃时，低头数到四，再移动")
    assert verify["classification"]["secondary_intent"] == "verify_rule"
    move_exit = _act(session_id, "前往服务出口")
    assert move_exit["combat"]["active"] is True
    assert _combat(session_id, "exploit_rule")["settlement_ready"] is True
    hospital_settlement = client.get(f"/api/v1/settlement/{session_id}")
    assert hospital_settlement.status_code == 200

    save = client.post(f"/api/v1/session/{session_id}/save", json={"slot_id": "story-smoke"})
    assert save.status_code == 200
    reload = client.post(f"/api/v1/session/{session_id}/load", json={"slot_id": "story-smoke"})
    assert reload.status_code == 200

    _enter(session_id, "apartment_night_return")
    _act(session_id, "观察楼梯间")
    _act(session_id, "前往配电间")
    _act(session_id, "检查开关")
    _act(session_id, "前往租客门口")
    _act(session_id, "验证规则：只有灯亮着时，才回应门后的声音")
    move_exit = _act(session_id, "前往街口")
    assert move_exit["combat"]["active"] is True
    _combat(session_id, "flee")
    apartment_settlement = client.get(f"/api/v1/settlement/{session_id}")
    assert apartment_settlement.status_code == 200

    hall = client.get(f"/api/v1/hall/{session_id}")
    assert hall.status_code == 200
    modules = {item["module_id"]: item for item in hall.json()["hall"]["modules"]}
    assert modules["black_zone"]["locked"] is False

    _enter(session_id, "black_zone_mirror_records")
    _act(session_id, _suggested_action(session_id, "observe"))
    _act(session_id, _suggested_action(session_id, "move", "档案"))
    _act(session_id, _suggested_action(session_id, "inspect", "井壁"))
    _act(session_id, _suggested_action(session_id, "move", "访客"))
    _act(session_id, _suggested_action(session_id, "inspect", "访客记录"))
    _act(session_id, "验证规则：不要说出自己的真实姓名")
    move_exit = _act(session_id, _suggested_action(session_id, "move", "真出口"))
    assert move_exit["combat"]["active"] is True
    _combat(session_id, "exploit_rule")
    black_settlement = client.get(f"/api/v1/settlement/{session_id}")
    assert black_settlement.status_code == 200
    assert black_settlement.json()["settlement"]["outcome"] in {"hidden_clear", "perfect_clear", "corrupted_clear", "normal_clear"}

    archives = client.get(f"/api/v1/archives/{session_id}")
    assert archives.status_code == 200
    archive_payload = archives.json()["archives"]
    assert len(archive_payload["rules"]) >= 5
    assert len(archive_payload["run_history"]) >= 3


def test_idempotent_replay_and_illegal_action_guardrails() -> None:
    session_id = _start_session("幂等测试")
    _enter(session_id, "hospital_night_shift")

    first = _act(session_id, "观察大厅和告示牌")
    second = _act(session_id, "观察大厅和告示牌")
    assert second.get("idempotent_replay") is True
    assert second["narrative"] == first["narrative"]

    illegal = _act(session_id, "前往不存在的区域")
    assert illegal["illegal_action"] is True


def test_active_run_view_exposes_scene_guidance_and_suggested_actions() -> None:
    session_id = _start_session("active-view")
    _enter(session_id, "hospital_night_shift")

    response = client.get(f"/api/v1/runs/{session_id}/active")
    response.raise_for_status()
    payload = response.json()

    assert payload["run"]["dungeon_id"] == "hospital_night_shift"
    assert payload["scene"]["node_id"] == "hospital_lobby"
    assert payload["scene"]["ai_hint"]
    choices = payload["scene"]["suggested_actions"]
    assert len(choices) >= 3
    assert any(item["kind"] == "inspect" for item in choices)
    assert any(item["kind"] == "move" for item in choices)
    assert any(item["kind"] == "inventory" for item in choices)


def test_backpack_module_and_inventory_action_are_available() -> None:
    session_id = _start_session("backpack")

    hall = client.get(f"/api/v1/hall/{session_id}")
    hall.raise_for_status()
    module_ids = [item["module_id"] for item in hall.json()["hall"]["modules"]]
    assert "backpack" in module_ids

    visit = client.post(f"/api/v1/hall/{session_id}/visit", json={"module_id": "backpack"})
    visit.raise_for_status()
    assert "背包" in visit.json()["visit"]["narrative"]

    _enter(session_id, "hospital_night_shift")
    inspect_inventory = _act(session_id, "查看背包")
    assert inspect_inventory["illegal_action"] is False
    assert "背包" in inspect_inventory["narrative"]
