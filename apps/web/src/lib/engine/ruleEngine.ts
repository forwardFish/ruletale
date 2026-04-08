import { APARTMENT_RULES } from "@/lib/data/rules_apartment";
import { HOSPITAL_RULES } from "@/lib/data/rules_hospital";
import type { RuleArchiveEntry } from "@/lib/types/rule";

const ALL_RULES = [...HOSPITAL_RULES, ...APARTMENT_RULES];
const RULE_MAP = new Map(ALL_RULES.map((rule) => [rule.id, rule]));

export function ensureRuleArchive(entries: RuleArchiveEntry[], ids: string[]) {
  const next = [...entries];
  ids.forEach((id) => {
    const existing = next.find((entry) => entry.id === id);
    const template = RULE_MAP.get(id);
    if (!template || existing) {
      return;
    }
    next.push({
      ...template,
      discovered: true,
      confidence: template.type === "explicit" ? 0.62 : 0.48,
      seenSources: [template.source],
      verified: false,
    });
  });
  return next;
}

export function discoverRules(entries: RuleArchiveEntry[], ids: string[], confidenceBoost = 0.08) {
  const next = ensureRuleArchive(entries, ids);
  return next.map((entry) =>
    ids.includes(entry.id)
      ? {
          ...entry,
          discovered: true,
          confidence: Math.min(0.95, entry.confidence + confidenceBoost),
          seenSources: entry.seenSources.includes(entry.source) ? entry.seenSources : [...entry.seenSources, entry.source],
        }
      : entry,
  );
}

export function verifyRules(entries: RuleArchiveEntry[], ids: string[]) {
  const next = ensureRuleArchive(entries, ids);
  return next.map((entry) =>
    ids.includes(entry.id)
      ? {
          ...entry,
          discovered: true,
          verified: true,
          confidence: Math.min(1, entry.confidence + 0.22),
        }
      : entry,
  );
}

export function getRuleById(id: string) {
  return RULE_MAP.get(id) ?? null;
}
