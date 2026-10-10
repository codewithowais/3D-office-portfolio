/** Remembers the visitor's name in this browser only. Every access is guarded: storage can be blocked. */
const KEY = 'office:name'
const SKIP = 'office:name-skipped'

function get(k: string): string {
  try {
    return (typeof localStorage !== 'undefined' && localStorage.getItem(k)) || ''
  } catch {
    return ''
  }
}
function set(k: string, v: string) {
  try {
    localStorage.setItem(k, v)
  } catch {
    /* private mode / blocked storage: the name just won't persist */
  }
}

export const readName = () => get(KEY)
export const readSkipped = () => get(SKIP) === '1'
export const saveName = (n: string) => set(KEY, n)
export const saveSkipped = () => set(SKIP, '1')

export interface Progress {
  met: string[]
  places: string[]
  things: string[]
}
export const EMPTY_PROGRESS: Progress = { met: [], places: [], things: [] }

export function readProgress(): Progress {
  try {
    const raw = get('office:progress')
    if (!raw) return { met: [], places: [], things: [] }
    const p = JSON.parse(raw) as Partial<Progress>
    const arr = (a: unknown) => (Array.isArray(a) ? a.filter((x): x is string => typeof x === 'string').slice(0, 200) : [])
    return { met: arr(p.met), places: arr(p.places), things: arr(p.things) }
  } catch {
    return { met: [], places: [], things: [] }
  }
}
export const saveProgress = (p: Progress) => set('office:progress', JSON.stringify(p))

export const DEFAULT_COLOR = '#ff6f59'
export const readColor = () => get('office:color') || DEFAULT_COLOR
export const saveColor = (c: string) => set('office:color', c)

export const readFemale = () => get('office:female') === '1'
export const saveFemale = (f: boolean) => set('office:female', f ? '1' : '0')

export const readSpeed = (): number => {
  const n = Number(get('office:speed'))
  return n === 1 || n === 2 ? n : 0
}
export const saveSpeed = (n: number) => set('office:speed', String(n))
