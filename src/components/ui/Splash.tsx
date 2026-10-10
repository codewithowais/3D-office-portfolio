'use client'
import { useStore } from '@/lib/store'
import { BRAND } from '@/lib/world'

export default function Splash() {
  const ready = useStore((s) => s.ready)
  return (
    <div
      aria-hidden={ready}
      className={`pointer-events-none absolute inset-0 grid place-items-center bg-[radial-gradient(120%_90%_at_50%_0%,var(--ui-splash-b),var(--ui-splash-a))] transition-opacity duration-700 ${ready ? 'opacity-0' : 'opacity-100'}`}
    >
      <div className="text-center">
        <span className="mx-auto mb-5 grid h-12 w-12 place-items-center rounded-full bg-[var(--ui-primary-bg)] text-[var(--ui-primary-fg)] shadow-[0_0_30px_-2px_var(--ui-glow)]">
          <span className="h-4 w-4 rounded-[4px] border-2 border-current" />
        </span>
        <p className="ui-display text-3xl text-[var(--ui-text)]">{BRAND.name}</p>
        <p role="status" className="mt-1.5 text-sm text-[var(--ui-muted)]">Building the neighbourhood…</p>
        <div className="mx-auto mt-5 h-1 w-40 overflow-hidden rounded-full bg-[var(--ui-press)]">
          <div className="ui-load-bar h-full w-2/5 rounded-full bg-[var(--ui-accent)]" />
        </div>
      </div>
    </div>
  )
}
