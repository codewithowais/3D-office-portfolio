'use client'
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { clock } from '@/lib/clock'
import { boss, receptionist } from '@/lib/actors'
import { TOUR_LEN, doorAngle } from '@/lib/tour'
import { BRAND, C, WALLS } from '@/lib/world'
import { useTheme } from '../Atmosphere'
import { Person } from './Person'
import { Art, Chair, Corkboard, Monitor, Plant, Shelf, Sitter, Sofa, Workstation } from './Furniture'
import { Box, Cyl, Floor, RBox, Sign, mat } from './primitives'
import { plankTexture } from './textures'

interface Gap {
  at: number
  w: number
}

/** Axis-aligned wall with door/opening gaps. `glass` = low wall + glass pane + dark frame. */
function Wall({ a, b, kind = 'solid', gaps = [], h = 3, t = 0.4 }: { a: [number, number]; b: [number, number]; kind?: 'solid' | 'glass'; gaps?: Gap[]; h?: number; t?: number }) {
  const horiz = a[1] === b[1]
  const s0 = horiz ? Math.min(a[0], b[0]) : Math.min(a[1], b[1])
  const s1 = horiz ? Math.max(a[0], b[0]) : Math.max(a[1], b[1])
  const fixed = horiz ? a[1] : a[0]
  const spans: [number, number][] = []
  let cur = s0
  for (const g of [...gaps].sort((p, q) => p.at - q.at)) {
    if (g.at - g.w / 2 > cur) spans.push([cur, g.at - g.w / 2])
    cur = g.at + g.w / 2
  }
  if (cur < s1) spans.push([cur, s1])

  return (
    <>
      {spans.map(([p, q], i) => {
        const L = q - p
        const c = (p + q) / 2
        const at = (y: number): [number, number, number] => (horiz ? [c, y, fixed] : [fixed, y, c])
        const size = (along: number, y: number, thick: number): [number, number, number] => (horiz ? [along, y, thick] : [thick, y, along])
        if (kind === 'solid') {
          return (
            <group key={i}>
              <Box p={at(h / 2)} s={size(L, h, t)} c={C.cream} />
              <Box p={at(h + 0.06)} s={size(L + 0.02, 0.12, t + 0.14)} c={C.wood} />
            </group>
          )
        }
        const n = Math.max(1, Math.round(L / 3.2))
        return (
          <group key={i}>
            <Box p={at(0.45)} s={size(L, 0.9, 0.22)} c={C.cream} />
            <Box p={at(1.65)} s={size(L, 1.5, 0.04)} m={mat(C.glass, { opacity: 0.22, rough: 0.1 })} cast={false} />
            <Box p={at(2.43)} s={size(L, 0.07, 0.09)} c={C.ink} />
            {Array.from({ length: n + 1 }, (_, k) => {
              const off = -L / 2 + (L * k) / n
              const pp: [number, number, number] = horiz ? [c + off, 1.65, fixed] : [fixed, 1.65, c + off]
              return <Box key={k} p={pp} s={[0.07, 1.5, 0.07]} c={C.ink} />
            })}
          </group>
        )
      })}
    </>
  )
}

function useFloor(w: number, d: number, base: string) {
  return useMemo(() => {
    const t = plankTexture(base).clone()
    t.needsUpdate = true
    t.repeat.set(w / 3.2, d / 3.2)
    return mat('#ffffff', { map: t, rough: 0.7 })
  }, [w, d, base])
}

function RoomFloor({ x0, x1, z0, z1, base }: { x0: number; x1: number; z0: number; z1: number; base: string }) {
  const m = useFloor(x1 - x0, z1 - z0, base)
  return <Floor x0={x0} x1={x1} z0={z0} z1={z1} y={0.02} m={m} />
}

function BossDoor() {
  const leaf = useRef<THREE.Group>(null)
  useFrame(() => {
    if (leaf.current) leaf.current.rotation.y = doorAngle(clock.t % TOUR_LEN)
  })
  return (
    <group>
      <group ref={leaf} position={[3, 0, -9.9]}>
        <Box p={[0, 1.15, 0.89]} s={[0.07, 2.3, 1.76]} c="#a9703f" />
        <Box p={[0.05, 1.1, 1.5]} s={[0.04, 0.05, 0.12]} c="#e8d8a8" cast={false} />
      </group>
      <Box p={[3, 2.65, -9]} s={[0.4, 0.7, 1.9]} c={C.cream} />
      <Sign p={[2.78, 2.62, -9]} r={-Math.PI / 2} w={1.5} h={0.42} text="BOSS CABIN" />
    </group>
  )
}

