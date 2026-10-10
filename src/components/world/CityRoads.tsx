'use client'
import { useMemo } from 'react'
import type { V3 } from '@/lib/math'
import { GRID } from '@/lib/world'
import { useTheme } from '../Atmosphere'
import { asphaltTexture, paverTexture } from './facades'
import { BOX, Box, CYL, Instanced, PLANE, SPH, mat } from './primitives'

const { xs, zs, road: RW } = GRID
const XMIN = xs[0] - 4
const XMAX = xs[xs.length - 1] + 4
const ZMIN = zs[0] - 4
const ZMAX = zs[zs.length - 1] + 4
const HALF = RW / 2

/** Spans along a road between the crossings (so lane lines stop before each junction). */
function spans(min: number, max: number, crossings: number[], gap: number): [number, number][] {
  const out: [number, number][] = []
  let cur = min
  for (const c of [...crossings].sort((a, b) => a - b)) {
    if (c - gap > cur) out.push([cur, c - gap])
    cur = c + gap
  }
  if (cur < max) out.push([cur, max])
  return out
}

interface Item {
  p: V3
  s: V3
}

export function Roads() {
  const asphalt = useMemo(() => mat('#3b414a', { detail: 0.14, detailMap: asphaltTexture(), detailStrength: 0.75, rough: 0.92 }), [])
  const paver = useMemo(() => mat('#c3cad0', { detail: 0.21, detailMap: paverTexture(), detailStrength: 0.9, rough: 0.9 }), [])
  const yellow = useMemo(() => mat('#f0c33c', { rough: 0.8 }), [])
  const white = useMemo(() => mat('#eef1f2', { rough: 0.8 }), [])
  const curbM = useMemo(() => mat('#aeb6bd', { rough: 0.9 }), [])

  const { yel, edge, zebra, curbs, slabs } = useMemo(() => {
    const yel: Item[] = []
    const edge: Item[] = []
    const zebra: Item[] = []
    const curbs: Item[] = []
    const slabs: { x: number; z: number; w: number; d: number }[] = []
    const gap = HALF + 7.2
    // lane lines on E-W roads (constant z) and N-S roads (constant x)
    for (const z of zs) {
      for (const [a, b] of spans(XMIN, XMAX, xs, gap)) {
        const c = (a + b) / 2
        const L = b - a
        yel.push({ p: [c, 0.005, z - 0.16], s: [L, 0.02, 0.12] }, { p: [c, 0.005, z + 0.16], s: [L, 0.02, 0.12] })
        edge.push({ p: [c, 0.005, z - 3.7], s: [L, 0.02, 0.14] }, { p: [c, 0.005, z + 3.7], s: [L, 0.02, 0.14] })
      }
    }
    for (const x of xs) {
      for (const [a, b] of spans(ZMIN, ZMAX, zs, gap)) {
        const c = (a + b) / 2
        const L = b - a
        yel.push({ p: [x - 0.16, 0.005, c], s: [0.12, 0.02, L] }, { p: [x + 0.16, 0.005, c], s: [0.12, 0.02, L] })
        edge.push({ p: [x - 3.7, 0.005, c], s: [0.14, 0.02, L] }, { p: [x + 3.7, 0.005, c], s: [0.14, 0.02, L] })
      }
    }
    // zebra crossings on all four legs of every junction
    for (const ix of xs)
      for (const iz of zs) {
        const off = HALF + 2.4
        for (let i = 0; i < 8; i++) {
          const t = -3.5 + i
          zebra.push({ p: [ix + t, 0.006, iz - off], s: [0.5, 0.02, 2.6] }, { p: [ix + t, 0.006, iz + off], s: [0.5, 0.02, 2.6] })
          zebra.push({ p: [ix - off, 0.006, iz + t], s: [2.6, 0.02, 0.5] }, { p: [ix + off, 0.006, iz + t], s: [2.6, 0.02, 0.5] })
        }
      }
    // pavement slabs with raised kerbs
    for (let i = 0; i < xs.length - 1; i++)
      for (let j = 0; j < zs.length - 1; j++) {
        const x0 = xs[i] + HALF
        const x1 = xs[i + 1] - HALF
        const z0 = zs[j] + HALF
        const z1 = zs[j + 1] - HALF
        slabs.push({ x: (x0 + x1) / 2, z: (z0 + z1) / 2, w: x1 - x0, d: z1 - z0 })
        const k = 0.28
        curbs.push(
          { p: [(x0 + x1) / 2, 0.06, z0 + k / 2], s: [x1 - x0, 0.16, k] },
          { p: [(x0 + x1) / 2, 0.06, z1 - k / 2], s: [x1 - x0, 0.16, k] },
          { p: [x0 + k / 2, 0.06, (z0 + z1) / 2], s: [k, 0.16, z1 - z0] },
          { p: [x1 - k / 2, 0.06, (z0 + z1) / 2], s: [k, 0.16, z1 - z0] },
        )
      }
    return { yel, edge, zebra, curbs, slabs }
  }, [])

  return (
    <group>
      {xs.map((x) => (
        <Box key={`rx${x}`} p={[x, -0.03, (ZMIN + ZMAX) / 2]} s={[RW, 0.04, ZMAX - ZMIN]} m={asphalt} cast={false} />
      ))}
      {zs.map((z) => (
        <Box key={`rz${z}`} p={[(XMIN + XMAX) / 2, -0.03, z]} s={[XMAX - XMIN, 0.04, RW]} m={asphalt} cast={false} />
      ))}
      {slabs.map((b, i) => (
        <mesh key={i} position={[b.x, -0.05, b.z]} scale={[b.w, 0.1, b.d]} receiveShadow geometry={BOX} material={paver} />
      ))}
      <Instanced geometry={BOX} material={yellow} items={yel} />
      <Instanced geometry={BOX} material={white} items={edge} />
      <Instanced geometry={BOX} material={white} items={zebra} />
      <Instanced geometry={BOX} material={curbM} items={curbs} receive cast />
    </group>
  )
}

