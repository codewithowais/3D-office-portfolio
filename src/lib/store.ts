import { create } from 'zustand'
import { clock } from './clock'
import type { V3 } from './math'
import type { ThemeName } from './themes'
import { getDevice } from './device'
import { NPCS, fill } from './dialogue'
import { readColor, readName, readSpeed, saveSpeed, readProgress, readSkipped, saveColor, saveName, saveProgress, saveSkipped, type Progress } from './profile'
import { clock as worldClock } from './clock'
import { escort, resetEscort, startEscort } from './escort'
import { stopSoccer } from './soccer'
import { TALKABLES, spotOf, talkable } from './talkables'
import { ZONES, type Zone } from './zones'
import { spawnFor } from './world'
import { doPose, input, motion, player, resetPlayer, sitAt, standUp, teleport } from './player'

export type Quality = 'Low' | 'Medium' | 'High'
export type Mode = 'demo' | 'explore'
export type GfxError = 'lost' | 'crash' | null
export type ProgressKind = keyof Progress
export interface Greeting {
  id: string
  text: string
  until: number
}
export interface Place {
  id: string
  title: string
  sub: string
  nonce: number
}

/** How many things there are to discover in each category. */
export const PROGRESS_TOTAL: Record<ProgressKind, number> = {
  met: TALKABLES.filter((t) => t.kind === 'person').length,
  places: ZONES.length,
  things: TALKABLES.filter((t) => t.kind !== 'person').length,
}
const DONE_MSG: Record<ProgressKind, string> = {
  met: "You've met everyone in the office!",
  places: "You've visited every place!",
  things: "You've tried everything there is to try!",
}

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
  /** the ball is within kicking range (football) */
  nearBall: boolean
  /** sitting on a chair/sofa/bench */
  seated: boolean
  /** a person welcoming you (shown as a bubble over their head) */
  greeting: Greeting | null
  greeted: string[]
  /** football: a match is on, and its score */
  playing: boolean
  score: { red: number; blue: number }
  /** the place banner (shown briefly when you enter somewhere new) */
  place: Place | null
  progress: Progress
  playerColor: string
  /** 0 walk, 1 run, 2 sprint */
  speedLevel: number
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
  setNearBall: (v: boolean) => void
  enterZone: (z: Zone) => void
  greet: (id: string) => void
  setPlaying: (playing: boolean, score?: { red: number; blue: number }) => void
  clearPlace: () => void
  standUp: () => void
  setPlayerColor: (c: string) => void
  setSpeedLevel: (n: number) => void
  cycleSpeed: () => void
  mark: (kind: ProgressKind, id: string) => void
  setPlayerName: (name: string) => void
  skipName: () => void
  openNamePrompt: () => void
  startTalk: (id?: string) => void
  choose: (i: number) => void
  endTalk: () => void
}

