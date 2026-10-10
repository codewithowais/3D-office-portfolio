import { boss, car, guard, TOUR_LEN, visitor } from './actors'
import { receptionistSample } from './escort'
import type { Pose } from './actor'
import type { SeatSpec } from './player'

export interface Spot {
  x: number
  z: number
  visible: boolean
}

export type Kind = 'person' | 'thing' | 'seat'

export interface Talkable {
  id: string
  kind: Kind
  /** height of the floating marker above the floor */
  marker: number
  /** how close you need to be to interact */
  range: number
  /** button text for things and seats ("Use the computer"); people show "Talk to <name>" */
  label?: string
  /** sit down instead of opening a conversation */
  action?: 'sit'
  /** something you DO instead of opening a conversation: a pose and a timed notice */
  use?: Use
  seat?: SeatSpec
  at: (t: number, out: Spot) => Spot
}

/** A one-shot use of an object: play `pose` for `secs`, then show one of the `say` notices ({name} = the visitor). */
export interface Use {
  pose?: Pose
  secs?: number
  say: string[]
  /** said instead in the evening and at night */
  late?: string[]
  /** extra effect: toggle the office lights (say[0] = now on, say[1] = now off) */
  fx?: 'lights'
}

export const TALK_RANGE = 2.7

function actor(id: string, a: { sample: (t: number) => { x: number; z: number; visible: boolean } }, marker = 2.35, range = TALK_RANGE): Talkable {
  return {
    id,
    kind: 'person',
    marker,
    range,
    at(t, out) {
      const s = a.sample(t % TOUR_LEN)
      out.x = s.x
      out.z = s.z
      out.visible = s.visible
      return out
    },
  }
}

function fixed(id: string, x: number, z: number, extra: Partial<Talkable> = {}): Talkable {
  return {
    id,
    kind: 'person',
    marker: 2.35,
    range: TALK_RANGE,
    at(_t, out) {
      out.x = x
      out.z = z
      out.visible = true
      return out
    },
    ...extra,
  }
}

const thing = (id: string, x: number, z: number, label: string, extra: Partial<Talkable> = {}) => fixed(id, x, z, { kind: 'thing', marker: 1.7, range: 2.5, label, ...extra })
const chair = (id: string, label: string, seat: SeatSpec, marker = 1.2) =>
  fixed(id, seat.x, seat.z, { kind: 'seat', marker, range: 1.7, label, action: 'sit', seat })

