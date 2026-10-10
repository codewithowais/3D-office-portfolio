'use client'
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { clock } from '@/lib/clock'
import type { Sample } from '@/lib/actor'
import { V3 } from '@/lib/math'
import { BOX, CYL, mat, rbox } from './primitives'

export const CAR_COLORS = ['#e8463f', '#1f4fa3', '#e4e8ec', '#ff9a3d', '#0e8f93', '#2fa365', '#ffd24d']

const HULL = rbox(1.82, 0.6, 4.3, 0.22)
const CABIN = rbox(1.62, 0.56, 2.3, 0.2)
const ROOF = rbox(1.56, 0.08, 2.0, 0.04)
const BUMP = rbox(1.86, 0.2, 0.18, 0.06)

function Body({ color }: { color: string }) {
  const body = mat(color, { rough: 0.32, metal: 0.35 })
  const glass = mat('#1d2a30', { rough: 0.08, metal: 0.6 })
  const wheel = mat('#151716', { rough: 0.8 })
  const rim = mat('#b9bcb7', { rough: 0.3, metal: 0.8 })
  const trim = mat('#222624', { rough: 0.6 })
  const red = mat('#ff3b30', { emissive: '#ff2a1f', ei: 1.6 })
  const lamp = mat('#fff7dc', { emissive: '#fff2c0', ei: 0.9 })
  const wheels: V3[] = [[-0.93, 0.34, 1.35], [0.93, 0.34, 1.35], [-0.93, 0.34, -1.35], [0.93, 0.34, -1.35]]
  return (
    <group>
      <mesh position={[0, 0.65, 0]} castShadow receiveShadow geometry={HULL} material={body} />
      <mesh position={[0, 1.15, -0.2]} castShadow geometry={CABIN} material={glass} />
      <mesh position={[0, 1.46, -0.2]} geometry={ROOF} material={body} />
      <mesh position={[0, 0.42, 2.12]} geometry={BUMP} material={trim} />
      <mesh position={[0, 0.42, -2.12]} geometry={BUMP} material={trim} />
      {wheels.map((w, i) => (
        <group key={i} position={w} rotation={[0, 0, Math.PI / 2]}>
          <mesh scale={[0.34, 0.25, 0.34]} castShadow geometry={CYL} material={wheel} />
          <mesh position={[0, w[0] > 0 ? 0.13 : -0.13, 0]} scale={[0.2, 0.03, 0.2]} geometry={CYL} material={rim} />
        </group>
      ))}
      <mesh position={[-0.6, 0.72, -2.17]} scale={[0.46, 0.14, 0.05]} geometry={BOX} material={red} />
      <mesh position={[0.6, 0.72, -2.17]} scale={[0.46, 0.14, 0.05]} geometry={BOX} material={red} />
      <mesh position={[-0.62, 0.72, 2.17]} scale={[0.4, 0.14, 0.05]} geometry={BOX} material={lamp} />
      <mesh position={[0.62, 0.72, 2.17]} scale={[0.4, 0.14, 0.05]} geometry={BOX} material={lamp} />
      <mesh position={[0, 0.5, -2.2]} scale={[0.5, 0.12, 0.03]} geometry={BOX} material={mat('#e9edf0')} />
    </group>
  )
}

export function ParkedCar({ p, r = 0, color }: { p: V3; r?: number; color: string }) {
  return (
    <group position={p} rotation={[0, r, 0]}>
      <Body color={color} />
    </group>
  )
}

/** A car that follows a scripted route or traffic loop. */
export function MovingCar({ sample, color, loop }: { sample: (t: number) => Sample; color: string; loop?: number }) {
  const g = useRef<THREE.Group>(null)
  useFrame(() => {
    const s = sample(loop ? clock.t % loop : clock.t)
    const o = g.current
    if (!o) return
    o.visible = s.visible
    o.position.set(s.x, s.y, s.z)
    o.rotation.y = s.heading
  })
  return (
    <group ref={g} userData={{ dynamic: true }}>
      <Body color={color} />
    </group>
  )
}
