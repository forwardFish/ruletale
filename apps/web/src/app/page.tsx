"use client";

import { FormEvent, useEffect, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_RULETALE_API_BASE ?? "http://127.0.0.1:8011";
const DEFAULT_PLAYER_NAME = "大厅访客";
const DEFAULT_ACTION_TEXT = "观察大厅和告示牌";
const ACTION_PRESETS = [
  "观察大厅和告示牌",
  "前往护士站",
  "查看值班表",
  "验证规则：只有灯亮着时，才回应门后的声音",
  "前往真出口",
];

type JsonMap = Record<string, any>;
type HallModuleView = {
  module_id: string;
  title: string;
  summary: string;
  locked: boolean;
  status: string;
};
type DungeonCard = {
  dungeon_id: string;
  title: string;
  kind: string;
  difficulty_band: string;
  recommended_style: string;
  reward_pool: string[];
  locked: boolean;
  lock_reason: string | null;
};
type ModuleVisit = {
  module_id: string;
  allowed: boolean;
  narrative: string;
} | null;

async function apiFetch(path: string, init?: RequestInit) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();
    try {
      const parsed = JSON.parse(text) as JsonMap;
      const detail = parsed.detail;
      if (typeof detail === "string" && detail.trim()) {
        throw new Error(detail);
      }
    } catch {
      // Fall through to the raw text below when parsing fails.
    }
    throw new Error(text || `Request failed: ${response.status}`);
  }

  return response.json();
}

function extractActiveRun(session: JsonMap | null) {
  return session?.active_run ?? session?.current_run ?? null;
}

function formatCombatAction(action: string) {
  return (
    {
      avoid: "规避",
      probe: "试探",
      fight: "正面战斗",
      flee: "逃离",
      exploit_rule: "利用规则弱点",
    }[action] ?? action
  );
}

function buildModuleHighlights(moduleId: string | null, archives: JsonMap | null, dungeons: DungeonCard[], settlement: JsonMap | null) {
  if (!moduleId) {
    return ["点击大厅模块后，这里会展开明确反馈，而不是只在顶部日志里轻微变化。"];
  }
  if (moduleId === "task_wall") {
    return [
      `当前可见副本 ${dungeons.length} 个。`,
      dungeons.some((item) => !item.locked) ? "至少有一个副本已可进入。" : "当前没有已解锁副本。",
      settlement ? `最近结算：${settlement.dungeon_title} / 综合 ${settlement.grades?.overall}` : "还没有本轮结算记录。",
    ];
  }
  if (moduleId === "archives") {
    return [
      `已发现规则 ${archives?.rules?.length ?? 0} 条。`,
      `记录本条目 ${archives?.notebook_entries?.length ?? 0} 条。`,
      `怪物档案 ${archives?.monster_archive?.length ?? 0} 条。`,
    ];
  }
  if (moduleId === "settlement_desk") {
    return [
      settlement ? `最近结算副本：${settlement.dungeon_title}` : "暂无结算记录。",
      settlement ? `行为画像：${settlement.hidden_behavior_tag}` : "行为画像需要完成副本后生成。",
      settlement ? `奖励数：${settlement.rewards?.length ?? 0}` : "奖励会在通关后写入这里。",
    ];
  }
  if (moduleId === "black_zone") {
    return [
      dungeons.find((item) => item.dungeon_id === "black_zone_mirror_records")?.locked
        ? "黑区当前仍锁定，需要先完成医院夜班和公寓夜归。"
        : "黑区入口已经解锁，可以直接进入镜厅档案。",
    ];
  }
  if (moduleId === "shop") {
    return ["商店访问会直接更新库存类反馈。", "如果还没有应急荧光笔，访问后会写入库存。"];
  }
  if (moduleId === "rest_area") {
    return ["休息区会恢复 SAN / STA，并降低恐惧。", "这是显性状态变化，不再是无反馈点击。"];
  }
  return ["大厅反馈已更新。"];
}