function Reception() {
  const slats = Array.from({ length: 16 }, (_, i) => -10.9 + i * 0.38)
  return (
    <group>
      <RoomFloor x0={-20} x1={-3} z0={4} z1={14} base="#eee0c6" />
      <Floor x0={-12} x1={-4} z0={5.4} z1={12.4} y={0.03} c="#dde3e8" />
      {/* counter */}
      <RBox p={[-8, 0.5, 9.2]} s={[7, 1.0, 0.3]} c="#eef1f4" />
      {slats.map((x, i) => (
        <RBox key={i} p={[x - 0.1, 0.5, 9.42]} s={[0.17, 0.98, 0.07]} c="#e6b980" />
      ))}
      <RBox p={[-8, 1.05, 8.55]} s={[7.3, 0.08, 1.7]} c="#e6b980" />
      <RBox p={[-8, 0.5, 7.9]} s={[7, 1.0, 0.1]} c="#d3c3a0" />
      <Sign p={[-8, 0.62, 9.5]} w={2.2} h={0.55} text="RECEPTION" />
      <RBox p={[-9.2, 1.12, 8.3]} s={[0.7, 0.02, 0.5]} c="#0f8b8d" />
      <Cyl p={[-5.6, 1.28, 8.5]} rad={0.07} h={0.4} c="#f4f6f8" />
      <group position={[-7.2, 1.09, 8.3]}>
        <RBox p={[0, 0.02, 0]} s={[0.22, 0.03, 0.16]} c="#1d2321" />
        <RBox p={[0, 0.3, 0]} s={[0.62, 0.38, 0.035]} c="#1d2321" />
      </group>
      <Chair p={[-8, 0, 6.8]} c="#2a5d9f" />
      <Chair p={[-15.5, 0, 11.2]} r={Math.PI / 2} c="#ee9a5a" />
      <Chair p={[-15.5, 0, 12.8]} r={Math.PI / 2} c="#ee9a5a" />
      <RBox p={[-16.7, 0.35, 12]} s={[0.6, 0.7, 0.7]} c="#e6b980" />
      <Plant p={[-18.4, 0.02, 12.6]} s={1.4} palm />
      <Plant p={[-4.2, 0.02, 12.8]} s={1.3} palm />
      <Plant p={[-18.4, 0.02, 5.6]} s={1} />
      <Art p={[-19.75, 2, 9]} r={Math.PI / 2} w={1.8} h={1.2} />
      <Art p={[-12, 2.1, 4.1]} w={1.6} h={1.1} />
    </group>
  )
}

function Studio() {
  const xs = [-17.4, -13.6, -9.8, -6]
  return (
    <group>
      <RoomFloor x0={-20} x1={-3} z0={-4} z1={4} base="#ebdcbf" />
      {xs.map((x, k) => (
        <group key={k}>
          <Workstation p={[x, 0.02, -0.45]} who={k * 2 + 1} seed={k} />
          <Workstation p={[x, 0.02, 0.45]} r={Math.PI} who={k % 3 === 2 ? undefined : k * 2 + 2} seed={k + 4} />
        </group>
      ))}
      <Corkboard p={[-19.75, 1.9, 0]} r={Math.PI / 2} w={3} />
      <Plant p={[-18.5, 0.02, 3]} s={1.1} />
      <Plant p={[-3.9, 0.02, -3]} s={0.9} />
    </group>
  )
}

function Operations() {
  const xs = [-17, -12.6, -8.2]
  const rows = [-11.6, -7]
  return (
    <group>
      <RoomFloor x0={-20} x1={-3} z0={-14} z1={-4} base="#e6d3ae" />
      {rows.map((z, j) =>
        xs.map((x, k) => (
          <group key={`${j}-${k}`}>
            <Workstation p={[x, 0.02, z - 0.45]} who={10 + j * 6 + k * 2} seed={j + k} wide />
            <Workstation p={[x, 0.02, z + 0.45]} r={Math.PI} who={(j + k) % 2 ? undefined : 11 + j * 6 + k * 2} seed={j * 3 + k} wide />
          </group>
        )),
      )}
      <Corkboard p={[-12, 1.9, -13.75]} w={3.2} h={1.4} />
      <Art p={[-6.2, 2, -13.75]} />
      <Art p={[-17.8, 2, -13.75]} />
      <Plant p={[-4.2, 0.02, -13]} s={1.2} palm />
      <Shelf p={[-19.6, 0.02, -9]} r={Math.PI / 2} w={3} h={1.8} />
    </group>
  )
}

