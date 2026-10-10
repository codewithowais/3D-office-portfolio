import { players as loops } from './actors'
import type { Sample } from './actor'
import { clamp } from './math'

/**
 * A small, forgiving 4-v-3 football game. Until you step onto the pitch it stays the scripted ambient
 * match; once you do, the ball becomes real (rolls, bounces, scores) and the other players chase,
 * pass and shoot. You play for red and attack the left goal. Pure logic: no rendering in here.
 */
export const PITCH = { x0: -52, x1: -30, z0: -13.5, z1: 13.5 }
const GOAL_HALF = 2.1
const R_BALL = 0.22
const HOMES: [number, number][] = [[-46, -7], [-40, 0], [-46, 7], [-36, -6], [-33.5, 2], [-37, 8]] // 0-2 blue, 3-5 red
const BLUE = [0, 1, 2]
const RED = [3, 4, 5]
/** goal each team attacks (x of the goal line) */
const ATTACK_X: Record<'blue' | 'red', number> = { blue: PITCH.x1, red: PITCH.x0 }

interface Body {
  x: number
  z: number
  vx: number
  vz: number
  cool: number
}

export const soccer = {
  active: false,
  ball: { x: -41, y: R_BALL, z: 0, vx: 0, vz: 0, vy: 0 },
  samples: HOMES.map<Sample>((h) => ({ x: h[0], y: 0, z: h[1], heading: 0, speed: 0, pose: 'stand', visible: true })),
  score: { red: 0, blue: 0 },
  nearBall: false,
  /** set to true by the E / Space key; consumed on the next update */
  kickRequest: false,
  /** text to announce (goal etc.); the caller clears it */
  announce: '' as string,
}

const bodies: Body[] = HOMES.map((h) => ({ x: h[0], z: h[1], vx: 0, vz: 0, cool: 0 }))
let resetAt = 0
let clockS = 0
let playerCool = 0
let kickTimer = 0

export function inPitch(x: number, z: number, margin = 0.5) {
  return x > PITCH.x0 - margin && x < PITCH.x1 + margin && z > PITCH.z0 - margin && z < PITCH.z1 + margin
}

export function startSoccer(t: number) {
  if (soccer.active) return
  soccer.active = true
  soccer.score.red = soccer.score.blue = 0
  loops.forEach((l, i) => {
    const s = l.sample(t)
    bodies[i].x = s.x
    bodies[i].z = s.z
    bodies[i].vx = bodies[i].vz = 0
    bodies[i].cool = 0
  })
  centreBall()
  clockS = 0
  resetAt = 0
}

export function stopSoccer() {
  soccer.active = false
  soccer.kickRequest = false
  soccer.nearBall = false
}

function centreBall() {
  const b = soccer.ball
  b.x = (PITCH.x0 + PITCH.x1) / 2
  b.z = 0
  b.y = R_BALL
  b.vx = b.vz = b.vy = 0
}

function kick(bx: number, bz: number, dx: number, dz: number, speed: number, loft = 0) {
  const b = soccer.ball
  const l = Math.hypot(dx, dz) || 1
  b.vx = (dx / l) * speed
  b.vz = (dz / l) * speed
  b.vy = loft
  void bx
  void bz
}

export interface PlayerRef {
  x: number
  z: number
  heading: number
  speed: number
}

