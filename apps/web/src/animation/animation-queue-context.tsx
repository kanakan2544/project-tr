"use client"

import { createContext, useCallback, useContext, useEffect, useReducer, useRef, useState } from "react"
import type { GameEvent } from "@tcg/shared-types"
import type { AnimationStep, AnimationStepKind } from "./types"
import { gameEventToSteps } from "./event-to-steps"
import { audioSystem } from "@/audio/audio-system"
import { animationStepToSound } from "@/audio/animation-to-sound"
import { useAudioPreloader } from "@/audio/use-audio-preloader"

// ---- State & Reducer ----

interface QueueState {
  pending: AnimationStep[]
  current: AnimationStep | null
  completedEvents: GameEvent[]
}

type QueueAction =
  | { type: "ENQUEUE"; steps: AnimationStep[] }
  | { type: "ADVANCE" }

function reducer(state: QueueState, action: QueueAction): QueueState {
  switch (action.type) {
    case "ENQUEUE":
      return { ...state, pending: [...state.pending, ...action.steps] }

    case "ADVANCE": {
      const finishedEvent = state.current?.sourceEvent ?? null
      const [next, ...rest] = state.pending
      const completedEvents = finishedEvent
        ? [...state.completedEvents, finishedEvent].slice(-200)
        : state.completedEvents
      return { pending: rest, current: next ?? null, completedEvents }
    }
  }
}

const initialState: QueueState = { pending: [], current: null, completedEvents: [] }

// ---- Context ----

export interface AnimationQueueContextValue {
  current: AnimationStep | null
  completedEvents: GameEvent[]
  enqueue: (events: GameEvent[]) => void
  isPaused: boolean
  setPaused: (v: boolean) => void
  isIdle: boolean
}

export const AnimationQueueContext = createContext<AnimationQueueContextValue | null>(null)

// ---- Provider ----

export function AnimationQueueProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  const [isPaused, setPaused] = useState(false)

  useAudioPreloader()

  const enqueue = useCallback((events: GameEvent[]) => {
    const steps = events.flatMap(gameEventToSteps)
    if (steps.length > 0) dispatch({ type: "ENQUEUE", steps })
  }, [])

  // Track previous current to detect changes (for audio side-effect)
  const prevCurrentIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (isPaused) return

    // Auto-advance when idle but queue has items
    if (state.current === null && state.pending.length > 0) {
      dispatch({ type: "ADVANCE" })
      return
    }

    if (state.current === null) return

    // Play audio when a new step starts
    if (state.current.id !== prevCurrentIdRef.current) {
      prevCurrentIdRef.current = state.current.id
      const soundKey = animationStepToSound(state.current)
      if (soundKey) audioSystem.play(soundKey)
    }

    if (state.current.durationMs === 0) {
      dispatch({ type: "ADVANCE" })
      return
    }

    const timer = setTimeout(() => dispatch({ type: "ADVANCE" }), state.current.durationMs)
    return () => clearTimeout(timer)
  }, [state.current, state.pending.length, isPaused])

  const isIdle = state.current === null && state.pending.length === 0

  const value: AnimationQueueContextValue = {
    current: state.current,
    completedEvents: state.completedEvents,
    enqueue,
    isPaused,
    setPaused,
    isIdle,
  }

  return (
    <AnimationQueueContext.Provider value={value}>
      {children}
    </AnimationQueueContext.Provider>
  )
}

// ---- Hooks ----

export function useAnimationQueue(): AnimationQueueContextValue {
  const ctx = useContext(AnimationQueueContext)
  if (!ctx) throw new Error("useAnimationQueue must be used inside AnimationQueueProvider")
  return ctx
}

export function useCurrentAnimation(): AnimationStep | null {
  return useAnimationQueue().current
}

export function useIsAnimating(instanceId: string, kind: AnimationStepKind): boolean {
  const current = useCurrentAnimation()
  if (!current || current.kind !== kind) return false
  if ("targetInstanceId" in current) return current.targetInstanceId === instanceId
  return false
}

export function useIsAnimatingLane(lane: number, kind: AnimationStepKind): boolean {
  const current = useCurrentAnimation()
  if (!current || current.kind !== kind) return false
  if (current.kind === "UNIT_DEATH") {
    return current.targetLane === lane
  }
  return false
}
