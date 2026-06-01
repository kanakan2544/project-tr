let counter = 0

export function generateInstanceId(cardId: string): string {
  counter++
  return `${cardId}#${counter.toString(16).toUpperCase().padStart(4, "0")}`
}

export function generateEffectQueueId(): string {
  counter++
  return `EFQ#${counter.toString(16).toUpperCase().padStart(6, "0")}`
}

export function resetIdCounter(): void {
  counter = 0
}
