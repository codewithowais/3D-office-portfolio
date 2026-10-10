import { V3, clamp } from './math'

export type Pose = 'stand' | 'sit' | 'type' | 'water' | 'wave' | 'talk' | 'listen' | 'sittalk' | 'sitlisten' | 'drink' | 'dance' | 'clap' | 'cheer' | 'bow' | 'flex' | 'press' | 'write' | 'kick' | 'shake' | 'highfive' | 'fistbump' | 'laugh' | 'selfie' | 'think'

export interface Sample {
  x: number
  y: number
  z: number
  heading: number
  speed: number
  pose: Pose
  visible: boolean
}

const newSample = (): Sample => ({ x: 0, y: 0, z: 0, heading: 0, speed: 0, pose: 'stand', visible: true })

function dedupe(pts: V3[]): V3[] {
  const out: V3[] = []
  for (const p of pts) {
    const q = out[out.length - 1]
    if (!q || Math.hypot(p[0] - q[0], p[2] - q[2]) > 1e-4) out.push(p)
  }
  return out
}

/** Rounds the corners of a polyline with quadratic curves so walkers/cars turn smoothly. */
export function roundPath(input: V3[], r: number, closed = false): V3[] {
  const pts = dedupe(input)
  const n = pts.length
  const out: V3[] = []
  const corner = (p0: V3, p1: V3, p2: V3) => {
    const d1 = Math.hypot(p0[0] - p1[0], p0[2] - p1[2])
    const d2 = Math.hypot(p2[0] - p1[0], p2[2] - p1[2])
    const c = Math.min(r, d1 / 2, d2 / 2)
    const a: V3 = [p1[0] + ((p0[0] - p1[0]) / d1) * c, p1[1], p1[2] + ((p0[2] - p1[2]) / d1) * c]
    const b: V3 = [p1[0] + ((p2[0] - p1[0]) / d2) * c, p1[1], p1[2] + ((p2[2] - p1[2]) / d2) * c]
    for (let i = 0; i <= 8; i++) {
      const t = i / 8
      const u = 1 - t
      out.push([u * u * a[0] + 2 * u * t * p1[0] + t * t * b[0], p1[1], u * u * a[2] + 2 * u * t * p1[2] + t * t * b[2]])
    }
  }
  if (!closed) {
    out.push(pts[0])
    for (let i = 1; i < n - 1; i++) corner(pts[i - 1], pts[i], pts[i + 1])
    out.push(pts[n - 1])
  } else {
    for (let i = 0; i < n; i++) corner(pts[(i + n - 1) % n], pts[i], pts[(i + 1) % n])
    out.push(out[0])
  }
  return dedupe(out)
}

interface Line {
  pts: V3[]
  cum: number[]
  len: number
}

function makeLine(pts: V3[]): Line {
  const cum = [0]
  for (let i = 1; i < pts.length; i++) {
    cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][2] - pts[i - 1][2]))
  }
  return { pts, cum, len: cum[cum.length - 1] }
}

function along(l: Line, d: number, out: Sample) {
  d = clamp(d, 0, l.len)
  let lo = 0
  let hi = l.cum.length - 1
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1
    if (l.cum[mid] <= d) lo = mid
    else hi = mid
  }
  const a = l.pts[lo]
  const b = l.pts[lo + 1] ?? a
  const seg = l.cum[lo + 1] - l.cum[lo] || 1
  const t = (d - l.cum[lo]) / seg
  out.x = a[0] + (b[0] - a[0]) * t
  out.y = a[1] + (b[1] - a[1]) * t
  out.z = a[2] + (b[2] - a[2]) * t
  out.heading = Math.atan2(b[0] - a[0], b[2] - a[2])
}

export type Step =
  | { walk: V3[]; speed?: number; round?: number; mark?: string }
  | { wait: number; pose?: Pose; face?: number; mark?: string }
  | { hide?: boolean; show?: boolean; mark?: string }

interface Seg {
  t0: number
  t1: number
  line?: Line
  pos?: V3
  heading: number
  pose: Pose
  speed: number
  visible: boolean
}

export interface Actor {
  /** Samples the actor at world time t. The returned object is reused - copy what you need. */
  sample: (t: number) => Sample
  /** Time (s) at the *end* of each marked step. */
  marks: Record<string, number>
  end: number
}

/** A scripted actor: a timeline of walk / wait / hide steps evaluated as a pure function of time. */
export function makeActor(start: V3, steps: Step[], t0 = 0, heading0 = 0): Actor {
  const segs: Seg[] = []
  const marks: Record<string, number> = {}
  let t = t0
  let cur = start
  let heading = heading0
  let visible = true
  for (const step of steps) {
    if ('walk' in step) {
      let pts = dedupe([cur, ...step.walk])
      if (step.round) pts = roundPath(pts, step.round)
      const line = makeLine(pts)
      const speed = step.speed ?? 1.5
      const dur = line.len / speed
      const a = pts[pts.length - 2] ?? pts[0]
      const b = pts[pts.length - 1]
      heading = Math.atan2(b[0] - a[0], b[2] - a[2])
      segs.push({ t0: t, t1: t + dur, line, heading: 0, pose: 'stand', speed, visible })
      t += dur
      cur = b
    } else if ('wait' in step) {
      if (step.face !== undefined) heading = step.face
      segs.push({ t0: t, t1: t + step.wait, pos: cur, heading, pose: step.pose ?? 'stand', speed: 0, visible })
      t += step.wait
    } else {
      if (step.hide) visible = false
      if (step.show) visible = true
    }
    if (step.mark) marks[step.mark] = t
  }
  const out = newSample()
  const first = segs[0]
  const last = segs[segs.length - 1]
  const hold = (pos: V3, h: number, pose: Pose, vis: boolean) => {
    out.x = pos[0]
    out.y = pos[1]
    out.z = pos[2]
    out.heading = h
    out.speed = 0
    out.pose = pose
    out.visible = vis
    return out
  }
  const sample = (time: number): Sample => {
    if (!first) return hold(start, heading0, 'stand', true)
    if (time <= first.t0) {
      return hold(first.pos ?? first.line!.pts[0], first.pos ? first.heading : heading0, first.pos ? first.pose : 'stand', first.visible)
    }
    if (time >= last.t1) {
      const endPos = last.pos ?? last.line!.pts[last.line!.pts.length - 1]
      return hold(endPos, last.pos ? last.heading : heading, last.pos ? last.pose : 'stand', visible)
    }
    for (let i = 0; i < segs.length; i++) {
      const s = segs[i]
      if (time < s.t0 || time >= s.t1) continue
      out.visible = s.visible
      if (s.line) {
        const d = ((time - s.t0) / (s.t1 - s.t0)) * s.line.len
        along(s.line, d, out)
        out.speed = s.speed
        out.pose = 'stand'
      } else {
        const p = s.pos!
        out.x = p[0]
        out.y = p[1]
        out.z = p[2]
        out.heading = s.heading
        out.speed = 0
        out.pose = s.pose
      }
      return out
    }
    return out
  }
  return { sample, marks, end: t }
}

/** A looping walker/runner/car that follows a closed route forever at constant speed. */
export function makeLoop(pts: V3[], speed: number, offset = 0, round = 3) {
  const line = makeLine(roundPath(pts, round, true))
  const out = newSample()
  return {
    length: line.len,
    sample(t: number): Sample {
      const d = (((t * speed + offset) % line.len) + line.len) % line.len
      along(line, d, out)
      out.speed = speed
      out.pose = 'stand'
      out.visible = true
      return out
    },
  }
}
