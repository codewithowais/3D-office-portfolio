import type { Pose } from './actor'

/**
 * Things you can DO with people (shake hands, high-five, rock-paper-scissors...). Pure data and tiny helpers:
 * dialogue.ts turns them into conversation nodes, store.ts plays the pose and keeps the game state.
 * `{name}` is the visitor, `{who}` the person you are talking to.
 */
export type Act = 'handshake' | 'highfive' | 'fistbump' | 'coffee' | 'compliment' | 'joke' | 'advice'

export interface ActDef {
  pose: Pose
  secs: number
  lines: string[]
  /** said instead in the evening and at night */
  late?: string[]
}

export const ACTS: Record<Act, ActDef> = {
  handshake: {
    pose: 'shake',
    secs: 2.6,
    lines: ['A firm handshake. "Great to meet you properly, {name}!"', '"Pleasure, {name}!" says {who}, shaking your hand warmly.', '{who} grins and shakes your hand. "Welcome aboard, {name}."'],
  },
  highfive: {
    pose: 'highfive',
    secs: 1.8,
    lines: ['SMACK! {who} high-fives you. "Yes, {name}!"', 'A perfect high-five. {who} laughs. "Nailed it!"', '{who} leaves you hanging for a second... then SMACK. "Gotcha, {name}!"'],
  },
  fistbump: {
    pose: 'fistbump',
    secs: 1.8,
    lines: ['Fist bump! {who} does the little explosion noise.', '{who} bumps your fist. "Respect, {name}."', 'Bump! "We are definitely friends now," says {who}.'],
  },
  coffee: {
    pose: 'drink',
    secs: 3.2,
    lines: ['{who} takes the coffee gratefully. "You are a lifesaver, {name}!"', '"Exactly what I needed," says {who}, sipping happily.', '{who} smells the coffee first. "Perfect, {name}. Strong, the way I like it."'],
    late: ['"Coffee this late?" {who} laughs, and drinks it anyway. "Thanks, {name}!"', '{who} cradles the cup. "I will be awake until Friday now. Thank you, {name}!"'],
  },
  compliment: {
    pose: 'wave',
    secs: 2,
    lines: ['{who} blushes. "That is very kind of you, {name}. You made my day."', '"Stop it, {name}, you are too nice!" says {who}, beaming.', '{who} smiles. "Coming from you, {name}, that means a lot."'],
  },
  joke: {
    pose: 'laugh',
    secs: 3,
    lines: [
      '"Why do programmers prefer dark mode? Because light attracts bugs." {who} grins.',
      '"There are 10 kinds of people: those who understand binary and those who do not." {who} waits for your laugh.',
      '"A SQL query walks into a bar, sees two tables and asks: can I join you?" {who} cracks up.',
      '"It works on my machine," says {who}. "Then we will ship your machine," you reply. Everyone laughs.',
    ],
  },
  advice: {
    pose: 'think',
    secs: 3.2,
    lines: [
      '{who} thinks for a moment. "Ship small, ship often, {name}. A tiny release beats a perfect plan."',
      '"Read the error message all the way to the end," says {who}. "It is usually telling you the answer."',
      '"Build something real in your first week," {who} says. "That is how Owais teaches, and it works."',
      '"Write the boring tests first, {name}. Future you will send flowers."',
    ],
  },
}

/** Personal jokes and advice that sound like the person (everyone else falls back to the generic ones above). */
export const PERSONAL: Record<string, { joke?: string; advice?: string }> = {
  receptionist: { joke: '"How many visitors does it take to find the boss cabin? None, they all follow me." Ayesha winks.', advice: '"Say hello to everyone on the way in, {name}. The best conversations start by the front door."' },
  guard: { joke: '"I never lose an argument at the gate: nobody gets past me without a smile." Rashid chuckles.', advice: '"Look both ways before you cross the road, {name}. The traffic here never stops."' },
  hamza: { joke: '"A CSS developer walks into a bar... and everything shifts three pixels to the left." Hamza groans at his own joke.', advice: '"Measure before you optimise, {name}. A profiler beats a hunch every time."' },
  sana: { joke: '"A DevOps engineer has no problems, only unresolved pipelines." Sana smiles.', advice: '"Make it observable first, {name}. You cannot fix what you cannot see."' },
  zain: { joke: '"I asked the render engine for a light joke. It said: bounce." Zain bounces his eyebrows.', advice: '"Limit your palette, {name}. Four colours that agree beat forty that do not."' },
  mahnoor: { joke: '"Why did the Flutter dev bring a ladder? To reach the widget tree." Mahnoor giggles.', advice: '"Hot reload is a superpower, {name}. Change one thing at a time and watch it move."' },
  usman: { joke: '"My students say I have a bottomless sofa. I say it is a learning environment." Usman leans back.', advice: '"Teach someone what you learned today, {name}. That is how it sticks."' },
  bilal: { joke: '"Why is the pitch always wet? The players dribble." Bilal slaps his knee.', advice: '"Look up before you pass, {name}. The best option is rarely the closest one."' },
  hira: { joke: '"Our goalkeeper is like a good bug fix: you only notice when it is missing." Hira smirks.', advice: '"Stay in space, {name}. Keep moving and the ball will find you."' },
  visitor: { joke: '"The recruiter and the developer walk into a bar. The bar says: we are hiring!" Faisal laughs.', advice: '"Keep your portfolio honest and your code on GitHub, {name}. That is what recruiters look at."' },
  boss: { joke: '"I told my computer I needed a break. It said: I will just refresh." Owais laughs.', advice: '"Learn by shipping, {name}. Pick a small idea, build it this week and put it online."' },
}

export const MOVES = ['Rock', 'Paper', 'Scissors'] as const
export const MOVE_ICON = ['✊', '✋', '✌️'] as const

/** 0 = draw, 1 = you win, -1 = you lose. Rock(0) beats Scissors(2), Paper(1) beats Rock(0), Scissors(2) beats Paper(1). */
export const rpsOutcome = (you: number, them: number): 0 | 1 | -1 => (you === them ? 0 : (you - them + 3) % 3 === 1 ? 1 : -1)

export interface Ctx {
  name: string
  hour: number
  visits: number
  done: number
  total: number
}

export const daypart = (h: number) => (h < 5 ? 'night' : h < 12 ? 'morning' : h < 17 ? 'afternoon' : h < 21 ? 'evening' : 'night')
export const isLate = (h: number) => h >= 19 || h < 5

const HELLO: Record<ReturnType<typeof daypart>, string> = {
  morning: 'Good morning, {name}!',
  afternoon: 'Good afternoon, {name}!',
  evening: 'Good evening, {name}!',
  night: 'Burning the midnight oil, {name}?',
}

/** A short context-aware line shown above the first thing someone says: time of day, return visits, how much you have explored. */
export function openingLine(c: Ctx, seed: number): string {
  const options = [HELLO[daypart(c.hour)]]
  if (c.visits > 1) options.push(`Welcome back, {name}! That is visit number ${c.visits}.`)
  if (c.total && c.done / c.total >= 0.75) options.push('You have seen almost everything here, {name}. Impressive!')
  else if (c.total && c.done / c.total < 0.1 && c.visits <= 1) options.push('First time here? Take your time, {name}.')
  return options[seed % options.length]
}

export const pick = <T>(a: readonly T[]): T => a[Math.floor(Math.random() * a.length)]
