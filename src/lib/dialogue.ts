import { BRAND } from './world'

/**
 * Everything the people in the office say. Edit freely: this is the content of the portfolio.
 * Replace the placeholder studio story and contact details with your own.
 */
export const CONTACT = { site: BRAND.site, email: `hello@${BRAND.site}` }

export interface Option {
  label: string
  /** id of the next node; omit to end the conversation */
  next?: string
  /** walk the player to this spot (x, z) before ending the conversation */
  teleport?: [number, number]
}

export interface Node {
  text: string
  options: Option[]
}

export interface Npc {
  id: string
  name: string
  role: string
  /** accent colour of the speaker badge */
  accent: string
  nodes: Record<string, Node>
}

const bye: Option = { label: 'Thanks, bye!' }

export const NPCS: Record<string, Npc> = {
  receptionist: {
    id: 'receptionist',
    name: 'Priya',
    role: 'Receptionist',
    accent: '#17a2a4',
    nodes: {
      hi: {
        text: `Welcome to ${BRAND.name}! I'm Priya, I look after every visitor. How can I help?`,
        options: [
          { label: 'What is this place?', next: 'about' },
          { label: 'Take me somewhere', next: 'go' },
          { label: 'Who works here?', next: 'team' },
          bye,
        ],
      },
      about: {
        text: "We're a small studio that builds fast, good-looking websites and interactive 3D experiences, like the one you're standing in right now.",
        options: [{ label: 'Who works here?', next: 'team' }, { label: 'Back', next: 'hi' }],
      },
      team: {
        text: 'Jin writes the front end in the Work Studio, Leo models in the Design Room, Maya keeps projects on track in Operations, Nora runs the meetings, and Alex, the boss, decides what we say yes to. Say hi to them!',
        options: [{ label: 'Take me somewhere', next: 'go' }, { label: 'Back', next: 'hi' }],
      },
      go: {
        text: 'Of course. Where to?',
        options: [
          { label: 'The Boss Cabin', teleport: [9, -9] },
          { label: 'The Work Studio', teleport: [-12, 2.6] },
          { label: 'The Lounge', teleport: [14, 7] },
          { label: 'Never mind', next: 'hi' },
        ],
      },
    },
  },
  boss: {
    id: 'boss',
    name: 'Alex Morgan',
    role: 'Founder',
    accent: '#ff6f59',
    nodes: {
      hi: {
        text: 'Ah, a visitor. I started this place to prove the web can feel like somewhere you go, not just something you scroll. What brings you in?',
        options: [
          { label: "I'd like to work with you", next: 'work' },
          { label: 'How was this built?', next: 'tech' },
          { label: 'Just exploring', next: 'explore' },
        ],
      },
      work: {
        text: `Wonderful. Tell us what you need: a website, a product, a 3D experience. Write to ${CONTACT.email} or visit ${CONTACT.site}. We reply within a day.`,
        options: [{ label: 'How was this built?', next: 'tech' }, bye],
      },
      tech: {
        text: "Next.js and React Three Fiber. Every wall, car and person here is generated in code, and it runs in your browser, even on a phone.",
        options: [{ label: "I'd like to work with you", next: 'work' }, { label: 'Impressive!' }],
      },
      explore: {
        text: 'Explore away. Try the Time menu at the top: the office looks quite different at night.',
        options: [bye],
      },
    },
  },
  guard: {
    id: 'guard',
    name: 'Sam',
    role: 'Security',
    accent: '#14324b',
    nodes: {
      hi: {
        text: 'Morning! Just keeping the garden alive and the gate secure. Mind the road, the traffic here never stops.',
        options: [{ label: 'Any tips for exploring?', next: 'tips' }, { label: "Who's inside?", next: 'who' }, bye],
      },
      tips: {
        text: 'Head in through the gate, say hi to Priya at reception, then follow the corridor. Hold Shift to run, press E to talk to people, Esc to stop walking.',
        options: [{ label: 'Back', next: 'hi' }],
      },
      who: {
        text: 'Priya at the front desk, the studio crew, and Alex at the end of the corridor. Everyone is friendly. Mostly.',
        options: [{ label: 'Back', next: 'hi' }],
      },
    },
  },
  jin: {
    id: 'jin',
    name: 'Jin',
    role: 'Front-end Developer',
    accent: '#2a5d9f',
    nodes: {
      hi: {
        text: "Shh, I'm shipping a feature... oh, hi! I'm Jin, front end. Currently fighting a CSS bug.",
        options: [{ label: 'What are you building?', next: 'build' }, { label: 'Performance tips?', next: 'perf' }, bye],
      },
      build: {
        text: 'A 3D portfolio: camera paths, instanced cities, a walkable office, and keeping it smooth on phones.',
        options: [{ label: 'Performance tips?', next: 'perf' }, { label: 'Back', next: 'hi' }],
      },
      perf: {
        text: "Instance everything that repeats, cap the pixel ratio, and measure frame time before you guess. The browser will thank you.",
        options: [{ label: 'Back', next: 'hi' }],
      },
    },
  },
  leo: {
    id: 'leo',
    name: 'Leo',
    role: '3D Designer',
    accent: '#9b6fd1',
    nodes: {
      hi: {
        text: "Hey! I'm Leo. Palette, lighting, mood: that's my corner. Have you tried the Time menu yet?",
        options: [{ label: 'Tell me about the lighting', next: 'light' }, bye],
      },
      light: {
        text: 'Day is bright and airy, Golden hour gives you long warm shadows, and Night turns every window on. Same scene, three completely different moods.',
        options: [{ label: 'Back', next: 'hi' }],
      },
    },
  },
  maya: {
    id: 'maya',
    name: 'Maya',
    role: 'Operations',
    accent: '#ffc233',
    nodes: {
      hi: {
        text: 'Schedules, budgets, hand-offs. If something ships on time, that was me. What do you need?',
        options: [{ label: 'How do projects start?', next: 'start' }, bye],
      },
      start: {
        text: 'A short call, a clear plan, then a working prototype within a week, so you can see and click it before we go further.',
        options: [{ label: 'Back', next: 'hi' }],
      },
    },
  },
  nora: {
    id: 'nora',
    name: 'Nora',
    role: 'Project Manager',
    accent: '#0f8b8d',
    nodes: {
      hi: {
        text: "Sorry, mid-meeting! We're reviewing the roadmap. Come find me in the Lounge afterwards and I'll walk you through it.",
        options: [bye],
      },
    },
  },
  omar: {
    id: 'omar',
    name: 'Omar',
    role: 'Copywriter',
    accent: '#ff8fc0',
    nodes: {
      hi: {
        text: 'Best coffee in the neighbourhood, and the best sofa. Take a seat. The view is better from here.',
        options: [{ label: 'What do you write?', next: 'write' }, bye],
      },
      write: {
        text: 'Words that make people want to click. Short ones, mostly. This conversation is about my limit.',
        options: [{ label: 'Back', next: 'hi' }],
      },
    },
  },
  visitor: {
    id: 'visitor',
    name: 'Daniel',
    role: 'Visitor',
    accent: '#2f9bff',
    nodes: {
      hi: {
        text: "I'm here to meet the boss. Priya says he's expecting me. Lovely office, isn't it?",
        options: [bye],
      },
    },
  },
}
