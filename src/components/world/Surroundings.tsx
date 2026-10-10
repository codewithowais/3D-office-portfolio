'use client'
import { useMemo } from 'react'
import * as THREE from 'three'
import { ballAt, car, guard, jogger, players, TOUR_LEN, visitor } from '@/lib/actors'
import { player } from '@/lib/player'
import { clock } from '@/lib/clock'
import { C, BRAND } from '@/lib/world'
import type { V3 } from '@/lib/math'
import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import { Person } from './Person'
import { CAR_COLORS, MovingCar, ParkedCar } from './Car'
import { Ball, BOX, Box, Cyl, Floor, Instanced, Sign, SPH, mat } from './primitives'
import { M } from './materials'
import { netTexture } from './textures'

/* ------------ perimeter: cream plinth wall + green railings + gate ------------ */
function Railing({ a, b }: { a: [number, number]; b: [number, number] }) {
  const horiz = a[1] === b[1]
  const s0 = horiz ? Math.min(a[0], b[0]) : Math.min(a[1], b[1])
  const s1 = horiz ? Math.max(a[0], b[0]) : Math.max(a[1], b[1])
  const fixed = horiz ? a[1] : a[0]
  const L = s1 - s0
  const c = (s0 + s1) / 2
  const P = (v: number, y: number): V3 => (horiz ? [v, y, fixed] : [fixed, y, v])
  const S = (along: number, y: number, th: number): V3 => (horiz ? [along, y, th] : [th, y, along])
  const n = Math.floor(L / 1.1)
  return (
    <group>
      <Box p={P(c, 0.32)} s={S(L, 0.64, 0.4)} c={C.cream} />
      <Box p={P(c, 0.68)} s={S(L, 0.07, 0.5)} c="#b9c3cb" />
      <Box p={P(c, 1.05)} s={S(L, 0.06, 0.06)} c={C.greenDark} />
      <Box p={P(c, 1.55)} s={S(L, 0.06, 0.06)} c={C.greenDark} />
      {Array.from({ length: n + 1 }, (_, i) => (
        <Box key={i} p={P(s0 + (L * i) / n, 1.12)} s={S(0.05, 1.0, 0.05)} c={C.greenDark} cast={false} />
      ))}
    </group>
  )
}

function Pillar({ p }: { p: V3 }) {
  return (
    <group position={p}>
      <Box p={[0, 1.1, 0]} s={[0.7, 2.2, 0.7]} c="#b9c3cb" />
      <Box p={[0, 2.28, 0]} s={[0.85, 0.14, 0.85]} c="#aab4bc" />
    </group>
  )
}

function Gate() {
  const bars = Array.from({ length: 10 }, (_, i) => i)
  return (
    <group position={[0, 0, 18]}>
      <Pillar p={[-3.2, 0, 0]} />
      <Pillar p={[3.2, 0, 0]} />
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 4.6, 0, 0.5]}>
          <Box p={[0, 0.3, 0]} s={[2.9, 0.06, 0.08]} c={C.greenDark} />
          <Box p={[0, 1.55, 0]} s={[2.9, 0.07, 0.08]} c={C.greenDark} />
          {bars.map((i) => (
            <Box key={i} p={[-1.35 + i * 0.3, 0.95, 0]} s={[0.05, 1.3, 0.05]} c={C.greenDark} cast={false} />
          ))}
        </group>
      ))}
      <Box p={[0, 0.02, 0.1]} s={[6, 0.02, 2.5]} c="#b2bbc2" />
    </group>
  )
}