/** Everything you can interact with in walk mode: people, objects and seats. */
export const TALKABLES: Talkable[] = [
  /* ---- people ---- */
  actor('receptionist', { sample: receptionistSample }, 2.35, 4.4), // reach her round the end of the counter
  actor('guard', guard),
  actor('visitor', visitor),
  actor('boss', boss, 2.0),
  fixed('hamza', -17.4, -1.4, { marker: 2.0 }),
  fixed('sana', -17, -13, { marker: 2.0 }),
  fixed('zain', 7, -3.55, { marker: 2.0 }),
  fixed('mahnoor', 4.9, 7.55, { marker: 2.0 }),
  fixed('usman', 15.2, 12.7, { marker: 2.0 }),
  fixed('bilal', -41, -16.9),
  fixed('hira', -39.5, -16.9),

  /* ---- things ---- */
  thing('pc', 15.4, -9.5, "Use Owais's computer"),
  thing('board', -19.6, 0, 'Read the skills board', { range: 3 }),
  thing('shelf', 19.5, -9, 'Browse the bookshelf', { range: 3 }),
  thing('screen', 7.5, 4.6, 'Look at the screen', { range: 2.8 }),
  thing('bell', -5.9, 8.9, 'Ring the bell', { use: { pose: 'wave', secs: 1.3, say: ['Ding! Ayesha: Welcome! Ask me for a tour whenever you like.', 'Ding! Ding! Ayesha: One ring is plenty, {name}!'] }, marker: 1.5, range: 2.6 }),
  thing('coffee', 12.9, 11.6, 'Pour a coffee', { use: { pose: 'drink', secs: 3.4, say: ['Fresh coffee. Exactly what you needed.', 'Strong and hot. Usman approves from the sofa.'], late: ['Decaf? Bold choice for this hour.', 'A late-night coffee. Tomorrow-you has been warned.'] }, marker: 1.5, range: 2.3 }),
  thing('plant', -18.4, 12.6, 'Water the plant', { use: { pose: 'water', secs: 3.8, say: ['The plant looks much happier.', 'Rashid says plants like being talked to as well.'] }, marker: 2.2, range: 2.3 }),
  thing('guestbook', -9.6, 8.3, 'Sign the guestbook', { use: { say: ['You signed the guestbook, {name}.', 'Your name sits right under a very enthusiastic recruiter, {name}.'] }, marker: 1.5, range: 2.6 }),
  thing('easel', 10, 2, 'Look at the easel', { marker: 2.0, range: 2.7 }),
  { ...actor('car', car, 2.0), kind: 'thing', range: 3.4, label: 'Honk the horn', use: { say: ['Beep beep!', 'HOOONK! Faisal waves from the pavement.'] } },

  /* ---- new things to try (props in world/Props.tsx) ---- */
  thing('cooler', 2.5, -3.2, 'Fill a cup at the water cooler', { use: { pose: 'drink', secs: 3, say: ['Glug glug. Cold, clear and free.', 'Blub... the cooler gurgles happily. Hydration complete, {name}.'] }, marker: 1.7, range: 2.3 }),
  thing('vending', 19.35, 6.4, 'Use the vending machine', { marker: 2.2, range: 2.6 }),
  thing('printer', -19.4, -7, 'Use the printer', { marker: 1.6, range: 2.4 }),
  thing('whiteboard', 9, -3.1, 'Scribble on the whiteboard', { use: { pose: 'write', secs: 3.6, say: ['You sketch a tiny office. Zain says it needs more glow.', 'You draw a flowchart: idea, build, ship, coffee, repeat.', 'You write "Hire Owais" in big letters and underline it twice.', 'You draw a very good cat. Nobody asked, but it is excellent.'] }, marker: 2.2, range: 2.6 }),
  thing('extinguisher', 2.55, 5.6, 'Look at the fire extinguisher', { use: { pose: 'press', secs: 1.8, say: ['Inspected on time. Rashid checks the date every Monday.', 'You read the tag: "Pull, aim, squeeze, sweep". Good to know.'] }, marker: 1.6, range: 2.0 }),
  thing('bin', -2.55, -5, 'Kick the bin', { use: { pose: 'kick', secs: 1.6, say: ['Clang! The bin wobbles but stays put.', 'Clang! Ayesha clears her throat from the front desk.'] }, marker: 1.2, range: 1.8 }),
  thing('switch', 2.45, -6.2, 'Flick the light switch', { use: { fx: 'lights', pose: 'press', secs: 1, say: ['Click! The office lights are back on.', 'Click! Lights off. Very moody, {name}.'] }, marker: 1.7, range: 2.0 }),
  thing('view', -12, 13.2, 'Enjoy the view', { use: { pose: 'think', secs: 3, say: ['Through the glass: the garden, the gate and the whole street. Not bad for an office.', 'You pause at the window. The traffic never stops, but in here it is calm.'], late: ['The street lights glow outside. A peaceful view for the evening.'] }, marker: 1.8, range: 2.4 }),
  thing('shelf2', 18.9, 11, 'Pull a book off the shelf', { use: { pose: 'think', secs: 2.6, say: [
    'You pull out "Angular in Depth". Owais built the SimpliEd web app with it.',
    'A well-thumbed Flutter cookbook falls open. He teaches this at Jawan Pakistan.',
    'Node.js and MongoDB, bookmarked at the chapter on scaling to 25,000+ users.',
    'A tiny TypeScript handbook with a sticky note: "strict mode, always".',
    'Docker and GitHub Actions: the book that taught his pipelines to deploy themselves.',
  ] }, marker: 2.0, range: 2.3 }),
  thing('palm', -4.2, 12.8, 'Pet the palm tree', { use: { pose: 'wave', secs: 1.6, say: ['The palm sways a little. It appreciates the attention.', 'You smooth a leaf. Ayesha says it has been thriving since the tour started.'] }, marker: 2.5, range: 2.2 }),
  thing('fern', 4.3, -12.5, 'Smell the plant', { use: { pose: 'think', secs: 1.8, say: ['Green and fresh. Owais waters it himself, apparently.', 'It smells of earth and Monday motivation.'] }, marker: 2.5, range: 2.2 }),

  /* ---- seats ---- */
  chair('seat-sofa', 'Sit on the sofa', { x: 16.9, z: 12.7, heading: Math.PI, exit: [16.9, 10.9] }),
  chair('seat-sofa2', 'Sit on the sofa', { x: 18.6, z: 9.5, heading: -Math.PI / 2, exit: [16.9, 9.5] }),
  chair('seat-reception', 'Take a seat', { x: -15.5, z: 11.2, heading: Math.PI / 2, exit: [-13.4, 11.2] }),
  chair('seat-meeting', 'Sit at the table', { x: 4.2, z: 9, heading: Math.PI / 2, exit: [3.9, 6] }),
  chair('seat-boss', "Sit across from Amna", { x: 12.6, z: -7.4, heading: Math.PI / 2, exit: [10.6, -7.4] }),
  chair('seat-bench', 'Sit on the bench', { x: -42.2, z: -15.35, heading: 0, y: -0.24, exit: [-42.2, -13.6] }, 0.9),
  chair('seat-studio', 'Work at the free desk', { x: -9.8, z: 1.4, heading: Math.PI, pose: 'type', exit: [-9.8, 3.1] }),
  chair('seat-ops', 'Work at the free desk', { x: -12.6, z: -10.2, heading: Math.PI, pose: 'type', exit: [-12.6, -9.2] }),
]

const scratch: Spot = { x: 0, z: 0, visible: true }

export const talkable = (id: string) => TALKABLES.find((k) => k.id === id)

/** Current position of a talkable, or null. The result is reused, copy what you need. */
export function spotOf(id: string, t: number): Spot | null {
  const tk = talkable(id)
  return tk ? tk.at(t, scratch) : null
}
