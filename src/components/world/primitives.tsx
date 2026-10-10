'use client'
import { useLayoutEffect, useRef } from 'react'
import * as THREE from 'three'
import type { V3 } from '@/lib/math'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { detailTexture, labelTexture } from './textures'

const mats = new Map<string, THREE.MeshStandardMaterial>()

export interface MatOpts {
  rough?: number
  metal?: number
  emissive?: string
  ei?: number
  opacity?: number
  map?: THREE.Texture
  side?: THREE.Side
  /** World-space grain scale (1 / metres per tile). Gives ground and walls surface detail. */
  detail?: number
  emissiveMap?: THREE.Texture
  bumpMap?: THREE.Texture
  /** Replace the default grain with another world-space texture, and set how strongly it tints. */
  detailMap?: THREE.Texture
  detailStrength?: number
  flat?: boolean
}

/** Shared, cached standard materials - hundreds of meshes reuse a handful of these. */
export function mat(color: string, o: MatOpts = {}) {
  const key = `${color}|${o.rough}|${o.metal}|${o.emissive}|${o.ei}|${o.opacity}|${o.map?.uuid}|${o.side}|${o.detail}|${o.emissiveMap?.uuid}|${o.flat}|${o.bumpMap?.uuid}|${o.detailMap?.uuid}|${o.detailStrength}`
  let m = mats.get(key)
  if (!m) {
    const params: THREE.MeshStandardMaterialParameters = {
      color,
      roughness: o.rough ?? 0.85,
      metalness: o.metal ?? 0,
      emissive: o.emissive ?? '#000000',
      emissiveIntensity: o.ei ?? 1,
      transparent: o.opacity !== undefined && o.opacity < 1,
      opacity: o.opacity ?? 1,
      side: o.side ?? THREE.FrontSide,
      depthWrite: !(o.opacity !== undefined && o.opacity < 1),
    }
    if (o.map) params.map = o.map
    if (o.emissiveMap) params.emissiveMap = o.emissiveMap
    if (o.flat) params.flatShading = true
    if (o.bumpMap) {
      params.bumpMap = o.bumpMap
      params.bumpScale = 1.6
    }
    if (o.detail) params.map = o.detailMap ?? detailTexture()
    m = new THREE.MeshStandardMaterial(params)
    if (o.detail) {
      const sc = o.detail.toFixed(4)
      const st = (o.detailStrength ?? 0.35).toFixed(3)
      m.customProgramCacheKey = () => `detail${sc}-${st}-${o.detailMap ? 1 : 0}`
      m.onBeforeCompile = (sh) => {
        sh.vertexShader = sh.vertexShader
          .replace('#include <common>', '#include <common>\nvarying vec3 vWPos;')
          .replace('#include <begin_vertex>', '#include <begin_vertex>\nvWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;')
        sh.fragmentShader = sh.fragmentShader
          .replace('#include <common>', '#include <common>\nvarying vec3 vWPos;')
          .replace(
            '#include <map_fragment>',
            `vec2 dp = vWPos.xz * ${sc};
             vec3 fine = texture2D(map, dp).rgb;
             vec3 broad = texture2D(map, dp * 0.09 + 0.37).rgb;
             diffuseColor.rgb *= mix(vec3(1.0), fine, ${st}) * (0.9 + 0.2 * broad.g);`,
          )
      }
    }
    mats.set(key, m)
  }
  return m
}

export const BOX = new THREE.BoxGeometry(1, 1, 1)
export const CYL = new THREE.CylinderGeometry(1, 1, 1, 14)
export const SPH = new THREE.SphereGeometry(1, 14, 10)
export const PLANE = new THREE.PlaneGeometry(1, 1)
export const OCTA = new THREE.OctahedronGeometry(1, 0)

interface BoxProps {
  p: V3
  s: V3
  c?: string
  m?: THREE.Material
  r?: number
  cast?: boolean
  receive?: boolean
}

export function Box({ p, s, c = '#ffffff', m, r = 0, cast, receive = true }: BoxProps) {
  // only big pieces cast shadows: mugs, monitors and book spines add shadow-pass cost for nothing
  const casts = cast ?? Math.max(s[0], s[1], s[2]) > 0.6
  return (
    <mesh position={p} rotation={[0, r, 0]} scale={s} castShadow={casts} receiveShadow={receive} geometry={BOX} material={m ?? mat(c)} />
  )
}

interface RoundProps {
  p: V3
  rad: number
  h: number
  c?: string
  m?: THREE.Material
  cast?: boolean
}

