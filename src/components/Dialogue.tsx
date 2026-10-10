'use client'
import { useEffect, useRef } from 'react'
import { NPCS } from '@/lib/dialogue'
import { useStore } from '@/lib/store'

const glass = 'bg-[#f8fbfd]/95 backdrop-blur-md border border-white/60 shadow-[0_8px_30px_rgba(20,50,75,0.18)]'
const serif = { fontFamily: "'Iowan Old Style','Palatino Linotype',Palatino,Georgia,serif" }
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
        className={`pointer-events-auto flex items-center gap-3 rounded-full py-2 pl-2 pr-5 text-left text-[13px] text-[#14324b] transition hover:bg-white ${glass}`}
      >
        <span className="grid h-8 w-8 place-items-center rounded-full text-[11px] font-semibold text-white" style={{ background: npc.accent }}>
          E
        </span>
        <span>
          Talk to <strong className="font-semibold">{npc.name}</strong>
          <span className="ml-1.5 text-[#4f6170]">{npc.role}</span>
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
        className={`pointer-events-auto w-full max-w-[560px] rounded-[20px] p-4 outline-none sm:p-5 ${glass}`}
      >
        <div className="mb-3 flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-[15px] font-semibold text-white" style={{ background: npc.accent }} aria-hidden>
            {npc.name[0]}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[20px] leading-none text-[#14324b]" style={serif}>{npc.name}</p>
            <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-[#4f6170]">{npc.role}</p>
          </div>
          <button onClick={endTalk} aria-label="End conversation" className="grid h-8 w-8 place-items-center rounded-full text-[#456072] transition hover:bg-black/5">
            ✕
          </button>
        </div>
        <p className="text-[14px] leading-relaxed text-[#14324b]">{n.text}</p>
        <ul className="mt-4 grid gap-1.5">
          {n.options.map((o, i) => (
            <li key={`${node}-${i}`}>
              <button
                onClick={() => choose(i)}
                className="flex w-full items-center gap-3 rounded-xl border border-[#14324b]/10 bg-white/60 px-3 py-2.5 text-left text-[13px] text-[#14324b] transition hover:border-[#17a2a4] hover:bg-white"
              >
                <span className="grid h-5 w-5 shrink-0 place-items-center rounded-md bg-[#14324b]/8 text-[10px] font-semibold text-[#456072]">{i + 1}</span>
                {o.label}
              </button>
            </li>
          ))}
        </ul>
        <p className="mt-3 hidden text-[11px] text-[#4f6170] sm:block">Press 1–{n.options.length} to answer · E to continue · Esc to leave</p>
      </div>
    </div>
  )
}
