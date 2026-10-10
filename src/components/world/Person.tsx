'use client'
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { clock } from '@/lib/clock'
import type { Sample } from '@/lib/actor'
import { angleLerp, clamp, lerp } from '@/lib/math'
import { SPH, mat, rbox } from './primitives'

export interface Look {
  shirt: string
  pants: string
  skin?: string
  hair?: string
}

export const SKINS = ['#e0b08c', '#c68e69', '#8d5a3b', '#f0c9a4', '#a87250']
export const HAIRS = ['#1c1714', '#3a2a1e', '#5a3d27', '#12100f', '#6b4b2d']

interface Props extends Look {
  sample: (t: number) => Sample
  scale?: number
  /** Wrap time so scripted actors loop in explore mode. */
  loop?: number
}

const CAP = new THREE.CapsuleGeometry(0.5, 1, 6, 12)
const TORSO = rbox(0.5, 0.6, 0.28, 0.12)
const SHOE = rbox(0.15, 0.09, 0.3, 0.04)
const SPRAY = Array.from({ length: 9 }, (_, i) => i)

/**
 * A low-poly person (≈1.8 m) with hip/knee/shoulder joints.
 * Poses: walk/run (from speed), sit, type, water, wave. Everything is driven by the world clock,
 * so pausing the tour freezes the animation too.
 */
