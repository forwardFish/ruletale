from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path
from typing import Any

from .models import GameSession


RUNTIME_ROOT = Path(__file__).resolve().parents[3] / ".runtime"
SESSIONS_DIR = RUNTIME_ROOT / "sessions"
RUNS_DIR = RUNTIME_ROOT / "runs"
SAVES_DIR = RUNTIME_ROOT / "saves"


def ensure_runtime_dirs() -> None:
    for path in (SESSIONS_DIR, RUNS_DIR, SAVES_DIR):
        path.mkdir(parents=True, exist_ok=True)


def _write_json(path: Path, payload: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")


def _read_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def session_path(session_id: str) -> Path:
    return SESSIONS_DIR / f"{session_id}.json"


def save_path(session_id: str, slot_id: str) -> Path:
    return SAVES_DIR / f"{session_id}_{slot_id}.json"


def run_report_path(run_id: str) -> Path:
    return RUNS_DIR / f"{run_id}.json"


def save_session(session: GameSession) -> GameSession:
    ensure_runtime_dirs()
    session.updated_at = datetime.now().isoformat(timespec="seconds")
    _write_json(session_path(session.session_id), session.model_dump(mode="json"))
    if session.current_run and session.current_run.settlement_report:
        _write_json(run_report_path(session.current_run.run_id), session.current_run.settlement_report.model_dump(mode="json"))
    return session


def load_session(session_id: str) -> GameSession:
    ensure_runtime_dirs()
    path = session_path(session_id)
    if not path.exists():
        raise FileNotFoundError(session_id)
    return GameSession.model_validate(_read_json(path))


def save_slot(session: GameSession, slot_id: str) -> Path:
    ensure_runtime_dirs()
    path = save_path(session.session_id, slot_id)
    _write_json(path, session.model_dump(mode="json"))
    return path


def load_slot(session_id: str, slot_id: str) -> GameSession:
    ensure_runtime_dirs()
    path = save_path(session_id, slot_id)
    if not path.exists():
        raise FileNotFoundError(f"{session_id}:{slot_id}")
    session = GameSession.model_validate(_read_json(path))
    save_session(session)
    return session


def list_run_reports(limit: int = 12) -> list[dict[str, Any]]:
    ensure_runtime_dirs()
    reports: list[dict[str, Any]] = []
    for path in sorted(RUNS_DIR.glob("run-*.json"), key=lambda item: item.stat().st_mtime, reverse=True)[:limit]:
        try:
            payload = _read_json(path)
        except Exception:
            continue
        payload["report_path"] = str(path)
        reports.append(payload)
    return reports


def load_run_report(run_id: str) -> dict[str, Any] | None:
    path = run_report_path(run_id)
    if not path.exists():
        return None
    return _read_json(path)
