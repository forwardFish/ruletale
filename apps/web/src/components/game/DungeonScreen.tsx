import type { FormEvent } from "react";

import { coreMeters, dungeonActionPresets, dungeonDrawerTabs, sideMeters } from "@/lib/copy";
import type { DungeonViewModel } from "@/lib/viewModels";

import { EventFeed } from "./EventFeed";
import { InteractionList } from "./InteractionList";
import { InventoryButton } from "./InventoryButton";
import { InventoryPanel } from "./InventoryPanel";
import { MonsterCard } from "./MonsterCard";
import { RewardPanel } from "./RewardPanel";
import { RuleHintCard } from "./RuleHintCard";
import { SceneRenderer } from "./SceneRenderer";
import { StatBadges } from "./StatBadges";
import { UnderstandingBadge } from "./UnderstandingBadge";
import { UnderstandingProgress } from "./UnderstandingProgress";
import { CombatPanel } from "./CombatPanel";

type DungeonScreenProps = {
  viewModel: DungeonViewModel;
  setActiveDrawer: (tab: "inventory" | "records" | "status") => void;
  setActionText: (text: string) => void;
  toggleComposer: () => void;
  hideComposer: () => void;
  submitAction: (text: string) => Promise<void>;
  resolveCombat: (action: string) => Promise<void>;
  goBackToHall: () => void;
};