/** Advance the game by dt seconds. `player` is the human. */
export function updateSoccer(dt: number, t: number, player: PlayerRef) {
  if (!soccer.active) return
  dt = Math.min(dt, 0.05)
  clockS += dt
  const b = soccer.ball
  playerCool = Math.max(0, playerCool - dt)

  /* ---- scoring pause ---- */
  if (resetAt > 0) {
    if (clockS >= resetAt) {
      resetAt = 0
      centreBall()
      HOMES.forEach((h, i) => {
        bodies[i].x = h[0]
        bodies[i].z = h[1]
        bodies[i].vx = bodies[i].vz = 0
      })
    }
    writeSamples(0)
    return
  }

  /* ---- ball physics ---- */
  b.x += b.vx * dt
  b.z += b.vz * dt
  b.vy -= 9.8 * dt
  b.y += b.vy * dt
  if (b.y < R_BALL) {
    b.y = R_BALL
    b.vy = Math.abs(b.vy) > 1 ? -b.vy * 0.45 : 0
  }
  const drag = Math.exp(-(b.y > R_BALL + 0.05 ? 0.15 : 0.95) * dt)
  b.vx *= drag
  b.vz *= drag
  // walls, except the two goal mouths
  const inMouth = Math.abs(b.z) < GOAL_HALF
  if (b.z < PITCH.z0 + R_BALL) { b.z = PITCH.z0 + R_BALL; b.vz = Math.abs(b.vz) * 0.55 }
  if (b.z > PITCH.z1 - R_BALL) { b.z = PITCH.z1 - R_BALL; b.vz = -Math.abs(b.vz) * 0.55 }
  if (b.x < PITCH.x0) {
    if (inMouth) return goal('red')
    b.x = PITCH.x0; b.vx = Math.abs(b.vx) * 0.55
  }
  if (b.x > PITCH.x1) {
    if (inMouth) return goal('blue')
    b.x = PITCH.x1; b.vx = -Math.abs(b.vx) * 0.55
  }

  /* ---- the human: the ball sticks to your feet when you run into it; kick to shoot or pass ---- */
  const dp = Math.hypot(b.x - player.x, b.z - player.z)
  soccer.nearBall = dp < 2.6
  const hx = Math.sin(player.heading)
  const hz = Math.cos(player.heading)
  // a kick pressed a moment early still counts when you get there
  if (soccer.kickRequest) {
    kickTimer = 0.45
    soccer.kickRequest = false
  }
  kickTimer = Math.max(0, kickTimer - dt)
  if (kickTimer > 0 && dp < 2.6) {
    kickTimer = 0
    // gentle aim assist: if you're roughly facing the left goal, curve the shot towards it
    const gx = PITCH.x0 - b.x
    const gz = 0 - b.z
    const gl = Math.hypot(gx, gz) || 1
    let dx = hx
    let dz = hz
    if ((hx * gx + hz * gz) / gl > 0.5) {
      dx = hx * 0.35 + (gx / gl) * 0.65
      dz = hz * 0.35 + (gz / gl) * 0.65
    }
    kick(b.x, b.z, dx, dz, 13, 2.2)
    playerCool = 0.4
  } else if (dp < 1.2 && b.y < 0.7 && playerCool === 0) {
    // dribbling: the ball is drawn to a spot just ahead of your feet
    const lead = 0.55 + Math.min(player.speed, 8.5) * 0.07
    b.vx = (player.x + hx * lead - b.x) * 9
    b.vz = (player.z + hz * lead - b.z) * 9
    b.vy = 0
  }

  /* ---- the other players ---- */
  const chaser: Record<'blue' | 'red', number> = { blue: -1, red: -1 }
  for (const team of ['blue', 'red'] as const) {
    let best = 1e9
    for (const i of team === 'blue' ? BLUE : RED) {
      const d = Math.hypot(b.x - bodies[i].x, b.z - bodies[i].z)
      if (d < best) {
        best = d
        chaser[team] = i
      }
    }
  }
  for (let i = 0; i < 6; i++) {
    const me = bodies[i]
    const team: 'blue' | 'red' = i < 3 ? 'blue' : 'red'
    me.cool = Math.max(0, me.cool - dt)
    let tx = HOMES[i][0] + (b.x - HOMES[i][0]) * 0.25
    let tz = HOMES[i][1] + (b.z - HOMES[i][1]) * 0.25
    let speed = 2.3
    if (chaser[team] === i) {
      // chase the ball a touch ahead of where it is going
      tx = b.x + b.vx * 0.25
      tz = b.z + b.vz * 0.25
      speed = 3.4
    }
    const dx = tx - me.x
    const dz = tz - me.z
    const dist = Math.hypot(dx, dz)
    const want = dist > 0.25 ? Math.min(speed, dist * 3) : 0
    const ax = dist > 1e-3 ? (dx / dist) * want : 0
    const az = dist > 1e-3 ? (dz / dist) * want : 0
    me.vx += (ax - me.vx) * Math.min(1, dt * 6)
    me.vz += (az - me.vz) * Math.min(1, dt * 6)
    me.x = clamp(me.x + me.vx * dt, PITCH.x0 + 0.6, PITCH.x1 - 0.6)
    me.z = clamp(me.z + me.vz * dt, PITCH.z0 + 0.6, PITCH.z1 - 0.6)

    // strike the ball when we reach it: shoot if close to goal, otherwise pass
    const humanHasIt = dp < 1.3 // nobody snatches the ball off your feet
    if (me.cool === 0 && !humanHasIt && Math.hypot(b.x - me.x, b.z - me.z) < 0.9 && b.y < 0.9) {
      const gx = ATTACK_X[team]
      const toGoal = Math.abs(gx - me.x)
      if (toGoal < 10) {
        kick(b.x, b.z, gx - b.x, (Math.sin(clockS * 7 + i) * GOAL_HALF * 0.8) - b.z, 11.5, 0.8)
      } else {
        const mates = (team === 'blue' ? BLUE : RED).filter((k) => k !== i).map((k) => ({ x: bodies[k].x + bodies[k].vx * 0.4, z: bodies[k].z + bodies[k].vz * 0.4 }))
        if (team === 'red') mates.push({ x: player.x + hx * player.speed * 0.4, z: player.z + hz * player.speed * 0.4 })
        // prefer a mate who is further up the pitch than us
        const ahead = mates.filter((m) => (gx - m.x) * Math.sign(gx - me.x) < toGoal)
        const pool = ahead.length ? ahead : mates
        const target = pool[Math.floor((Math.abs(Math.sin(clockS * 3.1 + i * 7)) * 997) % pool.length)]
        const d = Math.hypot(target.x - b.x, target.z - b.z)
        kick(b.x, b.z, target.x - b.x, target.z - b.z, clamp(d * 1.5 + 3, 6, 11), 0.5)
      }
      me.cool = 1.1
    }
  }
  writeSamples(1)
}

function goal(team: 'red' | 'blue') {
  const b = soccer.ball
  soccer.score[team]++
  b.vx = b.vz = 0
  soccer.announce = `Goal for ${team === 'red' ? 'Red (you!)' : 'Blue'}! Red ${soccer.score.red} – ${soccer.score.blue} Blue`
  resetAt = clockS + 2.2
  writeSamples(0)
}

function writeSamples(moving: number) {
  bodies.forEach((m, i) => {
    const s = soccer.samples[i]
    s.x = m.x
    s.z = m.z
    s.speed = moving ? Math.hypot(m.vx, m.vz) : 0
    if (s.speed > 0.15) s.heading = Math.atan2(m.vx, m.vz)
    else {
      const b = soccer.ball
      s.heading = Math.atan2(b.x - m.x, b.z - m.z) // idle players watch the ball
    }
  })
}
