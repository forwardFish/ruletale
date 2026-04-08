import { NextResponse } from "next/server";

import type { DeepseekSceneRequest } from "@/lib/types/assistant";
import {
  deepseekSceneRequestSchema,
  deepseekSceneResponseSchema,
} from "@/lib/types/assistant";
import type { SceneActionSuggestion } from "@/lib/types/node";

const DEEPSEEK_URL = "https://api.deepseek.com/chat/completions";

function stripCodeFence(raw: string) {
  return raw.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();
}

function withIds(actions: Array<Omit<SceneActionSuggestion, "id">>, prefix: string) {
  return actions.map((action, index) => ({
    id: `${prefix}-${index}-${action.kind}`,
    ...action,
  }));
}

function fallbackSuggestions(request: DeepseekSceneRequest): SceneActionSuggestion[] {
  const safeFallbacks = request.localSuggestedActions
    .slice(0, 5)
    .map((action, index) => ({
      id: `fallback-${index}-${action.kind}`,
      ...action,
      riskTone: action.riskTone ?? "balanced",
      riskLabel: action.riskLabel ?? "稳步推进",
    }));

  if (safeFallbacks.length >= 3) {
    return safeFallbacks;
  }

  return withIds(
    [
      {
        label: "先看异常点",
        command: "观察当前场景里的异常细节",
        kind: "observe",
        reason: "在信息不足时，先看异常比直接回应更稳。",
        riskTone: "safe",
        riskLabel: "低风险",
      },
      {
        label: "核对已知规则",
        command: "检查当前线索和规则是否冲突",
        kind: "verify_rule",
        reason: "把线索放回规则里，能避免被单一信息源带走。",
        riskTone: "balanced",
        riskLabel: "求证优先",
      },
      {
        label: "试着贴近一步",
        command: "谨慎靠近当前最可疑的位置",
        kind: "move_to_area",
        reason: "给副本一点推进压力，但不要完全交出判断权。",
        riskTone: "risky",
        riskLabel: "高压试探",
      },
    ],
    "fallback-default",
  );
}

function buildSystemPrompt(mode: "normalize" | "suggest") {
  const modeInstruction =
    mode === "normalize"
      ? "你要先把玩家输入收束成一句更适合提交给本地规则引擎的动作命令。"
      : "你不需要改写玩家输入，只需要围绕当前节点生成下一步可点选动作。";

  return `
你是规则怪谈游戏《Ruletale》的副本交互助手。
你的任务是：在不破坏公平性的前提下，把玩家的表达理解得更锐利、更大胆、更有推进力。

你只能做这些事：
1. 理解玩家输入，必要时把模糊表述改写成更可执行的动作命令。
2. 根据当前节点生成 3 到 5 个可点击动作。
3. 给出一条不剧透的玩家提示。
4. 给出一层“模型判断”，告诉玩家这次输入更像是在观察、求证、接近、冒险还是强压推进。
5. 给出一条“风险方向”和一条“可能牵动的规则焦点/奖励焦点”。

你必须遵守这些硬性约束：
- 绝对不能发明新的副本、怪物、规则、奖励、数值、结局或剧情阶段。
- 绝对不能替代本地引擎决定节点跳转、规则解锁、奖励发放、结算结果。
- 你只能围绕当前节点、当前目标、可见对象、可疑点、已发现规则来生成动作。
- 你可以更大胆，但不能把玩家引出副本中心，不要引导去做与当前节点完全无关的事。
- 你可以生成一条风险更高的动作，但必须仍然公平、可理解、可被当前场景承接。
- “ruleLead” 和 “rewardLead” 只能写成“可能牵动/更可能影响什么”，不能写成确定掉落或确定解锁。
- 所有动作都必须是简洁中文短句，能够直接提交给游戏。

动作生成策略：
- 至少给一条稳妥动作：观察、核对、求证类。
- 至少给一条贴近玩家原意的主动作。
- 可以给一条更大胆的动作，但要明确风险方向。
- 如果当前场景明显危险，优先把大胆动作写成“贴边试探”，不要写成纯送死。

风险标签只允许：
- safe：低风险
- balanced：稳步推进
- risky：高压试探

${modeInstruction}

你必须返回严格 JSON，对象结构如下：
{
  "normalizedAction": "提交给本地引擎的动作命令；suggest 模式可省略",
  "playerFacingHint": "一句不剧透提示，可为空",
  "actionInterpretation": "这次输入更像是在做什么，可为空",
  "pressureHint": "这一步会把局面推向哪里，可为空",
  "ruleLead": "可能牵动的规则焦点，可为空",
  "rewardLead": "更可能影响的收益方向，可为空",
  "suggestions": [
    {
      "label": "按钮标题",
      "command": "真正提交给游戏的动作命令",
      "kind": "observe | inspect_object | move_to_area | ask_question | verify_rule | respond_voice | hide | wait | use_item | fight | flee | test_boundary | open_inventory | check_archive",
      "reason": "一句说明为什么值得点",
      "riskTone": "safe | balanced | risky",
      "riskLabel": "低风险 | 稳步推进 | 高压试探"
    }
  ]
}
`.trim();
}

