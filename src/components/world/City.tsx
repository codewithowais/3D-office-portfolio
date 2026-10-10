'use client'
import { useMemo } from 'react'
import * as THREE from 'three'
import { makeLoop } from '@/lib/actor'
import { V3, rng } from '@/lib/math'
import { addObstacles } from '@/lib/collision'
import { GRID } from '@/lib/world'
import { useTheme } from '../Atmosphere'
import { MovingCar, CAR_COLORS } from './Car'
import { Roads, StreetFurniture } from './CityRoads'
import { FacadeStyle, brickBump, facadeGlow, facadeMap } from './facades'
import { M } from './materials'
import { Mountains } from './Mountains'
import { Person, look } from './Person'
import { BOX, Box, CYL, Floor, Instanced, PLANE, SPH, mat } from './primitives'

const { xs, zs, road: RW } = GRID
const TILE = 7
const ICO = new THREE.IcosahedronGeometry(1, 1)
const PYRAMID = new THREE.ConeGeometry(1, 1, 4).rotateY(Math.PI / 4)

const GLASS_TINTS = ['#6fb4d6', '#4f8fb5', '#5aa3a0', '#8aa7c4']
const GLASS_FRAMES = ['#3c4a56', '#2d3a45', '#4a5560']
const BRICKS = ['#b5543b', '#a8553d', '#c27a55', '#8e4a3a', '#b98a64']
const CONCRETES = ['#d9d6cf', '#cfcbc2', '#e6e2d8', '#c9ccd0']
const ROOF_TILES = ['#a5472f', '#7a4a3a', '#566470', '#8b5a3c']
const AWNINGS = ['#ff6f59', '#ffc233', '#17a2a4', '#2a5d9f', '#d9568f']

interface Bld {
  x: number
  z: number
  w: number
  d: number
  h: number
  style: FacadeStyle
  wall: string
  glass: string
  variant: number
  house: boolean
}

interface Lot {
  kind: 'building' | 'houses' | 'park' | 'plaza'
  x: number
  z: number
  w: number
  d: number
  blds: Bld[]
}

function buildingGeo(w: number, h: number, d: number) {
  const g = new THREE.BoxGeometry(w, h, d)
  const uv = g.attributes.uv as THREE.BufferAttribute
  // faces: px nx py ny pz nz, 4 verts each; scale UVs so the facade tile stays 7 m wide
  const scales: [number, number][] = [[d / TILE, h / TILE], [d / TILE, h / TILE], [1, 1], [1, 1], [w / TILE, h / TILE], [w / TILE, h / TILE]]
  for (let f = 0; f < 6; f++)
    for (let v = 0; v < 4; v++) {
      const i = f * 4 + v
      uv.setXY(i, uv.getX(i) * scales[f][0], uv.getY(i) * scales[f][1])
    }
  return g
}

function pickStyle(h: number, r: number): FacadeStyle {
  if (h >= 26) return r < 0.65 ? 'glass' : 'concrete'
  if (h >= 14) return r < 0.45 ? 'concrete' : r < 0.8 ? 'brick' : 'glass'
  return r < 0.55 ? 'brick' : 'concrete'
}

function makeBld(rand: () => number, x: number, z: number, w: number, d: number, h: number, house = false): Bld {
  const style = house ? (rand() < 0.5 ? 'brick' : 'concrete') : pickStyle(h, rand())
  const wall = style === 'glass' ? GLASS_FRAMES[Math.floor(rand() * 3)] : style === 'brick' ? BRICKS[Math.floor(rand() * BRICKS.length)] : CONCRETES[Math.floor(rand() * CONCRETES.length)]
  const glass = style === 'glass' ? GLASS_TINTS[Math.floor(rand() * GLASS_TINTS.length)] : style === 'brick' ? '#7aa6c2' : '#4a7da3'
  return { x, z, w, d, h, style, wall, glass, variant: Math.floor(rand() * 8), house }
}

function Facade({ b, tier }: { b: Bld; tier: boolean }) {
  const t = useTheme()
  const geo = useMemo(() => buildingGeo(b.w * (tier ? 0.62 : 1), b.h * (tier ? 0.3 : 1), b.d * (tier ? 0.62 : 1)), [b, tier])
  const m = useMemo(
    () =>
      mat('#ffffff', {
        map: facadeMap(b.style, b.wall, b.glass),
        bumpMap: b.style === 'brick' ? brickBump() : undefined,
        rough: b.style === 'glass' ? 0.12 : 0.82,
        metal: b.style === 'glass' ? 0.6 : 0.02,
        emissive: '#ffd9a0',
        emissiveMap: facadeGlow(b.style, b.variant),
        ei: t.windows,
      }),
    [b.style, b.wall, b.glass, b.variant, t.windows],
  )
  const hh = tier ? b.h * 0.3 : b.h
  const y = tier ? b.h + 0.4 + hh / 2 : hh / 2
  return <mesh position={[b.x, y, b.z]} geometry={geo} material={m} castShadow receiveShadow />
}

