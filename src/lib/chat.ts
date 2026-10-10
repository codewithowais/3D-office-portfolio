import type { Pose, Sample } from './actor'

/** Two people holding a conversation: they face each other, take turns gesturing, and show a speech bubble. */
export interface Pair {
  id: string
  a: { x: number; z: number; shirt: string; pants: string; skin: string; hair: string }
  b: { x: number; z: number; shirt: string; pants: string; skin: string; hair: string }
  seated?: boolean
  /** alternating lines: even = a, odd = b */
  lines: string[]
}

const TURN = 3.4

export const PAIRS: Pair[] = [
  {
    id: 'lounge',
    a: { x: 13.4, z: 5.7, shirt: '#ff8fc0', pants: '#26324a', skin: '#e0b08c', hair: '#1c1714' },
    b: { x: 15.0, z: 5.7, shirt: '#2f80d0', pants: '#3a3f45', skin: '#8d5a3b', hair: '#12100f' },
    lines: ['Did you see the new release?', "Yes! It's so fast now.", 'Coffee after stand-up?', 'Always.', 'Owais says ship it Friday.', 'Then we ship it Friday!'],
  },
  {
    id: 'corridor',
    a: { x: -2.3, z: 2.6, shirt: '#ffc233', pants: '#222426', skin: '#c68e69', hair: '#1c1714' },
    b: { x: -2.3, z: 4.0, shirt: '#4cc2a0', pants: '#4a4036', skin: '#f0c9a4', hair: '#5a3d27' },
    lines: ['Is the design review at three?', 'Yes, in the meeting room.', 'Did Zain finish the night theme?', "It's glowing. Wait till you see it.", 'Lovely. Walk over together?', 'Sure!'],
  },
  {
    id: 'sidewalk',
    a: { x: -30, z: 22, shirt: '#e8584a', pants: '#2b2f33', skin: '#e0b08c', hair: '#3a2a1e' },
    b: { x: -28.5, z: 22, shirt: '#9b6fd1', pants: '#59616b', skin: '#a87250', hair: '#12100f' },
    lines: ['Lovely weather today!', 'Perfect for a walk.', 'Have you been inside the office?', 'Not yet. Ayesha gives a great tour.', 'Then let us go in!', 'After this coffee.'],
  },
  {
    id: 'pitch',
    a: { x: -41, z: -16.9, shirt: '#14324b', pants: '#2b2f33', skin: '#c68e69', hair: '#1c1714' },
    b: { x: -39.5, z: -16.9, shirt: '#d9568f', pants: '#3a4a5a', skin: '#e0b08c', hair: '#12100f' },
    lines: ['Blue is playing well today.', 'Red could use another player.', 'Go on, join them!', 'Run at the ball and press E to kick.', 'You can do it!', 'Score on the left goal!'],
  },
  {
    id: 'meeting',
    seated: true,
    a: { x: 7.5, z: 7.55, shirt: '#3c5a9a', pants: '#2b2f33', skin: '#e0b08c', hair: '#1c1714' },
    b: { x: 7.5, z: 10.45, shirt: '#ee9a5a', pants: '#222426', skin: '#8d5a3b', hair: '#12100f' },
    lines: ["Let's go through the roadmap.", 'Mobile first, then the web app.', 'Does the Flutter build ship this week?', 'Yes, QA signed it off.', 'Great. Next item?', 'Performance on low-end phones.'],
  },
]

export function lineAt(p: Pair, t: number): { text: string; speaker: 0 | 1; k: number } {
  const k = Math.floor(t / TURN)
  return { text: p.lines[k % p.lines.length], speaker: (k % 2) as 0 | 1, k }
}

export function poseFor(p: Pair, who: 0 | 1, t: number): Pose {
  const talking = lineAt(p, t).speaker === who
  return p.seated ? (talking ? 'sittalk' : 'sitlisten') : talking ? 'talk' : 'listen'
}

/** Sampler for one half of a pair (they never move, only gesture). */
export function makePairSampler(p: Pair, who: 0 | 1): (t: number) => Sample {
  const me = who === 0 ? p.a : p.b
  const other = who === 0 ? p.b : p.a
  const out: Sample = { x: me.x, y: 0, z: me.z, heading: Math.atan2(other.x - me.x, other.z - me.z), speed: 0, pose: 'stand', visible: true }
  return (t) => {
    out.pose = poseFor(p, who, t)
    return out
  }
}