/** Lamps along every street plus traffic lights at every junction. */
export function StreetFurniture() {
  const t = useTheme()
  const { poles, heads, reds, greens, tlPoles, tlHeads } = useMemo(() => {
    const poles: Item[] = []
    const heads: Item[] = []
    const reds: Item[] = []
    const greens: Item[] = []
    const tlPoles: Item[] = []
    const tlHeads: Item[] = []
    const isJunction = (v: number, lines: number[]) => lines.some((l) => Math.abs(v - l) < HALF + 9)
    let n = 0
    for (const z of zs)
      for (let x = XMIN + 14; x < XMAX - 10; x += 26) {
        if (isJunction(x, xs)) continue
        const side = n++ % 2 ? 1 : -1
        const zz = z + side * (HALF + 0.9)
        poles.push({ p: [x, 2.7, zz], s: [0.09, 5.4, 0.09] })
        heads.push({ p: [x, 5.5, zz - side * 0.5], s: [0.9, 0.14, 0.34] })
      }
    for (const x of xs)
      for (let z = ZMIN + 14; z < ZMAX - 10; z += 26) {
        if (isJunction(z, zs)) continue
        const side = n++ % 2 ? 1 : -1
        const xx = x + side * (HALF + 0.9)
        poles.push({ p: [xx, 2.7, z], s: [0.09, 5.4, 0.09] })
        heads.push({ p: [xx - side * 0.5, 5.5, z], s: [0.34, 0.14, 0.9] })
      }
    let k = 0
    for (const ix of xs)
      for (const iz of zs) {
        for (const [sx, sz] of [[1, -1], [-1, 1]] as [number, number][]) {
          const px = ix + sx * (HALF + 1.1)
          const pz = iz + sz * (HALF + 1.1)
          tlPoles.push({ p: [px, 2.3, pz], s: [0.1, 4.6, 0.1] })
          tlHeads.push({ p: [px, 4.7, pz], s: [0.42, 1.1, 0.42] })
          const green = (k + (sx > 0 ? 0 : 1)) % 2 === 0
          const lamp: Item = { p: [px, green ? 4.4 : 5.0, pz - 0.0], s: [0.15, 0.15, 0.15] }
          // lamp sits on the face looking along the road
          lamp.p[2] += sz * 0.22
          ;(green ? greens : reds).push(lamp)
        }
        k++
      }
    return { poles, heads, reds, greens, tlPoles, tlHeads }
  }, [])

  const dark = useMemo(() => mat('#232a2f', { rough: 0.5, metal: 0.5 }), [])
  const bulb = mat('#fff2cf', { emissive: '#ffd98a', ei: t.lamp })
  const red = mat('#ff4a3a', { emissive: '#ff2a1a', ei: 1.5 + t.lamp * 0.4 })
  const green = mat('#45e07a', { emissive: '#22ff6a', ei: 1.5 + t.lamp * 0.4 })
  return (
    <group>
      <Instanced geometry={CYL} material={dark} items={poles} cast />
      <Instanced geometry={BOX} material={bulb} items={heads} />
      <Instanced geometry={CYL} material={dark} items={tlPoles} cast />
      <Instanced geometry={BOX} material={dark} items={tlHeads} cast />
      <Instanced geometry={SPH} material={red} items={reds} />
      <Instanced geometry={SPH} material={green} items={greens} />
    </group>
  )
}

export const GROUND_PLANE = PLANE