function Skyline() {
  const { items, colors } = useMemo(() => {
    const rand = rng(77)
    const items: { p: V3; s: V3 }[] = []
    const colors: string[] = []
    const pal = ['#9db0c0', '#a9b8c4', '#b9aa9a', '#9aa7b0', '#b4bfc9']
    for (let gx = -700; gx <= 700; gx += 64)
      for (let gz = -420; gz <= 560; gz += 64) {
        if (Math.abs(gx) < 262 && gz > -215 && gz < 240) continue
        if (gz < -215) continue
        const w = 26 + rand() * 16
        const d = 26 + rand() * 16
        const h = 14 + rand() * rand() * 90
        items.push({ p: [gx + (rand() - 0.5) * 14, h / 2, gz + (rand() - 0.5) * 14], s: [w, h, d] })
        colors.push(pal[Math.floor(rand() * pal.length)])
      }
    return { items, colors }
  }, [])
  const m = useMemo(() => mat('#ffffff', { rough: 0.8 }), [])
  return <Instanced geometry={BOX} material={m} items={items} colors={colors} cast />
}

function rect(hx: number, hz: number, cx = 0, cz = 0, west = true): V3[] {
  const a: V3[] = [[cx + hx, 0, cz + hz], [cx - hx, 0, cz + hz], [cx - hx, 0, cz - hz], [cx + hx, 0, cz - hz]]
  return west ? a : [a[1], a[0], a[3], a[2]]
}

const TRAFFIC = [
  { pts: rect(62, 30), v: 7, off: 0 },
  { pts: rect(62, 30), v: 7, off: 260 },
  { pts: rect(58, 26, 0, 0, false), v: 6, off: 40 },
  { pts: rect(58, 26, 0, 0, false), v: 6, off: 290 },
  { pts: rect(142, 110), v: 9, off: 100 },
  { pts: rect(142, 110), v: 9, off: 900 },
  { pts: rect(138, 106, 0, 0, false), v: 8, off: 20 },
  { pts: rect(138, 106, 0, 0, false), v: 8, off: 600 },
  { pts: rect(62, 110, 0, 0), v: 8, off: 300 },
  { pts: rect(142, 26, 0, 0, false), v: 8, off: 500 },
]

const WALKERS: { pts: V3[]; v: number; off: number }[] = [
  { pts: rect(54.8, 22.6, 0, 0, false), v: 1.3, off: 20 },
  { pts: rect(54.8, 22.6, 0, 0, true), v: 1.25, off: 100 },
  { pts: rect(54.8, 22.6, 0, 0, false), v: 1.4, off: 190 },
  { pts: rect(34.8, 22.6, -100, 0, false), v: 1.3, off: 10 },
  { pts: rect(34.8, 22.6, -100, 0, true), v: 1.2, off: 70 },
  { pts: rect(34.8, 22.6, 100, 0, false), v: 1.3, off: 40 },
  { pts: rect(34.8, 22.6, 100, 0, true), v: 1.35, off: 120 },
  { pts: rect(34.8, 33, -100, -68, false), v: 1.3, off: 30 },
  { pts: rect(34.8, 33, 100, -68, true), v: 1.2, off: 60 },
  { pts: rect(34.8, 33, 100, 68, false), v: 1.3, off: 90 },
]

function Traffic() {
  const cars = useMemo(() => TRAFFIC.map((t) => makeLoop(t.pts, t.v, t.off, 5)), [])
  return (
    <>
      {cars.map((c, i) => (
        <MovingCar key={i} sample={c.sample} color={CAR_COLORS[(i * 3 + 1) % 7]} />
      ))}
    </>
  )
}

function Walkers() {
  const walkers = useMemo(() => WALKERS.map((t) => makeLoop(t.pts, t.v, t.off, 1.5)), [])
  const shirts = ['#ff6f59', '#2f80d0', '#ffc233', '#f5efe0', '#4cc2a0', '#d9568f']
  const pants = ['#2b2f33', '#4a4036', '#3a4a5a']
  return (
    <>
      {walkers.map((w, i) => (
        <Person key={i} sample={w.sample} {...look(i + 3, shirts, pants)} />
      ))}
    </>
  )
}


