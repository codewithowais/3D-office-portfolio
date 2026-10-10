'use client'
import { useStore, type Quality } from '@/lib/store'
import { THEME_NAMES, type ThemeName } from '@/lib/themes'
import { BRAND } from '@/lib/world'

const QUALITIES: Quality[] = ['Low', 'Medium', 'High']

const Chev = () => (
  <svg className="ui-select-chev" width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
    <path d="M2 3.5 5 6.5 8 3.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const icons = {
  time: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  ),
  quality: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M5 20v-5M12 20V9M19 20V4" />
    </svg>
  ),
}

function Pick<T extends string>({ label, icon, value, options, onChange }: { label: string; icon: React.ReactNode; value: T; options: T[]; onChange: (v: T) => void }) {
  return (
    <label className="ui-select-wrap text-[12px]">
      <span className="hidden sm:inline-flex">{icon}</span>
      <span className="hidden text-[11px] font-medium sm:inline">{label}</span>
      <select aria-label={label} value={value} onChange={(e) => onChange(e.target.value as T)} className="ui-select">
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
      <Chev />
    </label>
  )
}

export default function TopBar() {
  const quality = useStore((s) => s.quality)
  const setQuality = useStore((s) => s.setQuality)
  const theme = useStore((s) => s.theme)
  const setTheme = useStore((s) => s.setTheme)
  return (
    <header className="ui-glass pointer-events-auto absolute left-3 right-3 top-[max(0.75rem,env(safe-area-inset-top))] flex h-[48px] items-center justify-between gap-2 rounded-full pl-4 pr-1.5 sm:left-4 sm:right-4 sm:h-[54px] sm:pl-3 sm:pr-2">
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="hidden h-8 w-8 shrink-0 place-items-center sm:grid rounded-full bg-[var(--ui-primary-bg)] text-[var(--ui-primary-fg)] shadow-[0_0_18px_-2px_var(--ui-glow)]" aria-hidden="true">
          <span className="h-3 w-3 rounded-[3px] border-[1.5px] border-current" />
        </span>
        <span className="whitespace-nowrap text-[11px] font-bold tracking-[0.1em] text-[var(--ui-text)] sm:text-[13px] sm:tracking-[0.14em]">{BRAND.name}</span>
        <span className="hidden items-center gap-2 border-l border-[var(--ui-border-inner)] pl-3 text-[10px] font-medium tracking-[0.18em] text-[var(--ui-faint)] md:flex">
          <span className="ui-dot h-1.5 w-1.5 rounded-full bg-[var(--ui-accent)]" />
          INTERACTIVE OFFICE
        </span>
      </div>
      <div className="flex items-center gap-1.5 sm:gap-2">
        <Pick<ThemeName> label="Time" icon={icons.time} value={theme} options={THEME_NAMES} onChange={setTheme} />
        <Pick<Quality> label="Quality" icon={icons.quality} value={quality} options={QUALITIES} onChange={setQuality} />
      </div>
    </header>
  )
}
