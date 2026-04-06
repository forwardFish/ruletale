# roadmap_1_0 Execution Playbook

## Preflight

1. Run `python scripts/check_scaffold.py`.
2. Run `python scripts/full_flow_smoke.py`.
3. Run `python -m pytest apps/api/tests -q`.
4. Run `python D:\lyh\agent\agent-frame\agentsystem\cli.py run-roadmap --project ruletale --env test --tasks-root "D:\lyh\agent\agent-frame\ruletale\tasks" --roadmap-prefix roadmap_1_0 --preflight-only`.
5. Start local API and Web surfaces for product verification.

## Formal Sprint Loop

1. Execute the current roadmap cursor with `python D:\lyh\agent\agent-frame\agentsystem\cli.py run-roadmap --resume` after preflight passes.
2. Let the sprint finish its required Story chain and sprint closeout chain: `ship -> document-release -> retro`.
3. Before leaving the sprint boundary, verify the closeout bundle exists:
   `tasks/runtime/auto_resume_state.json`,
   `NOW.md`,
   `STATE.md`,
   `docs/handoff/current_handoff.md`,
   `agentsystem/runs/sprints/ruletale/<sprint>/sprint_close_bundle.json`.
4. Confirm the pause cursor points at the next sprint/story and that the completed sprint remains accepted.
5. Capture the sprint demo evidence:
   local API/Web URLs, browser walkthrough, screenshots, key test results, and rerunnable commands.

## Compact Governance

1. After every sprint closeout, run `/compact` before starting the next sprint.
2. If `/compact` disconnects, retry in the same session up to `3` times.
3. If all retries fail, stop the current execution and keep the completed sprint as closed.
4. Resume later from the saved continuity files and `tasks/runtime/auto_resume_state.json` with `python D:\lyh\agent\agent-frame\agentsystem\cli.py run-roadmap --resume`.
5. Do not rerun the completed sprint unless the pause boundary artifacts are missing or inconsistent.

## Delivery Sequence

1. Treat `Sprint 0` and `Sprint 1` as the already accepted baseline unless continuity or acceptance artifacts prove otherwise.
2. Continue from the current cursor into `Sprint 2`, then `Sprint 3`, `Sprint 4`, and `Sprint 5`.
3. Keep the per-sprint demo format fixed:
   local run, browser acceptance/screenshots, key test output, URLs, and replay instructions.
4. Reserve `Sprint 6` for authoritative closeout only:
   runtime showcase, release evidence, handoff/docs sync, and final status convergence to `accepted`.
