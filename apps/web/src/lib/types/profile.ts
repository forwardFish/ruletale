export type ProfileTag =
  | "avoidant"
  | "investigative"
  | "aggressive"
  | "rescue"
  | "obsessive";

export type BehaviorProfile = Record<ProfileTag, number>;

export type BehaviorDelta = Partial<Record<ProfileTag, number>>;

export const PROFILE_TAG_LABELS: Record<ProfileTag, string> = {
  avoidant: "规避型",
  investigative: "试探型",
  aggressive: "强攻型",
  rescue: "救援型",
  obsessive: "执念型",
};