function buildCity() {
    const rand = rng(2024)
    const lots: Lot[] = []
    const trees: V3[] = []
    for (let i = 0; i < xs.length - 1; i++) {
      for (let j = 0; j < zs.length - 1; j++) {
        const x0 = xs[i] + RW / 2 + 2.5
        const x1 = xs[i + 1] - RW / 2 - 2.5
        const z0 = zs[j] + RW / 2 + 2.5
        const z1 = zs[j + 1] - RW / 2 - 2.5
        const cx = (x0 + x1) / 2
        const cz = (z0 + z1) / 2
        if (i === 2 && j === 2) continue
        const nearCenter = Math.hypot(cx, cz) < 175
        const southOfCenter = i === 2 && j === 3
        const nx = Math.max(1, Math.round((x1 - x0) / 36))
        const nz = Math.max(1, Math.round((z1 - z0) / 36))
        const lw = (x1 - x0) / nx
        const ld = (z1 - z0) / nz
        for (let a = 0; a < nx; a++) {
          for (let b = 0; b < nz; b++) {
            const lx = x0 + lw * (a + 0.5)
            const lz = z0 + ld * (b + 0.5)
            const r = rand()
            const kind: Lot['kind'] = southOfCenter ? 'park' : nearCenter && r < 0.22 ? 'houses' : r < 0.74 ? 'building' : r < 0.88 ? 'park' : 'plaza'
            const blds: Bld[] = []
            if (kind === 'building') {
              const w = lw * (0.6 + rand() * 0.28)
              const d = ld * (0.6 + rand() * 0.28)
              const h = nearCenter ? 7 + rand() * 11 : 14 + rand() * 38
              blds.push(makeBld(rand, lx, lz, w, d, h))
            } else if (kind === 'houses') {
              for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
                blds.push(makeBld(rand, lx + sx * lw * 0.24, lz + sz * ld * 0.24, 9 + rand() * 3, 9 + rand() * 3, 5.5, true))
              }
            } else {
              for (let k = 0; k < 6; k++) trees.push([lx + (rand() - 0.5) * (lw - 6), 0, lz + (rand() - 0.5) * (ld - 6)])
            }
            lots.push({ kind, x: lx, z: lz, w: lw * 0.8, d: ld * 0.8, blds })
          }
        }
        for (let x = x0 + 2; x < x1; x += 9) trees.push([x, 0, z0 + 0.8], [x + 4, 0, z1 - 0.8])
      }
    }

    // everything that is the same on every building is instanced: one draw call per kind
    const ex = {
      parapet: [] as { p: V3; s: V3 }[],
      roof: [] as { p: V3; s: V3 }[],
      ac: [] as { p: V3; s: V3 }[],
      tank: [] as { p: V3; s: V3 }[],
      pyramid: [] as { p: V3; s: V3 }[],
      pyramidColors: [] as string[],
      shop: [] as { p: V3; s: V3 }[],
      awning: [] as { p: V3; s: V3 }[],
      awningColors: [] as string[],
      mast: [] as { p: V3; s: V3 }[],
    }
    const roofOn = (x: number, z: number, w: number, d: number, h: number) => {
      ex.parapet.push({ p: [x, h + 0.45, z], s: [w + 0.3, 0.9, d + 0.3] })
      ex.roof.push({ p: [x, h + 0.93, z], s: [w - 0.5, 0.06, d - 0.5] })
    }
    for (const lot of lots)
      for (const b of lot.blds) {
        if (b.house) {
          ex.pyramid.push({ p: [b.x, b.h + 1.3, b.z], s: [(b.w + 0.8) / 1.414, 2.6, (b.d + 0.8) / 1.414] })
          ex.pyramidColors.push(ROOF_TILES[b.variant % ROOF_TILES.length])
          continue
        }
        roofOn(b.x, b.z, b.w, b.d, b.h)
        const nAc = 2 + (b.variant % 3)
        for (let k = 0; k < nAc; k++) {
          const u = ((b.variant * 13 + k * 29) % 100) / 100
          const v = ((b.variant * 7 + k * 41) % 100) / 100
          ex.ac.push({ p: [b.x + (u - 0.5) * b.w * 0.6, b.h + 1.4, b.z + (v - 0.5) * b.d * 0.6], s: [1.8, 0.9, 1.2] })
        }
        if (b.variant % 3 === 0) ex.tank.push({ p: [b.x - b.w * 0.25, b.h + 2.1, b.z + b.d * 0.2], s: [1.2, 2.4, 1.2] })
        if (b.h > 26) {
          roofOn(b.x, b.z, b.w * 0.62, b.d * 0.62, b.h + 0.4 + b.h * 0.3)
          ex.mast.push({ p: [b.x, b.h + b.h * 0.3 + 4.5, b.z], s: [0.14, 7, 0.14] })
        }
        ex.shop.push({ p: [b.x, 2, b.z], s: [b.w + 0.3, 4, b.d + 0.3] })
        ex.awning.push({ p: [b.x, 4.1, b.z + b.d / 2 + 0.8], s: [b.w * 0.85, 0.22, 1.6] })
        ex.awningColors.push(AWNINGS[b.variant % AWNINGS.length])
      }
    return { lots, trees, extras: ex }
}

