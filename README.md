# Ruletale

`ruletale` is the official rule-horror game project delivered through `agentsystem`.

Current shape:

- `apps/api`: FastAPI game engine and file-backed runtime persistence
- `apps/web`: Next.js product shell for the hall, dungeon, notebook, and replay surfaces
- `tasks`: roadmap/story assets for `agentsystem run-roadmap`
- `docs`: contracts, requirement mirrors, and handoff material

Local start:

```powershell
cd D:\lyh\agent\agent-frame\ruletale
python -m uvicorn apps.api.src.main:app --host 127.0.0.1 --port 8011
cd D:\lyh\agent\agent-frame\ruletale\apps\web
npm install
npm run dev -- --port 3001
```

Validation:

```powershell
cd D:\lyh\agent\agent-frame\ruletale
python scripts\check_scaffold.py
python scripts\full_flow_smoke.py
python -m pytest apps/api/tests -q
cd D:\lyh\agent\agent-frame\ruletale\apps\web
npm run build
```
