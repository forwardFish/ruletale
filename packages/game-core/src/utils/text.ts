export function normalizeText(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[，。！？、,.!?]/g, " ")
    .replace(/\s+/g, " ");
}

export function includesAny(text: string, keywords: string[]) {
  return keywords.some((keyword) => text.includes(keyword));
}

export function dedupeStrings(items: string[]) {
  return Array.from(new Set(items));
}