const CITY = buildCity()

/* walk mode: every building is solid */
addObstacles(CITY.lots.flatMap((l) => l.blds.map((b) => ({ x0: b.x - b.w / 2 - 0.2, x1: b.x + b.w / 2 + 0.2, z0: b.z - b.d / 2 - 0.2, z1: b.z + b.d / 2 + 0.2 }))))

export function City() {
  const { lots, trees, extras } = CITY

  const concreteLight = useMemo(() => mat('#c7cdd3', { rough: 0.85 }), [])
  const roofDark = useMemo(() => mat('#4d535a', { rough: 0.95 }), [])
  const acM = useMemo(() => mat('#aab2b9', { rough: 0.6, metal: 0.3 }), [])
  const tankM = useMemo(() => mat('#8f6b4a', { rough: 0.8 }), [])
  const tileM = useMemo(() => mat('#ffffff', { rough: 0.8 }), [])
  const shopM = useMemo(() => mat('#1d2b34', { rough: 0.08, metal: 0.65 }), [])
  const awnM = useMemo(() => mat('#ffffff', { rough: 0.75 }), [])
  const mastM = useMemo(() => mat('#c8d0d6', { rough: 0.5, metal: 0.4 }), [])

  const trunk = useMemo(() => mat('#6b4b2d'), [])
  const leafA = useMemo(() => mat('#ffffff', { rough: 0.85, flat: true }), [])
  const leafB = useMemo(() => mat('#ffffff', { rough: 0.85, flat: true }), [])
  const greens = useMemo(() => ['#3fae5a', '#52b455', '#2f9a4d', '#6cc15f', '#47a64f'], [])
  const greens2 = useMemo(() => ['#52b455', '#3fae5a', '#6cc15f', '#2f9a4d'], [])
  const trunkItems = useMemo(() => trees.map((p) => ({ p: [p[0], 1.1, p[2]] as V3, s: [0.2, 2.2, 0.2] as V3 })), [trees])
  const canopyA = useMemo(() => trees.map((p, i) => ({ p: [p[0], 3.1, p[2]] as V3, s: [1.5 + (i % 3) * 0.15, 1.5, 1.5 + (i % 3) * 0.15] as V3 })), [trees])
  const canopyB = useMemo(() => trees.map((p, i) => ({ p: [p[0] + 0.7, 2.6, p[2] + 0.3] as V3, s: [1, 1, 1] as V3, r: i })), [trees])

  return (
    <group>
      <Roads />
      <StreetFurniture />
      <Skyline />
      {extras.parapet.length > 0 && (
        <>
          <Instanced geometry={BOX} material={concreteLight} items={extras.parapet} cast />
          <Instanced geometry={BOX} material={roofDark} items={extras.roof} />
          <Instanced geometry={BOX} material={acM} items={extras.ac} cast />
          <Instanced geometry={CYL} material={tankM} items={extras.tank} cast />
          <Instanced geometry={BOX} material={shopM} items={extras.shop} />
          <Instanced geometry={BOX} material={awnM} items={extras.awning} colors={extras.awningColors} cast />
          <Instanced geometry={CYL} material={mastM} items={extras.mast} />
          <Instanced geometry={PYRAMID} material={tileM} items={extras.pyramid} colors={extras.pyramidColors} cast />
        </>
      )}
      {lots.map((l, i) => (
        <group key={i}>
          {l.blds.map((b, k) => (
            <group key={k}>
              <Facade b={b} tier={false} />
              {!b.house && b.h > 26 && <Facade b={b} tier />}
            </group>
          ))}
          {l.kind === 'houses' && (
            <Floor x0={l.x - l.w / 2 - 2} x1={l.x + l.w / 2 + 2} z0={l.z - l.d / 2 - 2} z1={l.z + l.d / 2 + 2} y={0.01} m={M.grass} />
          )}
          {(l.kind === 'park' || l.kind === 'plaza') && (
            <>
              <Floor x0={l.x - l.w / 2 - 2} x1={l.x + l.w / 2 + 2} z0={l.z - l.d / 2 - 2} z1={l.z + l.d / 2 + 2} y={0.01} m={l.kind === 'park' ? M.grass : M.sand} />
              {l.kind === 'plaza' && (
                <group position={[l.x, 0, l.z]}>
                  <mesh position={[0, 0.25, 0]} scale={[5, 0.5, 5]} geometry={CYL} material={mat('#b9c3cb')} />
                  <mesh position={[0, 0.52, 0]} scale={[4.4, 0.04, 4.4]} geometry={CYL} material={mat('#5cc4e0', { rough: 0.05, metal: 0.3 })} />
                </group>
              )}
              {l.kind === 'park' && (
                <>
                  <Floor x0={l.x - 1.2} x1={l.x + 1.2} z0={l.z - l.d / 2} z1={l.z + l.d / 2} y={0.02} c="#d9dee2" />
                  <Floor x0={l.x - l.w / 2} x1={l.x + l.w / 2} z0={l.z - 1.2} z1={l.z + 1.2} y={0.02} c="#d9dee2" />
                </>
              )}
            </>
          )}
        </group>
      ))}
      <Instanced geometry={CYL} material={trunk} items={trunkItems} cast />
      <Instanced geometry={ICO} material={leafA} items={canopyA} colors={greens} cast />
      <Instanced geometry={ICO} material={leafB} items={canopyB} colors={greens2} cast />
      <Traffic />
      <Walkers />
      <Waterfront />
    </group>
  )
}

