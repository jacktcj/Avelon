/** Returns a uniformly random integer in [0, maxExclusive). */
export type Rng = (maxExclusive: number) => number;

/** Cryptographically secure, unbiased integer via rejection sampling. */
export const secureRandomInt: Rng = (maxExclusive) => {
  if (maxExclusive <= 0) throw new Error('maxExclusive must be positive');
  const limit = Math.floor(0x100000000 / maxExclusive) * maxExclusive;
  const buf = new Uint32Array(1);
  for (;;) {
    crypto.getRandomValues(buf);
    if (buf[0] < limit) return buf[0] % maxExclusive;
  }
};

/** Fisher–Yates shuffle returning a new array. */
export function shuffle<T>(items: readonly T[], rng: Rng = secureRandomInt): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = rng(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