function Booth() {
  return (
    <group position={[-9, 0, 16]}>
      <Box p={[0, 1.3, 0]} s={[3, 2.6, 2.6]} c={C.cream} />
      <Box p={[0, 2.78, 0]} s={[3.9, 0.3, 3.5]} c={C.green} />
      <Box p={[0, 3.0, 0]} s={[3.3, 0.14, 2.9]} c={C.greenDark} />
      <Box p={[0, 1.55, 1.31]} s={[2.2, 1.0, 0.04]} m={mat('#7fb1c4', { opacity: 0.55, rough: 0.1 })} cast={false} />
      <Box p={[0, 1.04, 1.45]} s={[2.6, 0.08, 0.5]} c={C.wood} />
      <Box p={[-1.52, 1.1, 0]} s={[0.05, 2.1, 1]} c="#8a5a3a" cast={false} />
      <Sign p={[0, 2.35, 1.5]} w={1.7} h={0.42} text="SECURITY" />
      <Box p={[0.5, 0.03, 0]} s={[1.3, 0.04, 1.3]} c="#7fb1c4" cast={false} />
    </group>
  )
}

/* ------------ lawn, paths, shrubs ------------ */
function Garden() {
  const shrubs = useMemo(() => {
    const out: V3[] = []
    for (let x = -23; x <= 23; x += 1.6) if (Math.abs(x) > 4.2 && (x < -12.2 || x > -5)) out.push([x, 0.3, 17.2])
    for (let x = -23; x <= 23; x += 1.6) out.push([x, 0.3, -17.2])
    for (let z = -16; z <= 16; z += 1.6) out.push([-23.2, 0.3, z], [23.2, 0.3, z])
    return out
  }, [])
  const m = mat('#3f9e4d')
  const flowers = useMemo(() => shrubs.map((p, i) => ({ p: [p[0] + ((i * 7) % 5) * 0.12 - 0.25, 0.62 + (i % 3) * 0.04, p[2] + ((i * 3) % 4) * 0.1 - 0.15] as V3, s: [0.11, 0.11, 0.11] as V3 })), [shrubs])
  return (
    <group>
      <Floor x0={-24} x1={24} z0={-18} z1={18} y={0.008} m={M.grass} />
      <Floor x0={-1.7} x1={1.7} z0={14} z1={18.2} y={0.015} c="#c6ced4" />
      <Floor x0={-24} x1={24} z0={-18} z1={-16.5} y={0.012} m={M.grassDark} />
      {shrubs.map((p, i) => (
        <mesh key={i} position={p} scale={[0.62, 0.45 + (i % 3) * 0.05, 0.62]} castShadow geometry={SPH} material={m} />
      ))}
      <Instanced geometry={SPH} material={mat('#ffffff', { rough: 0.6 })} items={flowers} colors={['#ff6f59', '#ffc233', '#ff8fc0', '#ffffff', '#9b6fd1']} />
      <Tree p={[-21, 0, -13]} s={1.2} />
      <Tree p={[21.5, 0, -12]} s={1.1} />
      <Tree p={[-21.5, 0, 12]} s={1.1} />
      <Tree p={[22, 0, 11]} s={1.25} />
    </group>
  )
}

export function Tree({ p, s = 1 }: { p: V3; s?: number }) {
  return (
    <group position={p} scale={s}>
      <Cyl p={[0, 1.2, 0]} rad={0.2} h={2.4} c="#6b4b2d" />
      <Ball p={[0, 3.3, 0]} rad={1.5} sy={1.05} c="#3fae5a" />
      <Ball p={[0.9, 2.7, 0.3]} rad={1.0} c="#2f9a4d" />
      <Ball p={[-0.8, 2.9, -0.4]} rad={1.0} c="#5cb85f" />
    </group>
  )
}

