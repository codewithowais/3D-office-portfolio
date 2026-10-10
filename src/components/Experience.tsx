'use client'
import { useEffect } from 'react'
import { receptionist, TOUR_LEN, visitor } from '@/lib/actors'
import { clock } from '@/lib/clock'
import { useStore } from '@/lib/store'
import Overlay from './Overlay'
import Scene from './Scene'

export default function Experience() {
  useEffect(() => {
    // Deep link into the tour, e.g. /?t=60. Also handy for debugging in dev.
    const t = Number(new URLSearchParams(window.location.search).get('t'))
    if (t > 0) clock.t = t
    if (process.env.NODE_ENV !== 'production') (window as unknown as Record<string, unknown>).__office = { clock, store: useStore, marks: { visitor: visitor.marks, receptionist: receptionist.marks, TOUR_LEN } }
  }, [])
  return (
    <div className="fixed inset-0 bg-[#dcecf4]">
      <Scene />
      <Overlay />
    </div>
  )
}
