'use client'
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { clock } from '@/lib/clock'
import { PAIRS, lineAt, makePairSampler } from '@/lib/chat'
import { Person } from './Person'

const mats = new Map<string, THREE.SpriteMaterial>()

/** A rounded speech bubble with the line of dialogue, drawn once per distinct line. */
function bubble(text: string) {
  let m = mats.get(text)
  if (m) return m
  const c = document.createElement('canvas')
  const g = c.getContext('2d')!
  const font = '600 34px system-ui, -apple-system, "Segoe UI", sans-serif'
  g.font = font
  const w = Math.ceil(g.measureText(text).width) + 56
  const h = 92
  c.width = w
  c.height = h + 18
  g.font = font
  g.fillStyle = 'rgba(255,255,255,0.96)'
  g.strokeStyle = 'rgba(15,39,64,0.22)'
  g.lineWidth = 3
  const r = 28
  g.beginPath()
  g.roundRect(3, 3, w - 6, h - 6, r)
  g.fill()
  g.stroke()
  // tail
  g.beginPath()
  g.moveTo(w / 2 - 14, h - 4)
  g.lineTo(w / 2, h + 14)
  g.lineTo(w / 2 + 14, h - 4)
  g.closePath()
  g.fill()
  g.fillStyle = '#0f2740'
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.fillText(text, w / 2, h / 2)
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  m = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, toneMapped: false, fog: false })
  m.userData.aspect = c.width / c.height
  mats.set(text, m)
  return m
}

const SHOW_DIST2 = 38 * 38

/** Pairs of people talking to each other. A bubble follows whoever is speaking. */
export function Chat() {
  const samplers = useMemo(() => PAIRS.map((p) => [makePairSampler(p, 0), makePairSampler(p, 1)] as const), [])
  const sprites = useRef<(THREE.Sprite | null)[]>([])
  useFrame(({ camera }) => {
    PAIRS.forEach((p, i) => {
      const sp = sprites.current[i]
      if (!sp) return
      const { text, speaker } = lineAt(p, clock.t)
      const who = speaker === 0 ? p.a : p.b
      const dx = camera.position.x - who.x
      const dz = camera.position.z - who.z
      const near = dx * dx + dz * dz + camera.position.y * camera.position.y < SHOW_DIST2
      sp.visible = near
      if (!near) return
      const m = bubble(text)
      if (sp.material !== m) sp.material = m
      const hgt = p.seated ? 1.95 : 2.3
      sp.position.set(who.x, hgt + 0.3, who.z)
      const aspect = (m.userData.aspect as number) ?? 3
      sp.scale.set(0.36 * aspect, 0.36, 1)
    })
  })
  return (
    <>
      {PAIRS.map((p, i) => (
        <group key={p.id}>
          <Person sample={samplers[i][0]} shirt={p.a.shirt} pants={p.a.pants} skin={p.a.skin} hair={p.a.hair} />
          <Person sample={samplers[i][1]} shirt={p.b.shirt} pants={p.b.pants} skin={p.b.skin} hair={p.b.hair} />
          <sprite ref={(el) => void (sprites.current[i] = el)} visible={false} renderOrder={5} />
        </group>
      ))}
    </>
  )
}