/* ------------ football pitch ------------ */
function Goal({ p, r }: { p: V3; r: number }) {
  const net = useMemo(() => {
    const t = netTexture().clone()
    t.needsUpdate = true
    t.repeat.set(5, 2)
    return mat('#ffffff', { map: t, opacity: 0.8, side: THREE.DoubleSide })
  }, [])
  return (
    <group position={p} rotation={[0, r, 0]}>
      <Box p={[-2, 1.1, 0]} s={[0.1, 2.2, 0.1]} c="#232a27" />
      <Box p={[2, 1.1, 0]} s={[0.1, 2.2, 0.1]} c="#232a27" />
      <Box p={[0, 2.2, 0]} s={[4.1, 0.1, 0.1]} c="#232a27" />
      <mesh position={[0, 1.1, -0.9]} scale={[4, 2.2, 1]} geometry={BOX} material={net} />
    </group>
  )
}

function Ring({ p, r, w = 0.12 }: { p: V3; r: number; w?: number }) {
  return (
    <mesh position={p} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <ringGeometry args={[r - w, r, 48]} />
      <meshStandardMaterial color="#ffffff" />
    </mesh>
  )
}

function Pitch() {
  const line = mat('#ffffff')
  const ball = useRef<THREE.Mesh>(null)
  const tmp = useMemo<V3>(() => [0, 0, 0], [])
  useFrame(() => {
    ballAt(clock.t, tmp)
    ball.current?.position.set(tmp[0], tmp[1], tmp[2])
  })
  const cx = -41
  const L = (x0: number, x1: number, z0: number, z1: number) => <Floor x0={x0} x1={x1} z0={z0} z1={z1} y={0.03} m={line} />
  const kits = ['#2a62d6', '#2a62d6', '#2a62d6', '#ff6f59', '#ff6f59', '#ff6f59']
  return (
    <group>
      <Floor x0={-53} x1={-29} z0={-14.5} z1={14.5} y={0.01} m={M.sidewalk} />
      {Array.from({ length: 11 }, (_, i) => (
        <Floor key={i} x0={-52 + i * 2} x1={-50 + i * 2} z0={-13.5} z1={13.5} y={0.02} m={i % 2 ? M.pitchB : M.pitchA} />
      ))}
      {L(-52, -30, -13.5, -13.38)}
      {L(-52, -30, 13.38, 13.5)}
      {L(-52, -51.88, -13.5, 13.5)}
      {L(-30.12, -30, -13.5, 13.5)}
      {L(cx - 0.06, cx + 0.06, -13.5, 13.5)}
      <Ring p={[cx, 0.035, 0]} r={3.2} />
      {L(-52, -47, -5, -4.88)}
      {L(-52, -47, 4.88, 5)}
      {L(-47.12, -47, -5, 5)}
      {L(-35, -30, -5, -4.88)}
      {L(-35, -30, 4.88, 5)}
      {L(-35.12, -35, -5, 5)}
      <Goal p={[-52, 0, 0]} r={Math.PI / 2} />
      <Goal p={[-30, 0, 0]} r={-Math.PI / 2} />
      <mesh ref={ball} scale={0.22} castShadow geometry={SPH} material={mat('#ffffff')} />
      {players.map((pl, i) => (
        <Person key={i} sample={pl.sample} shirt={kits[i]} pants="#f4f6f8" skin={['#e0b08c', '#8d5a3b', '#c68e69'][i % 3]} hair="#1c1714" />
      ))}
      {/* benches + trees */}
      <Box p={[-41, 0.25, -15.6]} s={[3, 0.1, 0.5]} c="#e0ad6f" />
      <Box p={[-41, 0.12, -15.6]} s={[2.8, 0.24, 0.1]} c="#232a27" />
      <Tree p={[-54.5, 0, -12]} s={1.1} />
      <Tree p={[-54.5, 0, 9]} s={1} />
      <Tree p={[-27, 0, 12]} s={1.15} />
    </group>
  )
}

