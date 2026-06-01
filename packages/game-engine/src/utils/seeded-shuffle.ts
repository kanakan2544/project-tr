// Seeded Fisher-Yates shuffle. Same seed always produces same order.
// Uses a simple LCG PRNG — sufficient for a card game.
function seededRandom(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff
    return (s >>> 0) / 0x100000000
  }
}

export function seededShuffle<T>(array: T[], seed: number): T[] {
  const result = [...array]
  const rand = seededRandom(seed)
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    const temp = result[i]!
    result[i] = result[j]!
    result[j] = temp
  }
  return result
}
