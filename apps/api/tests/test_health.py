from __future__ import annotations

from fastapi.testclient import TestClient

from apps.api.src.main import app


client = TestClient(app)


def test_health_and_session_bootstrap() -> None:
    health = client.get("/healthz")
    assert health.status_code == 200
    assert health.json() == {"status": "ok"}

    start = client.post("/api/v1/session/start", json={"player_name": "巡查员"})
    assert start.status_code == 200
    payload = start.json()
    assert payload["session"]["player"]["player_name"] == "巡查员"
    module_ids = [item["module_id"] for item in payload["hall"]["modules"]]
    assert len(module_ids) == 7
    assert "backpack" in module_ids
