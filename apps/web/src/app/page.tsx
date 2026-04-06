"use client";

import { FormEvent, useEffect, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_RULETALE_API_BASE ?? "http://127.0.0.1:8011";

type JsonMap = Record<string, any>;

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
    const detail = await response.text();
    throw new Error(detail || `Request failed: ${response.status}`);
  }

  return response.json();
}

export default function Page() {
  const [session, setSession] = useState<JsonMap | null>(null);
  const [hall, setHall] = useState<JsonMap | null>(null);
  const [dungeons, setDungeons] = useState<JsonMap[]>([]);
  const [scene, setScene] = useState<JsonMap | null>(null);
  const [run, setRun] = useState<JsonMap | null>(null);
  const [archives, setArchives] = useState<JsonMap | null>(null);
  const [settlement, setSettlement] = useState<JsonMap | null>(null);
  const [log, setLog] = useState("大厅会记住你的每一次输入。");
  const [actionText, setActionText] = useState("观察大厅和告示牌");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const sessionId = session?.session_id as string | undefined;

  async function refreshHallAndArchives(activeSessionId: string) {
    const hallPayload = await apiFetch(`/api/v1/hall/${activeSessionId}`);
    const dungeonPayload = await apiFetch(`/api/v1/dungeons?session_id=${activeSessionId}`);
    const archivePayload = await apiFetch(`/api/v1/archives/${activeSessionId}`);
    setSession(hallPayload.session);
    setHall(hallPayload.hall);
    setDungeons(dungeonPayload.dungeons ?? []);
    setArchives(archivePayload.archives);
  }

  async function refreshSettlement(activeSessionId: string) {
    try {
      const payload = await apiFetch(`/api/v1/settlement/${activeSessionId}`);
      setSettlement(payload.settlement);
      setSession(payload.session);
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
        body: JSON.stringify({ player_name: "大厅访客" }),
      });
      setSession(payload.session);
      setHall(payload.hall);
      setDungeons(payload.hall?.available_dungeons ?? []);
      setScene(null);
      setRun(payload.session?.current_run ?? null);
      setSettlement(null);
      setLog("你醒来时已经站在大厅中央。管理员没有出现，任务墙却已经替你亮起。");
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
    try {
      const payload = await apiFetch(`/api/v1/dungeons/${dungeonId}/enter`, {
        method: "POST",
        body: JSON.stringify({ session_id: sessionId }),
      });
      setSession(payload.session);
      setRun(payload.run);
      setScene(payload.scene);
      setSettlement(null);
      setLog(payload.scene?.description ?? "你进入了新的副本。");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "进入副本失败");
    } finally {
      setLoading(false);
    }
  }

  async function handleActionSubmit(event?: FormEvent) {
    event?.preventDefault();
    if (!sessionId || !actionText.trim()) return;
    setLoading(true);
    setError("");
    try {
      const payload = await apiFetch(`/api/v1/actions/${sessionId}/interpret`, {
        method: "POST",
        body: JSON.stringify({ text: actionText }),
      });
      setSession(payload.session);
      setRun(payload.run);
      setScene(payload.scene);
      setLog(payload.narrative ?? "场景没有回应。");
      if (payload.settlement_ready && !payload.combat?.active) {
        await refreshSettlement(sessionId);
      }
      await refreshHallAndArchives(sessionId);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "动作执行失败");
    } finally {
      setLoading(false);
    }
  }

  async function handleCombat(action: string) {
    if (!sessionId) return;
    setLoading(true);
    setError("");
    try {
      const payload = await apiFetch(`/api/v1/combat/${sessionId}/resolve`, {
        method: "POST",
        body: JSON.stringify({ action }),
      });
      setSession(payload.session);
      setRun(payload.run);
      setLog(payload.combat_result?.narrative ?? "战斗结算完成。");
      if (payload.settlement_ready) {
        await refreshSettlement(sessionId);
      }
      await refreshHallAndArchives(sessionId);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "战斗结算失败");
    } finally {
      setLoading(false);
    }
  }

  async function handleVisitHall(moduleId: string) {
    if (!sessionId) return;
    setLoading(true);
    setError("");
    try {
      const payload = await apiFetch(`/api/v1/hall/${sessionId}/visit`, {
        method: "POST",
        body: JSON.stringify({ module_id: moduleId }),
      });
      setSession(payload.session);
      setLog(payload.visit?.narrative ?? "大厅没有回应。");
      await refreshHallAndArchives(sessionId);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "大厅访问失败");
    } finally {
      setLoading(false);
    }
  }

  const stats = session?.player?.visible_stats ?? {};
  const psychHint = session?.player?.psych_hint ?? {};
  const modules = (hall?.modules ?? []) as JsonMap[];
  const notebookEntries = (archives?.notebook_entries ?? []) as JsonMap[];
  const archiveRuns = (archives?.run_history ?? []) as JsonMap[];
  const rules = (archives?.rules ?? []) as JsonMap[];
  const activeCombat = run?.combat?.active;

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
            </div>
          </div>
          <div className="panel">
            <div className="section-title">当前回声</div>
            <p className="section-copy">
              {hall?.admin_hint ?? "管理员还没有留下新的说明。"}
            </p>
            <div className="subtle">最近叙述</div>
            <div className="log">{log}</div>
          </div>
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
            <p className="section-copy">
              六个模块都会反馈状态与叙事，不再是纯菜单页。
            </p>
            <div className="list">
              {modules.map((module) => (
                <article className="card" key={module.module_id}>
                  <h3>{module.title}</h3>
                  <p>{module.summary}</p>
                  <div className="meta-row">
                    <span className="meta">{module.status}</span>
                    <span className="meta">{module.locked ? "锁定" : "可访问"}</span>
                  </div>
                  <div style={{ marginTop: 14 }}>
                    <button disabled={loading || module.locked} onClick={() => void handleVisitHall(module.module_id)}>
                      进入 {module.title}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="panel">
            <div className="section-title">副本入口</div>
            <p className="section-copy">
              动态匹配会依据当前状态微调威胁值，但系统不会直接把真实倍率告诉玩家。
            </p>
            <div className="list">
              {dungeons.map((dungeon) => (
                <article className="card" key={dungeon.dungeon_id}>
                  <h3>{dungeon.title}</h3>
                  <p>{dungeon.recommended_style}</p>
                  <div className="meta-row">
                    <span className="meta">{dungeon.kind}</span>
                    <span className="meta">难度 {dungeon.difficulty_band}</span>
                    <span className={`meta ${dungeon.locked ? "warning" : "signal"}`}>
                      {dungeon.locked ? "未解锁" : "可挑战"}
                    </span>
                  </div>
                  <div style={{ marginTop: 14 }}>
                    <button disabled={loading || dungeon.locked} onClick={() => void handleEnterDungeon(dungeon.dungeon_id)}>
                      进入 {dungeon.title}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>

        <div className="stack">
          <div className="panel">
            <div className="section-title">当前场景</div>
            <p className="section-copy">
              上方环境文本、中段线索、下方输入框的结构对应需求文档里的交互建议。
            </p>
            <div className="card">
              <h3>{scene?.title ?? "尚未进入副本"}</h3>
              <p>{scene?.description ?? "从大厅选择一个副本后，这里会开始记录场景、规则与怪物反应。"}</p>
              <div className="meta-row">
                {(scene?.visible_objects ?? []).map((item: string) => (
                  <span className="meta" key={item}>
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <form className="control" onSubmit={handleActionSubmit} style={{ marginTop: 14 }}>
              <textarea
                value={actionText}
                onChange={(event) => setActionText(event.target.value)}
                placeholder="你想做什么？例如：观察大厅和告示牌 / 前往护士站 / 验证规则：不要说出自己的真实姓名"
              />
              <div className="action-grid">
                {[
                  "观察大厅和告示牌",
                  "前往护士站",
                  "查看值班表",
                  "验证规则：只有灯亮着时，才回应门后的声音",
                  "前往真出口",
                ].map((preset) => (
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
                <div className="section-title" style={{ fontSize: 24 }}>
                  战斗抉择
                </div>
                <div className="action-grid">
                  {["avoid", "probe", "fight", "flee", "exploit_rule"].map((action) => (
                    <button key={action} type="button" disabled={loading} onClick={() => void handleCombat(action)}>
                      {action}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {error ? <p className="warning">{error}</p> : null}
          </div>

          <div className="panel">
            <div className="section-title">结算与画像</div>
            <p className="section-copy">
              结算不是单一总分，而是生存、心理、规则、战斗、抉择五维评价和长期行为画像。
            </p>
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
          </div>
        </div>
      </section>
    </main>
  );
}
