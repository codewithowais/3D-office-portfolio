'use client'
import { useEffect, useState } from 'react'
import { receptionist, TOUR_LEN, visitor } from '@/lib/actors'
import { clock } from '@/lib/clock'
import { getDevice } from '@/lib/device'
import { EMOTES, input, player } from '@/lib/player'
import { escort } from '@/lib/escort'
import { soccer } from '@/lib/soccer'
import { useStore } from '@/lib/store'
import { ErrorBoundary, Fallback } from './ErrorBoundary'
import Overlay from './Overlay'
import Scene from './Scene'

export default function Experience() {
  // Mount the heavy 3D scene only after the loading screen has had a chance to paint,
  // so the page never looks frozen while shaders compile.
  const [mount, setMount] = useState(false)
  const [supported] = useState(() => getDevice().webgl2)
  const sceneKey = useStore((s) => s.sceneKey)
  const error = useStore((s) => s.error)

  useEffect(() => {
    let a = 0
    let b = 0
    a = requestAnimationFrame(() => {
      b = requestAnimationFrame(() => setMount(true))
    })
    return () => {
      cancelAnimationFrame(a)
      cancelAnimationFrame(b)
    }
  }, [])

  // While the GPU is gone, keep checking whether a fresh context can be created, then rebuild the scene.
  useEffect(() => {
    if (error !== 'lost') return
    const id = window.setInterval(() => {
      try {
        const gl = document.createElement('canvas').getContext('webgl2')
        if (gl && !gl.isContextLost()) {
          gl.getExtension('WEBGL_lose_context')?.loseContext()
          useStore.getState().restoreScene()
        }
      } catch {
        /* still unavailable */
      }
    }, 1500)
    return () => window.clearInterval(id)
  }, [error])

  useEffect(() => {
    // Deep link into the tour, e.g. /?t=60. Also handy for debugging in dev.
    const t = Number(new URLSearchParams(window.location.search).get('t'))
    if (t > 0) clock.t = t
    if (process.env.NODE_ENV !== 'production') (window as unknown as Record<string, unknown>).__office = { clock, player, input, soccer, escort, store: useStore, marks: { visitor: visitor.marks, receptionist: receptionist.marks, TOUR_LEN } }

    const KEYS: Record<string, keyof typeof input> = { KeyW: 'f', ArrowUp: 'f', KeyS: 'b', ArrowDown: 'b', KeyA: 'l', ArrowLeft: 'l', KeyD: 'r', ArrowRight: 'r', ShiftLeft: 'run', ShiftRight: 'run' }
    const typing = (e: KeyboardEvent) => ['SELECT', 'INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)
    const down = (e: KeyboardEvent) => {
      const st = useStore.getState()
      if (typing(e) || !st.walk) return
      // Trust the modifier state on every key event: a Shift press that was swallowed (focus elsewhere,
      // dialogue/seated branches, Shift held before a key) would otherwise leave Run stuck off.
      input.run = e.shiftKey
      if (e.code === 'Escape') return st.talking ? st.endTalk() : st.seated ? st.standUp() : st.stopWalk()
      if (st.seated && !st.talking && (e.code === 'KeyE' || e.code === 'Space' || KEYS[e.code])) {
        e.preventDefault()
        st.standUp()
        return
      }
      if (e.code === 'KeyR' && !e.repeat) {
        // R cycles walk -> run -> sprint
        e.preventDefault()
        st.cycleSpeed()
        return
      }
      if (e.code === 'KeyE') {
        // E starts a conversation, and while talking picks the first answer ("continue")
        e.preventDefault()
        if (st.talking) st.choose(0)
        else if (st.nearby) st.startTalk(st.nearby)
        else if (soccer.active) soccer.kickRequest = true
        return
      }
      if (e.code === 'Space' && !st.talking && soccer.active) {
        e.preventDefault()
        soccer.kickRequest = true
        return
      }
      if (e.code === 'Space' && !st.talking) {
        e.preventDefault()
        if (!e.repeat) st.hop()
        return
      }
      const em = !st.talking && !e.repeat && !e.metaKey && !e.ctrlKey && EMOTES.find((m) => 'Key' + m.key === e.code)
      if (em) {
        e.preventDefault()
        st.emote(em.id)
        return
      }
      if (st.talking) {
        const m = /^(?:Digit|Numpad)([1-9])$/.exec(e.code)
        if (m) return st.choose(Number(m[1]) - 1)
        // walking away is how you leave a conversation
        if (KEYS[e.code] && e.code !== 'ShiftLeft' && e.code !== 'ShiftRight') {
          st.endTalk()
          input[KEYS[e.code]] = true
          e.preventDefault()
        }
        return
      }
      const k = KEYS[e.code]
      if (k) {
        input[k] = true
        e.preventDefault()
      }
    }
    const up = (e: KeyboardEvent) => {
      const k = KEYS[e.code]
      if (k) input[k] = false
      input.run = e.shiftKey
    }
    const clear = () => Object.assign(input, { f: false, b: false, l: false, r: false, run: false })
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    window.addEventListener('blur', clear)
    document.addEventListener('visibilitychange', clear)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      window.removeEventListener('blur', clear)
      document.removeEventListener('visibilitychange', clear)
    }
  }, [])

  if (!supported) {
    return <Fallback title="3D isn't available here" detail="This browser or device doesn't support WebGL 2, which the 3D office needs. Try an up-to-date Chrome, Edge, Firefox or Safari." />
  }
  return (
    <div className="fixed inset-0 bg-[#dcecf4]">
      <ErrorBoundary key={sceneKey}>{mount && <Scene />}</ErrorBoundary>
      <Overlay />
    </div>
  )
}