/* ---------------- beach, sea, pier, boats, mountains ---------------- */
function Boat({ p, r = 0, c }: { p: V3; r?: number; c: string }) {
  return (
    <group position={p} rotation={[0, r, 0]}>
      <Box p={[0, 0.5, 0]} s={[3, 1, 9]} c="#f4f6f8" />
      <Box p={[0, 1.2, 1]} s={[2.4, 0.9, 3.6]} c={c} />
      <Box p={[0, 1.75, 1]} s={[2.7, 0.15, 4]} c="#0f8b8d" />
    </group>
  )
}

const sandZ0 = -192

function Waterfront() {
  const seaZ = GRID.seaZ
  const palmItems = useMemo(() => Array.from({ length: 14 }, (_, i) => ({ p: [-200 + i * 30, 1.4, sandZ0 - 8 - (i % 3) * 3] as V3, s: [0.18, 2.8, 0.18] as V3 })), [])
  const palmTops = useMemo(() => palmItems.map((p) => ({ p: [p.p[0], 3.1, p.p[2]] as V3, s: [1.3, 0.35, 1.3] as V3 })), [palmItems])
  return (
    <group>
      <Floor x0={-700} x1={700} z0={seaZ} z1={sandZ0} y={0.0} m={M.sand} />
      <Floor x0={-700} x1={700} z0={seaZ - 4} z1={seaZ + 1} y={0.02} c="#d9dee2" />
      <mesh position={[0, -0.3, -662]} rotation={[-Math.PI / 2, 0, 0]} scale={[2600, 880, 1]} geometry={PLANE} material={mat('#2fa6c4', { rough: 0.32, metal: 0.12 })} />
      {/* pier */}
      <Box p={[50, 0.6, seaZ - 26]} s={[4, 0.3, 64]} c="#e0ad6f" />
      {Array.from({ length: 13 }, (_, i) => (
        <Box key={i} p={[48.2, 0.2, seaZ + 6 - i * 5]} s={[0.3, 1.2, 0.3]} c="#6b4b2d" cast={false} />
      ))}
      <Boat p={[20, -0.2, seaZ - 40]} r={0.3} c="#ff6f59" />
      <Boat p={[80, -0.2, seaZ - 70]} r={-0.4} c="#1fa6a6" />
      <Boat p={[-60, -0.2, seaZ - 100]} r={1.2} c="#ffc233" />
      <Boat p={[130, -0.2, seaZ - 30]} r={0.1} c="#2f80d0" />
      {[[-120, '#ff6f59'], [-90, '#1fa6a6'], [-30, '#ffc233'], [20, '#ff6f59']].map(([x, c], i) => (
        <group key={i} position={[x as number, 0, sandZ0 - 14]}>
          <Box p={[0, 1.2, 0]} s={[0.15, 2.4, 0.15]} c="#6b4b2d" />
          <Box p={[0, 2.5, 0]} s={[5, 0.25, 5]} c={c as string} />
        </group>
      ))}
      <Instanced geometry={CYL} material={mat('#6b5a3a')} items={palmItems} cast />
      <Instanced geometry={SPH} material={mat('#2e9a52')} items={palmTops} cast />
      <Mountains />
    </group>
  )
}
