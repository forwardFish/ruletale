import type { ReactNode } from "react";

import { hallModuleCopy } from "@/lib/copy";
import type { HallViewModel } from "@/lib/viewModels";
import type { HallModuleId } from "@/lib/types/game";

import { InventoryButton } from "./InventoryButton";
import { InventoryPanel } from "./InventoryPanel";
import { RewardPanel } from "./RewardPanel";
import { RuleHintCard } from "./RuleHintCard";
import { UnderstandingBadge } from "./UnderstandingBadge";
import { UnderstandingProgress } from "./UnderstandingProgress";

type HallScreenProps = {
  viewModel: HallViewModel;
  openPanel: (panel: HallModuleId) => Promise<void>;
  closePanel: () => void;
  continueRun: () => void;
  enterDungeon: (dungeonId: string) => Promise<void>;
};

function HallSheet({
  children,
  onClose,
}: {
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="sheet-layer" role="presentation">
      <button
        type="button"
        className="sheet-backdrop"
        aria-label="关闭面板"
        onClick={onClose}
      />
      <div className="sheet-panel">{children}</div>
    </div>
  );
}

export function HallScreen({
  viewModel,
  openPanel,
  closePanel,
  continueRun,
  enterDungeon,
}: HallScreenProps) {
  const isBusy = Boolean(viewModel.loadingTarget);

  function renderActivePanel() {
    if (!viewModel.activePanel) {
      return null;
    }

    if (viewModel.activePanel === "task_wall") {
      return (
        <HallSheet onClose={closePanel}>
          <section className="overlay-card taskwall-card">
            <div className="overlay-head">
              <div>
                <div className="overlay-kicker">任务墙</div>
                <h2>今晚先看哪一扇门</h2>
              </div>
              <button type="button" className="ghost-button" onClick={closePanel}>
                收起
              </button>
            </div>
            <p className="overlay-copy">
              大厅不会直接替你选路，它只会把最容易出事的那几条线亮给你看。
            </p>
            {viewModel.dungeonCards.length ? (
              <div className="taskwall-grid">
                {viewModel.dungeonCards.map((dungeon) => (
                  <article
                    key={dungeon.dungeonId}
                    className={`taskwall-note ${dungeon.locked ? "taskwall-note-locked" : ""}`}
                  >
                    <div className="note-kicker">{dungeon.title}</div>
                    <h3>{dungeon.hook}</h3>
                    <p>{dungeon.danger}</p>
                    <div className="note-row">
                      <span className={`signal-pill ${dungeon.locked ? "signal-pill-warning" : ""}`}>
                        {dungeon.tone}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="primary-button"
                      disabled={isBusy || dungeon.locked}
                      onClick={() => void enterDungeon(dungeon.dungeonId)}
                    >
                      {dungeon.locked ? "门还没有为你打开" : dungeon.button}
                    </button>
                  </article>
                ))}
              </div>
            ) : (
              <div className="soft-empty">大厅今晚还没有给出新的入口。</div>
            )}
          </section>
        </HallSheet>
      );
    }

    if (viewModel.activePanel === "backpack") {
      return (
        <HallSheet onClose={closePanel}>
          <section className="overlay-card panel-stack">
            <div className="overlay-head">
              <div>
                <div className="overlay-kicker">背包</div>
                <h2>你带回来的东西还在</h2>
              </div>
              <button type="button" className="ghost-button" onClick={closePanel}>
                合上
              </button>
            </div>
            <p className="overlay-copy">{viewModel.lastNarrative}</p>
            <InventoryPanel items={viewModel.inventory} scope="lobby" />
          </section>
        </HallSheet>
      );
    }

    if (viewModel.activePanel === "archives") {
      return (
        <HallSheet onClose={closePanel}>
          <section className="overlay-card panel-stack">
            <div className="overlay-head">
              <div>
                <div className="overlay-kicker">档案室</div>
                <h2>先确认哪些记录还可信</h2>
              </div>
              <button type="button" className="ghost-button" onClick={closePanel}>
                合上
              </button>
            </div>
            <div className="records-stack">
              {viewModel.archives.rules.slice(0, 4).map((rule) => (
                <RuleHintCard
                  key={rule.rule_id}
                  title={rule.verified ? "已验证规则" : "待验证规则"}
                  body={rule.text}
                  subtle={!rule.verified}
                />
              ))}
              {viewModel.archives.notebook_entries.slice(0, 3).map((entry) => (
                <article key={entry.entry_id} className="paper-line">
                  <strong>{entry.title}</strong>
                  <span>{entry.content}</span>
                </article>
              ))}
              {!viewModel.archives.rules.length && !viewModel.archives.notebook_entries.length ? (
                <div className="soft-empty">今晚的档案柜还没有多出新的纸页。</div>
              ) : null}
            </div>
          </section>
        </HallSheet>
      );
    }

    if (viewModel.activePanel === "settlement_desk") {
      return (
        <HallSheet onClose={closePanel}>
          <section className="overlay-card panel-stack">
            <div className="overlay-head">
              <div>
                <div className="overlay-kicker">结算台</div>
                <h2>大厅给你的回声</h2>
              </div>
              <button type="button" className="ghost-button" onClick={closePanel}>
                收回
              </button>
            </div>
            <p className="overlay-copy">{viewModel.settlementMood}</p>
            {viewModel.settlement ? (
              <>
                <div className="chip-field">
                  <span className="story-chip">生存 {viewModel.settlement.grades?.survival}</span>
                  <span className="story-chip">心理 {viewModel.settlement.grades?.mental}</span>
                  <span className="story-chip">规则 {viewModel.settlement.grades?.rules}</span>
                  <span className="story-chip story-chip-accent">综合 {viewModel.settlement.grades?.overall}</span>
                </div>
                <RewardPanel rewards={viewModel.settlement.rewards} />
              </>
            ) : (
              <div className="soft-empty">结算台还没有写下新的结果。</div>
            )}
          </section>
        </HallSheet>
      );
    }

    return (
      <HallSheet onClose={closePanel}>
        <section className="overlay-card panel-stack">
          <div className="overlay-head">
            <div>
              <div className="overlay-kicker">{hallModuleCopy[viewModel.activePanel].label}</div>
              <h2>{hallModuleCopy[viewModel.activePanel].teaser}</h2>
            </div>
            <button type="button" className="ghost-button" onClick={closePanel}>
              收起
            </button>
          </div>
          <p className="overlay-copy">{viewModel.lastNarrative}</p>
          <div className="soft-empty">这一处还在继续扩建，先别在这里久留。</div>
        </section>
      </HallSheet>
    );
  }

  if (viewModel.booting) {
    return (
      <main className="game-boot">
        <div className="boot-card">
          <div className="boot-kicker">Ruletale</div>
          <h1>大厅正在雾里慢慢显影</h1>
          <p>你听见墙上的灯先亮了一盏。</p>
        </div>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <section className="hall-stage mobile-stage">
        <div className="film-grain" />
        <div className="hero-shell">
          <div className="hero-head">
            <div>
              <div className="hall-kicker">Rule Horror</div>
              <h1 className="hero-title">Ruletale</h1>
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

          <p className="hall-lead">大厅会先记住你接下来准备从哪一扇门离开。</p>
          <p className="hall-subline">{viewModel.lastNarrative}</p>

          <div className="page-actions">
            {viewModel.primaryActions.map((action) =>
              action.id === "backpack" ? (
                <InventoryButton
                  key={action.id}
                  count={viewModel.inventory.length}
                  onClick={() => void openPanel("backpack")}
                />
              ) : (
                <button
                  key={action.id}
                  type="button"
                  className={action.tone === "primary" ? "primary-button" : "ghost-button"}
                  onClick={() => {
                    if (action.id === "continue") {
                      continueRun();
                    } else {
                      void openPanel("task_wall");
                    }
                  }}
                >
                  {action.label}
                </button>
              ),
            )}
          </div>

          {viewModel.error ? <div className="story-warning">{viewModel.error}</div> : null}
          {viewModel.settlement ? <div className="hall-whisper">{viewModel.settlementMood}</div> : null}
        </div>

        <div className="overview-panels">
          <article className="section-panel">
            <div className="section-head">
              <div>
                <div className="overlay-kicker">大厅摘要</div>
                <h2>今晚先看清楚什么值得进入</h2>
              </div>
              <span className="metric-badge">档案 {viewModel.archiveCount}</span>
            </div>
            <p className="overlay-copy">{viewModel.hallSummary}</p>
            <div className="summary-grid">
              <div className="summary-item">
                <span>可进入副本</span>
                <strong>{viewModel.dungeonCards.filter((item) => !item.locked).length}</strong>
              </div>
              <div className="summary-item">
                <span>背包物品</span>
                <strong>{viewModel.inventory.length}</strong>
              </div>
              <div className="summary-item">
                <span>最近奖励</span>
                <strong>{viewModel.recentRewards.length}</strong>
              </div>
              <div className="summary-item">
                <span>污染值</span>
                <strong>{viewModel.contamination}</strong>
              </div>
            </div>
          </article>

          <article className="section-panel">
            <div className="section-head">
              <div>
                <div className="overlay-kicker">状态</div>
                <h2>先带着边界感出门</h2>
              </div>
            </div>
            {viewModel.understanding ? (
              <UnderstandingProgress understanding={viewModel.understanding} />
            ) : null}
            {viewModel.recentRewards.length ? (
              <RewardPanel rewards={viewModel.recentRewards.slice(0, 2)} />
            ) : (
              <div className="soft-empty">最近还没有新的奖励，今晚更需要靠记忆和判断。</div>
            )}
          </article>
        </div>
      </section>

      <nav className="bottom-dock" aria-label="大厅模块导航">
        <div className="dock-grid">
          {viewModel.dockModules.map((module) => (
            <button
              key={module.moduleId}
              type="button"
              className={`dock-button ${module.active ? "dock-button-active" : ""} ${
                module.locked ? "dock-button-locked" : ""
              }`}
              disabled={isBusy}
              onClick={() => void openPanel(module.moduleId)}
            >
              <span>{module.label}</span>
              <small>{module.action}</small>
            </button>
          ))}
        </div>
      </nav>

      {renderActivePanel()}
    </main>
  );
}
