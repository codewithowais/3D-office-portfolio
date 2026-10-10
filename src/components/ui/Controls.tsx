'use client'
import { useStore } from '@/lib/store'

export default function Controls() {
  const mode = useStore((s) => s.mode)
  const paused = useStore((s) => s.paused)
  const toggle = useStore((s) => s.togglePause)
  const setMode = useStore((s) => s.setMode)
  const start = useStore((s) => s.startDemo)
  const walk = useStore((s) => s.walk)
  const startWalk = useStore((s) => s.startWalk)
  const stopWalk = useStore((s) => s.stopWalk)
  const btn = 'ui-glass ui-btn rounded-full px-3.5 py-2 text-[12px] font-medium sm:px-5 sm:py-2.5 sm:text-[13px]'
  return (
    <div className="pointer-events-auto absolute bottom-[calc(env(safe-area-inset-bottom)+12px)] right-3 flex gap-2 sm:bottom-4 sm:right-4">
      {mode === 'demo' ? (
        <>
          <button className={btn} onClick={startWalk}>Walk</button>
          <button className={btn} onClick={toggle}>{paused ? 'Resume' : 'Pause'}</button>
          <button className={btn} onClick={() => setMode('explore')}>Exit demo</button>
        </>
      ) : (
        <>
          {walk ? (
            <button className={btn} onClick={stopWalk}>Stop walking</button>
          ) : (
            <button className={`${btn} ui-btn-primary`} onClick={startWalk}>Walk as a person</button>
          )}
          <button className={btn} onClick={start}>Start demo</button>
        </>
      )}
    </div>
  )
}
