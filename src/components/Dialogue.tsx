'use client'
import { useEffect, useRef } from 'react'
import { NPCS } from '@/lib/dialogue'
import { useStore } from '@/lib/store'

const anchor = 'absolute left-3 right-3 top-[calc(max(0.75rem,env(safe-area-inset-top))+104px)] sm:left-[232px] sm:right-4 sm:top-[76px]'

/** "Press E to talk" prompt when someone is in range, and the conversation panel once you start. */
export default function Dialogue() {
  const walk = useStore((s) => s.walk)
  const nearby = useStore((s) => s.nearby)
  const talking = useStore((s) => s.talking)
  if (!walk) return null
  if (talking) return <Conversation id={talking.id} node={talking.node} />
  if (nearby && NPCS[nearby]) return <Prompt id={nearby} />
  return null
}

function Prompt({ id }: { id: string }) {
  const startTalk = useStore((s) => s.startTalk)
  const npc = NPCS[id]
  return (
    <div className={`${anchor} pointer-events-none flex sm:justify-start`}>
      <button
        onClick={() => startTalk(id)}
        className={`pointer-events-auto ui-glass ui-btn ui-pop flex items-center gap-3 !rounded-full py-2 pl-2 pr-5 text-left text-[13px] text-[var(--ui-text)]`}
      >
        <span className="grid h-8 w-8 place-items-center rounded-full text-[11px] font-semibold text-white" style={{ background: npc.accent }}>
          E
        </span>
        <span>
          Talk to <strong className="font-semibold">{npc.name}</strong>
          <span className="ml-1.5 text-[var(--ui-muted)]">{npc.role}</span>
        </span>
      </button>
    </div>
  )
}

function Conversation({ id, node }: { id: string; node: string }) {
  const choose = useStore((s) => s.choose)
  const endTalk = useStore((s) => s.endTalk)
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
        <p className="text-[14px] leading-relaxed text-[var(--ui-text)]">{n.text}</p>
        <ul className="mt-4 grid gap-1.5">
          {n.options.map((o, i) => (
            <li key={`${node}-${i}`}>
              <button
                onClick={() => choose(i)}
                className="ui-row ui-focus flex w-full cursor-pointer items-center gap-3 rounded-xl border border-[var(--ui-border-inner)] px-3 py-2.5 text-left text-[13px] !text-[var(--ui-text)] hover:!border-[var(--ui-accent)]"
              >
                <span className="grid h-5 w-5 shrink-0 place-items-center rounded-md bg-[var(--ui-accent-soft)] text-[10px] font-semibold text-[var(--ui-accent)]">{i + 1}</span>
                {o.label}
              </button>
            </li>
          ))}
        </ul>
        <p className="mt-3 hidden text-[11px] text-[var(--ui-muted)] sm:block">Press 1–{n.options.length} to answer · E to continue · Esc to leave</p>
      </div>
    </div>
  )
}
