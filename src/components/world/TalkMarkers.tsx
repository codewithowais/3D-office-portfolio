'use client'
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { clock } from '@/lib/clock'
import { player } from '@/lib/player'
import { useStore } from '@/lib/store'
import { TALKABLES } from '@/lib/talkables'
import { OCTA } from './primitives'

const spot = { x: 0, z: 0, visible: true }
const PERSON = new THREE.MeshBasicMaterial({ color: '#ffb199', toneMapped: false })
const THING = new THREE.MeshBasicMaterial({ color: '#ffe27a', toneMapped: false })
const SEAT = new THREE.MeshBasicMaterial({ color: '#a8e6ff', toneMapped: false })
const NEAR = new THREE.MeshBasicMaterial({ color: '#2ef0e0', toneMapped: false })
const SEE_DIST = 16

/** Bobbing diamonds over everything you can interact with (walk mode only, and only nearby). The closest one glows. */
export function TalkMarkers() {
  const refs = useRef<(THREE.Mesh | null)[]>([])
  useFrame(() => {
    const st = useStore.getState()
    const on = st.walk && !st.talking && !st.seated
    TALKABLES.forEach((tk, i) => {
      const m = refs.current[i]
      if (!m) return
      if (!on) {
        m.visible = false
        return
      }
      const s = tk.at(clock.t, spot)
      const d = Math.hypot(s.x - player.x, s.z - player.z)
      m.visible = s.visible && d < SEE_DIST
      if (!m.visible) return
      const near = st.nearby === tk.id
      m.position.set(s.x, tk.marker + 0.15 + Math.sin(clock.t * 3 + i) * 0.06, s.z)
      m.rotation.y = clock.t * 1.6
      m.scale.setScalar(near ? 0.2 : tk.kind === 'seat' ? 0.1 : 0.13)
      m.material = near ? NEAR : tk.kind === 'thing' ? THING : tk.kind === 'seat' ? SEAT : PERSON
    })
  })
  return (
    <>
      {TALKABLES.map((tk, i) => (
        <mesh key={tk.id} ref={(el) => void (refs.current[i] = el)} geometry={OCTA} material={PERSON} visible={false} />
      ))}
    </>
  )
}