export default function Page() {
  const [session, setSession] = useState<JsonMap | null>(null);
  const [hall, setHall] = useState<JsonMap | null>(null);
  const [dungeons, setDungeons] = useState<DungeonCard[]>([]);
  const [scene, setScene] = useState<JsonMap | null>(null);
  const [run, setRun] = useState<JsonMap | null>(null);
  const [archives, setArchives] = useState<JsonMap | null>(null);
  const [settlement, setSettlement] = useState<JsonMap | null>(null);
  const [log, setLog] = useState("大厅会记住你的每一次输入。");
  const [actionText, setActionText] = useState(DEFAULT_ACTION_TEXT);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lastInteraction, setLastInteraction] = useState("页面已就绪，先从任务墙或副本入口开始。");
  const [activeModuleId, setActiveModuleId] = useState<string>("task_wall");
  const [moduleVisit, setModuleVisit] = useState<ModuleVisit>(null);

  const sessionId = session?.session_id as string | undefined;
  const stats = session?.player?.visible_stats ?? {};
  const psychHint = session?.player?.psych_hint ?? {};
  const behaviorProfile = session?.player?.behavior_profile ?? {};
  const modules = (hall?.modules ?? []) as HallModuleView[];
  const notebookEntries = (archives?.notebook_entries ?? []) as JsonMap[];
  const archiveRuns = (archives?.run_history ?? []) as JsonMap[];
  const rules = (archives?.rules ?? []) as JsonMap[];
  const monsterArchive = (archives?.monster_archive ?? []) as JsonMap[];
  const combat = run?.combat ?? {};
  const activeCombat = Boolean(combat?.active);
  const moduleHighlights = buildModuleHighlights(activeModuleId, archives, dungeons, settlement);

  async function refreshHallAndArchives(activeSessionId: string) {
    const hallPayload = await apiFetch(`/api/v1/hall/${activeSessionId}`);
    const dungeonPayload = await apiFetch(`/api/v1/dungeons?session_id=${activeSessionId}`);
    const archivePayload = await apiFetch(`/api/v1/archives/${activeSessionId}`);
    setSession(hallPayload.session);
    setRun(extractActiveRun(hallPayload.session));
    setHall(hallPayload.hall);
    setDungeons((dungeonPayload.dungeons ?? []) as DungeonCard[]);
    setArchives(archivePayload.archives);
  }

  async function refreshSettlement(activeSessionId: string) {
    try {
      const payload = await apiFetch(`/api/v1/settlement/${activeSessionId}`);
      setSettlement(payload.settlement);
      setSession(payload.session);
      setRun(extractActiveRun(payload.session));
    } catch {
      // Ignore while a run is still active.
    }
  }

  async function bootstrap() {
    setLoading(true);
    setError("");
    try {
      const payload = await apiFetch("/api/v1/session/start", {
        method: "POST",
        body: JSON.stringify({ player_name: DEFAULT_PLAYER_NAME }),
      });
      setSession(payload.session);
      setRun(extractActiveRun(payload.session));
      setHall(payload.hall);
      setDungeons((payload.hall?.available_dungeons ?? []) as DungeonCard[]);
      setScene(null);
      setSettlement(null);
      setModuleVisit({
        module_id: "task_wall",
        allowed: true,
        narrative: "任务墙已经展开。当前可以先从医院夜班或公寓夜归进入正式流程。",
      });
      setActiveModuleId("task_wall");
      setLastInteraction("会话已创建，大厅和副本入口已加载。");
      setLog("你醒来时已经站在大厅中央。管理员没有出现，但任务墙已经替你亮起。");

      const createdSessionId = payload.session?.session_id as string;
      const archivePayload = await apiFetch(`/api/v1/archives/${createdSessionId}`);
      setArchives(archivePayload.archives);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "初始化失败");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void bootstrap();
  }, []);

  async function handleEnterDungeon(dungeonId: string) {
    if (!sessionId) return;
    setLoading(true);
    setError("");
    const selectedDungeon = dungeons.find((item) => item.dungeon_id === dungeonId);
    setLastInteraction(`正在进入 ${selectedDungeon?.title ?? dungeonId}...`);
    try {
      const payload = await apiFetch(`/api/v1/dungeons/${dungeonId}/enter`, {
        method: "POST",
        body: JSON.stringify({ session_id: sessionId }),
      });
      setSession(payload.session);
      setRun(payload.run);
      setScene(payload.scene);
      setSettlement(null);
      setActiveModuleId("task_wall");
      setModuleVisit({
        module_id: "task_wall",
        allowed: true,
        narrative: `${payload.run?.dungeon_title ?? "副本"} 已进入，当前场景：${payload.scene?.title ?? "未知场景"}。`,
      });
      setLog(payload.scene?.description ?? "你进入了新的副本。");
      setLastInteraction(`已进入 ${payload.run?.dungeon_title ?? dungeonId}。`);
      await refreshHallAndArchives(sessionId);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "进入副本失败");
      setLastInteraction("副本进入失败。");
    } finally {
      setLoading(false);
    }
  }

  async function handleActionSubmit(event?: FormEvent) {
    event?.preventDefault();
    if (!sessionId || !actionText.trim()) return;
    setLoading(true);
    setError("");
    setLastInteraction(`正在执行动作：${actionText}`);
    try {
      const payload = await apiFetch(`/api/v1/actions/${sessionId}/interpret`, {
        method: "POST",
        body: JSON.stringify({ text: actionText }),
      });
      setSession(payload.session);
      setRun(payload.run);
      setScene(payload.scene);
      setLog(payload.narrative ?? "场景没有回应。");
      setLastInteraction(payload.illegal_action ? "动作被判定为非法或无效。" : "动作已执行，场景结果已更新。");
      if (payload.settlement_ready && !payload.combat?.active) {
        await refreshSettlement(sessionId);
      }
      await refreshHallAndArchives(sessionId);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "动作执行失败");
      setLastInteraction("动作执行失败。");
    } finally {
      setLoading(false);
    }
  }

  async function handleCombat(action: string) {
    if (!sessionId) return;
    setLoading(true);
    setError("");
    setLastInteraction(`正在执行战斗动作：${formatCombatAction(action)}`);
    try {
      const payload = await apiFetch(`/api/v1/combat/${sessionId}/resolve`, {
        method: "POST",
        body: JSON.stringify({ action }),
      });
      setSession(payload.session);
      setRun(payload.run);
      setLog(payload.combat_result?.narrative ?? "战斗结算完成。");
      setLastInteraction(`战斗动作完成：${formatCombatAction(action)}`);
      if (payload.settlement_ready) {
        await refreshSettlement(sessionId);
      }
      await refreshHallAndArchives(sessionId);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "战斗结算失败");
      setLastInteraction("战斗结算失败。");
    } finally {
      setLoading(false);
    }
  }

  async function handleVisitHall(moduleId: string) {
    if (!sessionId) return;
    setLoading(true);
    setError("");
    setActiveModuleId(moduleId);
    const clickedModule = modules.find((item) => item.module_id === moduleId);
    setLastInteraction(`正在进入 ${clickedModule?.title ?? moduleId}...`);
    try {
      const payload = await apiFetch(`/api/v1/hall/${sessionId}/visit`, {
        method: "POST",
        body: JSON.stringify({ module_id: moduleId }),
      });
      setSession(payload.session);
      setRun(extractActiveRun(payload.session));
      setModuleVisit(payload.visit ?? null);
      setLog(payload.visit?.narrative ?? "大厅没有回应。");
      setLastInteraction(`${clickedModule?.title ?? moduleId} 已响应。`);
      await refreshHallAndArchives(sessionId);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "大厅访问失败");
      setLastInteraction("大厅访问失败。");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="shell">
      <section className="hero">
        <div className="hero-grid">
          <div>
            <div className="eyebrow">Rule Horror Workflow Ready</div>
            <h1>Ruletale</h1>
            <p>
              大厅不是菜单，副本也不是单纯文本框。这里把规则发现、自然语言推进、心理修正、规则型怪物战斗、
              多维结算和黑区成长全部压到一条可验证的 Web 流程里。
            </p>
            <div className="pill-row">
              <span className="pill">Session {sessionId ?? "building"}</span>
              <span className="pill">API {API_BASE}</span>
              <span className="pill">状态 {run?.status ?? "hall"}</span>
              <span className="pill">副本 {run?.dungeon_title ?? "未进入"}</span>
            </div>
          </div>

          <div className="panel">
            <div className="section-title">当前回声</div>
            <p className="section-copy">{hall?.admin_hint ?? "管理员还没有留下新的说明。"}</p>
            <div className="subtle">最近叙述</div>
            <div className="log">{log}</div>
          </div>
        </div>
      </section>

      <section className="status-strip">
        <div className="status-banner">
          <strong>最近动作</strong>
          <span>{lastInteraction}</span>
        </div>
        <div className={`status-banner ${error ? "status-banner-error" : ""}`}>
          <strong>{error ? "错误" : loading ? "处理中" : "系统状态"}</strong>
          <span>{error || (loading ? "正在请求最新结果..." : "页面交互已就绪，可以继续点击。")}</span>
        </div>
      </section>

      <section className="stats-grid" style={{ marginTop: 18 }}>
        {[
          ["HP", stats.hp],
          ["SAN", stats.san],
          ["STA", stats.sta],
          ["COG", stats.cog],
          ["COR", stats.cor],
        ].map(([label, value]) => (
          <div className="stat" key={label}>
            <div className="stat-label">{label}</div>
            <div className="stat-value">{value ?? "--"}</div>
          </div>
        ))}
      </section>

      <section className="main-grid">
        <div className="stack">
          <div className="panel">
            <div className="section-title">大厅模块</div>
            <p className="section-copy">点击后会在右侧内容区展开明确反馈和状态变化，不再是“像没反应一样”的轻微日志更新。</p>
            <div className="list">
              {modules.map((module) => (
                <article className={`card ${activeModuleId === module.module_id ? "card-active" : ""}`} key={module.module_id}>
                  <h3>{module.title}</h3>
                  <p>{module.summary}</p>
                  <div className="meta-row">
                    <span className="meta">{module.status}</span>
                    <span className="meta">{module.locked ? "锁定" : "可访问"}</span>
                  </div>
                  <div style={{ marginTop: 14 }}>
                    <button
                      type="button"
                      disabled={loading || module.locked}
                      onClick={() => void handleVisitHall(module.module_id)}
                    >
                      {activeModuleId === module.module_id ? "已展开" : `进入 ${module.title}`}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="panel">
            <div className="section-title">副本入口</div>
            <p className="section-copy">这里直接连到 API 的副本进入接口。进入成功后，当前场景、威胁值和战斗选项会立刻出现在右侧运行面板。</p>
            <div className="list">
              {dungeons.map((dungeon) => (
                <article className={`card ${run?.dungeon_id === dungeon.dungeon_id ? "card-active" : ""}`} key={dungeon.dungeon_id}>
                  <h3>{dungeon.title}</h3>
                  <p>{dungeon.recommended_style}</p>
                  <div className="meta-row">
                    <span className="meta">{dungeon.kind}</span>
                    <span className="meta">难度 {dungeon.difficulty_band}</span>
                    <span className={`meta ${dungeon.locked ? "warning" : "signal"}`}>{dungeon.locked ? "未解锁" : "可挑战"}</span>
                  </div>
                  {dungeon.lock_reason ? <p className="warning" style={{ marginTop: 10 }}>{dungeon.lock_reason}</p> : null}
                  <div style={{ marginTop: 14 }}>
                    <button
                      type="button"
                      disabled={loading || dungeon.locked}
                      onClick={() => void handleEnterDungeon(dungeon.dungeon_id)}
                    >
                      {run?.dungeon_id === dungeon.dungeon_id && run?.status === "active" ? "副本进行中" : `进入 ${dungeon.title}`}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>

        <div className="stack">
          <div className="panel">
            <div className="section-title">大厅反馈</div>
            <p className="section-copy">这里专门展示大厅按钮点击后的结果，避免点击后“看不出变化”。</p>
            <div className="card">
              <h3>{modules.find((item) => item.module_id === activeModuleId)?.title ?? "任务墙"}</h3>
              <p>{moduleVisit?.narrative ?? "点击任意大厅模块后，这里会显示对应叙事与状态反馈。"}</p>
              <div className="meta-row">
                {moduleHighlights.map((item) => (
                  <span className="meta signal" key={item}>
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="panel">
            <div className="section-title">当前副本运行</div>
            <p className="section-copy">进入副本后，这里会明确显示当前场景、威胁、步数、规则发现和战斗状态。</p>

            <div className="card">
              <h3>{scene?.title ?? run?.dungeon_title ?? "尚未进入副本"}</h3>
              <p>{scene?.description ?? "从左侧副本入口进入后，这里会显示当前场景文本。Hall 按钮不会再和副本按钮混在一起。"}
              </p>
              <div className="meta-row">
                <span className="meta">Run {run?.run_id ?? "--"}</span>
                <span className="meta">状态 {run?.status ?? "hall"}</span>
                <span className="meta">威胁 {run?.threat_value ?? "--"}</span>
                <span className="meta">步数 {run?.step_count ?? 0}</span>
              </div>
              <div className="meta-row">
                {(scene?.visible_objects ?? []).map((item: string) => (
                  <span className="meta" key={item}>
                    {item}
                  </span>
                ))}
              </div>
              {scene?.clues?.length ? (
                <div className="info-grid" style={{ marginTop: 14 }}>
                  {scene.clues.map((item: string) => (
                    <div className="info-chip" key={item}>
                      {item}
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            <form className="control" onSubmit={handleActionSubmit} style={{ marginTop: 14 }}>
              <textarea
                value={actionText}
                onChange={(event) => setActionText(event.target.value)}
                placeholder="你想做什么？例如：观察大厅和告示牌 / 前往护士站 / 验证规则：不要说出自己的真实姓名"
              />
              <div className="action-grid">
                {ACTION_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    disabled={loading}
                    onClick={() => setActionText(preset)}
                  >
                    快填
                  </button>
                ))}
              </div>
              <button type="submit" disabled={loading || !sessionId}>
                {loading ? "处理中..." : "提交动作"}
              </button>
            </form>

            {activeCombat ? (
              <div className="control" style={{ marginTop: 14 }}>
                <div className="section-title" style={{ fontSize: 24 }}>战斗抉择</div>
                <div className="meta-row">
                  <span className="meta warning">{combat.monster_name ?? "未知怪物"}</span>
                  <span className="meta">{combat.weakness_known ? "弱点已知" : "弱点未确认"}</span>
                </div>
                <div className="action-grid">
                  {["avoid", "probe", "fight", "flee", "exploit_rule"].map((action) => (
                    <button key={action} type="button" disabled={loading} onClick={() => void handleCombat(action)}>
                      {formatCombatAction(action)}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <div className="panel">
            <div className="section-title">结算与画像</div>
            <p className="section-copy">结算不是单一总分，而是生存、心理、规则、战斗、抉择五维评价和长期行为画像。</p>
            {settlement ? (
              <div className="card">
                <h3>{settlement.dungeon_title}</h3>
                <p>{settlement.summary}</p>
                <div className="meta-row">
                  <span className="meta">生存 {settlement.grades?.survival}</span>
                  <span className="meta">心理 {settlement.grades?.mental}</span>
                  <span className="meta">规则 {settlement.grades?.rules}</span>
                  <span className="meta">战斗 {settlement.grades?.combat}</span>
                  <span className="meta">抉择 {settlement.grades?.choice}</span>
                  <span className="meta accent">综合 {settlement.grades?.overall}</span>
                </div>
                <div className="meta-row">
                  {(settlement.rewards ?? []).map((reward: string) => (
                    <span className="meta signal" key={reward}>
                      {reward}
                    </span>
                  ))}
                  {(settlement.unlocked_features ?? []).map((item: string) => (
                    <span className="meta warning" key={item}>
                      解锁 {item}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="empty">进入结算节点后，这里会展示本次副本的评级、奖励与隐藏行为画像。</div>
            )}
          </div>
        </div>
      </section>

      <section className="detail-grid">
        <div className="panel">
          <div className="section-title">心理提示</div>
          <div className="list">
            {Object.entries(psychHint).map(([key, value]) => (
              <div className="card" key={key}>
                <h4>{key.toUpperCase()}</h4>
                <p>{String(value)}</p>
              </div>
            ))}
            <div className="card">
              <h4>行为画像</h4>
              <p>{Object.entries(behaviorProfile).map(([key, value]) => `${key}: ${value}`).join(" / ") || "尚无画像"}</p>
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="section-title">记录本与规则</div>
          <div className="list">
            {rules.length === 0 ? <div className="empty">尚未发现规则。</div> : null}
            {rules.slice(0, 6).map((rule: JsonMap) => (
              <div className="card" key={rule.rule_id}>
                <h4>{rule.text}</h4>
                <p>
                  {rule.rule_type} / {rule.verified ? "已验证" : "待验证"}
                </p>
              </div>
            ))}
            {notebookEntries.slice(0, 4).map((entry: JsonMap) => (
              <div className="card" key={entry.entry_id}>
                <h4>{entry.title}</h4>
                <p>{entry.content}</p>
                {entry.tampered ? <p className="warning">高污染下记录已被篡改</p> : null}
              </div>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="section-title">回放档案</div>
          <div className="list">
            {archiveRuns.length === 0 ? <div className="empty">完成副本后，这里会出现结算回放。</div> : null}
            {archiveRuns.slice(0, 5).map((item: JsonMap) => (
              <div className="card" key={item.run_id}>
                <h4>{item.dungeon_title}</h4>
                <p>
                  结果 {item.outcome} / 画像 {item.hidden_behavior_tag}
                </p>
              </div>
            ))}
            {monsterArchive.slice(0, 3).map((item: JsonMap) => (
              <div className="card" key={item.monster_id}>
                <h4>{item.name}</h4>
                <p>{item.archive_hint}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
