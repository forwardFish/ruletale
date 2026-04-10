# Ruletale

`ruletale` is the official rule-horror game project delivered through `agentsystem`.

Current shape:

- `apps/api`: FastAPI game engine and file-backed runtime persistence
- `apps/web`: Next.js product shell for the hall, dungeon, notebook, replay surfaces, and the standalone `/mvp` frontend-only prototype
- `apps/mini`: Taro React WeChat mini program shell for the local-first release line
- `packages/game-core`: shared rules engine, dungeon data, types, and platform capability contracts
- `tasks`: roadmap/story assets for `agentsystem run-roadmap`
- `docs`: contracts, requirement mirrors, and handoff material

Local start:

```powershell
cd D:\lyh\agent\agent-frame\ruletale
python -m uvicorn apps.api.src.main:app --host 127.0.0.1 --port 8011
cd D:\lyh\agent\agent-frame\ruletale\apps\web
npm install
npm run dev -- --port 3001
cd D:\lyh\agent\agent-frame\ruletale\apps\mini
npm install
npm run dev:weapp
```

Key local routes:

- API docs: [http://127.0.0.1:8011/docs](http://127.0.0.1:8011/docs)
- Existing web shell: [http://127.0.0.1:3001/](http://127.0.0.1:3001/)
- Standalone frontend MVP: [http://127.0.0.1:3001/mvp](http://127.0.0.1:3001/mvp)
- Mini app output: `apps/mini/dist/`

Validation:

```powershell
cd D:\lyh\agent\agent-frame\ruletale
python scripts\check_scaffold.py
python scripts\full_flow_smoke.py
python -m pytest apps/api/tests -q
cd D:\lyh\agent\agent-frame\ruletale\apps\web
npm run test
npm run build
```

Frontend MVP notes:

- `/mvp` is fully local and does not depend on `apps/api`
- state, inventory, archives, settlement, rewards, and understanding are persisted with localStorage
- `apps/mini` is wired for the same local-first loop through `packages/game-core` and Taro storage adapters
- the current MVP loop is:
  - lobby
  - choose dungeon
  - natural-language input
  - rule discovery / conflict / monster encounter
  - settlement
  - reward return to lobby

See [apps/web/README.md](D:\lyh\agent\agent-frame\ruletale\apps\web\README.md) for the web-specific architecture, extension guide, and test coverage.
