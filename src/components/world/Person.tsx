'use client'
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { clock } from '@/lib/clock'
import type { Sample } from '@/lib/actor'
import { angleLerp, clamp, lerp } from '@/lib/math'
import { SPH, mat } from './primitives'
import { VERTEX_MAT, getRig } from './PersonRig'

export interface Look {
  shirt: string
  pants: string
  skin?: string
  hair?: string
  female?: boolean
  /** hijab and shoulder scarf colour */
  scarf?: string
}

export const SKINS = ['#e0b08c', '#c68e69', '#8d5a3b', '#f0c9a4', '#a87250']
export const HAIRS = ['#1c1714', '#3a2a1e', '#5a3d27', '#12100f', '#6b4b2d']

interface Props extends Look {
  sample: (t: number) => Sample
  scale?: number
  /** Constant sample (seated staff): frozen while far from the camera. */
  still?: boolean
  /** Wrap time so scripted actors loop in explore mode. */
  loop?: number
  /** has a watering hose (guard, you): adds the spray particles */
  sprays?: boolean
}

/** Beyond this distance a person is drawn as a single static mesh; they switch back inside the nearer one. */
const FAR2 = 42 * 42
const NEAR2 = 34 * 34
const SPRAY = Array.from({ length: 9 }, (_, i) => i)

/**
 * A low-poly person (≈1.8 m) with hip/knee/shoulder joints.
 * Poses: walk/run (from speed), sit, type, water, wave, talk/listen (standing or seated). Everything is driven by the world clock,
 * so pausing the tour freezes the animation too.
 */
