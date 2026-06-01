"use client"

import { useEffect } from "react"
import { SOUND_KEYS } from "./sound-keys"
import { audioSystem } from "./audio-system"

export function useAudioPreloader(): void {
  useEffect(() => {
    for (const key of SOUND_KEYS) {
      audioSystem.preload(key, `/audio/sfx/${key}.mp3`)
    }
  }, [])
}
