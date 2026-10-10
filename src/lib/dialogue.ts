/**
 * Everything the people in the office say, written from Muhammad Owais Ahmed's public portfolio
 * (https://codewithowais.github.io). Edit freely: this file is the content of the site.
 * `{name}` is replaced by the visitor's name (or removed gracefully if they skipped it).
 */
export const OWNER = {
  name: 'Muhammad Owais Ahmed',
  short: 'Owais',
  email: 'codewithowais@gmail.com',
  whatsapp: 'https://wa.me/923169585886',
  site: 'https://codewithowais.github.io',
  github: 'https://github.com/codewithowais',
  linkedin: 'https://www.linkedin.com/in/codewithowais/',
  resume: 'https://codewithowais.github.io/muhammad-owais-ahmed-resume.pdf',
}

export interface Option {
  label: string
  /** id of the next node; omit to end the conversation */
  next?: string
  /** teleport the player to this spot (x, z) and end the conversation */
  teleport?: [number, number]
  /** open a link (new tab, or mail client for mailto:) and stay in the conversation */
  href?: string
  /** special actions */
  action?: 'askName' | 'escort'
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
  /** what they say when you first come close (before you have talked) */
  greet?: string
  nodes: Record<string, Node>
}

/** Fills in the visitor's name, or removes the placeholder cleanly when there isn't one. */
export function fill(text: string, name: string): string {
  const n = name.trim()
  if (n) return text.replace(/\{name\}/g, n)
  return text.replace(/,\s*\{name\}/g, '').replace(/\s*\{name\},/g, ',').replace(/\{name\}/g, 'friend')
}

const bye: Option = { label: 'Thanks, bye!' }
const back = (next: string): Option => ({ label: 'Back', next })
const contactOptions: Option[] = [
  { label: `Email ${OWNER.short}`, href: `mailto:${OWNER.email}` },
  { label: 'Message on WhatsApp', href: OWNER.whatsapp },
  { label: 'Connect on LinkedIn', href: OWNER.linkedin },
  { label: 'Download the résumé', href: OWNER.resume },
]

