from __future__ import annotations

import json
import sys
from pathlib import Path

from fastapi.testclient import TestClient

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from apps.api.src.main import app


REPORT_PATH = ROOT / ".runtime" / "test_reports" / "full_flow.json"


def _action(client: TestClient, session_id: str, text: str) -> dict:
    response = client.post(f"/api/v1/actions/{session_id}/interpret", json={"text": text})
    response.raise_for_status()
    return response.json()


def _combat(client: TestClient, session_id: str, action: str) -> dict:
    response = client.post(f"/api/v1/combat/{session_id}/resolve", json={"action": action})
    response.raise_for_status()
    return response.json()


def main() -> None:
    REPORT_PATH.parent.mkdir(parents=True, exist_ok=True)
    client = TestClient(app)

    start = client.post("/api/v1/session/start", json={"player_name": "全流程测试员"})
    start.raise_for_status()
    session_id = start.json()["session"]["session_id"]

    client.post("/api/v1/dungeons/hospital_night_shift/enter", json={"session_id": session_id}).raise_for_status()
    _action(client, session_id, "观察大厅和告示牌")
    _action(client, session_id, "前往护士站")
    _action(client, session_id, "查看值班表")
    _action(client, session_id, "前往隔离病房")
    _action(client, session_id, "验证规则：听到双响铃时，低头数到四，再移动")
    hospital_move = _action(client, session_id, "前往服务出口")
    if hospital_move.get("combat", {}).get("active"):
        _combat(client, session_id, "exploit_rule")
    hospital_settlement = client.get(f"/api/v1/settlement/{session_id}").json()

    client.post(f"/api/v1/session/{session_id}/save", json={"slot_id": "full-flow"}).raise_for_status()
    client.post(f"/api/v1/session/{session_id}/load", json={"slot_id": "full-flow"}).raise_for_status()

    client.post("/api/v1/dungeons/apartment_night_return/enter", json={"session_id": session_id}).raise_for_status()
    _action(client, session_id, "观察楼梯间")
    _action(client, session_id, "前往配电间")
    _action(client, session_id, "检查开关")
    _action(client, session_id, "前往租客门口")
    _action(client, session_id, "验证规则：只有灯亮着时，才回应门后的声音")
    apartment_move = _action(client, session_id, "前往街口")
    if apartment_move.get("combat", {}).get("active"):
        _combat(client, session_id, "flee")
    apartment_settlement = client.get(f"/api/v1/settlement/{session_id}").json()
    hall = client.get(f"/api/v1/hall/{session_id}").json()

    client.post("/api/v1/dungeons/black_zone_mirror_records/enter", json={"session_id": session_id}).raise_for_status()
    _action(client, session_id, "观察镜厅")
    _action(client, session_id, "前往档案井")
    _action(client, session_id, "查看井壁刻痕")
    _action(client, session_id, "前往访客记录")
    _action(client, session_id, "查看访客记录")
    _action(client, session_id, "验证规则：不要说出自己的真实姓名")
    black_gate = _action(client, session_id, "前往真出口")
    if black_gate.get("combat", {}).get("active"):
        _combat(client, session_id, "exploit_rule")
    black_settlement = client.get(f"/api/v1/settlement/{session_id}").json()
    archives = client.get(f"/api/v1/archives/{session_id}").json()

    report = {
        "session_id": session_id,
        "hospital": hospital_settlement,
        "apartment": apartment_settlement,
        "hall_after_two_runs": hall,
        "black_zone": black_settlement,
        "archives": archives,
    }
    REPORT_PATH.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Full flow smoke passed: {REPORT_PATH}")


if __name__ == "__main__":
    main()

# Database Agent scaffold
