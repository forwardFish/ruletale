# Ruletale Web MVP

`apps/web` 现在同时承载两套前端入口：

- `/`：现有的 API 联调版外壳，保留不动
- `/mvp`：新增的前端单机规则怪谈 MVP，本次实现的主入口

这套 MVP 完全运行在前端本地，不依赖 `apps/api`。核心循环已经打通：

大厅 -> 选择副本 -> 输入行动 -> 规则发现/冲突/怪物/战斗 -> 结算 -> 奖励回大厅

## Tech Stack

- Next.js 15 App Router
- React 19
- TypeScript
- Tailwind CSS v4
- Zustand + localStorage persist
- Zod
- Framer Motion
- Vitest

## Start

```powershell
cd D:\lyh\agent\agent-frame\ruletale\apps\web
npm install
npm run dev -- --port 3001
```

打开：

- 旧前端壳：[http://127.0.0.1:3001/](http://127.0.0.1:3001/)
- 新单机 MVP：[http://127.0.0.1:3001/mvp](http://127.0.0.1:3001/mvp)

## Validation

```powershell
cd D:\lyh\agent\agent-frame\ruletale\apps\web
npm run test
npm run build
```

当前已覆盖的核心测试：

- `tests/inputParser.test.ts`
- `tests/combatEngine.test.ts`
- `tests/scoringEngine.test.ts`
- `tests/threatEngine.test.ts`
- `tests/inventoryEngine.test.ts`
- `tests/understandingEngine.test.ts`

## Directory Guide

主要目录：

- `src/app/mvp/`：MVP 路由入口
- `src/components/mvp/`：大厅、副本、通用布局组件
- `src/lib/data/`：副本、规则、怪物、物品、奖励、结局等数据配置
- `src/lib/engine/`：输入解析、节点驱动、战斗、威胁、结算、奖励、理解度等核心逻辑
- `src/lib/types/`：MVP 与旧壳共存的类型定义
- `src/store/gameStore.ts`：唯一状态入口，本地存档也从这里出发

## Core Systems

### Lobby

`/mvp` 大厅包含：

- 任务墙
- 档案室
- 休息区
- 结算台
- 背包入口
- 理解度展示
- 最近奖励区
- 商店
- 黑区锁定入口

大厅不是纯菜单页。它会持续反映：

- 当前显性状态
- 污染值
- 行为标签
- 最近结算
- 已解锁档案
- 已获得物品

### Dungeon

当前 MVP 实装副本：`hospital_night_shift`

内容包括：

- 住院部大厅
- 告示牌与广播冲突
- 护士站和值班表
- 错误护士
- 107 房间求救诱导
- 旧档案室
- 镜面滞后
- 电梯/楼梯出口判断

副本使用“节点 + 状态 + 输入解析”驱动，不是固定按钮分支小说。

### Input Parser

输入框支持把中文短句解析成结构化动作，核心意图包括：

- `observe`
- `inspect_object`
- `move_to_area`
- `ask_question`
- `verify_rule`
- `respond_voice`
- `hide`
- `wait`
- `use_item`
- `fight`
- `flee`
- `test_boundary`
- `open_inventory`
- `check_archive`

理解度越高，模糊输入越容易被解析成“观察/验证/求证”而不是盲动。

### Inventory

背包在大厅和副本中都可打开，支持：

- 查看详情
- 叠加数量
- 按场景限制可用性
- 直接通过输入触发使用，例如“使用手电”“使用镇静针剂”

物品定义位于：

- `src/lib/data/items.ts`

背包逻辑位于：

- `src/lib/engine/inventoryEngine.ts`

### Understanding

怪谈理解度是长期成长值，跨副本保留，不会因为重开副本重置。

它会影响：

- 场景额外洞察是否显示
- 输入解析偏向
- 伪规则异常感知
- 怪物弱点提示

相关实现：

- `src/lib/engine/understandingEngine.ts`
- `src/lib/types/understanding.ts`

### Local Save

Zustand 持久化 key：

- `ruletale-mvp-save-v1`

保存内容包括：

- 玩家属性
- 理解度
- 背包
- 档案
- 最近奖励
- 当前大厅状态
- 当前副本运行态

如需彻底清档，使用大厅内清档动作，或手动清理浏览器 localStorage。

## How To Extend A Second Dungeon

新增第二副本时，按下面顺序扩展：

1. 在 `src/lib/data/` 新建副本数据文件，例如 `dungeon_school_midnight.ts`
2. 定义节点、节点交互、规则发现、关键结局、怪物触发
3. 如有新规则，补到独立规则数据文件
4. 如有新怪物，补到 `src/lib/data/monsters.ts`
5. 在 `src/lib/data/lobby.ts` 注册新的大厅副本卡片
6. 在 `src/lib/engine/nodeEngine.ts` 的副本映射中注册新副本
7. 为新机制补充对应测试

原则：

- 新内容优先放数据层
- 不把副本逻辑写进页面组件
- 不修改 `gameStore` 的基础结构，除非是全局系统级新增

## Notes

- 当前 MVP 是前端单机原型，不依赖大模型或 API。
- 旧首页仍然保留，并在右下角提供 `/mvp` 入口。
- 黑市系统当前只做锁定态和数据预留，没有完整经济闭环。
