'use client'
import { useMemo } from 'react'
import * as THREE from 'three'
import { rng, smooth } from '@/lib/math'

/** Seeded 2D value noise, smooth-interpolated. */
function makeNoise(seed: number) {
  const r = rng(seed)
  const N = 256
  const grid = Float32Array.from({ length: N * N }, () => r())
  const at = (x: number, y: number) => grid[((y & (N - 1)) * N + (x & (N - 1))) | 0]
  return (x: number, y: number) => {
    const xi = Math.floor(x)
    const yi = Math.floor(y)
    const u = smooth(x - xi)
    const v = smooth(y - yi)
    const a = at(xi, yi) + (at(xi + 1, yi) - at(xi, yi)) * u
    const b = at(xi, yi + 1) + (at(xi + 1, yi + 1) - at(xi, yi + 1)) * u
    return a + (b - a) * v
  }
}

const ROCK = new THREE.Color('#8a8d98')
const DARK_ROCK = new THREE.Color('#6d7080')
const FOREST = new THREE.Color('#3f7d52')
const MEADOW = new THREE.Color('#6fa564')
const SNOW = new THREE.Color('#f4f8fc')

/**
 * A distant mountain range across the bay: ridged-noise terrain, faceted, coloured by altitude
 * (meadow → forest → rock → snow). Fog supplies the atmospheric haze.
 */
export function Mountains({ z = -880 }: { z?: number }) {
  const geo = useMemo(() => {
    const W = 2800
    const D = 360
    const nx = 240
    const nz = 56
    const g = new THREE.PlaneGeometry(W, D, nx, nz)
    g.rotateX(-Math.PI / 2)
    const noise = makeNoise(31)
    const pos = g.attributes.position as THREE.BufferAttribute
    const colors = new Float32Array(pos.count * 3)
    const c = new THREE.Color()
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i)
      const zz = pos.getZ(i) // -D/2 (front, toward the city) .. +D/2 (back)
      const t = (zz + D / 2) / D
      const env = Math.pow(smooth(t * 1.15), 1.3)
      const big = noise(x * 0.0022 + 3, zz * 0.0022)
      const fbm = noise(x * 0.006, zz * 0.006) * 0.55 + noise(x * 0.015, zz * 0.015) * 0.3 + noise(x * 0.04, zz * 0.04) * 0.15
      const ridge = 1 - Math.abs(noise(x * 0.0045 + 9, zz * 0.0045 + 4) * 2 - 1)
      const h = (fbm * 0.4 + ridge * ridge * 0.9) * (0.45 + big * 1.1)
      const y = Math.max(-3, h * 150 * env - 4)
      pos.setY(i, y)
      const jitter = (noise(x * 0.09, zz * 0.09) - 0.5) * 24
      const a = y + jitter
      if (a < 12) c.copy(MEADOW)
      else if (a < 55) c.copy(MEADOW).lerp(FOREST, smooth((a - 12) / 43))
      else if (a < 80) c.copy(FOREST).lerp(ROCK, smooth((a - 55) / 25))
      else if (a < 105) c.copy(ROCK).lerp(DARK_ROCK, 0.4).lerp(SNOW, smooth((a - 80) / 25))
      else c.copy(SNOW)
      colors[i * 3] = c.r
      colors[i * 3 + 1] = c.g
      colors[i * 3 + 2] = c.b
    }
    g.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    g.computeVertexNormals()
    return g
  }, [])
  const material = useMemo(() => new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 1, metalness: 0, side: THREE.DoubleSide }), [])
  return <mesh position={[0, 0, z]} geometry={geo} material={material} receiveShadow />
}
