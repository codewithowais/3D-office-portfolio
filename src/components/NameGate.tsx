'use client'
import { useEffect, useRef, useState } from 'react'
import { input } from '@/lib/player'
import { useStore } from '@/lib/store'

const SHIRTS = ['#ff6f59', '#2f80d0', '#4cc2a0', '#9b6fd1', '#ffc233', '#d9568f']

/** Asks the visitor what to call them (once). Saved in this browser only; skipping is fine. */
export default function NameGate() {
  const open = useStore((s) => s.askName)
  const current = useStore((s) => s.playerName)
  const setPlayerName = useStore((s) => s.setPlayerName)
  const skipName = useStore((s) => s.skipName)
  const color = useStore((s) => s.playerColor)
  const setPlayerColor = useStore((s) => s.setPlayerColor)
  const [value, setValue] = useState(current)
  const ref = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    // stop any held movement keys, then focus the field
    Object.assign(input, { f: false, b: false, l: false, r: false, run: false })
    const id = window.setTimeout(() => ref.current?.focus(), 60)
    return () => window.clearTimeout(id)
  }, [open])

  if (!open) return null
  return (
    <div className="pointer-events-auto absolute inset-0 z-20 grid place-items-center bg-black/25 p-4 backdrop-blur-[2px]">
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="name-title"
        onSubmit={(e) => {
          e.preventDefault()
          setPlayerName(value)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Escape') skipName()
        }}
        className="ui-glass ui-pop w-full max-w-[380px] rounded-[24px] p-6 text-center"
      >
        <p id="name-title" className="ui-display text-[26px] leading-tight text-[var(--ui-text)]">
          Welcome! What&apos;s your name?
        </p>
        <p className="mt-2 text-[13px] text-[var(--ui-muted)]">Everyone in the office will greet you by name. It stays on this device.</p>
        <input
          ref={ref}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          maxLength={24}
          autoComplete="given-name"
          enterKeyHint="go"
          placeholder="Your name"
          aria-label="Your name"
          className="ui-focus mt-5 w-full rounded-xl border border-[var(--ui-border-inner)] bg-[var(--ui-surface-strong)] px-4 py-3 text-center text-[16px] text-[var(--ui-text)] outline-none placeholder:text-[var(--ui-faint)]"
        />
        <p className="mt-5 text-[12px] text-[var(--ui-muted)]">Pick your shirt colour</p>
        <div className="mt-2 flex justify-center gap-2" role="radiogroup" aria-label="Shirt colour">
          {SHIRTS.map((c) => (
            <button
              key={c}
              type="button"
              role="radio"
              aria-checked={color === c}
              aria-label={c}
              onClick={() => setPlayerColor(c)}
              className="ui-focus h-8 w-8 rounded-full border-2 transition-transform hover:scale-110"
              style={{ background: c, borderColor: color === c ? 'var(--ui-text)' : 'transparent', transform: color === c ? 'scale(1.12)' : undefined }}
            />
          ))}
        </div>
        <div className="mt-4 flex gap-2">
          <button type="button" onClick={skipName} className="ui-btn ui-focus flex-1 !rounded-xl py-2.5 text-[13px] text-[var(--ui-muted)]">
            Skip
          </button>
          <button type="submit" className="ui-btn ui-btn-primary ui-focus flex-1 !rounded-xl py-2.5 text-[13px] font-semibold">
            Let me in
          </button>
        </div>
      </form>
    </div>
  )
}
