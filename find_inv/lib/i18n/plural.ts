// Odmiana przez liczby. Polski: 1 / 2–4 (bez 12–14) / reszta. Ukraiński tak samo, ale 21, 31… to forma pojedyncza.

export function plPlural(count: number, one: string, few: string, many: string) {
  if (count === 1) return one;
  const lastTwo = count % 100;
  const last = count % 10;
  return last >= 2 && last <= 4 && (lastTwo < 12 || lastTwo > 14) ? few : many;
}

export function ukPlural(count: number, one: string, few: string, many: string) {
  const lastTwo = count % 100;
  const last = count % 10;
  if (last === 1 && lastTwo !== 11) return one;
  return last >= 2 && last <= 4 && (lastTwo < 12 || lastTwo > 14) ? few : many;
}

export function enPlural(count: number, one: string, many: string) {
  return count === 1 ? one : many;
}
