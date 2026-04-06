# Ruletale Game API

Base URL: `http://127.0.0.1:8011`

## Session

- `POST /api/v1/session/start`
- `GET /api/v1/session/{session_id}`
- `POST /api/v1/session/{session_id}/save`
- `POST /api/v1/session/{session_id}/load`

## Hall

- `GET /api/v1/hall/{session_id}`
- `POST /api/v1/hall/{session_id}/visit`

## Dungeons

- `GET /api/v1/dungeons`
- `POST /api/v1/dungeons/{dungeon_id}/enter`

## Runs

- `GET /api/v1/runs/{session_id}`

## Actions

- `POST /api/v1/actions/{session_id}/interpret`

## Combat

- `POST /api/v1/combat/{session_id}/resolve`

## Settlement

- `GET /api/v1/settlement/{session_id}`
- `POST /api/v1/settlement/{session_id}/finalize`

## Archives

- `GET /api/v1/archives/{session_id}`
- `GET /api/v1/archives/runs`
- `GET /api/v1/archives/runs/{run_id}`

## Core Models

- `PlayerState`
- `VisibleStats`
- `PsychState`
- `WorldState`
- `DungeonConfig`
- `SceneNode`
- `RuleRecord`
- `NotebookEntry`
- `MonsterSpec`
- `SettlementReport`

