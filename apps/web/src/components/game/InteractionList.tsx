import type { SceneChoice } from "@game-core/types/game";

import { formatChoiceKind } from "@/lib/copy";

const choiceKindMeta: Record<
  string,
  {
    title: string;
    hint: string;
    order: number;
  }
> = {
  observe: {
    title: "先补线索",
    hint: "通常代价最低，适合先确认这里到底哪里不对劲。",
    order: 0,
  },
  inspect: {
    title: "直接检查",
    hint: "对可互动对象做近距离确认，容易拿到规则或笔记。",
    order: 1,
  },
  verify: {
    title: "验证规则",
    hint: "把你已经拿到的线索，升级成真正可依赖的判断。",
    order: 2,
  },
  move: {
    title: "继续推进",
    hint: "会把副本往下一层推开，信息更多，风险也更高。",
    order: 3,
  },
  inventory: {
    title: "盘点资源",
    hint: "先确认还能动用什么，再决定要不要继续冒险。",
    order: 4,
  },
  item: {
    title: "动用道具",
    hint: "更像是在换取主动权，通常不适合当第一步。",
    order: 5,
  },
};

function getChoiceMeta(kind: string) {
  return (
    choiceKindMeta[kind] ?? {
      title: "其他动作",
      hint: "这是当前场景里还能尝试的另一条路。",
      order: 99,
    }
  );
}

function getPrimaryPrompt(choice: SceneChoice) {
  switch (choice.kind) {
    case "observe":
    case "inventory":
      return "如果你只想先试一步，先按这个，通常更稳妥。";
    case "inspect":
      return "先确认眼前最直接的异常点，再决定要不要继续推进。";
    case "verify":
      return "你已经有线索了，这一步是在把它变成真正可用的规则。";
    case "move":
      return "这是继续往前推剧情的动作，准备好承受下一层代价时再按。";
    case "item":
      return "这会动用资源，适合在高压节点用来换主动。";
    default:
      return "如果你不知道先点什么，先从这一步开始。";
  }
}

export function InteractionList({
  choices,
  onChoose,
  loading,
}: {
  choices: SceneChoice[];
  onChoose: (choice: SceneChoice) => void;
  loading?: boolean;
}) {
  const [primaryChoice, ...secondaryChoices] = choices;

  const groupedChoices = secondaryChoices.reduce<
    Array<{
      kind: string;
      title: string;
      hint: string;
      order: number;
      items: SceneChoice[];
    }>
  >((groups, choice) => {
    const meta = getChoiceMeta(choice.kind);
    const existing = groups.find((group) => group.kind === choice.kind);

    if (existing) {
      existing.items.push(choice);
      return groups;
    }

    groups.push({
      kind: choice.kind,
      title: meta.title,
      hint: meta.hint,
      order: meta.order,
      items: [choice],
    });
    return groups;
  }, []);

  groupedChoices.sort((left, right) => left.order - right.order);

  if (!choices.length) {
    return <div className="soft-empty">当前场景还没有浮出明确动作，先试着观察一下周围。</div>;
  }

  return (
    <div className="choice-stack">
      {primaryChoice ? (
        <section className="choice-spotlight">
          <div className="choice-spotlight-head">
            <div>
              <div className="overlay-kicker">建议先做</div>
              <h3>{primaryChoice.label}</h3>
            </div>
            <span className="story-chip story-chip-accent">{formatChoiceKind(primaryChoice.kind)}</span>
          </div>
          <p className="choice-board-copy">{getPrimaryPrompt(primaryChoice)}</p>
          <p className="choice-primary-reason">{primaryChoice.reason}</p>
          <div className="choice-command">
            <span>执行动作</span>
            <strong>{primaryChoice.action_text}</strong>
          </div>
          <button
            type="button"
            disabled={loading}
            onClick={() => onChoose(primaryChoice)}
            className="choice-primary-button"
          >
            先按这一步
          </button>
        </section>
      ) : null}

      {groupedChoices.length ? (
        <section className="choice-groups">
          <div className="choice-groups-head">
            <div className="overlay-kicker">其他可选</div>
            <p className="choice-board-copy">上面那一步更适合作为起手，其余动作按用途分开看会更容易选。</p>
          </div>

          {groupedChoices.map((group) => (
            <div key={group.kind} className="choice-group">
              <div className="choice-group-head">
                <div>
                  <h4>{group.title}</h4>
                  <p>{group.hint}</p>
                </div>
                <span className="story-chip">{formatChoiceKind(group.kind)}</span>
              </div>

              <div className="choice-grid">
                {group.items.map((choice) => (
                  <button
                    key={choice.choice_id}
                    type="button"
                    disabled={loading}
                    onClick={() => onChoose(choice)}
                    className={`choice-button choice-button-${choice.kind}`}
                  >
                    <p className="choice-meta">{formatChoiceKind(choice.kind)}</p>
                    <h5>{choice.label}</h5>
                    <p className="choice-reason">{choice.reason}</p>
                    <div className="choice-command-inline">
                      <span>执行</span>
                      <strong>{choice.action_text}</strong>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </section>
      ) : null}
    </div>
  );
}
