import { WALLS } from './world'

export interface Rect {
  x0: number
  x1: number
  z0: number
  z1: number
}

export const obstacles: Rect[] = []

export function addObstacles(rects: Rect[]) {
  obstacles.push(...rects)
}

const box = (cx: number, cz: number, hw: number, hd: number): Rect => ({ x0: cx - hw, x1: cx + hw, z0: cz - hd, z1: cz + hd })

/* ---- office walls (minus door gaps) ---- */
for (const w of WALLS) {
  const horiz = w.a[1] === w.b[1]
  const s0 = horiz ? Math.min(w.a[0], w.b[0]) : Math.min(w.a[1], w.b[1])
  const s1 = horiz ? Math.max(w.a[0], w.b[0]) : Math.max(w.a[1], w.b[1])
  const fixed = horiz ? w.a[1] : w.a[0]
  const t = (w.t ?? 0.4) / 2 + 0.05
  const spans: [number, number][] = []
  let cur = s0
  for (const g of [...(w.gaps ?? [])].sort((p, q) => p.at - q.at)) {
    if (g.at - g.w / 2 > cur) spans.push([cur, g.at - g.w / 2])
    cur = g.at + g.w / 2
  }
  if (cur < s1) spans.push([cur, s1])
  for (const [p, q] of spans) obstacles.push(horiz ? { x0: p, x1: q, z0: fixed - t, z1: fixed + t } : { x0: fixed - t, x1: fixed + t, z0: p, z1: q })
}

/* ---- perimeter fence (gate is open between x = -3.6 and 3.6) ---- */
obstacles.push(
  { x0: -24.2, x1: -3.6, z0: 17.8, z1: 18.2 },
  { x0: 3.6, x1: 24.2, z0: 17.8, z1: 18.2 },
  { x0: -24.2, x1: 24.2, z0: -18.2, z1: -17.8 },
  { x0: -24.2, x1: -23.8, z0: -18.2, z1: 18.2 },
  { x0: 23.8, x1: 24.2, z0: -18.2, z1: 18.2 },
  box(-9, 16, 1.7, 1.45), // guard booth
)

/* ---- main furniture ---- */
obstacles.push(
  { x0: -11.6, x1: -4.4, z0: 7.8, z1: 9.7 }, // reception counter
  { x0: 4.7, x1: 10.3, z0: 8.2, z1: 9.8 }, // meeting table
  { x0: 15.1, x1: 16.5, z0: 8.5, z1: 9.9 }, // coffee table
  box(16, 12.9, 1.6, 0.5), // lounge sofa
  box(19, 8.6, 0.5, 1.2),
  box(15.8, -9, 0.65, 1.7), // boss desk
  box(8, -13.1, 1.5, 0.5), // boss sofa
  { x0: 19.3, x1: 19.9, z0: -11.1, z1: -6.9 }, // boss shelf
  box(18.2, 2.4, 0.85, 0.45),
)
for (const x of [-17.4, -13.6, -9.8, -6]) obstacles.push(box(x, 0, 0.85, 0.85)) // studio pods
for (const z of [-11.6, -7]) for (const x of [-17, -12.6, -8.2]) obstacles.push(box(x, z, 0.85, 0.85)) // operations
for (const x of [7, 11, 15]) obstacles.push(box(x, -2.6, 0.85, 0.45)) // design desks

/** Outer limits of the walkable world (city edge / beach). */
export const BOUNDS = { x0: -236, x1: 236, z0: -205, z1: 205 }

/** Slides a circle of radius r out of every obstacle. Mutates and returns [x, z]. */
export function resolve(p: { x: number; z: number }, r: number) {
  for (let pass = 0; pass < 3; pass++) {
    for (const o of obstacles) {
      if (p.x < o.x0 - r || p.x > o.x1 + r || p.z < o.z0 - r || p.z > o.z1 + r) continue
      const cx = Math.min(Math.max(p.x, o.x0), o.x1)
      const cz = Math.min(Math.max(p.z, o.z0), o.z1)
      let dx = p.x - cx
      let dz = p.z - cz
      const d = Math.hypot(dx, dz)
      if (d >= r) continue
      if (d > 1e-5) {
        p.x = cx + (dx / d) * r
        p.z = cz + (dz / d) * r
      } else {
        // centre is inside the rect: push out through the nearest face
        const l = p.x - o.x0
        const rr = o.x1 - p.x
        const t = p.z - o.z0
        const b = o.z1 - p.z
        const m = Math.min(l, rr, t, b)
        if (m === l) p.x = o.x0 - r
        else if (m === rr) p.x = o.x1 + r
        else if (m === t) p.z = o.z0 - r
        else p.z = o.z1 + r
        dx = 0
        dz = 0
      }
    }
  }
  p.x = Math.min(Math.max(p.x, BOUNDS.x0), BOUNDS.x1)
  p.z = Math.min(Math.max(p.z, BOUNDS.z0), BOUNDS.z1)
}