export const NPCS: Record<string, Npc> = {
  /* ---------------- Owais himself: the Boss Cabin ---------------- */
  boss: {
    id: 'boss',
    name: 'Owais',
    role: 'Staff Software Engineer',
    accent: '#ff6f59',
    nodes: {
      hi: {
        text: `Hi {name}, I'm Owais, nice to meet you! Welcome to my office. I build web and mobile products, and teach Flutter on the side. What would you like to know?`,
        options: [
          { label: 'Tell me about yourself', next: 'about' },
          { label: 'What have you built?', next: 'work' },
          { label: "What's your tech stack?", next: 'stack' },
          { label: 'Open source and AI work', next: 'oss' },
          { label: 'Are you available to hire?', next: 'hire' },
          { label: 'How was this office built?', next: 'tech' },
          { label: 'Tell me something fun', next: 'fun' },
          { label: 'Just looking around' },
        ],
      },
      about: {
        text: "I'm a Staff Software Engineer from Karachi, Pakistan, with six years of building production web and mobile apps. I've been on the founding team at SimpliEd since day one, and I'm the Lead Trainer for Flutter at Jawan Pakistan.",
        options: [{ label: 'What do you do at SimpliEd?', next: 'simplied' }, { label: 'Tell me about teaching', next: 'teach' }, { label: 'Education?', next: 'edu' }, back('hi')],
      },
      edu: {
        text: "I'm studying BS Computer Science at Virtual University of Pakistan (2023 to 2027). Before that I did Pre-Engineering at Superior Govt College, Karachi. Most of what I know I learned by shipping things.",
        options: [back('about')],
      },
      teach: {
        text: 'At Jawan Pakistan I designed the whole Flutter curriculum and have trained over 1,200 developers across 11 cohorts, from their very first widget to apps published on the App Store and Play Store.',
        options: [back('about')],
      },
      work: {
        text: 'Pick one and I will tell you the story behind it.',
        options: [
          { label: 'SimpliEd', next: 'simplied' },
          { label: 'Ledgerly', next: 'ledgerly' },
          { label: 'AI Study Partner', next: 'study' },
          { label: 'DevPath', next: 'devpath' },
          { label: 'Tic-Tac-Toe Live', next: 'tictactoe' },
          { label: 'Zulaal (3D website)', next: 'zulaal' },
          { label: 'See everything on GitHub', href: OWNER.github },
          back('hi'),
        ],
      },
      simplied: {
        text: 'SimpliEd is a school-management platform that grew from zero to 25,000+ users across 10 schools. I architected the Node.js and MongoDB backend, built the Angular web app and the Flutter QR-attendance and parent apps, ran the AWS infrastructure and CI/CD, and led code review for a team of five or six engineers.',
        options: [{ label: 'Open simpliedtech.com', href: 'https://simpliedtech.com' }, back('work')],
      },
      ledgerly: {
        text: 'Ledgerly is an open-source, privacy-first finance app with an AI assistant. It is an offline-first PWA built with Next.js 16, React 19 and IndexedDB, so your data stays on your device.',
        options: [{ label: 'Open Ledgerly', href: 'https://expense-tracker-ochre-one-65.vercel.app' }, { label: 'View the code', href: 'https://github.com/codewithowais/expense-tracker' }, back('work')],
      },
      study: {
        text: 'AI Study Partner turns your own PDFs and notes into a course: chapters, plain-language explanations, quizzes and mock exams, and weak-topic revision. It runs a local AI, so nothing leaves your machine.',
        options: [{ label: 'View the code', href: 'https://github.com/codewithowais/ai-study-planner' }, back('work')],
      },
      devpath: {
        text: "DevPath is a beginner-friendly learning and career platform with 200+ runnable lessons. My favourite feature is 'Watch it sort', a live visualizer that animates each sorting algorithm step by step from the lesson's own code.",
        options: [{ label: 'Open DevPath', href: 'https://dev-path-by-codewithowais.vercel.app' }, back('work')],
      },
      tictactoe: {
        text: 'Real-time multiplayer tic-tac-toe for two to four players: rooms you share by link, spectators, live voice chat over WebRTC, computer opponents, a leaderboard and an admin panel. Built with Next.js and Convex.',
        options: [{ label: 'Play it', href: 'https://tictactoe-live.vercel.app' }, back('work')],
      },
      zulaal: {
        text: 'Zulaal is a brand website for a premium Pakistani water company, with a three.js 3D hero, custom bottle orders and a Firebase admin panel. It is where my 3D work started, and it led to this very office.',
        options: [{ label: 'Open Zulaal', href: 'https://zulaal.vercel.app' }, back('work')],
      },
      oss: {
        text: 'A lot of it is open and free to try: AI Prompt Builder (60+ fill-in-the-blank templates, no sign-up), Ledgerly, AI Study Partner, Decidr, Cadence (a prompt-native AI video editor), CrispCast (an offline screen recorder), Mini Gantt, and a 16-week Agentic AI course. There are 60+ repositories on GitHub.',
        options: [
          { label: 'Open AI Prompt Builder', href: 'https://codewithowais.github.io/flutter-prompt-builder/' },
          { label: 'Open the Agentic AI course', href: 'https://codewithowais.github.io/agentic-ai/' },
          { label: 'Browse all repositories', href: OWNER.github },
          back('hi'),
        ],
      },
      fun: {
        text: "I teach what I build: the Flutter lessons at Jawan Pakistan feed back into the apps I ship. Mini Gantt, for instance, is a dependency-free drag-and-resize Gantt chart. And this office is a portfolio you can walk around in.",
        options: [{ label: 'Can you build something like this for me?', next: 'hire' }, back('hi')],
      },
      stack: {
        text: 'TypeScript, JavaScript, Dart, C# and Python. Angular, React, Next.js and Flutter on the front; Node.js, NestJS and .NET Core on the back. MongoDB, PostgreSQL, SQL Server and Redis for data, and AWS, Docker and GitHub Actions to ship.',
        options: [{ label: 'What have you built with it?', next: 'work' }, back('hi')],
      },
      hire: {
        text: "I'm open to freelance, contract and full-time roles: remote worldwide, on-site in Karachi, and open to relocating to the Gulf (UAE and Saudi Arabia). Let's talk!",
        options: [...contactOptions, back('hi')],
      },
      tech: {
        text: 'This office is Next.js and React Three Fiber. Every wall, car and person is generated in code, nothing is a downloaded model, and it adapts its quality to your device so it stays smooth even on a phone.',
        options: [{ label: 'Can you build something like this for me?', next: 'hire' }, back('hi')],
      },
    },
  },

  /* ---------------- Reception ---------------- */
  receptionist: {
    id: 'receptionist',
    name: 'Ayesha',
    role: 'Receptionist',
    accent: '#17a2a4',
    nodes: {
      hi: {
        text: `Welcome to the office of Muhammad Owais Ahmed, {name}! I'm Ayesha, I look after every visitor. What would you like to know?`,
        options: [
          { label: 'Who is Owais?', next: 'who' },
          { label: 'Is he available to hire?', next: 'hire' },
          { label: 'Show me around the office', action: 'escort' },
          { label: 'Take me somewhere', next: 'go' },
          { label: 'Where can I play football?', teleport: [-35, 4] },
          { label: 'What is there to do here?', next: 'todo' },
          { label: 'Change my name or shirt colour', action: 'askName' },
          { label: 'Thanks, bye!' },
        ],
      },
      todo: {
        text: 'Plenty! Chat to anyone with a diamond over their head, sit on the sofas or at the free desks, pour a coffee in the lounge, ring my bell, play football with red, or read the boards. A little Explorer counter in the corner tracks what you have found.',
        options: [{ label: 'Show me around the office', action: 'escort' }, back('hi')],
      },
      who: {
        text: 'Owais is a Staff Software Engineer from Karachi with six years of experience in Angular, React, Node.js, .NET and Flutter. He is on the founding team at SimpliEd, which serves 25,000+ users, and he is Lead Trainer for Flutter at Jawan Pakistan.',
        options: [{ label: 'Take me to meet him', teleport: [9, -9] }, { label: 'Who else works here?', next: 'team' }, back('hi')],
      },
      team: {
        text: 'Hamza covers the front end, Sana the backend and cloud, Zain the 3D and design, Mahnoor the mobile apps, and Usman the training and mentoring. Each of them can tell you about that side of his work. Walk up and press E.',
        options: [back('hi')],
      },
      hire: {
        text: 'Yes! Owais is open to freelance, contract and full-time roles: remote worldwide, on-site in Karachi, and open to relocating to the Gulf, in the UAE and Saudi Arabia.',
        options: [{ label: 'How do I contact him?', next: 'contact' }, back('hi')],
      },
      contact: {
        text: `The quickest ways to reach Owais are below. Email is best: ${OWNER.email}.`,
        options: [...contactOptions, back('hi')],
      },
      go: {
        text: 'Of course. Where to?',
        options: [
          { label: "Owais's cabin", teleport: [9, -9] },
          { label: 'The Work Studio', teleport: [-12, 2.6] },
          { label: 'The Design Room', teleport: [11, 1.2] },
          { label: 'The Meeting Room', teleport: [7.5, 6.2] },
          { label: 'Operations', teleport: [-12.6, -9.3] },
          { label: 'The Lounge', teleport: [14, 7] },
          { label: 'The football pitch', teleport: [-35, 4] },
          { label: 'The parking lot', teleport: [41, 8] },
          { label: 'Never mind', next: 'hi' },
        ],
      },
    },
  },

  /* ---------------- Gate ---------------- */
  guard: {
    id: 'guard',
    name: 'Rashid',
    role: 'Security',
    accent: '#14324b',
    nodes: {
      hi: {
        text: `Morning, {name}! Owais's office is straight through the gate. Mind the road, the traffic here never stops.`,
        options: [{ label: 'Any tips for exploring?', next: 'tips' }, { label: 'Where is Owais based?', next: 'where' }, { label: 'Where can I play football?', teleport: [-35, 4] }, bye],
      },
      tips: {
        text: 'Head in, say hi to Ayesha at reception, then follow the corridor to the Boss Cabin. A diamond floats over everything you can interact with: people, computers, boards, chairs, even the coffee machine. Press E near one. Hold Shift to go faster, press R to switch between Walk, Run and Sprint, and Esc to stop walking.',
        options: [back('hi')],
      },
      where: {
        text: "Karachi, Pakistan. He works on-site there, remotely with teams worldwide, and he's open to relocating to the Gulf.",
        options: [back('hi')],
      },
    },
  },

  /* ---------------- The team: each one speaks for part of Owais's work ---------------- */
  hamza: {
    id: 'hamza',
    name: 'Hamza',
    role: 'Front-end Lead',
    accent: '#2a5d9f',
    nodes: {
      hi: {
        text: `Shh, I'm in the middle of a component... oh, hi {name}! I'm Hamza. I look after the front end, which is Owais's home turf.`,
        options: [{ label: 'What front-end work has he done?', next: 'fe' }, { label: 'Any 3D work?', next: 'threed' }, bye],
      },
      fe: {
        text: 'He built the Angular web app for SimpliEd, and ships React and Next.js products such as Ledgerly, DevPath and Tic-Tac-Toe Live. Tailwind, Material UI, Redux and RxJS are all in his toolbox.',
        options: [{ label: 'See his GitHub', href: OWNER.github }, back('hi')],
      },
      threed: {
        text: 'Yes: the three.js hero on the Zulaal website, and this entire office, which is React Three Fiber with everything generated in code.',
        options: [back('hi')],
      },
    },
  },
  sana: {
    id: 'sana',
    name: 'Sana',
    role: 'Backend & Cloud',
    accent: '#ffc233',
    nodes: {
      hi: {
        text: `Hi {name}! I'm Sana. Servers, databases, pipelines: if it runs in the cloud and doesn't fall over, that's my side of Owais's work.`,
        options: [{ label: 'What backend does he build?', next: 'be' }, { label: 'And the cloud side?', next: 'cloud' }, bye],
      },
      be: {
        text: 'Node.js with Express and NestJS, .NET Core, and Django, with REST, GraphQL and microservices. He architected the whole SimpliEd backend on Node.js and MongoDB, and earlier migrated core services from .NET Framework to .NET Core.',
        options: [back('hi')],
      },
      cloud: {
        text: 'AWS (EC2, S3, RDS and Lambda), Docker and GitHub Actions for CI/CD, on top of MongoDB, PostgreSQL, SQL Server and Redis. He also led code review for a team of five or six engineers.',
        options: [back('hi')],
      },
    },
  },
  zain: {
    id: 'zain',
    name: 'Zain',
    role: '3D & Design',
    accent: '#9b6fd1',
    nodes: {
      hi: {
        text: `Hey {name}, I'm Zain. I look after the 3D and the look of things. Have you tried the Time menu at the top yet?`,
        options: [{ label: 'How is this 3D office made?', next: 'how' }, bye],
      },
      how: {
        text: "Every wall, car, tree and person is generated in code with React Three Fiber, no downloaded models. Day, Golden hour and Night are three lighting moods on the same scene, and it adjusts its quality automatically so it runs on phones too.",
        options: [{ label: "Show me Owais's 3D website", href: 'https://zulaal.vercel.app' }, back('hi')],
      },
    },
  },
  mahnoor: {
    id: 'mahnoor',
    name: 'Mahnoor',
    role: 'Mobile (Flutter)',
    accent: '#0f8b8d',
    nodes: {
      hi: {
        text: `Sorry, {name}, I'm mid-meeting about a release! I look after mobile. Owais has been shipping Flutter apps for years.`,
        options: [{ label: 'What mobile apps has he built?', next: 'apps' }, bye],
      },
      apps: {
        text: "SimpliEd's QR-attendance and parent-student apps, used daily by thousands of families, plus an offline-first travel app with on-device English to Chinese translation. He also teaches Flutter, so he knows it inside out.",
        options: [back('hi')],
      },
    },
  },
  usman: {
    id: 'usman',
    name: 'Usman',
    role: 'Training & Mentoring',
    accent: '#ff8fc0',
    nodes: {
      hi: {
        text: `Take a seat, {name}! I'm Usman. Best sofa in the building, and I keep the teaching side of Owais's work organised.`,
        options: [{ label: 'Tell me about the teaching', next: 'teach' }, bye],
      },
      teach: {
        text: 'Owais is Lead Trainer at Jawan Pakistan. He designed the Flutter curriculum and has trained over 1,200 developers across 11 cohorts. He also offers workshops and one-to-one mentorship for individuals and teams.',
        options: [{ label: 'How do I reach him about mentoring?', href: `mailto:${OWNER.email}` }, back('hi')],
      },
    },
  },
  visitor: {
    id: 'visitor',
    name: 'Faisal',
    role: 'Visiting recruiter',
    accent: '#2f9bff',
    nodes: {
      hi: {
        text: `Oh, hello {name}! I'm here to talk to Owais about a role. I heard he's open to relocating to the Gulf. Lovely office, isn't it?`,
        options: [{ label: 'Is that true?', next: 'gulf' }, bye],
      },
      gulf: {
        text: "Yes: UAE and Saudi Arabia are both on the table, with visa sponsorship welcome and about 30 days' notice. He's also happy to work fully remote.",
        options: [back('hi')],
      },
    },
  },

  /* ---------------- Pitch-side: they get you into the game ---------------- */
  bilal: {
    id: 'bilal',
    name: 'Bilal',
    role: 'Football fan',
    accent: '#14324b',
    nodes: {
      hi: {
        text: `Hey {name}! Red is a player short today. Why don't you jump in? Just walk onto the pitch.`,
        options: [{ label: 'How do I play?', next: 'how' }, { label: "Who's winning?", next: 'score' }, { label: 'Take me to the ball!', teleport: [-38, 0] }, bye],
      },
      how: {
        text: 'Run into the ball to dribble it. When you are close, press E (or tap the Kick button) to shoot. You play for red and attack the left goal, and the shot bends towards it if you are roughly facing it.',
        options: [back('hi')],
      },
      score: {
        text: "Hard to say, it changes every minute! Step onto the pitch and a goal flashes up whenever somebody scores.",
        options: [back('hi')],
      },
    },
  },
  hira: {
    id: 'hira',
    name: 'Hira',
    role: 'Football fan',
    accent: '#d9568f',
    nodes: {
      hi: {
        text: `Hi {name}! Watching the match with Bilal. The red team passes to you if you stand in space.`,
        options: [{ label: 'Any tips?', next: 'tips' }, { label: 'Is the office worth visiting?', next: 'office' }, bye],
      },
      tips: {
        text: 'Keep moving and the others will pass to you. The goal in front of you is the left one. Hold Shift or switch to Sprint (press R) to get to the ball first.',
        options: [back('hi')],
      },
      office: {
        text: "Definitely. Go in through the gate and ask Ayesha at reception to show you around. She even waits if you stop to look at things.",
        options: [back('hi')],
      },
    },
  },

  /* ---------------- Objects you can use ---------------- */
  pc: {
    id: 'pc',
    name: "Owais's computer",
    role: 'Workstation',
    accent: '#0f8b8d',
    nodes: {
      hi: {
        text: `The screen is open on GitHub: 60+ repositories, from SimpliEd-style platforms to AI tools, a 3D water-brand site and this very office. What would you like to open?`,
        options: [
          { label: 'Open his GitHub', href: OWNER.github },
          { label: 'Open the portfolio site', href: OWNER.site },
          { label: 'Open LinkedIn', href: OWNER.linkedin },
          { label: 'Download the résumé', href: OWNER.resume },
          { label: 'Step away' },
        ],
      },
    },
  },
  board: {
    id: 'board',
    name: 'Skills board',
    role: 'Corkboard',
    accent: '#ffc233',
    nodes: {
      hi: {
        text: 'A corkboard covered in sticky notes: Angular, React, Next.js, Flutter, Node.js, NestJS, .NET Core, MongoDB, PostgreSQL, AWS, Docker, GitHub Actions. Someone has underlined "Flutter" twice.',
        options: [{ label: 'Who works with these?', next: 'who' }, { label: 'Step away' }],
      },
      who: {
        text: 'Hamza handles the front end, Sana the backend and cloud, Mahnoor the Flutter apps, and Owais does a bit of everything. Walk up to any of them and press E.',
        options: [back('hi')],
      },
    },
  },
  shelf: {
    id: 'shelf',
    name: 'Bookshelf',
    role: 'Owais\'s shelf',
    accent: '#7a4a2e',
    nodes: {
      hi: {
        text: "Rows of programming books and binders. One folder is labelled 'Flutter curriculum, Jawan Pakistan': the course Owais designed and has taught to over 1,200 developers.",
        options: [{ label: 'Tell me about the teaching', next: 'teach' }, { label: 'Step away' }],
      },
      teach: {
        text: 'Eleven cohorts so far, from first widget to published apps. He also offers workshops and one-to-one mentoring.',
        options: [{ label: 'Ask about mentoring', href: `mailto:${OWNER.email}` }, back('hi')],
      },
    },
  },
  screen: {
    id: 'screen',
    name: 'Meeting-room screen',
    role: 'Presentation',
    accent: '#17a2a4',
    nodes: {
      hi: {
        text: 'The screen is showing a slide: "Muhammad Owais Ahmed, Staff Software Engineer. Angular, React, Node.js, .NET and Flutter. SimpliEd: 25,000+ users, 10 schools."',
        options: [{ label: 'Open the full résumé (PDF)', href: OWNER.resume }, { label: 'Connect on LinkedIn', href: OWNER.linkedin }, { label: 'Step away' }],
      },
    },
  },
  easel: {
    id: 'easel',
    name: 'Easel',
    role: "Zain's canvas",
    accent: '#9b6fd1',
    nodes: {
      hi: {
        text: 'A canvas on an easel with a half-finished palette: teal, coral, navy and a warm cream. A sticky note says "Night theme: more glow".',
        options: [{ label: 'Who painted this?', next: 'who' }, { label: 'Step away' }],
      },
      who: {
        text: 'Zain, who looks after the 3D and the look of things. The palette is the same one used across the whole office.',
        options: [back('hi')],
      },
    },
  },
}

