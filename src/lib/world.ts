import type { V3 } from './math'

/** Edit these to rebrand the whole site. */
export const BRAND = {
  name: 'THE OFFICE',
  site: 'yourbrand.com',
}

export const C = {
  cream: '#e4e9ee',
  creamDark: '#dde3e8',
  wood: '#e6b980',
  woodLight: '#f0dcb8',
  woodDark: '#8a5a3a',
  green: '#0f8b8d',
  greenDark: '#14324b',
  sage: '#1fa6a6',
  terracotta: '#ff6f59',
  asphalt: '#353b44',
  sidewalk: '#bcc4cb',
  grass: '#6cbc55',
  grassDark: '#5fb447',
  glass: '#cfeef0',
  ink: '#232a27',
  sky: '#dcecf4',
}

export const OFFICE = { hx: 20, hz: 14, wallH: 3 }

export interface Room {
  id: string
  name: string
  x0: number
  x1: number
  z0: number
  z1: number
}

export const ROOMS: Room[] = [
  { id: 'reception', name: 'Reception', x0: -20, x1: -3, z0: 4, z1: 14 },
  { id: 'studio', name: 'Work Studio', x0: -20, x1: -3, z0: -4, z1: 4 },
  { id: 'design', name: 'Design Room', x0: 3, x1: 20, z0: -4, z1: 4 },
  { id: 'meeting', name: 'Meeting Room', x0: 3, x1: 12, z0: 4, z1: 14 },
  { id: 'operations', name: 'Operations', x0: -20, x1: -3, z0: -14, z1: -4 },
  { id: 'lounge', name: 'The Lounge', x0: 12, x1: 20, z0: 4, z1: 14 },
  { id: 'boss', name: 'Boss Cabin', x0: 3, x1: 20, z0: -14, z1: -4 },
]

export function roomView(r: Room): { pos: V3; target: V3 } {
  const cx = (r.x0 + r.x1) / 2
  const cz = (r.z0 + r.z1) / 2
  return { pos: [cx + 4, 12, cz + 13], target: [cx, 0, cz] }
}

export function roomAt(x: number, z: number): string | null {
  for (const r of ROOMS) if (x >= r.x0 && x <= r.x1 && z >= r.z0 && z <= r.z1) return r.id
  return null
}

export interface Scenic {
  id: string
  name: string
  pos: V3
  target: V3
}

export const SCENIC: Scenic[] = [
  { id: 'gate', name: 'Security gate', pos: [6, 9, 34], target: [-6, 1, 16] },
  { id: 'pitch', name: 'Football pitch', pos: [-26, 18, 24], target: [-41, 0, 0] },
  { id: 'parking', name: 'Parking lot', pos: [20, 20, 32], target: [41, 0, 4] },
  { id: 'aerial', name: 'Aerial view', pos: [0, 62, 58], target: [0, 0, 0] },
  { id: 'city', name: 'City & waterfront', pos: [120, 120, 150], target: [0, 0, -90] },
]

/** Geometry of the city grid. Roads are 8 wide, centred on these lines. */
export const GRID = {
  xs: [-220, -140, -60, 60, 140, 220],
  zs: [-188, -108, -28, 28, 108, 188],
  road: 8,
  seaZ: -222,
}