/** Upright cylinder of radius rad and height h, sitting with its centre at p. */
export function Cyl({ p, rad, h, c = '#ffffff', m, cast = true }: RoundProps) {
  return <mesh position={p} scale={[rad, h, rad]} castShadow={cast} receiveShadow geometry={CYL} material={m ?? mat(c)} />
}

export function Ball({ p, rad, c = '#ffffff', m, sy = 1, cast = true }: { p: V3; rad: number; c?: string; m?: THREE.Material; sy?: number; cast?: boolean }) {
  return <mesh position={p} scale={[rad, rad * sy, rad]} castShadow={cast} receiveShadow geometry={SPH} material={m ?? mat(c)} />
}

/** Flat horizontal plane at height y covering [x0,x1] x [z0,z1]. */
export function Floor({ x0, x1, z0, z1, y = 0, m, c = '#fff' }: { x0: number; x1: number; z0: number; z1: number; y?: number; m?: THREE.Material; c?: string }) {
  return (
    <mesh
      position={[(x0 + x1) / 2, y, (z0 + z1) / 2]}
      rotation={[-Math.PI / 2, 0, 0]}
      scale={[x1 - x0, z1 - z0, 1]}
      receiveShadow
      geometry={PLANE}
      material={m ?? mat(c)}
    />
  )
}

/** A wooden-framed sage sign with text. Faces +z unless rotated with r. */
export function Sign({ p, r = 0, w, h, text, bg = '#1fa6a6', fg = '#ffffff' }: { p: V3; r?: number; w: number; h: number; text: string; bg?: string; fg?: string }) {
  const tex = labelTexture(text, bg, fg, 512, Math.round(512 * (h / w)))
  return (
    <group position={p} rotation={[0, r, 0]}>
      <Box p={[0, 0, 0]} s={[w + 0.16, h + 0.16, 0.08]} c="#e0ad6f" />
      <mesh position={[0, 0, 0.045]} scale={[w, h, 1]} geometry={PLANE} material={mat('#ffffff', { map: tex, rough: 0.7 })} />
    </group>
  )
}

interface Item {
  p: V3
  s: V3
  r?: number
}

/** One draw call for many identical meshes (trees, road dashes, ...). */
export function Instanced({ geometry, material, items, colors, cast = false, receive = true }: { geometry: THREE.BufferGeometry; material: THREE.Material; items: Item[]; colors?: string[]; cast?: boolean; receive?: boolean }) {
  const ref = useRef<THREE.InstancedMesh>(null)
  useLayoutEffect(() => {
    const m = ref.current
    if (!m) return
    const o = new THREE.Object3D()
    const col = new THREE.Color()
    items.forEach((it, i) => {
      o.position.set(it.p[0], it.p[1], it.p[2])
      o.rotation.set(0, it.r ?? 0, 0)
      o.scale.set(it.s[0], it.s[1], it.s[2])
      o.updateMatrix()
      m.setMatrixAt(i, o.matrix)
      if (colors) m.setColorAt(i, col.set(colors[i % colors.length]))
    })
    m.instanceMatrix.needsUpdate = true
    if (m.instanceColor) m.instanceColor.needsUpdate = true
  }, [items, colors])
  return <instancedMesh ref={ref} args={[geometry, material, items.length]} castShadow={cast} receiveShadow={receive} frustumCulled={false} />
}

const rboxCache = new Map<string, RoundedBoxGeometry>()

/** Cached rounded-box geometry of an exact size (so bevels keep a true radius). */
export function rbox(w: number, h: number, d: number, r = 0.04) {
  const k = [w, h, d, r].map((v) => v.toFixed(3)).join()
  let g = rboxCache.get(k)
  if (!g) {
    g = new RoundedBoxGeometry(w, h, d, 3, Math.min(r, w / 2 - 0.001, h / 2 - 0.001, d / 2 - 0.001))
    rboxCache.set(k, g)
  }
  return g
}

/** Box with softly rounded edges: catches light much better than a hard cube. */
export function RBox({ p, s, c = '#ffffff', m, r = 0, rad = 0.04, cast, receive = true }: { p: V3; s: V3; c?: string; m?: THREE.Material; r?: number; rad?: number; cast?: boolean; receive?: boolean }) {
  const casts = cast ?? Math.max(s[0], s[1], s[2]) > 0.6
  return <mesh position={p} rotation={[0, r, 0]} castShadow={casts} receiveShadow={receive} geometry={rbox(s[0], s[1], s[2], rad)} material={m ?? mat(c)} />
}