let restores: number[] = []
function initSpeed() {
  const n = readSpeed()
  motion.level = n
  return n
}
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
  nearBall: false,
  seated: false,
  greeting: null,
  greeted: [],
  playing: false,
  score: { red: 0, blue: 0 },
  place: null,
  progress: readProgress(),
  playerColor: readColor(),
  speedLevel: initSpeed(),
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
  flyTo: (pos, target, room = null) => {
    // while walking, picking a place takes your character there instead of leaving walk mode
    if (get().walk) {
      const dest = spawnFor(room, pos)
      if (dest) {
        get().standUp()
        teleport(dest[0], dest[1])
        set({ talking: null, nearby: null, activeRoom: room })
        return
      }
    }
    set({ mode: 'explore', walk: false, talking: null, nearby: null, paused: false, activeRoom: room, flight: { pos, target, nonce: performance.now() } })
  },
  startDemo: () => {
    clock.t = 0
    stopSoccer()
    resetEscort()
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
    stopSoccer()
    resetEscort()
    standUp()
    set({ walk: false, nearby: null, nearBall: false, seated: false, place: null, talking: null, greeting: null, greeted: [], playing: false })
  },
  setNearby: (nearby) => set({ nearby }),
  setNearBall: (nearBall) => set({ nearBall }),
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
  greet: (id) => {
    const npc = NPCS[id]
    if (!npc?.greet || get().greeted.includes(id) || get().talking) return
    const text = fill(npc.greet, get().playerName)
    if (id === 'receptionist') escort.greetUntil = worldClock.t + 4.5
    set({ greeted: [...get().greeted, id], greeting: { id, text, until: performance.now() + 5000 }, notice: `${npc.name}: ${text}` })
  },
  setPlaying: (playing, score) => set(score ? { playing, score } : { playing }),
  enterZone: (z) => {
    set({ place: { id: z.id, title: z.title, sub: z.sub, nonce: performance.now() } })
    get().mark('places', z.id)
  },
  clearPlace: () => set({ place: null }),
  standUp: () => {
    standUp()
    set({ seated: false })
  },
  setSpeedLevel: (n) => {
    const level = Math.max(0, Math.min(2, Math.round(n)))
    motion.level = level
    saveSpeed(level)
    set({ speedLevel: level })
  },
  cycleSpeed: () => get().setSpeedLevel((get().speedLevel + 1) % 3),
  setPlayerColor: (playerColor) => {
    saveColor(playerColor)
    set({ playerColor })
  },
  mark: (kind, id) => {
    const cur = get().progress
    if (cur[kind].includes(id)) return
    const next = { ...cur, [kind]: [...cur[kind], id] }
    saveProgress(next)
    set({ progress: next })
    if (next[kind].length === PROGRESS_TOTAL[kind]) set({ notice: DONE_MSG[kind] })
  },
  startTalk: (id) => {
    const who = id ?? get().nearby
    const tk = who ? talkable(who) : undefined
    if (!tk || !get().walk || get().seated) return
    Object.assign(input, { f: false, b: false, l: false, r: false, run: false })
    player.speed = 0
    // some things are used, not talked to
    if (tk.action) {
      const now = worldClock.t
      if (tk.action === 'sit' && tk.seat) {
        sitAt(tk.id, tk.seat)
        set({ seated: true, nearby: null })
      } else if (tk.action === 'coffee') {
        doPose('drink', now, 3.4)
        set({ notice: 'Fresh coffee. Exactly what you needed.' })
      } else if (tk.action === 'bell') {
        doPose('wave', now, 1.3)
        set({ notice: 'Ding! Ayesha: Welcome! Ask me for a tour whenever you like.' })
      } else if (tk.action === 'guestbook') {
        const n = get().playerName
        set({ notice: n ? `You signed the guestbook, ${n}.` : 'You signed the guestbook.' })
      } else if (tk.action === 'honk') {
        set({ notice: 'Beep beep!' })
      } else if (tk.action === 'water') {
        doPose('water', now, 3.8)
        set({ notice: 'The plant looks much happier.' })
      }
      get().mark('things', tk.id)
      return
    }
    if (!NPCS[tk.id]) return
    get().mark(tk.kind === 'person' ? 'met' : 'things', tk.id)
    set({ talking: { id: tk.id, node: 'hi' } })
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
    if (opt.action === 'escort') {
      // Ayesha starts the guided tour from wherever she is standing right now
      const sp = spotOf('receptionist', worldClock.t)
      startEscort({ x: sp ? sp.x : -8, z: sp ? sp.z : 7.2 })
      return set({ talking: null })
    }
    if (opt.teleport) {
      teleport(opt.teleport[0], opt.teleport[1])
      return set({ talking: null })
    }
    // The conversation stays open until you say goodbye or walk away: answers without a destination
    // go back to the start rather than closing the chat.
    const ends = /^(thanks, bye|bye|goodbye|see you|step away)/i.test(opt.label)
    if (ends) return set({ talking: null })
    const next = opt.next && NPCS[t.id].nodes[opt.next] ? opt.next : 'hi'
    set({ talking: { id: t.id, node: next } })
  },
  endTalk: () => set({ talking: null }),
}))
