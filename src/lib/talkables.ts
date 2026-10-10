import { boss, guard, TOUR_LEN, visitor } from './actors'
import { receptionistSample } from './escort'

export interface Spot {
  x: number
  z: number
  visible: boolean
}

export interface Talkable {
  id: string
  /** height of the floating marker above the floor */
  marker: number
  at: (t: number, out: Spot) => Spot
}

function actor(id: string, a: { sample: (t: number) => { x: number; z: number; visible: boolean } }, marker = 2.35): Talkable {
  return {
    id,
    marker,
    at(t, out) {
      const s = a.sample(t % TOUR_LEN)
      out.x = s.x
      out.z = s.z
      out.visible = s.visible
      return out
    },
  }
}

function fixed(id: string, x: number, z: number, marker = 2.0): Talkable {
  return {
    id,
    marker,
    at(_t, out) {
      out.x = x
      out.z = z
      out.visible = true
      return out
    },
  }
}

/** Everyone you can speak to, and where they are right now. Seated staff use their desk positions. */
export const TALKABLES: Talkable[] = [
  actor('receptionist', { sample: receptionistSample }),
  actor('guard', guard),
  actor('visitor', visitor),
  actor('boss', boss, 2.0),
  fixed('jin', -17.4, -1.4),
  fixed('maya', -17, -13),
  fixed('leo', 7, -3.55),
  fixed('nora', 4.9, 7.55),
  fixed('omar', 15.2, 12.7),
  fixed('bilal', -41, -16.9, 2.35),
  fixed('hira', -39.5, -16.9, 2.35),
]

export const TALK_RANGE = 2.7

const scratch: Spot = { x: 0, z: 0, visible: true }

/** Current position of a talkable, or null. The result is reused, copy what you need. */
export function spotOf(id: string, t: number): Spot | null {
  const tk = TALKABLES.find((k) => k.id === id)
  return tk ? tk.at(t, scratch) : null
}
