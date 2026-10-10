'use client'
import { useEffect } from 'react'
import { receptionist, TOUR_LEN, visitor } from '@/lib/actors'
import { clock } from '@/lib/clock'
import { input, player } from '@/lib/player'
import { useStore } from '@/lib/store'
import Overlay from './Overlay'
import Scene from './Scene'

export default function Experience() {
  useEffect(() => {
    // Deep link into the tour, e.g. /?t=60. Also handy for debugging in dev.
    const t = Number(new URLSearchParams(window.location.search).get('t'))
    if (t > 0) clock.t = t
    if (process.env.NODE_ENV !== 'production') (window as unknown as Record<string, unknown>).__office = { clock, player, input, store: useStore, marks: { visitor: visitor.marks, receptionist: receptionist.marks, TOUR_LEN } }

    const KEYS: Record<string, keyof typeof input> = { KeyW: 'f', ArrowUp: 'f', KeyS: 'b', ArrowDown: 'b', KeyA: 'l', ArrowLeft: 'l', KeyD: 'r', ArrowRight: 'r', ShiftLeft: 'run', ShiftRight: 'run' }
    const typing = (e: KeyboardEvent) => ['SELECT', 'INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)
    const down = (e: KeyboardEvent) => {
      const st = useStore.getState()
      if (typing(e) || !st.walk) return
      if (e.code === 'Escape') return st.stopWalk()
      const k = KEYS[e.code]
      if (k) {
        input[k] = true
        e.preventDefault()
      }
    }
    const up = (e: KeyboardEvent) => {
      const k = KEYS[e.code]
      if (k) input[k] = false
    }
    const clear = () => Object.assign(input, { f: false, b: false, l: false, r: false, run: false })
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    window.addEventListener('blur', clear)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      window.removeEventListener('blur', clear)
    }
  }, [])
  return (
    <div className="fixed inset-0 bg-[#dcecf4]">
      <Scene />
      <Overlay />
    </div>
  )
}
