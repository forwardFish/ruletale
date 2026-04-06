from __future__ import annotations

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .engine import (
    archives_view,
    dungeon_catalog,
    enter_dungeon,
    finalize_settlement,
    get_archived_run,
    get_session,
    hall_view,
    interpret_action,
    list_archived_runs,
    load_progress,
    resolve_combat,
    save_progress,
    session_runs,
    start_session,
    visit_hall_module,
)
from .models import (
    CombatActionRequest,
    EnterDungeonRequest,
    HallVisitRequest,
    InterpretActionRequest,
    LoadSlotRequest,
    SaveSlotRequest,
    StartSessionRequest,
)
from .persistence import ensure_runtime_dirs


app = FastAPI(title="Ruletale API", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup() -> None:
    ensure_runtime_dirs()


@app.get("/healthz")
def healthz() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/v1/session/start")
def api_start_session(payload: StartSessionRequest) -> dict:
    session = start_session(payload.player_name)
    return hall_view(session.session_id)


@app.get("/api/v1/session/{session_id}")
def api_get_session(session_id: str) -> dict:
    try:
        session = get_session(session_id)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail="session_not_found") from exc
    return {"session": session.model_dump(mode="json")}


@app.post("/api/v1/session/{session_id}/save")
def api_save_session(session_id: str, payload: SaveSlotRequest) -> dict:
    try:
        return save_progress(session_id, payload.slot_id)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail="session_not_found") from exc


@app.post("/api/v1/session/{session_id}/load")
def api_load_session(session_id: str, payload: LoadSlotRequest) -> dict:
    try:
        return load_progress(session_id, payload.slot_id)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail="save_not_found") from exc


@app.get("/api/v1/hall/{session_id}")
def api_hall(session_id: str) -> dict:
    try:
        return hall_view(session_id)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail="session_not_found") from exc


@app.post("/api/v1/hall/{session_id}/visit")
def api_visit_hall(session_id: str, payload: HallVisitRequest) -> dict:
    try:
        return visit_hall_module(session_id, payload.module_id)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail="session_not_found") from exc


@app.get("/api/v1/dungeons")
def api_dungeons(session_id: str) -> dict:
    try:
        return dungeon_catalog(session_id)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail="session_not_found") from exc


@app.post("/api/v1/dungeons/{dungeon_id}/enter")
def api_enter_dungeon(dungeon_id: str, payload: EnterDungeonRequest) -> dict:
    try:
        return enter_dungeon(payload.session_id, dungeon_id)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail="session_not_found") from exc
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="dungeon_not_found") from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.get("/api/v1/runs/{session_id}")
def api_runs(session_id: str) -> dict:
    try:
        return session_runs(session_id)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail="session_not_found") from exc


@app.post("/api/v1/actions/{session_id}/interpret")
def api_interpret_action(session_id: str, payload: InterpretActionRequest) -> dict:
    try:
        return interpret_action(session_id, payload.text)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail="session_not_found") from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.post("/api/v1/combat/{session_id}/resolve")
def api_resolve_combat(session_id: str, payload: CombatActionRequest) -> dict:
    try:
        return resolve_combat(session_id, payload.action)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail="session_not_found") from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.get("/api/v1/settlement/{session_id}")
def api_get_settlement(session_id: str) -> dict:
    try:
        return finalize_settlement(session_id)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail="session_not_found") from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.post("/api/v1/settlement/{session_id}/finalize")
def api_finalize_settlement(session_id: str) -> dict:
    try:
        return finalize_settlement(session_id)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail="session_not_found") from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.get("/api/v1/archives/{session_id}")
def api_archives(session_id: str) -> dict:
    try:
        return archives_view(session_id)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail="session_not_found") from exc


@app.get("/api/v1/archives/runs")
def api_archived_runs(limit: int = 12) -> dict:
    return list_archived_runs(limit=limit)


@app.get("/api/v1/archives/runs/{run_id}")
def api_archived_run(run_id: str) -> dict:
    try:
        return get_archived_run(run_id)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail="run_not_found") from exc
