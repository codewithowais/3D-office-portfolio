'use client'
import { useMemo } from 'react'
import type { Pose, Sample } from '@/lib/actor'
import type { V3 } from '@/lib/math'
import { Person, look } from './Person'
import { BOX, Ball, Cyl, PLANE, RBox as Box, mat } from './primitives'
import { screenTexture } from './textures'

export const SHIRTS = ['#2f80d0', '#ee9a5a', '#4cc2a0', '#e8584a', '#f5efe0', '#3c5a9a', '#9b6fd1', '#ffc233']
export const PANTS = ['#2b2f33', '#3a3f45', '#4a4036', '#222426', '#59616b']

/** A seated, motionless person. Coordinates are local to the parent group. */
export function Sitter({ p, r = 0, i, pose = 'type' }: { p: V3; r?: number; i: number; pose?: Pose }) {
  const sample = useMemo(() => {
    const s: Sample = { x: p[0], y: p[1], z: p[2], heading: r, speed: 0, pose, visible: true }
    return () => s
  }, [p, r, pose])
  return <Person still sample={sample} {...look(i, SHIRTS, PANTS)} scale={0.96 + ((i * 7) % 5) * 0.018} />
}

export function Chair({ p, r = 0, c = '#17a2a4' }: { p: V3; r?: number; c?: string }) {
  return (
    <group position={p} rotation={[0, r, 0]}>
      <Box p={[0, 0.5, 0]} s={[0.5, 0.07, 0.5]} c={c} />
      <Box p={[0, 0.82, -0.26]} s={[0.5, 0.5, 0.06]} c={c} />
      <Cyl p={[0, 0.25, 0]} rad={0.03} h={0.45} c="#262a28" />
      <Box p={[0, 0.04, 0]} s={[0.56, 0.04, 0.08]} c="#262a28" />
      <Box p={[0, 0.04, 0]} s={[0.08, 0.04, 0.56]} c="#262a28" />
    </group>
  )
}

export function Monitor({ p, r = 0, seed = 0, wide = false }: { p: V3; r?: number; seed?: number; wide?: boolean }) {
  const tex = screenTexture(seed)
  const w = wide ? 0.9 : 0.6
  return (
    <group position={p} rotation={[0, r, 0]}>
      <Box p={[0, 0.02, 0]} s={[0.22, 0.03, 0.16]} c="#1d2321" />
      <Box p={[0, 0.14, 0]} s={[0.05, 0.25, 0.04]} c="#1d2321" />
      <Box p={[0, 0.33, 0]} s={[w, 0.36, 0.035]} c="#1d2321" />
      <mesh position={[0, 0.33, 0.02]} scale={[w - 0.04, 0.32, 1]} geometry={PLANE} material={mat('#ffffff', { map: tex, emissive: '#26b8a8', ei: 0.35 })} />
    </group>
  )
}

/** Wooden desk. Seat side is local -z; the monitor faces it. */
export function Workstation({ p, r = 0, who, seed = 0, wide = false }: { p: V3; r?: number; who?: number; seed?: number; wide?: boolean }) {
  return (
    <group position={p} rotation={[0, r, 0]}>
      <Box p={[0, 0.75, 0]} s={[1.6, 0.06, 0.8]} c="#e6b980" />
      {([[-0.72, -0.34], [0.72, -0.34], [-0.72, 0.34], [0.72, 0.34]] as [number, number][]).map(([x, z], i) => (
        <Box key={i} p={[x, 0.36, z]} s={[0.05, 0.72, 0.05]} c="#2a2f2c" />
      ))}
      <Box p={[0, 0.5, 0.36]} s={[1.5, 0.4, 0.03]} c="#2a2f2c" />
      <Monitor p={[0, 0.78, 0.12]} r={Math.PI} seed={seed} wide={wide} />
      <Cyl p={[0.6, 0.83, -0.1]} rad={0.04} h={0.1} c="#ff6f59" />
      <Box p={[-0.5, 0.79, -0.15]} s={[0.3, 0.015, 0.22]} c="#f4f6f8" />
      <Chair p={[0, 0, -0.95]} />
      {who !== undefined && <Sitter p={[0, 0, -0.95]} i={who} />}
    </group>
  )
}

