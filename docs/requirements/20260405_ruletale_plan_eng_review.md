# Ruletale Plan Engineering Review

## Architecture Verdict

采用数据驱动内容层 + 文件持久化运行时 + 轻量 Web 壳的方案，可在不引入额外基础设施的前提下覆盖规则怪谈 MVP 到 roadmap 继续迭代的核心能力。

## Recommended Delivery Slices

1. Sprint 0：仓库骨架、contracts、continuity、dashboard 接入、preflight
2. Sprint 1：大厅六模块、基础状态、存读档、档案室、记录本
3. Sprint 2：意图识别、规则引擎、规则发现 / 验证 / 篡改
4. Sprint 3：动态匹配、两个常规副本、NPC 可信度与回厅链路
5. Sprint 4：怪物与战斗分支
6. Sprint 5：结算、成长、黑区解锁与黑区事件
7. Sprint 6：runtime 回放、审计视图、roadmap closeout

## Contract Requirements

- 后端统一 API 组：`session / hall / dungeons / runs / actions / combat / settlement / archives`
- 类型统一放在模型层，供 API、前端和 roadmap 共同引用
- 副本节点、规则、怪物与 NPC 放在集中式内容配置中
- 前端只消费 API，不承载业务判定

## Verification Requirements

- `python scripts/check_scaffold.py`
- `python -m pytest apps/api/tests -q`
- `python scripts/full_flow_smoke.py`
- `npm run build`
- `python cli.py run-roadmap --project ruletale --env test --tasks-root "...\\ruletale\\tasks" --roadmap-prefix roadmap_1_0 --preflight-only`

## Open Execution Note

Story 全链路 agent 执行状态必须由真实运行结果回写，不能人工把 `accepted` 写成已完成。当前阶段允许先完成功能和 roadmap preflight，再由后续正式 roadmap 执行把 Story 状态推进到 accepted。
