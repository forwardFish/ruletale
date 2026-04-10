# Ruletale Mini

This is the Taro React WeChat mini program shell for Ruletale's local-first gameplay loop.

Run from a clean checkout:

```powershell
cd D:\lyh\agent\agent-frame\ruletale\apps\mini
npm install
npm run build:weapp
```

Open `D:\lyh\agent\agent-frame\ruletale\apps\mini` in WeChat DevTools. `project.config.json` uses `miniprogramRoot: "dist"`, so DevTools reads the compiled output from `apps/mini/dist`.

Notes:

- `appid` is intentionally `touristappid` for local development.
- Gameplay is local-only and uses Taro storage for saves.
- Shared rules, dungeon data, engine logic, and types come from `../../packages/game-core`.
- The deployable web app remains the existing Next.js app under `apps/web`; this mini app does not introduce a separate Taro H5 target.
