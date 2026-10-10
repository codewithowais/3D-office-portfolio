'use client'
import { useState } from 'react'
import { useStore } from '@/lib/store'
import { ROOMS, SCENIC, roomView } from '@/lib/world'

export default function RoomMenu() {
  const active = useStore((s) => s.activeRoom)
  const flyTo = useStore((s) => s.flyTo)
  const [open, setOpen] = useState(false)
  const [shown, setShown] = useState(false) // phones: menu is closed until asked for
  return (
    <>
      <button
        onClick={() => setShown((v) => !v)}
        aria-expanded={shown}
        aria-controls="room-menu"
        className="ui-glass ui-btn pointer-events-auto absolute left-3 top-[calc(max(0.75rem,env(safe-area-inset-top))+58px)] h-9 rounded-full px-4 text-[12px] font-semibold sm:hidden"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <path d="M4 7h16M4 12h16M4 17h10" />
        </svg>
        {shown ? 'Hide rooms' : 'Rooms'}
      </button>
      <nav
        id="room-menu"
        aria-label="Rooms"
        className={`ui-glass ui-pop pointer-events-auto absolute left-3 top-[calc(max(0.75rem,env(safe-area-inset-top))+102px)] max-h-[calc(100dvh-230px)] w-[200px] overflow-y-auto rounded-3xl p-1.5 sm:left-4 sm:top-[78px] sm:block sm:w-[208px] ${shown ? 'block' : 'hidden'}`}
      >
        <p className="px-3 pb-1 pt-2 text-[10px] font-semibold tracking-[0.18em] text-[var(--ui-faint)]">ROOMS</p>
        <ul>
          {ROOMS.map((r, i) => {
            const on = active === r.id
            return (
              <li key={r.id}>
                <button
                  aria-current={on ? 'true' : undefined}
                  onClick={() => {
                    const v = roomView(r)
                    flyTo(v.pos, v.target, r.id)
                    setShown(false)
                  }}
                  className="ui-row group flex w-full cursor-pointer items-center gap-3 rounded-2xl px-3 py-[7px] text-left text-[13px]"
                >
                  <span className={`text-[10px] font-semibold tabular-nums ${on ? 'text-[var(--ui-accent)]' : 'text-[var(--ui-faint)]'}`}>{String(i + 1).padStart(2, '0')}</span>
                  <span className="flex-1">{r.name}</span>
                  {on && <span className="h-1.5 w-1.5 rounded-full bg-[var(--ui-accent)] shadow-[0_0_8px_var(--ui-accent)]" aria-hidden="true" />}
                </button>
              </li>
            )
          })}
        </ul>
        <div className="mt-1 border-t border-[var(--ui-border-inner)] pt-1">
          <button
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            className="ui-row flex w-full cursor-pointer items-center justify-between rounded-2xl px-3 py-[7px] text-[12px] font-medium"
          >
            <span>Scenic places ↗</span>
            <svg className={`transition-transform ${open ? 'rotate-180' : ''}`} width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
              <path d="M2 3.5 5 6.5 8 3.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          {open && (
            <ul className="ui-pop">
              {SCENIC.map((s) => (
                <li key={s.id}>
                  <button onClick={() => flyTo(s.pos, s.target, null)} className="ui-row w-full cursor-pointer rounded-2xl px-3 py-[6px] pl-8 text-left text-[12px]">
                    {s.name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </nav>
    </>
  )
}
