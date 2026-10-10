'use client'
import { useEffect, useRef, useState } from 'react'
import { NPCS, fill } from '@/lib/dialogue'
import { soccer } from '@/lib/soccer'
import { PROGRESS_TOTAL, useStore } from '@/lib/store'
import { talkable } from '@/lib/talkables'
import NameGate from './NameGate'

const anchor = 'absolute left-3 right-3 top-[calc(max(0.75rem,env(safe-area-inset-top))+104px)] sm:left-[232px] sm:right-4 sm:top-[76px]'

/** "Press E to talk" prompt when someone is in range, and the conversation panel once you start. */
export default function Dialogue() {
  const walk = useStore((s) => s.walk)
  const nearby = useStore((s) => s.nearby)
  const talking = useStore((s) => s.talking)
  const asking = useStore((s) => s.askName)
  const nearBall = useStore((s) => s.nearBall)
  const seated = useStore((s) => s.seated)
  if (!walk) return null
  return (
    <>
      <NameGate />
      <ProgressChip />
      {!asking && !talking && <PlaceBanner />}
      {!asking && talking && <Conversation id={talking.id} node={talking.node} />}
      {!asking && !talking && seated && <StandPrompt />}
      {!asking && !talking && !seated && nearby && talkable(nearby) && <Prompt id={nearby} />}
      {!asking && !talking && !seated && !nearby && nearBall && <KickPrompt />}
    </>
  )
}

/** The place you just walked into: its name and a line about it. Fades after a few seconds. */
function PlaceBanner() {
  const place = useStore((s) => s.place)
  const clearPlace = useStore((s) => s.clearPlace)
  useEffect(() => {
    if (!place) return
    const id = window.setTimeout(clearPlace, 4200)
    return () => window.clearTimeout(id)
  }, [place, clearPlace])
  if (!place) return null
  return (
    <div key={place.nonce} className="pointer-events-none absolute left-1/2 top-[calc(max(0.75rem,env(safe-area-inset-top))+164px)] z-10 w-[min(92vw,460px)] -translate-x-1/2 sm:top-[136px]">
      <div className="ui-glass ui-toast rounded-2xl px-5 py-3 text-center">
        <p className="ui-display text-[20px] leading-tight text-[var(--ui-text)]">{place.title}</p>
        <p className="mt-0.5 text-[12px] text-[var(--ui-muted)]">{place.sub}</p>
      </div>
    </div>
  )
}

/** How much of the office you've discovered. Tap it for the breakdown. */
function ProgressChip() {
  const progress = useStore((s) => s.progress)
  const [open, setOpen] = useState(false)
  const done = progress.met.length + progress.places.length + progress.things.length
  const total = PROGRESS_TOTAL.met + PROGRESS_TOTAL.places + PROGRESS_TOTAL.things
  const pct = Math.round((done / total) * 100)
  const row = (label: string, n: number, of: number) => (
    <li className="flex items-center justify-between gap-6">
      <span>{label}</span>
      <span className="tabular-nums text-[var(--ui-muted)]">{n} / {of}</span>
    </li>
  )
  return (
    <div className="pointer-events-none absolute right-3 top-[calc(max(0.75rem,env(safe-area-inset-top))+54px)] z-10 flex flex-col items-end sm:right-4 sm:top-[68px]">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={`Explorer progress ${done} of ${total}`}
        className="ui-glass ui-btn pointer-events-auto flex items-center gap-2 !rounded-full px-3 py-1.5 text-[12px] text-[var(--ui-text)]"
      >
        <span className="relative h-1.5 w-12 overflow-hidden rounded-full bg-[var(--ui-hover)]">
          <span className="absolute inset-y-0 left-0 rounded-full bg-[var(--ui-accent)] transition-[width]" style={{ width: `${pct}%` }} />
        </span>
        <span className="font-semibold tabular-nums">{done}/{total}</span>
      </button>
      {open && (
        <div className="ui-glass ui-pop pointer-events-auto mt-2 w-[220px] rounded-2xl p-4 text-[13px] text-[var(--ui-text)]">
          <p className="ui-display text-[17px]">Explorer</p>
          <ul className="mt-2 grid gap-1.5">
            {row('People met', progress.met.length, PROGRESS_TOTAL.met)}
            {row('Places visited', progress.places.length, PROGRESS_TOTAL.places)}
            {row('Things tried', progress.things.length, PROGRESS_TOTAL.things)}
          </ul>
          <p className="mt-3 text-[11px] text-[var(--ui-muted)]">Talk to people, walk into every room, and try the computers, chairs and coffee machine.</p>
        </div>
      )}
    </div>
  )
}

