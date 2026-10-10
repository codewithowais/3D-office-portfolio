'use client'
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { clock } from '@/lib/clock'
import { useStore } from '@/lib/store'
import { TALKABLES } from '@/lib/talkables'
import { OCTA } from './primitives'

const spot = { x: 0, z: 0, visible: true }
const IDLE = new THREE.MeshBasicMaterial({ color: '#ffb199', toneMapped: false })
const NEAR = new THREE.MeshBasicMaterial({ color: '#2ef0e0', toneMapped: false })

/** Bobbing diamonds above everyone you can talk to (walk mode only). The nearest one glows and grows. */
export function TalkMarkers() {
  const refs = useRef<(THREE.Mesh | null)[]>([])
  useFrame(() => {
    const st = useStore.getState()
    const on = st.walk && !st.talking
    TALKABLES.forEach((tk, i) => {
      const m = refs.current[i]
      if (!m) return
      const s = tk.at(clock.t, spot)
      m.visible = on && s.visible
      if (!m.visible) return
      const near = st.nearby === tk.id
      m.position.set(s.x, tk.marker + 0.15 + Math.sin(clock.t * 3 + i) * 0.06, s.z)
      m.rotation.y = clock.t * 1.6
      m.scale.setScalar(near ? 0.2 : 0.13)
      m.material = near ? NEAR : IDLE
    })
  })
  return (
    <>
      {TALKABLES.map((tk, i) => (
        <mesh key={tk.id} ref={(el) => void (refs.current[i] = el)} geometry={OCTA} material={IDLE} visible={false} />
      ))}
    </>
  )
}
