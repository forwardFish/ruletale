import type { BehaviorDelta, BehaviorProfile, ProfileTag } from "@game-core/types/profile";
import { PROFILE_TAG_LABELS } from "@game-core/types/profile";
import type { ActionIntent } from "@game-core/types/node";

export const DEFAULT_BEHAVIOR_PROFILE: BehaviorProfile = {
  avoidant: 0,
  investigative: 0,
  aggressive: 0,
  rescue: 0,
  obsessive: 0,
};

export function applyBehaviorDelta(profile: BehaviorProfile, delta: BehaviorDelta) {
  const next = { ...profile };
  (Object.keys(delta) as ProfileTag[]).forEach((tag) => {
    next[tag] += delta[tag] ?? 0;
  });
  return next;
}

export function inferBehaviorDelta(intent: ActionIntent): BehaviorDelta {
  switch (intent) {
    case "observe":
    case "inspect_object":
    case "verify_rule":
      return { investigative: 1 };
    case "hide":
    case "flee":
      return { avoidant: 1 };
    case "fight":
    case "test_boundary":
      return { aggressive: 1 };
    case "respond_voice":
    case "ask_question":
      return { rescue: 1 };
    case "wait":
      return { obsessive: 1 };
    default:
      return {};
  }
}

export function dominantBehavior(profile: BehaviorProfile): ProfileTag {
  return (Object.entries(profile).sort((a, b) => b[1] - a[1])[0]?.[0] as ProfileTag) ?? "investigative";
}

export function behaviorLabel(tag: ProfileTag) {
  return PROFILE_TAG_LABELS[tag];
}
