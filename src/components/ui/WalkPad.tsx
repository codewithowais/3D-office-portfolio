'use client'
import { input } from '@/lib/player'
import { useStore } from '@/lib/store'

const arrow = (d: string) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d={d} />
  </svg>
)

/** Touch / mouse pad for walking without a keyboard. */
export default function WalkPad() {
  const walk = useStore((s) => s.walk)
  if (!walk) return null
  const hold = (k: keyof typeof input) => ({
    onPointerDown: (e: React.PointerEvent) => {
      e.currentTarget.setPointerCapture(e.pointerId)
      input[k] = true
    },
    onPointerUp: () => {
      input[k] = false
    },
    onPointerCancel: () => {
      input[k] = false
    },
  })
  const key = 'ui-glass ui-btn h-12 w-12 rounded-2xl select-none touch-none'
  return (
    <div role="group" className="ui-pop pointer-events-auto absolute bottom-[calc(env(safe-area-inset-bottom)+64px)] right-3 grid grid-cols-3 gap-2 sm:bottom-24 sm:right-4" aria-label="Walking controls">
      <span />
      <button className={key} aria-label="Forward" {...hold('f')}>{arrow('M12 6 4 17h16z')}</button>
      <span />
      <button className={key} aria-label="Left" {...hold('l')}>{arrow('M6 12l11-8v16z')}</button>
      <button className={key} aria-label="Back" {...hold('b')}>{arrow('M12 18 4 7h16z')}</button>
      <button className={key} aria-label="Right" {...hold('r')}>{arrow('M18 12 7 4v16z')}</button>
      <button className={`${key} col-span-3 !h-10 !w-auto text-[12px] font-semibold tracking-wide`} {...hold('run')}>Hold to run</button>
    </div>
  )
}
