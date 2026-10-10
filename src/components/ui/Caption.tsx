'use client'
import { useStore } from '@/lib/store'
import { CHAPTERS } from '@/lib/tour'

export default function Caption() {
  const chapter = useStore((s) => s.chapter)
  const mode = useStore((s) => s.mode)
  const walk = useStore((s) => s.walk)
  const pos = 'pointer-events-none absolute bottom-[calc(env(safe-area-inset-bottom)+68px)] left-3 sm:bottom-4 sm:left-4'
  if (mode !== 'demo') {
    return (
      <div className={`ui-glass ${pos} ${walk ? 'max-w-[170px] sm:max-w-[320px]' : 'max-w-[300px]'} rounded-3xl px-4 py-3 sm:px-5 sm:py-4`}>
        <p className="mb-1 flex items-center gap-2 text-[10px] font-semibold tracking-[0.18em] text-[var(--ui-accent)]">
          <span className="ui-dot h-1.5 w-1.5 rounded-full bg-[var(--ui-accent)]" aria-hidden="true" />
          {walk ? 'ON FOOT' : 'EXPLORE'}
        </p>
        <p className="ui-display text-[22px] leading-tight">{walk ? 'You are walking' : 'Explore freely'}</p>
        <p className={`mt-1 text-[12px] leading-snug text-[var(--ui-muted)] ${walk ? 'hidden sm:block' : ''}`}>
          {walk ? 'W A S D or arrows to move · Shift to run · drag to look · Esc to stop' : 'Drag to orbit · scroll to zoom · right-drag to pan'}
        </p>
      </div>
    )
  }
  const c = CHAPTERS[chapter]
  return (
    <div key={chapter} className={`ui-glass caption-in ${pos} max-w-[calc(100%-1.5rem)] rounded-3xl px-4 py-3 sm:max-w-[380px] sm:px-5 sm:py-4`}>
      <p className="mb-1 flex items-center gap-2 text-[10px] font-semibold tracking-[0.18em] text-[var(--ui-accent)]">
        <span className="tabular-nums">{String(chapter + 1).padStart(2, '0')}</span>
        <span className="h-px w-5 bg-[var(--ui-accent)] opacity-60" aria-hidden="true" />
        <span>TOUR</span>
      </p>
      <p className="ui-display text-[21px] leading-[1.1] sm:text-[28px]">{c.title}</p>
      <p className="mt-1.5 text-[12px] leading-snug text-[var(--ui-muted)] sm:text-[13px]">{c.sub}</p>
    </div>
  )
}
