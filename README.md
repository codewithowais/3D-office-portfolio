# The Office — interactive 3D office portfolio

A fully procedural 3D office and neighbourhood for **Muhammad Owais Ahmed**, built with Next.js, React Three Fiber and zustand.
There are no external 3D models or textures: every building, person and prop is generated in code.

Live site: https://the-office-3d.vercel.app (auto-deploys from `main`).

## Run

Needs **Node 20.9+** (tested on Node 22 and 26).

```bash
npm install
npm run dev      # http://localhost:3000
npm run build && npm start
npm run lint
```

For performance testing use the production build (`npm run build && npm start`), not `npm run dev`.

## What you can do

### Watch
- **Auto-play tour** (about 3 minutes): the guard waters the garden, a jogger runs by, five-a-side football, the receptionist leads a visitor to the boss, the visitor drives away, then a 360° city orbit.
- **Free look**: drag or scroll the view at any time. During the tour this takes the camera over; **Start demo** resumes it.
- **Explore mode**: orbit, zoom and pan, 7 room shortcuts, scenic places, Pause / Exit demo / Start demo.
- **Time of day**: Day, Golden hour, Night.
- **Quality**: Low (no shadows), Medium, High. A frame-rate watchdog steps it down on slow machines.

### Walk (control your own character)
Press **Walk**. You are asked for your name, a Boy/Girl character and a shirt colour (saved in your browser only).

| Control | Action |
| --- | --- |
| **W A S D** / arrows | Move (relative to the camera) |
| **Shift** | One speed level faster while held |
| **R** | Cycle Walk 2.3 / Run 5.0 / Sprint 8.5 m/s (also the selector at top right) |
| **Space** | Jump (kicks during the football match) |
| **G F C V B X** | Emotes: wave, dance, clap, cheer, bow, flex (also the Emotes menu) |
| **E** | Talk / use / kick / stand up |
| **1 – 9** | Choose a dialogue answer |
| Drag / scroll or pinch | Rotate and zoom the camera around your character |
| Click or tap the ground | Walk there |
| **Esc** | Stop walking / leave a conversation |

On a phone there is an on-screen pad, a "Hold to run" button and tappable speed and emote menus.
A **Back to office** button appears when you are on the pitch or outside the compound, and the Rooms menu works from anywhere.

### Interact
- **People**: reception (Ayesha), the guard, the boss (Owais) and seven more colleagues with Pakistani names, plus a visitor. They greet you by name when you come close.
  Walk up so that nothing (a desk, a counter, a wall) is between you, then press **E**. Conversations stay open until you walk away or say goodbye, and use real details from Owais's portfolio.
- **Chat or do something together** with anyone: small talk, jokes, advice, compliments, handshake, high-five, fist bump, give a coffee, take a selfie, rock-paper-scissors, and a 3-question quiz about Owais.
- **Ayesha** can show you around the office (a guided walk through the rooms), take you to any room, or sign you in.
- **Things**: Owais's computer, skills board, bookshelves, meeting screen, easel, reception bell, guestbook, coffee machine, water cooler, vending machine, printer (opens the résumé or portfolio), whiteboard, light switch, fire extinguisher, a kickable bin, plants, a window view, and the car horn. Eight seats can be sat on.
- **Football**: step onto the pitch, run into the ball and press **E** or **Space** to kick. You play for red and attack the left goal.
- **Explorer progress**: a chip at the top right counts the people met, places visited and things tried.
- Men and women have different builds, hair and clothes.

## Where to change things

| Want to change | File |
| --- | --- |
| What people say, quiz questions, contact details | `src/lib/dialogue.ts` (`OWNER`, `NPCS`) |
| Jokes, advice, social acts, greetings | `src/lib/social.ts` |
| Who and what can be interacted with, and where | `src/lib/talkables.ts` |
| Walking speeds, emotes, jump | `src/lib/player.ts` |
| Click-to-walk | `src/lib/walkto.ts` |
| Football rules and AI | `src/lib/soccer.ts` |
| Guided office tour | `src/lib/escort.ts` |
| Colliders (walls, desks) | `src/lib/collision.ts` |
| Place banners and discovery zones | `src/lib/zones.ts` |
| Brand name and website on the signs | `src/lib/world.ts` (`BRAND`) |
| Colours and lighting moods | `src/lib/world.ts` (`C`), `src/lib/themes.ts` |
| Captions and camera shots of the tour | `src/lib/tour.ts` |
| Who walks where, and when | `src/lib/actors.ts`, `src/lib/chat.ts` |
| Rooms and menu | `src/lib/world.ts` (`ROOMS`, `SCENIC`) |
| App state, persistence | `src/lib/store.ts`, `src/lib/profile.ts` |
| Office walls, furniture and props | `src/components/world/Office.tsx`, `Furniture.tsx`, `Props.tsx` |
| People and their animations | `src/components/world/Person.tsx`, `PersonRig.ts` |
| Fence, booth, pitch, parking | `src/components/world/Surroundings.tsx` |
| City, roads, traffic, mountains | `City.tsx`, `CityRoads.tsx`, `Mountains.tsx` |
| Camera, input and the main loop | `src/components/Scene.tsx`, `Experience.tsx` |
| UI overlay and dialogue panel | `src/components/Overlay.tsx`, `Dialogue.tsx`, `ui/*` |

Everything animated is a pure function of one world clock (`src/lib/clock.ts`), so pausing freezes the whole world. The clock also pauses while you are in a conversation.

Deep link into the tour with `/?t=60` (seconds).

## Performance

Draw calls and shadow casters are the main cost, so the scene is built to keep both low:

- **People** are a few merged, vertex-coloured meshes each, and anyone more than ~40 m from the camera is drawn as one static mesh with no animation (`PersonRig.ts`).
- **Static furniture and props** are merged into one mesh per material after mounting (`StaticMerge.tsx`). Anything animated is marked `userData.dynamic` and left alone.
- **Repeated props** (trees, railings, shrubs, road markings, lamps) are instanced.
- **Shadows**: only objects bigger than ~0.6 m cast them, and the shadow map refreshes every other frame.
- **UI** avoids `backdrop-filter`, which is expensive over a canvas that redraws every frame.
- **Adaptive quality**: the device is probed at start-up (`device.ts`), the pixel ratio follows a pixel budget, and a watchdog lowers quality on slow machines.
- **Resilience**: an error boundary catches render errors, and a lost GPU context remounts the scene with a circuit breaker.

Measured on an M2 Pro at 1280x800, High quality (mean frame cost): 11-20 ms before, 4.6-6.6 ms after, with visible meshes dropping from ~2,800 to ~920 and shadow casters from ~1,730 to ~545.

`performance.mark` entries `office-ready` and `office-first-frame` are written for load measurement.

## Stack

Next.js 16 (static export-friendly, Turbopack), React 19, TypeScript, Tailwind 4, three.js r186, `@react-three/fiber`, `@react-three/drei`, `@react-three/postprocessing`, zustand.

In `next dev` a debug hook is available as `window.__office` (clock, player, input, store, football and escort state).
