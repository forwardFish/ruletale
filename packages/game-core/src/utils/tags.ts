export function mergeTagWeights(
  current: Record<string, number>,
  delta: Partial<Record<string, number>>,
) {
  const next = { ...current };
  Object.entries(delta).forEach(([key, value]) => {
    next[key] = (next[key] ?? 0) + (value ?? 0);
  });
  return next;
}
