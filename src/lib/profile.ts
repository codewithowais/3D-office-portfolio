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
