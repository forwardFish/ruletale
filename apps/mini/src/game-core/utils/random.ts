export function randomBetween(min: number, max: number, random = Math.random()) {
  return min + (max - min) * random;
}

export function pickOne<T>(items: T[], random = Math.random()) {
  if (!items.length) {
    throw new Error("pickOne requires at least one item");
  }
  return items[Math.floor(random * items.length)];
}
