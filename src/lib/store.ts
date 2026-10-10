import { create } from 'zustand'
import { clock } from './clock'
import type { V3 } from './math'
import type { ThemeName } from './themes'
import { player, resetPlayer } from './player'

export type Quality = 'Low' | 'Medium' | 'High'
export type Mode = 'demo' | 'explore'

export interface Flight {
  pos: V3
  target: V3
  nonce: number
}

interface State {
  mode: Mode
  paused: boolean
  quality: Quality
  theme: ThemeName
  ready: boolean
  walk: boolean
  chapter: number
  activeRoom: string | null
  flight: Flight | null
  setReady: () => void
  setQuality: (q: Quality) => void
  setTheme: (t: ThemeName) => void
  setChapter: (c: number) => void
  setActiveRoom: (id: string | null) => void
  togglePause: () => void
  setMode: (m: Mode) => void
  flyTo: (pos: V3, target: V3, room?: string | null) => void
  startDemo: () => void
  startWalk: () => void
  stopWalk: () => void
}

export const useStore = create<State>((set) => ({
  mode: 'demo',
  paused: false,
  quality: 'High',
  theme: 'Day',
  ready: false,
  walk: false,
  chapter: 0,
  activeRoom: null,
  flight: null,
  setReady: () => set({ ready: true }),
  setQuality: (quality) => set({ quality }),
  setTheme: (theme) => set({ theme }),
  setChapter: (chapter) => set({ chapter }),
  setActiveRoom: (activeRoom) => set({ activeRoom }),
  togglePause: () => set((s) => ({ paused: !s.paused })),
  setMode: (mode) => set({ mode }),
  flyTo: (pos, target, room = null) =>
    set({ mode: 'explore', walk: false, paused: false, activeRoom: room, flight: { pos, target, nonce: performance.now() } }),
  startDemo: () => {
    clock.t = 0
    set({ mode: 'demo', walk: false, paused: false, chapter: 0, activeRoom: null, flight: null })
  },
  startWalk: () => {
    resetPlayer()
    player.visible = true
    set({
      mode: 'explore',
      walk: true,
      paused: false,
      activeRoom: null,
      flight: { pos: [0, 5.4, 33], target: [0, 1.3, 25], nonce: performance.now() },
    })
  },
  stopWalk: () => {
    player.visible = false
    player.speed = 0
    set({ walk: false })
  },
}))