export function Plant({ p, s = 1, palm = false }: { p: V3; s?: number; palm?: boolean }) {
  const leaf = mat('#2e9a52')
  const leaf2 = mat('#1f7a3d')
  return (
    <group position={p} scale={s}>
      <Cyl p={[0, 0.25, 0]} rad={0.3} h={0.5} c="#eef1f4" />
      {palm ? (
        <>
          <Cyl p={[0, 1, 0]} rad={0.05} h={1.4} c="#6b5a3a" />
          {Array.from({ length: 8 }, (_, k) => (
            <group key={k} position={[0, 1.7, 0]} rotation={[0, (k * Math.PI * 2) / 8, 0]}>
              <mesh position={[0, -0.12, 0.55]} rotation={[0.55, 0, 0]} scale={[0.22, 0.03, 1.2]} castShadow geometry={BOX} material={k % 2 ? leaf : leaf2} />
            </group>
          ))}
        </>
      ) : (
        <>
          <Ball p={[0, 0.95, 0]} rad={0.46} sy={1.1} m={leaf} />
          <Ball p={[0.26, 0.75, 0.14]} rad={0.32} m={leaf2} />
          <Ball p={[-0.25, 0.72, -0.1]} rad={0.32} m={leaf2} />
          <Ball p={[0.05, 1.28, -0.08]} rad={0.3} m={leaf} />
        </>
      )}
    </group>
  )
}

export function Sofa({ p, r = 0, len = 2.2, c = '#17a2a4' }: { p: V3; r?: number; len?: number; c?: string }) {
  return (
    <group position={p} rotation={[0, r, 0]}>
      <Box p={[0, 0.2, 0]} s={[len, 0.4, 0.9]} c={c} />
      <Box p={[0, 0.5, 0.05]} s={[len - 0.4, 0.18, 0.78]} c="#2bbcbc" />
      <Box p={[0, 0.78, -0.37]} s={[len, 0.58, 0.18]} c={c} />
      <Box p={[-len / 2 + 0.1, 0.5, 0]} s={[0.2, 0.5, 0.9]} c={c} />
      <Box p={[len / 2 - 0.1, 0.5, 0]} s={[0.2, 0.5, 0.9]} c={c} />
    </group>
  )
}

export function Art({ p, r = 0, w = 1.4, h = 1 }: { p: V3; r?: number; w?: number; h?: number }) {
  return (
    <group position={p} rotation={[0, r, 0]}>
      <Box p={[0, 0, 0]} s={[w, h, 0.06]} c="#f7f9fb" />
      <Box p={[-w * 0.12, h * 0.05, 0.04]} s={[w * 0.5, h * 0.55, 0.02]} c="#0f8b8d" cast={false} />
      <Box p={[w * 0.12, -h * 0.12, 0.05]} s={[w * 0.45, h * 0.3, 0.02]} c="#ff6f59" cast={false} />
    </group>
  )
}

export function Corkboard({ p, r = 0, w = 2.2, h = 1.3 }: { p: V3; r?: number; w?: number; h?: number }) {
  const cards = ['#ffd866', '#f7f9fb', '#ffb59c', '#f7f9fb', '#ffd866', '#cfeef0']
  return (
    <group position={p} rotation={[0, r, 0]}>
      <Box p={[0, 0, 0]} s={[w, h, 0.06]} c="#d19a5c" />
      {cards.map((c, i) => (
        <Box key={i} p={[-w * 0.33 + (i % 3) * w * 0.33, h * 0.18 - Math.floor(i / 3) * h * 0.38, 0.05]} s={[0.36, 0.3, 0.02]} c={c} cast={false} />
      ))}
    </group>
  )
}

export function Shelf({ p, r = 0, w = 2.4, h = 2.2 }: { p: V3; r?: number; w?: number; h?: number }) {
  const cols = ['#ff6f59', '#0f8b8d', '#ffc233', '#1fa6a6', '#f4f6f8', '#7a4a3a']
  return (
    <group position={p} rotation={[0, r, 0]}>
      <Box p={[0, h / 2, 0]} s={[w, h, 0.4]} c="#8a5a3a" />
      {[0.45, 0.95, 1.45, 1.95].map((y, row) =>
        Array.from({ length: 9 }, (_, i) => (
          <Box key={`${row}-${i}`} p={[-w / 2 + 0.25 + i * ((w - 0.5) / 8), y, 0.18]} s={[0.1, 0.34, 0.12]} c={cols[(i + row * 2) % cols.length]} cast={false} />
        )),
      )}
    </group>
  )
}
