# 规则怪谈全量路线图交付需求

## Title

Ruletale 规则怪谈新项目接入与全量路线图交付

## Context

本需求以 [规则怪谈游戏总体设计文档_v_1.md](/D:/lyh/agent/agent-frame/ruletale/docs/requirements/规则怪谈游戏总体设计文档_v_1.md) 作为唯一业务需求源。项目目标是在 `agent-frame` 工作区中新建独立仓库 `ruletale`，通过 `agentsystem` 的标准 Story / Sprint 工作流完成接入、实现、验证与后续迭代治理。

## User Problem

当前工作区内没有可独立交付的“规则怪谈”项目仓库，也没有对应的 roadmap、dashboard 接入、运行时展示与全流程测试资产。需求文档定义了大厅、多副本、规则系统、自然语言输入、心理数值、规则型怪物、动态威胁匹配、多维结算与黑区成长，但这些能力尚未变成可运行、可测试、可继续推进的项目。

## Target Users

- 产品 owner / 需求发起人：希望把规则怪谈设计文档转成可执行项目与可持续 roadmap
- Story / Sprint 执行者：需要在 `agentsystem` 中继续交付 `ruletale`
- QA / 验收人员：需要可重复的 API、Web、runtime、roadmap preflight 验证面

## Requirement Summary

- 创建独立项目 `ruletale`，采用 `FastAPI + Next.js + .agents + tasks + docs/contracts` 结构。
- 后端必须围绕 `session / hall / dungeons / runs / actions / combat / settlement / archives` 七类 API 组织。
- 核心类型统一为 `PlayerState`、`VisibleStats`、`PsychState`、`WorldState`、`DungeonConfig`、`SceneNode`、`RuleRecord`、`NotebookEntry`、`MonsterSpec`、`SettlementReport`。
- 大厅必须具备任务墙、档案室、商店、休息区、结算台、黑区入口六个模块。
- 至少实现两个完整副本样本：医院夜班、公寓夜归；并实现至少一个黑区事件。
- 实现规则四层结构、自然语言意图识别、规则验证、记录本归档与高污染篡改。
- 实现动态威胁匹配、四类规则型怪物、有效战斗值公式、规避 / 试探 / 逃离 / 正面战斗分支。
- 实现多维结算、奖励、行为画像、大厅权限解锁、黑区入口与长期成长。
- 在 `agentsystem` 中注册 `ruletale`，补齐 dashboard 项目列表、runtime/showcase 与 roadmap preflight。
- 生成多 Sprint roadmap 资产，后续执行必须遵守 `office-hours -> plan-ceo-review -> plan-eng-review` 和 Story 全链路 Agent 规范。

## Constraints

- 不借用 `versefina` 或 `finahunt` 仓库承载规则怪谈功能。
- 对现有仓库的改动仅限 `agentsystem` 的最小必要接入。
- 剧情、规则、怪物与节点必须数据驱动，不能把副本逻辑散落硬编码在页面层。
- Web first，本轮不以小程序为主交付物。
- 不伪造 Story 已执行 / 已 accepted 的证据；流程资产与真实执行状态必须一致。

## Success Signals

- `ruletale` 后端 API 可通过 `pytest` 和 `scripts/full_flow_smoke.py`
- `ruletale` Web 可通过 `npm run build`
- `ruletale` 仓库具备 continuity / handoff / contracts / roadmap / runtime 资产
- `agentsystem` 能识别 `ruletale` 项目并对 roadmap 进行 preflight
- 最小完整主流程可跑通：Hall -> Dungeon -> Combat -> Settlement -> Hall -> Black Zone

## Out of Scope

- 不在本轮扩写无限数量副本与主线文案
- 不接入真实账号体系、支付或小程序分发
- 不把现有三仓库的大量脏工作树整理为 release-clean

## Delivery Decision

当前交付策略为 `auto` 延续执行：先完成独立仓库、功能与测试，再补齐 `agentsystem` 接入和 roadmap 资产，并执行 preflight 与本地验证。
