'use client'
import { useStore } from '@/lib/store'

/** Shown while walking on the football pitch or outside the office compound: one tap brings you home. */
export default function BackToOffice() {
  const show = useStore((s) => s.walk && s.away)
  const back = useStore((s) => s.returnToOffice)
  if (!show) return null
  return (
    <button
      onClick={back}
      className="ui-glass ui-btn ui-btn-primary ui-pop pointer-events-auto absolute left-1/2 top-[calc(max(0.75rem,env(safe-area-inset-top))+58px)] h-10 -translate-x-1/2 rounded-full px-5 text-[13px] font-semibold"
    >
      Back to office
    </button>
  )
}
