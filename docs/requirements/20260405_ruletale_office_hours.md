# Ruletale Office Hours

## Goal

把《规则怪谈游戏总体设计文档 v1》落成一个可运行、可继续用 `agentsystem` 推进的独立新项目，而不是只做一轮 demo。

## Scope Lock

- 独立仓库 `ruletale`
- Web first
- FastAPI + Next.js
- 至少两个完整常规副本 + 一个黑区事件
- 大厅、规则、心理、战斗、结算、成长全链路闭环
- `agentsystem` 最小接入 + roadmap preflight

## User Value

- 对玩家：形成“观察规则、判断真假、承担代价、带污染回厅”的连续体验
- 对交付团队：形成一个遵循 Story / Sprint 工作流的新项目基线

## Key Risks

- 规则和剧情被写死在页面层，导致后续副本不可扩展
- 过度强调战斗，削弱规则判断核心体验
- 只交付代码，不交付 roadmap / continuity / handoff / dashboard 资产
- 误把“故事很多”当成“系统能力完整”

## Decisions

- 以 engine-complete、content-extensible 为第一阶段目标
- 先做医院夜班、公寓夜归、黑区镜厅三块样本内容
- 先保证 API / Web / smoke / pytest / build / preflight 全通过
- `agentsystem` 只做最小增量接入，不改动无关脏工作树
