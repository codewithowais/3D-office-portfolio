# The Office — interactive 3D office

A procedural 3D office and neighbourhood built with Next.js, React Three Fiber and zustand.
No external 3D assets: everything is generated in code.

## Run

Needs Node 20+ (tested on Node 22).

```bash
npm install
npm run dev      # http://localhost:3000
npm run build && npm start
```

## What's inside

- **Auto-play tour** (about 3 minutes): guard watering the garden, a jogger, five-a-side football,
  a receptionist leading a visitor to the boss, the visitor driving away, then a 360° city orbit.
- **Explore mode**: orbit / zoom / pan, 7 room shortcuts, scenic places, Pause / Exit demo / Start demo.
- **Talk to people**: in Walk mode, nine characters can be spoken to (marked by a bobbing diamond). Walk close and press **E** (or tap the prompt), answer with **1–4**, **Esc** to leave. Some answers can teleport you, e.g. Priya at reception takes you to the Boss Cabin.
- **Quality**: Low (no shadows), Medium, High.
- **Time of day**: Day, Golden hour, Night (themes live in `src/lib/themes.ts`).
- Deep link into the tour with `/?t=60` (seconds).

## Where to change things

| Want to change | File |
| --- | --- |
| What people say (conversations, contact details) | `src/lib/dialogue.ts` |
| Who can be talked to, and where they stand | `src/lib/talkables.ts` |
| Brand name and website on the signs | `src/lib/world.ts` (`BRAND`) |
| Colours and lighting moods | `src/lib/world.ts` (`C`), `src/lib/themes.ts` |
| Captions and camera shots | `src/lib/tour.ts` |
| Who walks where, and when | `src/lib/actors.ts` |
| Rooms and menu | `src/lib/world.ts` (`ROOMS`, `SCENIC`) |
| Office walls and furniture | `src/components/world/Office.tsx`, `Furniture.tsx` |
| Fence, booth, pitch, parking | `src/components/world/Surroundings.tsx` |
| City, roads, traffic, waterfront | `src/components/world/City.tsx` |
| UI overlay | `src/components/Overlay.tsx` |

Everything animated is a pure function of one clock (`src/lib/clock.ts`), so pausing freezes the whole world.

## Performance

Repeated static props (railing posts, shrubs) are instanced, and seated staff stop animating while far from the camera. `performance.mark` entries `office-ready` and `office-first-frame` are written for load measurement.