/* ---------------- extras applied to everyone ---------------- */

/** What each person says when you first come close. */
const GREET: Record<string, string> = {
  receptionist: "Welcome to the office, {name}! Press E and I'll be happy to show you around.",
  boss: 'Ah, {name}! Come in, come in. Take a seat if you like.',
  guard: 'Good morning, {name}! Mind the road.',
  hamza: 'Hey {name}! Give me a second, I am mid-commit.',
  sana: 'Hi {name}! Everything is green on my dashboards today.',
  zain: 'Oh hello, {name}! Have you tried the Night theme?',
  mahnoor: 'Hi {name}! Welcome to the mobile corner.',
  usman: 'Take a seat, {name}! The sofa is very good.',
  bilal: "{name}! Red needs a player. Join us on the pitch!",
  hira: 'Hi {name}! Come and watch the match with us.',
  visitor: 'Hello, {name}! Lovely office, isn\'t it?',
}
for (const [id, g] of Object.entries(GREET)) if (NPCS[id]) NPCS[id].greet = g

/** Small talk, so every person has a few more things to say. */
const SMALL: Record<string, [string, string]> = {
  receptionist: ['Busy, in a good way! Visitors keep arriving and I love giving the tour.', 'Fun fact: the corridor is about 28 metres long, and nobody who follows me has ever got lost.'],
  guard: ['Quiet. The shrubs are thriving and the gate is behaving.', 'The booth has the best view of the garden, the gate and the road all at once.'],
  hamza: ['Deep in a component. Send coffee.', 'A good front end is felt, not seen: no jank, no layout jumps, nothing in your way.'],
  sana: ['Watching dashboards and trying very hard not to get paged.', 'Most outages turn out to be configuration, not code. Check the boring stuff first.'],
  zain: ['Tweaking the Night theme: I want the windows to glow just right.', 'Everything here is generated in code. There are no downloaded models at all.'],
  mahnoor: ['Release-day energy!', 'Flutter lets you ship Android and iOS from one codebase, which is why Owais teaches it.'],
  usman: ['Relaxed. This sofa is undefeated.', 'Beginners learn fastest by building something real in the first week.'],
  bilal: ['Great match. Red is a player short, as you know.', 'A good pass finds the player in space, not the one standing still.'],
  hira: ['Enjoying the game with Bilal.', 'The goal red attacks is the left one. Remember that when you shoot!'],
  visitor: ['Excited! This is not what I expected from a portfolio.', 'I was told the whole city around the office is built in code.'],
}
for (const [id, [day, fact]] of Object.entries(SMALL)) {
  const n = NPCS[id]
  if (!n) continue
  n.nodes.day = { text: day, options: [{ label: 'Tell me something interesting', next: 'fact' }, back('hi')] }
  n.nodes.fact = { text: fact, options: [{ label: 'How is your day going?', next: 'day' }, back('hi')] }
  const hi = n.nodes.hi
  // put the small talk before the final "bye"/exit option, never exceeding nine choices
  const at = Math.max(0, hi.options.length - 1)
  if (hi.options.length < 8) hi.options.splice(at, 0, { label: 'How is your day going?', next: 'day' }, { label: 'Tell me something interesting', next: 'fact' })
  else if (hi.options.length < 9) hi.options.splice(at, 0, { label: 'Tell me something interesting', next: 'fact' })
}