function Design() {
  return (
    <group>
      <RoomFloor x0={3} x1={20} z0={-4} z1={4} base="#f0e2c8" />
      {[7, 11, 15].map((x, k) => (
        <Workstation key={k} p={[x, 0.02, -2.6]} r={0} who={20 + k} seed={k + 2} wide />
      ))}
      <Workstation p={[18.2, 0.02, 2.4]} r={Math.PI} who={25} seed={9} />
      {/* easel */}
      <group position={[10, 0, 2]} rotation={[0, 0.4, 0]}>
        <RBox p={[0, 0.9, 0]} s={[0.04, 1.8, 0.04]} c="#8a5a3a" />
        <RBox p={[0, 1.25, 0.05]} s={[0.9, 0.7, 0.04]} c="#f7f9fb" />
        <RBox p={[-0.15, 1.3, 0.08]} s={[0.4, 0.4, 0.02]} c="#0f8b8d" cast={false} />
        <RBox p={[0.2, 1.2, 0.08]} s={[0.3, 0.3, 0.02]} c="#ff6f59" cast={false} />
      </group>
      <Corkboard p={[19.75, 1.9, 0]} r={-Math.PI / 2} w={4.5} h={1.5} />
      <Art p={[8, 2, 3.8]} r={Math.PI} w={1.8} h={1.2} />
      <Art p={[13, 2, 3.8]} r={Math.PI} w={1.8} h={1.2} />
      <Plant p={[4.2, 0.02, 3]} s={1.1} />
    </group>
  )
}

function Meeting() {
  const seats = [4.9, 7.5, 10.1]
  return (
    <group>
      <RoomFloor x0={3} x1={12} z0={4} z1={14} base="#e8d6b4" />
      <RBox p={[7.5, 0.75, 9]} s={[5.6, 0.08, 1.6]} c="#8a5a3a" />
      <RBox p={[7.5, 0.37, 9]} s={[0.5, 0.74, 0.5]} c="#3a2a1e" />
      {seats.map((x, i) => (
        <group key={i}>
          <Chair p={[x, 0, 7.55]} r={0} c="#2a5d9f" />
          <Chair p={[x, 0, 10.45]} r={Math.PI} c="#2a5d9f" />
          <Sitter p={[x, 0, 7.55]} i={30 + i} pose="sit" />
          {i !== 1 && <Sitter p={[x, 0, 10.45]} r={Math.PI} i={34 + i} pose="sit" />}
        </group>
      ))}
      <Chair p={[4.2, 0, 9]} r={Math.PI / 2} c="#2a5d9f" />
      {/* screen */}
      <RBox p={[7.5, 1.9, 4.45]} s={[3.2, 1.8, 0.1]} c="#1d2321" />
      <RBox p={[7.5, 1.9, 4.51]} s={[3.0, 1.6, 0.02]} m={mat('#0f8b8d', { emissive: '#2fb5b0', ei: 0.4 })} cast={false} />
      <RBox p={[7.5, 0.5, 4.45]} s={[0.1, 1, 0.1]} c="#1d2321" />
      <Plant p={[11, 0.02, 5]} s={1.1} />
      <Plant p={[4.2, 0.02, 13]} s={1.1} />
    </group>
  )
}

function Lounge() {
  return (
    <group>
      <RoomFloor x0={12} x1={20} z0={4} z1={14} base="#e6d3ae" />
      <RBox p={[16, 0.03, 9]} s={[5.6, 0.03, 4.6]} c="#ffc2a8" receive />
      <Sofa p={[16, 0.02, 12.9]} r={Math.PI} len={3.2} />
      <Sofa p={[19, 0.02, 8.6]} r={-Math.PI / 2} len={2.4} c="#5aa9d6" />
      <Cyl p={[15.8, 0.3, 9.2]} rad={0.7} h={0.12} c="#e6b980" />
      <Cyl p={[15.8, 0.15, 9.2]} rad={0.1} h={0.3} c="#3a2a1e" />
      <Sitter p={[15.2, 0.02, 12.7]} r={Math.PI} i={44} pose="sit" />
      <Sitter p={[18.6, 0.02, 8.3]} r={-Math.PI / 2} i={46} pose="sit" />
      <Plant p={[13.2, 0.02, 5]} s={1.3} palm />
      <Plant p={[19, 0.02, 5]} s={1.1} />
      <Plant p={[19, 0.02, 13]} s={1} />
      <Shelf p={[19.6, 0.02, 11.5]} r={-Math.PI / 2} w={2.4} h={1.6} />
      <Art p={[16, 2.1, 4.1]} w={2} h={1.2} />
    </group>
  )
}

