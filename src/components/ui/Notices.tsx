'use client'
import { useEffect } from 'react'
import { useStore } from '@/lib/store'

/** Tells people when quality was lowered automatically, or if the GPU was taken away. */
export default function Notices() {
  const notice = useStore((s) => s.notice)
  const error = useStore((s) => s.error)
  const setNotice = useStore((s) => s.setNotice)
  useEffect(() => {
    if (!notice) return
    const id = window.setTimeout(() => setNotice(null), 6000)
    return () => window.clearTimeout(id)
  }, [notice, setNotice])
  const top = 'top-[calc(max(0.75rem,env(safe-area-inset-top))+102px)] sm:top-[78px]'
  return (
    <div className={`pointer-events-none absolute inset-x-3 ${top} flex flex-col items-center gap-2`}>
      {notice && (
        <div role="status" className="ui-glass ui-toast flex max-w-full items-center gap-2 rounded-2xl px-4 py-2 text-center text-[12px] font-medium">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--ui-accent)]" aria-hidden="true" />
          {notice}
        </div>
      )}
      {error === 'lost' && (
        <div role="alert" className={`ui-glass ui-toast pointer-events-auto w-[min(100%,420px)] rounded-3xl border-l-4 !border-l-[var(--ui-warn)] px-4 py-3 text-[13px] leading-snug`}>
          <strong className="block text-[var(--ui-warn)]">Graphics paused</strong>
          Graphics were paused by your device. They usually resume on their own, or{' '}
          <button className="ui-focus cursor-pointer rounded font-semibold underline underline-offset-2" onClick={() => window.location.reload()}>reload</button>.
        </div>
      )}
    </div>
  )
}