export function DungeonScreen({
  viewModel,
  setActiveDrawer,
  setActionText,
  toggleComposer,
  hideComposer,
  submitAction,
  resolveCombat,
  goBackToHall,
}: DungeonScreenProps) {
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await submitAction(viewModel.actionText);
  }

  function renderDetailPanel() {
    if (viewModel.activeDrawer === "inventory") {
      return <InventoryPanel items={viewModel.inventory} scope="dungeon" />;
    }

    if (viewModel.activeDrawer === "records") {
      return (
        <div className="records-stack">
          {viewModel.rules.slice(0, 4).map((rule) => (
            <RuleHintCard
              key={rule.rule_id}
              title={rule.verified ? "已验证规则" : "待验证规则"}
              body={rule.text}
              subtle={!rule.verified}
            />
          ))}
          {viewModel.notebookEntries.slice(0, 3).map((entry) => (
            <article key={entry.entry_id} className="paper-line">
              <strong>{entry.title}</strong>
              <span>{entry.content}</span>
            </article>
          ))}
          {viewModel.recentRewards.length ? (
            <RewardPanel rewards={viewModel.recentRewards.slice(0, 2)} />
          ) : null}
          {!viewModel.rules.length && !viewModel.notebookEntries.length ? (
            <div className="soft-empty">你还没有从这一处怪谈里带走新的纸页。</div>
          ) : null}
        </div>
      );
    }

    return (
      <div className="meter-stack">
        {[...coreMeters, ...sideMeters].map((meter) => {
          const value = Number(viewModel.visibleStats?.[meter.key] ?? 0);
          const percent = meter.key === "cor" ? Math.min(100, value) : Math.max(0, Math.min(100, value));
          return (
            <div key={meter.key} className="meter-line">
              <div className="meter-head">
                <span>{meter.label}</span>
                <strong>{value}</strong>
              </div>
              <div className="meter-track">
                <div className="meter-fill" style={{ width: `${percent}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  if (viewModel.booting) {
    return (
      <main className="game-boot">
        <div className="boot-card">
          <div className="boot-kicker">Ruletale</div>
          <h1>门后的光线正在慢慢靠近</h1>
          <p>你还没想好先看哪里，但场景已经先看见你了。</p>
        </div>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <section className="dungeon-stage mobile-stage">
        <div className="film-grain" />
        <div className="hero-shell">
          <div className="hero-head">
            <div>
              <div className="overlay-kicker">{viewModel.run?.dungeon_title ?? "怪谈副本"}</div>
              <h1 className="hero-title">{viewModel.scene?.title ?? "场景还没有显影"}</h1>
            </div>
            <div className="hero-badges">
              {viewModel.understanding ? (
                <UnderstandingBadge
                  level={viewModel.understanding.level}
                  total={viewModel.understanding.total}
                />
              ) : null}
            </div>
          </div>

          <div className="page-actions">
            <InventoryButton count={viewModel.inventory.length} onClick={() => setActiveDrawer("inventory")} />
            <button type="button" className="ghost-button" onClick={goBackToHall}>
              回大厅
            </button>
          </div>

          {viewModel.scene ? (
            <SceneRenderer scene={viewModel.scene} />
          ) : (
            <div className="soft-empty">门后的场景还没有完全显影。</div>
          )}

          <div className="overview-panels">
            <article className="section-panel">
              <div className="section-head">
                <div>
                  <div className="overlay-kicker">当前状态</div>
                  <h2>先确认你还剩多少边界</h2>
                </div>
              </div>
              {viewModel.visibleStats ? <StatBadges stats={viewModel.visibleStats} /> : null}
            </article>
            <article className="section-panel">
              <div className="section-head">
                <div>
                  <div className="overlay-kicker">理解度</div>
                  <h2>越看清楚，越能拿回主动</h2>
                </div>
              </div>
              {viewModel.understanding ? (
                <UnderstandingProgress understanding={viewModel.understanding} />
              ) : (
                <div className="soft-empty">这轮副本还没有产生新的理解度变化。</div>
              )}
            </article>
          </div>
        </div>

        <div className="screen-grid">
          <div className="story-column">
            <EventFeed text={viewModel.lastNarrative} />
            {viewModel.error ? <div className="story-warning">{viewModel.error}</div> : null}

            {viewModel.monster ? (
              <MonsterCard
                monsterName={viewModel.monster.name}
                weaknessKnown={viewModel.monster.weaknessKnown}
                reason={viewModel.monster.reason}
              />
            ) : null}

            <article className="section-panel panel-stack">
              <div className="section-head">
                <div>
                  <div className="overlay-kicker">
                    {viewModel.activeCombat ? "战斗" : viewModel.settlement ? "结算" : "下一步"}
                  </div>
                  <h2>
                    {viewModel.activeCombat
                      ? "先活下来，再想答案"
                      : viewModel.settlement
                        ? "这一轮已经写完结尾"
                        : "先试一条你还能承担代价的路"}
                  </h2>
                </div>
              </div>

              {viewModel.activeCombat ? (
                <CombatPanel
                  options={viewModel.run?.combat?.options ?? ["avoid", "probe", "fight", "flee", "exploit_rule"]}
                  monsterName={viewModel.monster?.name ?? "未知怪异"}
                  weaknessKnown={viewModel.monster?.weaknessKnown}
                  onResolve={(action) => void resolveCombat(action)}
                  loading={viewModel.loading}
                />
              ) : viewModel.settlement ? (
                <>
                  <div className="settlement-card">
                    <div className="overlay-kicker">回到大厅前</div>
                    <h3>{viewModel.settlement.dungeon_title}</h3>
                    <p>{viewModel.settlement.summary}</p>
                    <div className="chip-field">
                      <span className="story-chip">生存 {viewModel.settlement.grades?.survival}</span>
                      <span className="story-chip">心理 {viewModel.settlement.grades?.mental}</span>
                      <span className="story-chip">规则 {viewModel.settlement.grades?.rules}</span>
                      <span className="story-chip story-chip-accent">综合 {viewModel.settlement.grades?.overall}</span>
                    </div>
                    <button type="button" className="primary-button" onClick={goBackToHall}>
                      带着这份回声回大厅
                    </button>
                  </div>
                  <RewardPanel rewards={viewModel.settlement.rewards} />
                </>
              ) : (
                <InteractionList
                  choices={viewModel.scene?.suggested_actions ?? []}
                  onChoose={(choice) => void submitAction(choice.action_text)}
                  loading={viewModel.loading}
                />
              )}
            </article>

            {!viewModel.settlement ? (
              <article className="section-panel composer-panel">
                <div className="section-head">
                  <div>
                    <div className="overlay-kicker">自定义动作</div>
                    <h2>换一种说法，看看怪谈会怎么回你</h2>
                  </div>
                  <button type="button" className="ghost-button" onClick={toggleComposer}>
                    {viewModel.showComposer ? "收起" : "展开"}
                  </button>
                </div>

                {viewModel.showComposer ? (
                  <form className="composer-form" onSubmit={handleSubmit}>
                    <textarea
                      value={viewModel.actionText}
                      onChange={(event) => setActionText(event.target.value)}
                      placeholder="例如：先看一眼告示牌，再靠近护士站。"
                    />
                    <div className="compact-row">
                      {dungeonActionPresets.map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          className="ghost-button"
                          disabled={viewModel.loading}
                          onClick={() => setActionText(preset)}
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                    <div className="page-actions">
                      <button
                        type="submit"
                        className="primary-button"
                        disabled={viewModel.loading || !viewModel.actionText.trim()}
                      >
                        让大厅听见这一步
                      </button>
                      <button type="button" className="ghost-button" onClick={hideComposer}>
                        稍后再说
                      </button>
                    </div>
                  </form>
                ) : (
                  <p className="overlay-copy">想换一种说法时再展开，不要让键盘把你从当前场景里拉走。</p>
                )}
              </article>
            ) : null}
          </div>

          <aside className="detail-shell">
            <div className="detail-tabs-grid">
              {dungeonDrawerTabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  className={`tab-button ${viewModel.activeDrawer === tab.id ? "tab-button-active" : ""}`}
                  onClick={() => setActiveDrawer(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="section-panel panel-stack">{renderDetailPanel()}</div>
          </aside>
        </div>
      </section>
    </main>
  );
}