function BossCabin() {
  return (
    <group>
      <RoomFloor x0={3} x1={20} z0={-14} z1={-4} base="#c8a273" />
      <RBox p={[11.5, 0.03, -9]} s={[7, 0.03, 4.8]} c="#bfe3e6" />
      <RBox p={[15.8, 0.76, -9]} s={[1.2, 0.09, 3.2]} c="#7a4a2e" />
      <RBox p={[15.8, 0.38, -7.6]} s={[1.1, 0.74, 0.2]} c="#5a3822" />
      <RBox p={[15.8, 0.38, -10.4]} s={[1.1, 0.74, 0.2]} c="#5a3822" />
      <Monitor p={[15.8, 0.8, -9.5]} r={Math.PI / 2} seed={3} wide />
      <RBox p={[15.8, 0.81, -8.5]} s={[0.4, 0.015, 0.3]} c="#f4f6f8" />
      <Chair p={[17.1, 0, -9]} r={-Math.PI / 2} c="#3a2a1e" />
      <Chair p={[12.6, 0, -9]} r={Math.PI / 2} c="#17a2a4" />
      <Chair p={[12.6, 0, -7.4]} r={Math.PI / 2} c="#17a2a4" />
      <Sofa p={[8, 0.02, -13.1]} r={0} len={3} c="#6f5238" />
      <RBox p={[10.4, 0.3, -13.2]} s={[0.7, 0.6, 0.7]} c="#e6b980" />
      <Shelf p={[19.6, 0.02, -9]} r={-Math.PI / 2} w={4.2} h={2.4} />
      <Art p={[3.25, 2.1, -6]} r={Math.PI / 2} w={1.6} h={1.1} />
      <Plant p={[4.3, 0.02, -13]} s={1.4} palm />
      <Plant p={[19, 0.02, -4.9]} s={1.2} />
    </group>
  )
}

const INTERIOR_LIGHTS: [number, number, number][] = [
  [-11, 2.7, 9], [-11, 2.7, 0], [-11, 2.7, -9], [0, 2.7, 6], [0, 2.7, -6], [7.5, 2.7, 9], [16, 2.7, 9], [11, 2.7, 0], [11, 2.7, -9],
]

export function Office() {
  const theme = useTheme()
  const corridor = useFloor(6, 28, '#dfe3e6')
  const reception = useMemo(() => (t: number) => receptionist.sample(t), [])
  const bossS = useMemo(() => (t: number) => boss.sample(t), [])
  return (
    <group>
      {theme.interior > 0 && INTERIOR_LIGHTS.map((p, i) => <pointLight key={i} position={p} intensity={theme.interior * 70} distance={17} decay={2} color="#ffe3b8" />)}
      {/* slab + corridor */}
      <Box p={[0, -0.05, 0]} s={[41, 0.08, 29]} c="#c6ced4" receive />
      <Floor x0={-3} x1={3} z0={-14} z1={14} y={0.02} m={corridor} />
      <Floor x0={-1.6} x1={1.6} z0={11} z1={14.4} y={0.03} c="#17a2a4" />

      <Reception />
      <Studio />
      <Operations />
      <Design />
      <Meeting />
      <Lounge />
      <BossCabin />

      {WALLS.map((w, i) => (
        <Wall key={i} a={w.a} b={w.b} kind={w.kind} gaps={w.gaps} t={w.t} />
      ))}
      <Box p={[0, 2.72, 14]} s={[40.2, 0.62, 0.4]} c={C.cream} />
      <Box p={[0, 3.06, 14]} s={[40.4, 0.12, 0.54]} c={C.wood} />
      <Sign p={[-9, 2.72, 14.24]} w={4.4} h={0.44} text={BRAND.site} />
      <Sign p={[0, 2.72, 14.24]} w={2.6} h={0.44} text={BRAND.name} bg="#0f8b8d" />

      {/* corridor partitions */}
      {/* room dividers */}
      <BossDoor />

      {/* people with their own scripts */}
      <Person sample={reception} loop={TOUR_LEN} {...{ shirt: '#26302c', pants: '#1c1f1e', skin: '#e0b08c', hair: '#1c1714' }} />
      <Person sample={bossS} {...{ shirt: '#3a3f45', pants: '#23262a', skin: '#c68e69', hair: '#2a2a2a' }} scale={1.03} />
    </group>
  )
}

