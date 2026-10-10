'use client'
import { useEffect, useState } from 'react'
import { input } from '@/lib/player'
import Dialogue from './Dialogue'
import { useStore, type Quality } from '@/lib/store'
import { THEME_NAMES, type ThemeName } from '@/lib/themes'
import { CHAPTERS } from '@/lib/tour'
import { BRAND, ROOMS, SCENIC, roomView } from '@/lib/world'

const glass = 'bg-[#f8fbfd]/92 backdrop-blur-md border border-white/60 shadow-[0_8px_30px_rgba(40,50,40,0.14)]'
const serif = { fontFamily: "'Iowan Old Style','Palatino Linotype',Palatino,Georgia,serif" }

function TopBar() {
  const quality = useStore((s) => s.quality)
  const setQuality = useStore((s) => s.setQuality)
  const theme = useStore((s) => s.theme)
  const setTheme = useStore((s) => s.setTheme)
  return (
    <header className={`pointer-events-auto absolute left-3 right-3 top-[max(0.75rem,env(safe-area-inset-top))] flex h-[46px] items-center justify-between gap-2 rounded-[18px] px-3 sm:left-4 sm:right-4 sm:h-[50px] sm:px-4 ${glass}`}>
      <div className="flex items-center gap-3">
        <span className="grid h-6 w-6 place-items-center rounded-[6px] border border-[#d19a5c]">
          <span className="h-2.5 w-2.5 rounded-[2px] border border-[#d19a5c]" />
        </span>
        <span className="whitespace-nowrap text-[12px] font-semibold tracking-[0.1em] text-[#14324b] sm:text-[13px] sm:tracking-[0.14em]">{BRAND.name}</span>
        <span className="hidden text-[11px] text-[#8fa0ad] sm:inline">/ 01</span>
      </div>
      <div className="flex items-center gap-2 text-[10px] tracking-[0.16em] text-[#456072] sm:gap-3">
        <span className="hidden items-center gap-2 sm:flex">
          <span className="h-1.5 w-1.5 rounded-full bg-[#17a2a4]" />
          INTERACTIVE OFFICE
        </span>
        <label className="flex items-center gap-2 tracking-normal">
          <span className="hidden text-[11px] sm:inline">Time</span>
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value as ThemeName)}
            className="rounded-md border border-[#cfd8de] bg-white/70 px-1.5 py-1 text-[11px] text-[#14324b] outline-none"
          >
            {THEME_NAMES.map((n) => (
              <option key={n}>{n}</option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 tracking-normal">
          <span className="hidden text-[11px] sm:inline">Quality</span>
          <select
            value={quality}
            onChange={(e) => setQuality(e.target.value as Quality)}
            className="rounded-md border border-[#c6ced4] bg-white/70 px-2 py-1 text-[11px] text-[#14324b] outline-none"
          >
            {(['Low', 'Medium', 'High'] as Quality[]).map((q) => (
              <option key={q}>{q}</option>
            ))}
          </select>
        </label>
      </div>
    </header>
  )
}

function RoomMenu() {
  const active = useStore((s) => s.activeRoom)
  const flyTo = useStore((s) => s.flyTo)
  const [open, setOpen] = useState(false)
  const [shown, setShown] = useState(false) // phones: menu is closed until asked for
  return (
    <>
    <button
      onClick={() => setShown((v) => !v)}
      aria-expanded={shown}
      className={`pointer-events-auto absolute left-3 top-[calc(max(0.75rem,env(safe-area-inset-top))+54px)] rounded-full px-4 py-2 text-[12px] text-[#14324b] sm:hidden ${glass}`}
    >
      {shown ? 'Hide rooms' : 'Rooms'}
    </button>
    <nav className={`pointer-events-auto absolute left-3 top-[calc(max(0.75rem,env(safe-area-inset-top))+98px)] w-[184px] rounded-[18px] p-2 sm:left-4 sm:top-[76px] sm:block sm:w-[196px] ${shown ? 'block' : 'hidden'} ${glass}`} aria-label="Rooms">
      <ul>
        {ROOMS.map((r, i) => {
          const on = active === r.id
          return (
            <li key={r.id}>
              <button
                onClick={() => {
                  const v = roomView(r)
                  flyTo(v.pos, v.target, r.id)
                  setShown(false)
                }}
                className={`group flex w-full items-center gap-3 rounded-xl px-3 py-[7px] text-left text-[13px] transition-colors ${on ? 'bg-[#0f8b8d]/10 font-semibold text-[#14324b]' : 'text-[#4f6170] hover:bg-black/[0.04]'}`}
              >
                <span className={`text-[10px] tabular-nums ${on ? 'text-[#ff6f59]' : 'text-[#9aa8b4]'}`}>{String(i + 1).padStart(2, '0')}</span>
                {r.name}
              </button>
            </li>
          )
        })}
      </ul>
      <div className="mt-1 border-t border-black/10 pt-1">
        <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between rounded-xl px-3 py-[7px] text-[12px] text-[#456072] hover:bg-black/[0.04]">
          <span>Scenic places ↗</span>
          <span className={`text-[10px] transition-transform ${open ? 'rotate-180' : ''}`}>⌄</span>
        </button>
        {open && (
          <ul>
            {SCENIC.map((s) => (
              <li key={s.id}>
                <button onClick={() => flyTo(s.pos, s.target, null)} className="w-full rounded-xl px-3 py-[6px] pl-8 text-left text-[12px] text-[#4f6170] hover:bg-black/[0.04]">
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

function Caption() {
  const chapter = useStore((s) => s.chapter)
  const mode = useStore((s) => s.mode)
  const walk = useStore((s) => s.walk)
  if (mode !== 'demo') {
    return (
      <div className={`pointer-events-none absolute bottom-[calc(env(safe-area-inset-bottom)+64px)] left-3 ${walk ? 'max-w-[170px] sm:max-w-[300px]' : 'max-w-[300px]'} rounded-[18px] px-4 py-3 sm:bottom-4 sm:left-4 sm:px-5 sm:py-4 ${glass}`}>
        <p className="text-[22px] leading-tight text-[#14324b]" style={serif}>{walk ? 'You are walking' : 'Explore freely'}</p>
        <p className={`mt-1 text-[12px] text-[#4f6170] ${walk ? 'hidden sm:block' : ''}`}>
          {walk ? 'W A S D or arrows to move · Shift to run · drag to look · Esc to stop' : 'Drag to orbit · scroll to zoom · right-drag to pan'}
        </p>
      </div>
    )
  }
  const c = CHAPTERS[chapter]
  return (
    <div key={chapter} className={`caption-in pointer-events-none absolute bottom-[calc(env(safe-area-inset-bottom)+64px)] left-3 max-w-[calc(100%-1.5rem)] rounded-[18px] px-4 py-3 sm:bottom-4 sm:left-4 sm:max-w-[360px] sm:px-5 sm:py-4 ${glass}`}>
      <p className="text-[21px] leading-[1.1] text-[#14324b] sm:text-[28px]" style={serif}>{c.title}</p>
      <p className="mt-1.5 text-[12px] text-[#4f6170]">{c.sub}</p>
    </div>
  )
}

function Controls() {
  const mode = useStore((s) => s.mode)
  const paused = useStore((s) => s.paused)
  const toggle = useStore((s) => s.togglePause)
  const setMode = useStore((s) => s.setMode)
  const start = useStore((s) => s.startDemo)
  const walk = useStore((s) => s.walk)
  const startWalk = useStore((s) => s.startWalk)
  const stopWalk = useStore((s) => s.stopWalk)
  const btn = `whitespace-nowrap rounded-full px-3.5 py-2 text-[12px] text-[#14324b] transition hover:bg-white sm:px-5 sm:py-2.5 sm:text-[13px] ${glass}`
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
            <button className={`${btn} !bg-[#14324b] !text-white hover:!bg-[#1c4466]`} onClick={startWalk}>Walk as a person</button>
          )}
          <button className={btn} onClick={start}>Start demo</button>
        </>
      )}
    </div>
  )
}

/** Touch / mouse pad for walking without a keyboard. */
function WalkPad() {
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
  const key = `grid h-12 w-12 place-items-center rounded-2xl text-lg text-[#14324b] select-none touch-none active:bg-white ${glass}`
  return (
    <div className="pointer-events-auto absolute bottom-[calc(env(safe-area-inset-bottom)+64px)] right-3 grid grid-cols-3 gap-2 sm:bottom-24 sm:right-4" aria-label="Walking controls">
      <span />
      <button className={key} aria-label="Forward" {...hold('f')}>▲</button>
      <span />
      <button className={key} aria-label="Left" {...hold('l')}>◀</button>
      <button className={key} aria-label="Back" {...hold('b')}>▼</button>
      <button className={key} aria-label="Right" {...hold('r')}>▶</button>
      <button className={`${key} col-span-3 !h-10 !w-auto !text-[12px]`} {...hold('run')}>Hold to run</button>
    </div>
  )
}

/** Tells people when quality was lowered automatically, or if the GPU was taken away. */
function Notices() {
  const notice = useStore((s) => s.notice)
  const error = useStore((s) => s.error)
  const setNotice = useStore((s) => s.setNotice)
  useEffect(() => {
    if (!notice) return
    const id = window.setTimeout(() => setNotice(null), 6000)
    return () => window.clearTimeout(id)
  }, [notice, setNotice])
  return (
    <>
      {notice && (
        <div role="status" className={`pointer-events-none absolute left-1/2 top-[70px] -translate-x-1/2 rounded-full px-4 py-2 text-[12px] text-[#14324b] ${glass}`}>
          {notice}
        </div>
      )}
      {error === 'lost' && (
        <div role="alert" className={`pointer-events-auto absolute left-1/2 top-[70px] w-[min(92vw,420px)] -translate-x-1/2 rounded-2xl px-4 py-3 text-center text-[13px] text-[#14324b] ${glass}`}>
          Graphics were paused by your device. They usually resume on their own, or{' '}
          <button className="underline" onClick={() => window.location.reload()}>reload</button>.
        </div>
      )}
    </>
  )
}

export default function Overlay() {
  const ready = useStore((s) => s.ready)
  return (
    <>
      <div className="pointer-events-none absolute inset-0 select-none text-[#14324b]">
        <TopBar />
        <RoomMenu />
        <Caption />
        <Controls />
        <WalkPad />
        <Notices />
        <Dialogue />
      </div>
      <div className={`pointer-events-none absolute inset-0 grid place-items-center bg-[#dcecf4] transition-opacity duration-700 ${ready ? 'opacity-0' : 'opacity-100'}`}>
        <div className="text-center" style={serif}>
          <p className="text-2xl text-[#14324b]">{BRAND.name}</p>
          <p className="mt-1 text-sm text-[#4f6170]">Building the neighbourhood…</p>
        </div>
      </div>
    </>
  )
}
