'use client'
import { Component, type ReactNode } from 'react'
import { useStore } from '@/lib/store'

export function Fallback({ title, detail, reload = true }: { title: string; detail: string; reload?: boolean }) {
  return (
    <div className="grid h-full w-full place-items-center bg-[#dcecf4] p-6 text-center text-[#14324b]" role="alert">
      <div className="max-w-sm">
        <p className="text-2xl" style={{ fontFamily: "'Iowan Old Style','Palatino Linotype',Georgia,serif" }}>{title}</p>
        <p className="mt-2 text-sm text-[#4f6170]">{detail}</p>
        {reload && (
          <button onClick={() => window.location.reload()} className="mt-5 rounded-full bg-[#14324b] px-5 py-2.5 text-sm text-white">
            Reload
          </button>
        )}
      </div>
    </div>
  )
}

/** Catches any render/GPU error in the 3D tree so the page shows a message instead of a blank screen. */
export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch(error: unknown) {
    // A missing/lost GPU context makes the renderer throw while mounting. That is recoverable:
    // the Experience watchdog rebuilds the scene as soon as a fresh context can be created.
    const msg = String((error as Error)?.message ?? error)
    let lost = /context|webgl|getContextAttributes|alpha/i.test(msg)
    if (!lost) {
      const canvas = document.querySelector('canvas')
      lost = !!canvas && (canvas.getContext('webgl2')?.isContextLost() ?? false)
    }
    if (!lost) console.error('3D scene crashed:', error)
    useStore.getState().setError(lost ? 'lost' : 'crash')
  }
  render() {
    if (this.state.failed) return <Failed />
    return this.props.children
  }
}

function Failed() {
  const error = useStore((s) => s.error)
  if (error === 'lost') return <Fallback reload={false} title="Graphics paused" detail="Your device took the GPU back for a moment. The scene will return by itself; if it doesn't, reload the page." />
  return <Fallback title="Something went wrong" detail="The 3D scene stopped unexpectedly. Reloading usually fixes it." />
}