function buildUserPrompt(request: DeepseekSceneRequest) {
  return JSON.stringify(
    {
      mode: request.mode,
      rawInput: request.rawInput ?? null,
      scene: {
        dungeonTitle: request.dungeonTitle,
        nodeId: request.nodeId,
        nodeTitle: request.nodeTitle,
        area: request.area,
        description: request.description,
        visibleObjects: request.visibleObjects,
        suspiciousPoints: request.suspiciousPoints,
        currentGoal: request.currentGoal,
      },
      player: {
        understanding: request.understanding,
        contamination: request.contamination,
        behaviorLabel: request.behaviorLabel,
        inventoryNames: request.inventoryNames,
      },
      rules: {
        discovered: request.discoveredRules,
        verified: request.verifiedRules,
      },
      history: {
        recentLog: request.recentLog,
        actionHistory: request.actionHistory,
      },
      localSuggestedActions: request.localSuggestedActions,
    },
    null,
    2,
  );
}

export async function POST(request: Request) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "DEEPSEEK_API_KEY is missing." }, { status: 503 });
  }

  const json = await request.json().catch(() => null);
  const parsed = deepseekSceneRequestSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request payload.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  if (parsed.data.mode === "normalize" && !parsed.data.rawInput?.trim()) {
    return NextResponse.json({ error: "rawInput is required in normalize mode." }, { status: 400 });
  }

  const fallback = fallbackSuggestions(parsed.data);
  const rawFallback = parsed.data.rawInput ?? "";

  try {
    const response = await fetch(DEEPSEEK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.DEEPSEEK_MODEL || "deepseek-chat",
        temperature: parsed.data.mode === "normalize" ? 0.55 : 0.8,
        max_tokens: 900,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: buildSystemPrompt(parsed.data.mode) },
          { role: "user", content: buildUserPrompt(parsed.data) },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        {
          normalizedAction: rawFallback,
          playerFacingHint: null,
          actionInterpretation: null,
          pressureHint: null,
          ruleLead: null,
          rewardLead: null,
          suggestions: fallback,
          error: `DeepSeek request failed: ${response.status} ${errorText}`,
        },
        { status: 200 },
      );
    }

    const completion = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = completion.choices?.[0]?.message?.content?.trim();

    if (!content) {
      return NextResponse.json(
        {
          normalizedAction: rawFallback,
          playerFacingHint: null,
          actionInterpretation: null,
          pressureHint: null,
          ruleLead: null,
          rewardLead: null,
          suggestions: fallback,
        },
        { status: 200 },
      );
    }

    const parsedContent = deepseekSceneResponseSchema.safeParse(JSON.parse(stripCodeFence(content)));
    if (!parsedContent.success) {
      return NextResponse.json(
        {
          normalizedAction: rawFallback,
          playerFacingHint: null,
          actionInterpretation: null,
          pressureHint: null,
          ruleLead: null,
          rewardLead: null,
          suggestions: fallback,
          error: "DeepSeek returned malformed JSON.",
        },
        { status: 200 },
      );
    }

    const suggestions = parsedContent.data.suggestions.map((suggestion, index) => ({
      id: `ai-${index}-${suggestion.kind}`,
      ...suggestion,
    }));

    return NextResponse.json(
      {
        normalizedAction: parsedContent.data.normalizedAction ?? rawFallback,
        playerFacingHint: parsedContent.data.playerFacingHint ?? null,
        actionInterpretation: parsedContent.data.actionInterpretation ?? null,
        pressureHint: parsedContent.data.pressureHint ?? null,
        ruleLead: parsedContent.data.ruleLead ?? null,
        rewardLead: parsedContent.data.rewardLead ?? null,
        suggestions,
      },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        normalizedAction: rawFallback,
        playerFacingHint: null,
        actionInterpretation: null,
        pressureHint: null,
        ruleLead: null,
        rewardLead: null,
        suggestions: fallback,
        error: error instanceof Error ? error.message : "Unknown DeepSeek error.",
      },
      { status: 200 },
    );
  }
}