/* ------------ parking lot ------------ */
function Parking() {
  const slotsA = Array.from({ length: 14 }, (_, i) => -18.5 + i * 2.7)
  const taken = new Set([0, 2, 3, 5, 6, 8, 11, 12])
  const takenB = new Set([1, 2, 4, 7, 8, 9, 12])
  const lines = mat('#ffffff')
  return (
    <group>
      <Floor x0={28} x1={53} z0={-21} z1={21} y={0.012} m={M.asphalt} />
      <Floor x0={38} x1={44} z0={21} z1={24} y={0.012} m={M.asphalt} />
      {slotsA.map((z, i) => (
        <group key={i}>
          <Floor x0={31} x1={37} z0={z - 1.35} z1={z - 1.27} y={0.03} m={lines} />
          <Floor x0={45} x1={51} z0={z - 1.35} z1={z - 1.27} y={0.03} m={lines} />
          {i !== 12 && taken.has(i) && i !== 0 && <ParkedCar p={[34, 0.02, z]} r={Math.PI / 2} color={CAR_COLORS[(i * 3) % 7]} />}
          {takenB.has(i) && <ParkedCar p={[48, 0.02, z]} r={-Math.PI / 2} color={CAR_COLORS[(i * 5 + 2) % 7]} />}
        </group>
      ))}
      <Floor x0={31} x1={31.12} z0={-20} z1={19.5} y={0.03} m={lines} />
      <Floor x0={50.88} x1={51} z0={-20} z1={19.5} y={0.03} m={lines} />
      {/* dashed aisle centre */}
      {Array.from({ length: 12 }, (_, i) => (
        <Floor key={i} x0={40.94} x1={41.06} z0={-19 + i * 3.6} z1={-17.4 + i * 3.6} y={0.03} m={lines} />
      ))}
      <Tree p={[29.5, 0, -19]} s={1} />
      <Tree p={[52.5, 0, 19.5]} s={1} />
    </group>
  )
}

/** The person you control in walk mode, with a ring on the ground so you can find yourself in a crowd. */
function PlayerAvatar() {
  const ring = useRef<THREE.Mesh>(null)
  const sample = useMemo(() => () => player, [])
  useFrame(() => {
    const r = ring.current
    if (!r) return
    r.visible = player.visible
    r.position.set(player.x, 0.06, player.z)
    r.scale.setScalar(1 + Math.sin(clock.t * 4) * 0.06)
  })
  return (
    <>
      <Person sample={sample} shirt="#ff6f59" pants="#14324b" skin="#d9a77f" hair="#2a1d14" />
      <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
        <ringGeometry args={[0.62, 0.78, 40]} />
        <meshBasicMaterial color="#17e0d6" transparent opacity={0.9} depthWrite={false} toneMapped={false} />
      </mesh>
    </>
  )
}

export function Surroundings() {
  const guardSample = useMemo(() => (t: number) => guard.sample(t), [])
  const visitorSample = useMemo(() => (t: number) => visitor.sample(t), [])
  const carSample = useMemo(() => (t: number) => car.sample(t), [])
  return (
    <group>
      <Garden />
      <Railing a={[-24, 18]} b={[-3.6, 18]} />
      <Railing a={[3.6, 18]} b={[24, 18]} />
      <Railing a={[-24, -18]} b={[24, -18]} />
      <Railing a={[-24, -18]} b={[-24, 18]} />
      <Railing a={[24, -18]} b={[24, 18]} />
      <Gate />
      <Booth />
      <Sign p={[11, 1.9, 18.32]} w={4.2} h={0.9} text={BRAND.site} />
      <Person sample={guardSample} loop={TOUR_LEN} shirt="#14324b" pants="#1f2429" skin="#c68e69" hair="#151515" />
      <Person sample={visitorSample} loop={TOUR_LEN} shirt="#2f9bff" pants="#26324a" skin="#d9a77f" hair="#2a1d14" />
      <MovingCar sample={carSample} loop={TOUR_LEN} color="#0e8f93" />
      <PlayerAvatar />
      <Person sample={jogger.sample} shirt="#ff6f59" pants="#1f2429" skin="#c68e69" hair="#151515" />
      <Pitch />
      <Parking />
    </group>
  )
}