export function Person({ sample, shirt, pants, skin = '#d9a77f', hair = '#2a1d14', female = false, scarf = '', scale = 1, loop, still, sprays }: Props) {
  const root = useRef<THREE.Group>(null)
  const hips = useRef<THREE.Group>(null)
  const lodMesh = useRef<THREE.Mesh>(null)
  const armL = useRef<THREE.Group>(null)
  const armR = useRef<THREE.Group>(null)
  const legL = useRef<THREE.Group>(null)
  const legR = useRef<THREE.Group>(null)
  const kneeL = useRef<THREE.Group>(null)
  const kneeR = useRef<THREE.Group>(null)
  const spray = useRef<THREE.Group>(null)
  const st = useRef({ lastT: -1, heading: 0, phase: [...shirt].reduce((a, ch) => a + ch.charCodeAt(0), 0) % 6, sit: 0, init: false, far: false, farSeated: false })

  const rig = useMemo(() => getRig(shirt, pants, skin, hair, female, scarf), [shirt, pants, skin, hair, female, scarf])
  const water = useMemo(() => mat('#bfe6f2', { opacity: 0.8 }), [])

  useFrame(({ camera }) => {
    const g = root.current
    if (!g) return
    // seated people far from the camera are frozen after their first update (imperceptible, saves CPU)
    if (still && st.current.init && camera.position.distanceToSquared(g.position) > 4900) return
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

    // far away: one static mesh, no limb animation
    const d2 = camera.position.distanceToSquared(g.position)
    const wasFar = k.far
    k.far = wasFar ? d2 > NEAR2 : d2 > FAR2
    const lod = lodMesh.current
    if (k.far && lod) {
      const seatedNow = s.pose === 'sit' || s.pose === 'type' || s.pose === 'sittalk' || s.pose === 'sitlisten'
      if (!wasFar || seatedNow !== k.farSeated) {
        k.farSeated = seatedNow
        lod.geometry = seatedNow ? rig.farSit : rig.farStand
      }
      lod.visible = true
      hips.current!.visible = false
      return
    }
    if (lod && lod.visible) {
      lod.visible = false
      hips.current!.visible = true
    }

    const seated = s.pose === 'sit' || s.pose === 'type' || s.pose === 'sittalk' || s.pose === 'sitlisten'
    const sd = moving ? dt : 0
    k.sit += ((seated ? 1 : 0) - k.sit) * clamp(sd * 8)
    const run = s.speed > 2.6
    const sprint = s.speed > 6.5
    const amp = clamp(s.speed / 1.5) * (sprint ? 1.0 : run ? 0.8 : 0.55)
    k.phase += s.speed * sd * (sprint ? 2.3 : run ? 2.6 : 3.2)
    const ph = k.phase
    const sw = Math.sin(ph) * amp
    const sw2 = Math.sin(ph + Math.PI) * amp

    hips.current!.position.y = 0.9 - 0.4 * k.sit + (s.speed > 0.1 ? Math.abs(Math.cos(ph)) * 0.035 * (run ? 2 : 1) : 0)
    hips.current!.rotation.x = sprint ? 0.38 : run ? 0.16 : 0 // sprinting leans further into it
    legL.current!.rotation.x = lerp(sw, -Math.PI / 2, k.sit)
    legR.current!.rotation.x = lerp(sw2, -Math.PI / 2, k.sit)
    kneeL.current!.rotation.x = lerp(Math.max(0, -Math.sin(ph)) * amp * 1.3, Math.PI / 2, k.sit)
    kneeR.current!.rotation.x = lerp(Math.max(0, Math.sin(ph)) * amp * 1.3, Math.PI / 2, k.sit)

    let al = -sw * 0.9
    let ar = -sw2 * 0.9
    let arz = 0
    if (run) {
      al -= sprint ? 0.9 : 0.6
      ar -= sprint ? 0.9 : 0.6
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
    } else if (s.pose === 'drink') {
      // cup raised to the mouth, a little tilt every now and then
      ar = -2.15 + Math.sin(t * 2.2) * 0.12
      al = -0.2
    } else if (s.pose === 'talk') {
      // speaking: both hands gesture, out of phase
      ar = -0.95 + Math.sin(t * 4.3 + k.phase) * 0.5
      al = -0.55 + Math.sin(t * 3.4 + 1.3 + k.phase) * 0.35
    } else if (s.pose === 'listen') {
      al = -0.12 + Math.sin(t * 1.3) * 0.04
      ar = -0.12
    } else if (s.pose === 'sittalk') {
      ar = -1.1 + Math.sin(t * 4.3 + k.phase) * 0.45
      al = -0.8 + Math.sin(t * 3.4 + 1.3) * 0.3
    } else if (s.pose === 'sitlisten') {
      al = -0.9
      ar = -0.9
    }
    armL.current!.rotation.x = al
    armR.current!.rotation.x = ar
    armR.current!.rotation.z = arz

    // emotes (player only): override limbs after the standard poses
    const hp = hips.current!
    hp.rotation.y = 0
    hp.rotation.z = 0
    armL.current!.rotation.z = 0
    if (s.pose === 'dance') {
      const b = Math.sin(t * 9)
      hp.position.y = 0.9 + Math.abs(b) * 0.07
      hp.rotation.y = Math.sin(t * 4.5) * 0.45
      hp.rotation.z = Math.sin(t * 4.5) * 0.08
      armR.current!.rotation.x = -2.4 + Math.sin(t * 9) * 0.5
      armL.current!.rotation.x = -2.4 + Math.sin(t * 9 + Math.PI) * 0.5
      armR.current!.rotation.z = -0.5
      armL.current!.rotation.z = 0.5
      legL.current!.rotation.x = Math.sin(t * 9) * 0.35
      legR.current!.rotation.x = Math.sin(t * 9 + Math.PI) * 0.35
      kneeL.current!.rotation.x = Math.max(0, -Math.sin(t * 9)) * 0.6
      kneeR.current!.rotation.x = Math.max(0, Math.sin(t * 9)) * 0.6
    } else if (s.pose === 'clap') {
      const c = 0.5 + 0.5 * Math.sin(t * 15)
      armR.current!.rotation.x = -1.3
      armL.current!.rotation.x = -1.3
      armR.current!.rotation.z = 0.35 - c * 0.5
      armL.current!.rotation.z = -0.35 + c * 0.5
    } else if (s.pose === 'cheer') {
      hp.position.y = 0.9 + Math.abs(Math.sin(t * 8)) * 0.1
      armR.current!.rotation.x = -2.9 + Math.sin(t * 8) * 0.2
      armL.current!.rotation.x = -2.9 - Math.sin(t * 8) * 0.2
      armR.current!.rotation.z = -0.35
      armL.current!.rotation.z = 0.35
    } else if (s.pose === 'bow') {
      hp.rotation.x = 0.85
      armR.current!.rotation.x = 0.2
      armL.current!.rotation.x = 0.2
    } else if (s.pose === 'press') {
      // pressing a button or tapping a screen
      armR.current!.rotation.x = -1.4 + Math.sin(t * 7) * 0.1
      armL.current!.rotation.x = -0.15
    } else if (s.pose === 'write') {
      // scribbling on a whiteboard: the arm is up and sweeps side to side
      armR.current!.rotation.x = -2.0 + Math.sin(t * 5) * 0.2
      armR.current!.rotation.z = -0.25 + Math.sin(t * 9) * 0.22
      armL.current!.rotation.x = -0.15
    } else if (s.pose === 'kick') {
      legR.current!.rotation.x = -Math.max(0, Math.sin(t * 6)) * 1.25
      kneeR.current!.rotation.x = Math.max(0, -Math.sin(t * 6)) * 0.5
      armR.current!.rotation.x = 0.5
      armL.current!.rotation.x = -0.6
    } else if (s.pose === 'shake') {
      armR.current!.rotation.x = -1.35 + Math.sin(t * 13) * 0.17
      armL.current!.rotation.x = -0.15
    } else if (s.pose === 'highfive') {
      armR.current!.rotation.x = -2.75 + Math.sin(t * 10) * 0.06
      armR.current!.rotation.z = -0.15
    } else if (s.pose === 'fistbump') {
      armR.current!.rotation.x = -1.5 + Math.sin(t * 6) * 0.1
      armL.current!.rotation.x = -0.15
    } else if (s.pose === 'laugh') {
      hp.position.y = 0.9 + Math.abs(Math.sin(t * 12)) * 0.03
      hp.rotation.x = -0.12 + Math.sin(t * 12) * 0.06
      armR.current!.rotation.x = -0.95
      armL.current!.rotation.x = -0.95
    } else if (s.pose === 'selfie') {
      // phone held up and out in front
      armR.current!.rotation.x = -2.05
      armR.current!.rotation.z = -0.2
      armL.current!.rotation.x = -0.15
    } else if (s.pose === 'think') {
      // hand to the chin
      armR.current!.rotation.x = -2.3 + Math.sin(t * 1.5) * 0.05
      armL.current!.rotation.x = -1.0
    } else if (s.pose === 'flex') {
      hp.position.y = 0.9 + Math.abs(Math.sin(t * 5)) * 0.03
      armR.current!.rotation.x = -1.5
      armL.current!.rotation.x = -1.5
      armR.current!.rotation.z = -1.0
      armL.current!.rotation.z = 1.0
    }

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
    <group ref={root} scale={scale} userData={{ dynamic: true }}>
      <mesh ref={lodMesh} geometry={rig.farStand} material={VERTEX_MAT} visible={false} />
      <group ref={hips} position={[0, 0.9, 0]}>
        <mesh geometry={rig.body} material={VERTEX_MAT} castShadow />
        <group ref={armL} position={[-0.325, 0.56, 0]}>
          <mesh geometry={rig.arm} material={VERTEX_MAT} castShadow />
        </group>
        <group ref={armR} position={[0.325, 0.56, 0]}>
          <mesh geometry={rig.arm} material={VERTEX_MAT} castShadow />
        </group>
        <group ref={legL} position={[-0.12, 0, 0]}>
          <mesh geometry={rig.thigh} material={VERTEX_MAT} castShadow />
          <group ref={kneeL} position={[0, -0.45, 0]}>
            <mesh geometry={rig.shin} material={VERTEX_MAT} castShadow />
          </group>
        </group>
        <group ref={legR} position={[0.12, 0, 0]}>
          <mesh geometry={rig.thigh} material={VERTEX_MAT} castShadow />
          <group ref={kneeR} position={[0, -0.45, 0]}>
            <mesh geometry={rig.shin} material={VERTEX_MAT} castShadow />
          </group>
        </group>
        {sprays && (
          <group ref={spray} visible={false}>
            {SPRAY.map((i) => (
              <mesh key={i} scale={0.035} geometry={SPH} material={water} />
            ))}
          </group>
        )}
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
    female: (i * 3 + 1) % 2 === 1,
  }
}
