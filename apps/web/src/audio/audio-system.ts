import { SOUND_KEYS, type SoundKey } from "./sound-keys"

const DEV_TONES = true

const DEV_FREQUENCIES: Record<SoundKey, number> = {
  summon: 440,
  attack: 330,
  damage_unit: 220,
  damage_player: 180,
  spell_cast: 520,
  unit_death: 160,
  phase_change: 600,
  turn_start: 480,
  ace_unlock: 700,
  heal: 560,
  revolve: 380,
  primed: 500,
  spellshield: 460,
  game_win: 640,
  game_lose: 200,
}

class AudioSystem {
  private sounds: Partial<Record<SoundKey, HTMLAudioElement>> = {}
  private unavailable = new Set<SoundKey>()
  private enabled = true
  private volume = 0.6

  preload(key: SoundKey, path: string): void {
    if (typeof window === "undefined") return
    const audio = new Audio(path)
    audio.volume = this.volume
    audio.addEventListener("error", () => { this.unavailable.add(key) }, { once: true })
    this.sounds[key] = audio
  }

  play(key: SoundKey): void {
    if (!this.enabled) return
    if (typeof window === "undefined") return

    if (!this.unavailable.has(key) && this.sounds[key]) {
      const audio = this.sounds[key]!
      audio.currentTime = 0
      audio.play().catch(() => { this.unavailable.add(key) })
      return
    }

    if (DEV_TONES && this.unavailable.has(key)) {
      this.playTone(key)
    }
  }

  private playTone(key: SoundKey): void {
    try {
      const ctx = new AudioContext()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.value = DEV_FREQUENCIES[key]
      gain.gain.setValueAtTime(this.volume * 0.3, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15)
      osc.start()
      osc.stop(ctx.currentTime + 0.15)
      osc.addEventListener("ended", () => { ctx.close() })
    } catch {
      // AudioContext unavailable (SSR or restricted environment)
    }
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled
  }

  setVolume(v: number): void {
    this.volume = Math.max(0, Math.min(1, v))
    for (const key of SOUND_KEYS) {
      const audio = this.sounds[key]
      if (audio) audio.volume = this.volume
    }
  }

  isEnabled(): boolean {
    return this.enabled
  }
}

export const audioSystem = new AudioSystem()