function StandPrompt() {
  const standUp = useStore((s) => s.standUp)
  return (
    <div className={`${anchor} pointer-events-none flex sm:justify-start`}>
      <button onClick={standUp} className="ui-glass ui-btn ui-pop pointer-events-auto flex items-center gap-3 !rounded-full py-2 pl-2 pr-5 text-left text-[13px] text-[var(--ui-text)]">
        <span className="grid h-8 w-8 place-items-center rounded-full bg-[var(--ui-accent)] text-[11px] font-semibold text-white">E</span>
        <span>
          <strong className="font-semibold">Stand up</strong>
          <span className="ml-1.5 text-[var(--ui-muted)]">or press any movement key</span>
        </span>
      </button>
    </div>
  )
}

function KickPrompt() {
  return (
    <div className={`${anchor} pointer-events-none flex sm:justify-start`}>
      <button
        onClick={() => {
          soccer.kickRequest = true
        }}
        className="ui-glass ui-btn ui-pop pointer-events-auto flex items-center gap-3 !rounded-full py-2 pl-2 pr-5 text-left text-[13px] text-[var(--ui-text)]"
      >
        <span className="grid h-8 w-8 place-items-center rounded-full bg-[var(--ui-accent)] text-[11px] font-semibold text-white">E</span>
        <span>
          <strong className="font-semibold">Kick the ball</strong>
          <span className="ml-1.5 text-[var(--ui-muted)]">or run into it</span>
        </span>
      </button>
    </div>
  )
}

function Prompt({ id }: { id: string }) {
  const startTalk = useStore((s) => s.startTalk)
  const tk = talkable(id)
  const npc = NPCS[id]
  if (!tk) return null
  const person = tk.kind === 'person'
  const accent = npc?.accent ?? (tk.kind === 'seat' ? '#2bbcbc' : '#e0a21a')
  return (
    <div className={`${anchor} pointer-events-none flex sm:justify-start`}>
      <button
        onClick={() => startTalk(id)}
        className="ui-glass ui-btn ui-pop pointer-events-auto flex items-center gap-3 !rounded-full py-2 pl-2 pr-5 text-left text-[13px] text-[var(--ui-text)]"
      >
        <span className="grid h-8 w-8 place-items-center rounded-full text-[11px] font-semibold text-white" style={{ background: accent }}>
          E
        </span>
        {person && npc ? (
          <span>
            Talk to <strong className="font-semibold">{npc.name}</strong>
            <span className="ml-1.5 text-[var(--ui-muted)]">{npc.role}</span>
          </span>
        ) : (
          <strong className="font-semibold">{tk.label}</strong>
        )}
      </button>
    </div>
  )
}

function Conversation({ id, node }: { id: string; node: string }) {
  const choose = useStore((s) => s.choose)
  const endTalk = useStore((s) => s.endTalk)
  const playerName = useStore((s) => s.playerName)
  const npc = NPCS[id]
  const n = npc.nodes[node]
  const box = useRef<HTMLDivElement>(null)
  useEffect(() => {
    box.current?.focus({ preventScroll: true })
  }, [id, node])
  if (!n) return null
  return (
    <div className={`${anchor} pointer-events-none flex sm:justify-start`}>
      <div
        ref={box}
        tabIndex={-1}
        role="dialog"
        aria-label={`Conversation with ${npc.name}`}
        aria-live="polite"
        className="ui-glass ui-pop pointer-events-auto w-full max-w-[560px] rounded-[22px] p-4 outline-none sm:p-5"
      >
        <div className="mb-3 flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-[15px] font-semibold text-white" style={{ background: npc.accent }} aria-hidden>
            {npc.name[0]}
          </span>
          <div className="min-w-0 flex-1">
            <p className="ui-display text-[21px] leading-none text-[var(--ui-text)]">{npc.name}</p>
            <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-[var(--ui-muted)]">{npc.role}</p>
          </div>
          <button onClick={endTalk} aria-label="End conversation" className="ui-btn ui-focus grid h-8 w-8 place-items-center !rounded-full !p-0 text-[var(--ui-muted)]">
            ✕
          </button>
        </div>
        <p className="text-[14px] leading-relaxed text-[var(--ui-text)]">{fill(n.text, playerName)}</p>
        <ul className="mt-4 grid gap-1.5">
          {n.options.map((o, i) => (
            <li key={`${node}-${i}`}>
              <button
                onClick={() => choose(i)}
                className="ui-row ui-focus flex w-full cursor-pointer items-center gap-3 rounded-xl border border-[var(--ui-border-inner)] px-3 py-2.5 text-left text-[13px] !text-[var(--ui-text)] hover:!border-[var(--ui-accent)]"
              >
                <span className="grid h-5 w-5 shrink-0 place-items-center rounded-md bg-[var(--ui-accent-soft)] text-[10px] font-semibold text-[var(--ui-accent)]">{i + 1}</span>
                <span className="flex-1">{o.label}</span>
                {o.href && <span aria-hidden className="text-[var(--ui-faint)]">↗</span>}
              </button>
            </li>
          ))}
        </ul>
        <p className="mt-3 hidden text-[11px] text-[var(--ui-muted)] sm:block">Press 1–{n.options.length} to answer · E to continue · Esc to leave</p>
      </div>
    </div>
  )
}
