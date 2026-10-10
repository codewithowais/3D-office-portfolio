import { ROOMS } from './world'
import { PITCH } from './soccer'

export interface Zone {
  id: string
  title: string
  sub: string
  x0: number
  x1: number
  z0: number
  z1: number
}

const R = (id: string) => ROOMS.find((r) => r.id === id)!
const room = (id: string, sub: string): Zone => {
  const r = R(id)
  return { id, title: r.name, sub, x0: r.x0, x1: r.x1, z0: r.z0, z1: r.z1 }
}

/** Named places you can discover. The first matching zone wins, so specific ones come first. */
export const ZONES: Zone[] = [
  room('boss', 'Owais’s own cabin: his desk, his bookshelf, a chair for visitors'),
  room('reception', 'Ayesha’s front desk. Ring the bell, or ask for a tour'),
  room('studio', 'Where Hamza builds the front end. There’s a free desk if you want to work'),
  room('design', 'Zain’s corner for 3D and design'),
  room('meeting', 'Roadmap reviews happen here. Check the screen'),
  room('operations', 'Sana keeps the backend and cloud running from here'),
  room('lounge', 'Coffee, sofas and Usman. Take a seat'),
  { id: 'corridor', title: 'The Corridor', sub: 'Every room opens onto this hallway', x0: -3, x1: 3, z0: -14, z1: 14 },
  { id: 'gate', title: 'Security Gate', sub: 'Rashid keeps an eye on everyone coming in', x0: -8, x1: 8, z0: 14, z1: 26 },
  { id: 'pitch', title: 'Football Pitch', sub: 'Run into the ball to play. You’re on red', x0: PITCH.x0 - 1, x1: PITCH.x1 + 1, z0: PITCH.z0 - 4, z1: PITCH.z1 + 1 },
  { id: 'parking', title: 'Parking Lot', sub: 'Faisal’s car is parked here when he visits', x0: 28, x1: 54, z0: -21, z1: 24 },
  { id: 'garden', title: 'The Garden', sub: 'Rashid waters these shrubs every morning', x0: -25, x1: 25, z0: 14, z1: 19 },
]

export function zoneAt(x: number, z: number): Zone | null {
  for (const zn of ZONES) if (x >= zn.x0 && x <= zn.x1 && z >= zn.z0 && z <= zn.z1) return zn
  return null
}