export function Person({ sample, shirt, pants, skin = '#d9a77f', hair = '#2a1d14', scale = 1, loop }: Props) {
  const root = useRef<THREE.Group>(null)
  const hips = useRef<THREE.Group>(null)
  const torso = useRef<THREE.Mesh>(null)
  const armL = useRef<THREE.Group>(null)
  const armR = useRef<THREE.Group>(null)
  const legL = useRef<THREE.Group>(null)
  const legR = useRef<THREE.Group>(null)
  const kneeL = useRef<THREE.Group>(null)
  const kneeR = useRef<THREE.Group>(null)
  const spray = useRef<THREE.Group>(null)
  const st = useRef({ lastT: -1, heading: 0, phase: [...shirt].reduce((a, ch) => a + ch.charCodeAt(0), 0) % 6, sit: 0, init: false })

  const m = useMemo(
    () => ({ shirt: mat(shirt), pants: mat(pants), skin: mat(skin), hair: mat(hair), shoe: mat('#2a2622', { rough: 0.5 }), eye: mat('#1a1512'), water: mat('#bfe6f2', { opacity: 0.8 }) }),
    [shirt, pants, skin, hair],
  )

  useFrame(() => {
    const g = root.current
    if (!g) return
    const t = loop ? clock.t % loop : clock.t
    const s = sample(t)
    g.visible = s.visible
    if (!s.visible) return
    const k = st.current
    const dt = t - k.lastT
    const moving = k.init && dt > 0 && dt < 0.5
    k.lastT = t
    g.position.set(s.x, s.y, s.z)
    if (!k.init || dt < 0 || dt > 0.5) k.heading = s.heading
    else k.heading = angleLerp(k.heading, s.heading, 1 - Math.exp(-dt * 10))
    k.init = true
    g.rotation.y = k.heading

    const seated = s.pose === 'sit' || s.pose === 'type'
    const sd = moving ? dt : 0
    k.sit += ((seated ? 1 : 0) - k.sit) * clamp(sd * 8)
    const run = s.speed > 2.6
    const amp = clamp(s.speed / 1.5) * (run ? 0.72 : 0.55)
    k.phase += s.speed * sd * (run ? 2.3 : 3.2)
    const ph = k.phase
    const sw = Math.sin(ph) * amp
    const sw2 = Math.sin(ph + Math.PI) * amp

    hips.current!.position.y = 0.9 - 0.4 * k.sit + (s.speed > 0.1 ? Math.abs(Math.cos(ph)) * 0.035 * (run ? 2 : 1) : 0)
    hips.current!.rotation.x = run ? 0.16 : 0
    legL.current!.rotation.x = lerp(sw, -Math.PI / 2, k.sit)
    legR.current!.rotation.x = lerp(sw2, -Math.PI / 2, k.sit)
    kneeL.current!.rotation.x = lerp(Math.max(0, -Math.sin(ph)) * amp * 1.3, Math.PI / 2, k.sit)
    kneeR.current!.rotation.x = lerp(Math.max(0, Math.sin(ph)) * amp * 1.3, Math.PI / 2, k.sit)

    let al = -sw * 0.9
    let ar = -sw2 * 0.9
    let arz = 0
    if (run) {
      al -= 0.5
      ar -= 0.5
    }
    if (s.pose === 'type') {
      al = -1.15 + Math.sin(t * 13) * 0.05
      ar = -1.15 + Math.sin(t * 11 + 1) * 0.05
    } else if (s.pose === 'sit') {
      al = -0.5
      ar = -0.5
    } else if (s.pose === 'water') {
      ar = -1.25
      al = -0.2
    } else if (s.pose === 'wave') {
      ar = -2.55 + Math.sin(t * 7) * 0.22
      arz = -0.1
    }
    armL.current!.rotation.x = al
    armR.current!.rotation.x = ar
    armR.current!.rotation.z = arz
    torso.current!.scale.y = 0.62 + Math.sin(t * 2) * 0.006

    const sp = spray.current
    if (sp) {
      sp.visible = s.pose === 'water'
      if (sp.visible) {
        sp.children.forEach((c, i) => {
          const u = (t * 1.6 + i / SPRAY.length) % 1
          c.position.set(0.3 + (i % 3 - 1) * 0.04 * u, 0.55 + u * 0.55 - u * u * 1.9, 0.5 + u * 2.4)
        })
      }
    }
  })

  return (
    <group ref={root} scale={scale}>
      <group ref={hips} position={[0, 0.9, 0]}>
        <mesh ref={torso} position={[0, 0.31, 0]} scale={[1, 0.62 / 0.6, 1]} castShadow geometry={TORSO} material={m.shirt} />
        <mesh position={[0, 0.03, 0]} scale={[0.46, 0.12, 0.26]} castShadow geometry={CAP} material={m.pants} rotation={[0, 0, Math.PI / 2]} />
        {/* neck + head */}
        <mesh position={[0, 0.66, 0]} scale={[0.09, 0.07, 0.09]} geometry={CAP} material={m.skin} />
        <mesh position={[0, 0.8, 0]} scale={[0.155, 0.17, 0.16]} castShadow geometry={SPH} material={m.skin} />
        <mesh position={[0, 0.855, -0.015]} scale={[0.17, 0.135, 0.175]} geometry={SPH} material={m.hair} />
        <mesh position={[-0.055, 0.81, 0.138]} scale={0.017} geometry={SPH} material={m.eye} />
        <mesh position={[0.055, 0.81, 0.138]} scale={0.017} geometry={SPH} material={m.eye} />
        {/* arms */}
        <group ref={armL} position={[-0.325, 0.56, 0]}>
          <mesh position={[0, -0.27, 0]} scale={[0.115, 0.3, 0.115]} castShadow geometry={CAP} material={m.shirt} />
          <mesh position={[0, -0.58, 0]} scale={0.062} geometry={SPH} material={m.skin} />
        </group>
        <group ref={armR} position={[0.325, 0.56, 0]}>
          <mesh position={[0, -0.27, 0]} scale={[0.115, 0.3, 0.115]} castShadow geometry={CAP} material={m.shirt} />
          <mesh position={[0, -0.58, 0]} scale={0.062} geometry={SPH} material={m.skin} />
        </group>
        {/* legs */}
        <group ref={legL} position={[-0.12, 0, 0]}>
          <mesh position={[0, -0.225, 0]} scale={[0.19, 0.25, 0.2]} castShadow geometry={CAP} material={m.pants} />
          <group ref={kneeL} position={[0, -0.45, 0]}>
            <mesh position={[0, -0.225, 0]} scale={[0.155, 0.25, 0.17]} castShadow geometry={CAP} material={m.pants} />
            <mesh position={[0, -0.45, 0.05]} geometry={SHOE} material={m.shoe} castShadow />
          </group>
        </group>
        <group ref={legR} position={[0.12, 0, 0]}>
          <mesh position={[0, -0.225, 0]} scale={[0.19, 0.25, 0.2]} castShadow geometry={CAP} material={m.pants} />
          <group ref={kneeR} position={[0, -0.45, 0]}>
            <mesh position={[0, -0.225, 0]} scale={[0.155, 0.25, 0.17]} castShadow geometry={CAP} material={m.pants} />
            <mesh position={[0, -0.45, 0.05]} geometry={SHOE} material={m.shoe} castShadow />
          </group>
        </group>
        {/* hose spray (only visible while watering) */}
        <group ref={spray} visible={false}>
          {SPRAY.map((i) => (
            <mesh key={i} scale={0.035} geometry={SPH} material={m.water} />
          ))}
        </group>
      </group>
    </group>
  )
}

/** Deterministic pick helpers so crowds look varied but identical between loads. */
export function look(i: number, shirts: string[], pants: string[]): Look {
  return {
    shirt: shirts[i % shirts.length],
    pants: pants[(i * 3 + 1) % pants.length],
    skin: SKINS[(i * 7 + 2) % SKINS.length],
    hair: HAIRS[(i * 5 + 1) % HAIRS.length],
  }
}
