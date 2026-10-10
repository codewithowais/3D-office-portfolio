import { create } from 'zustand'
import { clock } from './clock'
import type { V3 } from './math'
import type { ThemeName } from './themes'

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
}

export const useStore = create<State>((set) => ({
  mode: 'demo',
  paused: false,
  quality: 'High',
  theme: 'Day',
  ready: false,
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
    set({ mode: 'explore', paused: false, activeRoom: room, flight: { pos, target, nonce: performance.now() } }),
  startDemo: () => {
    clock.t = 0
    set({ mode: 'demo', paused: false, chapter: 0, activeRoom: null, flight: null })
  },
}))
