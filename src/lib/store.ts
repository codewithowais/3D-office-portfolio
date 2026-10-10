import { create } from 'zustand'
import { clock } from './clock'
import type { V3 } from './math'
import type { ThemeName } from './themes'
import { getDevice } from './device'
import { NPCS } from './dialogue'
import { readName, readSkipped, saveName, saveSkipped } from './profile'
import { input, player, resetPlayer, teleport } from './player'

export type Quality = 'Low' | 'Medium' | 'High'
export type Mode = 'demo' | 'explore'
export type GfxError = 'lost' | 'crash' | null

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
  /** what the visitor told us to call them ('' if unknown) */
  playerName: string
  /** show the 'what's your name?' prompt */
  askName: boolean
  nameAsked: boolean
  /** person within talking distance (walk mode) */
  nearby: string | null
  /** the conversation in progress */
  talking: { id: string; node: string } | null
  /** true once the user picked a quality themselves: auto-downgrade then stays out of the way */
  qualityLocked: boolean
  /** extra resolution multiplier applied when even Low struggles */
  dprScale: number
  notice: string | null
  error: GfxError
  /** bumped to rebuild the 3D scene from scratch after the GPU comes back */
  sceneKey: number
  chapter: number
  activeRoom: string | null
  flight: Flight | null
  setReady: () => void
  autoDowngrade: () => void
  setNotice: (n: string | null) => void
  setError: (e: GfxError) => void
  restoreScene: () => void
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
  setNearby: (id: string | null) => void
  setPlayerName: (name: string) => void
  skipName: () => void
  openNamePrompt: () => void
  startTalk: (id?: string) => void
  choose: (i: number) => void
  endTalk: () => void
}

let restores: number[] = []
const dev = getDevice()
const START_Q: Quality = dev.tier === 'high' ? 'High' : dev.tier === 'medium' ? 'Medium' : 'Low'

export const useStore = create<State>((set, get) => ({
  // people who asked for less motion start in free-explore from an aerial view instead of the auto-play tour
  mode: dev.reducedMotion ? 'explore' : 'demo',
  paused: false,
  quality: START_Q,
  qualityLocked: false,
  dprScale: 1,
  notice: null,
  error: null,
  sceneKey: 0,
  theme: 'Day',
  ready: false,
  walk: false,
  playerName: readName(),
  askName: false,
  nameAsked: !!readName() || readSkipped(),
  nearby: null,
  talking: null,
  chapter: 0,
  activeRoom: null,
  flight: dev.reducedMotion ? { pos: [0, 62, 58], target: [0, 0, 0], nonce: 1 } : null,
  setReady: () => set({ ready: true }),
  setNotice: (notice) => set({ notice }),
  setError: (error) => set({ error }),
  restoreScene: () => {
    // circuit breaker: if the GPU keeps dropping, stop rebuilding and ask for a reload
    const now = Date.now()
    restores = restores.filter((t) => now - t < 60000)
    restores.push(now)
    if (restores.length > 4) return set({ error: 'crash' })
    set((s) => ({ error: null, ready: false, sceneKey: s.sceneKey + 1 }))
  },
  autoDowngrade: () => {
    const { quality, dprScale, qualityLocked } = get()
    if (qualityLocked) return
    if (quality === 'High') set({ quality: 'Medium', notice: 'Switched to Medium quality to keep things smooth.' })
    else if (quality === 'Medium') set({ quality: 'Low', notice: 'Switched to Low quality to keep things smooth.' })
    else if (dprScale > 0.6) set({ dprScale: Math.max(0.6, dprScale - 0.2), notice: 'Lowered resolution to keep things smooth.' })
  },
  setQuality: (quality) => set({ quality, qualityLocked: true, dprScale: 1 }),
  setTheme: (theme) => set({ theme }),
  setChapter: (chapter) => set({ chapter }),
  setActiveRoom: (activeRoom) => set({ activeRoom }),
  togglePause: () => set((s) => ({ paused: !s.paused })),
  setMode: (mode) => set({ mode }),
  flyTo: (pos, target, room = null) =>
    set({ mode: 'explore', walk: false, talking: null, nearby: null, paused: false, activeRoom: room, flight: { pos, target, nonce: performance.now() } }),
  startDemo: () => {
    clock.t = 0
    set({ mode: 'demo', walk: false, talking: null, nearby: null, paused: false, chapter: 0, activeRoom: null, flight: null })
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
      talking: null,
      askName: !get().nameAsked,
    })
  },
  stopWalk: () => {
    player.visible = false
    player.speed = 0
    set({ walk: false, nearby: null, talking: null })
  },
  setNearby: (nearby) => set({ nearby }),
  setPlayerName: (name) => {
    const clean = name.replace(/\s+/g, ' ').trim().slice(0, 24)
    if (clean) saveName(clean)
    else saveSkipped()
    set({ playerName: clean, askName: false, nameAsked: true })
  },
  skipName: () => {
    saveSkipped()
    set({ askName: false, nameAsked: true })
  },
  openNamePrompt: () => set({ askName: true, talking: null }),
  startTalk: (id) => {
    const who = id ?? get().nearby
    if (!who || !NPCS[who] || !get().walk) return
    Object.assign(input, { f: false, b: false, l: false, r: false, run: false })
    player.speed = 0
    set({ talking: { id: who, node: 'hi' } })
  },
  choose: (i) => {
    const t = get().talking
    if (!t) return
    const opt = NPCS[t.id]?.nodes[t.node]?.options[i]
    if (!opt) return
    if (opt.href) {
      // links open without leaving the conversation
      if (opt.href.startsWith('mailto:')) window.location.href = opt.href
      else window.open(opt.href, '_blank', 'noopener,noreferrer')
      return
    }
    if (opt.action === 'askName') return set({ askName: true, talking: null })
    if (opt.teleport) {
      teleport(opt.teleport[0], opt.teleport[1])
      return set({ talking: null })
    }
    set({ talking: opt.next && NPCS[t.id].nodes[opt.next] ? { id: t.id, node: opt.next } : null })
  },
  endTalk: () => set({ talking: null }),
}))
