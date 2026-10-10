'use client'
import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { clock } from '@/lib/clock'
import { dprFor, getDevice } from '@/lib/device'
import { player, stepPlayer } from '@/lib/player'
import { TALKABLES, TALK_RANGE, spotOf } from '@/lib/talkables'
import { useStore, type Flight } from '@/lib/store'
import { TOUR_LEN, activeRoomAt, cameraAt, chapterAt, type Cam } from '@/lib/tour'
import { roomAt } from '@/lib/world'
import { Effects, Lighting, Sky, useTheme } from './Atmosphere'
import { City } from './world/City'
import { Office } from './world/Office'
import { Surroundings } from './world/Surroundings'

/** Advances the world clock and drives the camera: scripted tour in demo mode, free orbit otherwise. */
function Director() {
  const controls = useRef<React.ElementRef<typeof OrbitControls>>(null)
  const look = useRef(new THREE.Vector3(0, 1, 18))
  const cam = useMemo<Cam>(() => ({ p: [0, 0, 0], t: [0, 0, 0] }), [])
  const flight = useRef<Flight | null>(null)
  const primed = useRef(false)
  const last = useRef({ x: 0, z: 0, init: false })
  const mode = useStore((s) => s.mode)
  const fly = useStore((s) => s.flight)

  useEffect(() => {
    flight.current = fly
  }, [fly])

  useEffect(() => {
    if (mode === 'demo') primed.current = false
    else if (controls.current) {
      controls.current.target.copy(look.current)
      controls.current.update()
    }
  }, [mode])

  useFrame(({ camera }, delta) => {
    const dt = Math.min(delta, 0.05)
    const st = useStore.getState()
    if (!st.ready) {
      st.setReady()
      performance.mark('office-ready')
    }
    if (!st.walk) last.current.init = false

    if (st.mode === 'demo') {
      if (!st.paused) clock.t += dt
      if (clock.t >= TOUR_LEN) {
        clock.t = TOUR_LEN
        st.setMode('explore')
        return
      }
      const ch = chapterAt(clock.t)
      if (ch !== st.chapter) st.setChapter(ch)
      const room = activeRoomAt(clock.t)
      if (room !== st.activeRoom) st.setActiveRoom(room)

      cameraAt(clock.t, cam)
      if (!primed.current) {
        camera.position.set(cam.p[0], cam.p[1], cam.p[2])
        look.current.set(cam.t[0], cam.t[1], cam.t[2])
        primed.current = true
      }
      const k = 1 - Math.exp(-dt * 2.4)
      camera.position.x += (cam.p[0] - camera.position.x) * k
      camera.position.y += (cam.p[1] - camera.position.y) * k
      camera.position.z += (cam.p[2] - camera.position.z) * k
      look.current.x += (cam.t[0] - look.current.x) * k
      look.current.y += (cam.t[1] - look.current.y) * k
      look.current.z += (cam.t[2] - look.current.z) * k
      camera.lookAt(look.current)
    } else {
      clock.t += dt
      const f = flight.current
      const c = controls.current
      if (f && c) {
        const k = 1 - Math.exp(-dt * 3)
        camera.position.x += (f.pos[0] - camera.position.x) * k
        camera.position.y += (f.pos[1] - camera.position.y) * k
        camera.position.z += (f.pos[2] - camera.position.z) * k
        c.target.x += (f.target[0] - c.target.x) * k
        c.target.y += (f.target[1] - c.target.y) * k
        c.target.z += (f.target[2] - c.target.z) * k
        if (camera.position.distanceTo(new THREE.Vector3(...f.pos)) < 0.05) flight.current = null
      } else if (st.walk && c) {
        // third-person: move relative to where the camera looks, then drag the camera along with the player
        let fx = c.target.x - camera.position.x
        let fz = c.target.z - camera.position.z
        const fl = Math.hypot(fx, fz) || 1
        fx /= fl
        fz /= fl
        const l = last.current
        if (!l.init) {
          l.x = player.x
          l.z = player.z
          l.init = true
        }
        if (st.talking) {
          // stand still and face whoever you're talking to; walk away and the conversation ends
          player.speed = 0
          const sp = spotOf(st.talking.id, clock.t)
          if (sp) {
            player.heading = Math.atan2(sp.x - player.x, sp.z - player.z)
            if (Math.hypot(sp.x - player.x, sp.z - player.z) > TALK_RANGE * 2.2) st.endTalk()
          }
        } else {
          stepPlayer(fx, fz, dt)
          let best: string | null = null
          let bd = TALK_RANGE
          for (const tk of TALKABLES) {
            const sp = tk.at(clock.t, nearScratch)
            if (!sp.visible) continue
            const d = Math.hypot(sp.x - player.x, sp.z - player.z)
            if (d < bd) {
              bd = d
              best = tk.id
            }
          }
          if (best !== st.nearby) st.setNearby(best)
        }
        // move the camera by however far the player moved this frame (walking or teleporting)
        camera.position.x += player.x - l.x
        camera.position.z += player.z - l.z
        l.x = player.x
        l.z = player.z
        c.target.set(player.x, 1.3, player.z)
        const room = roomAt(player.x, player.z)
        if (room !== st.activeRoom) st.setActiveRoom(room)
      }
    }
  })

  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enabled={mode === 'explore'}
      enableDamping
      dampingFactor={0.08}
      maxPolarAngle={Math.PI * 0.485}
      minDistance={3}
      maxDistance={420}
      onStart={() => {
        flight.current = null
      }}
    />
  )
}

function Lights() {
  const quality = useStore((s) => s.quality)
  const t = useTheme()
  const d = getDevice()
  const size = quality === 'High' ? (d.maxTexture >= 8192 && !d.mobile ? 4096 : 2048) : d.mobile ? 1024 : 2048
  return (
    <>
      <hemisphereLight args={[t.hemi.sky, t.hemi.ground, t.hemi.intensity]} />
      <directionalLight
        position={t.sun.pos}
        intensity={t.sun.intensity}
        color={t.sun.color}
        castShadow={quality !== 'Low'}
        shadow-mapSize={[size, size]}
        shadow-camera-left={-85}
        shadow-camera-right={85}
        shadow-camera-top={85}
        shadow-camera-bottom={-85}
        shadow-camera-near={10}
        shadow-camera-far={300}
        shadow-bias={-0.0004}
        shadow-normalBias={0.06}
      />
    </>
  )
}

/**
 * Frame-rate watchdog. If the device can't hold ~30 fps it steps quality down (High -> Medium -> Low,
 * then resolution), so a slow machine settles instead of grinding. Skips warm-up and hidden tabs.
 */
const nearScratch = { x: 0, z: 0, visible: true }
let liveCanvas: HTMLCanvasElement | null = null
let lastRestore = 0

function AutoQuality() {
  const acc = useRef({ time: 0, frames: 0, warm: 0, strikes: 0 })
  useFrame((_, delta) => {
    const a = acc.current
    const st = useStore.getState()
    if (!st.ready || document.hidden || delta > 0.5) {
      a.time = 0
      a.frames = 0
      return
    }
    a.warm += delta
    if (a.warm < 4) return // first seconds include shader compilation
    a.time += delta
    a.frames++
    if (a.time < 2.5) return
    const fps = a.frames / a.time
    a.time = 0
    a.frames = 0
    a.strikes = fps < 27 ? a.strikes + 1 : 0
    if (a.strikes >= 2) {
      a.strikes = 0
      a.warm = 0 // give the new settings a moment before judging again
      st.autoDowngrade()
    }
  })
  return null
}

/** Canvas pixel ratio that respects the quality's pixel budget and follows window resizes. */
function useDpr(quality: 'Low' | 'Medium' | 'High', scale: number) {
  const [size, setSize] = useState(() => ({ w: window.innerWidth, h: window.innerHeight }))
  useEffect(() => {
    let id = 0
    const onResize = () => {
      clearTimeout(id)
      id = window.setTimeout(() => setSize({ w: window.innerWidth, h: window.innerHeight }), 150)
    }
    window.addEventListener('resize', onResize)
    return () => {
      clearTimeout(id)
      window.removeEventListener('resize', onResize)
    }
  }, [])
  return dprFor(quality, size.w, size.h, scale)
}

export default function Scene() {
  const quality = useStore((s) => s.quality)
  const scale = useStore((s) => s.dprScale)
  const t = useTheme()
  const dpr = useDpr(quality, scale)
  return (
    <Canvas
      shadows={quality !== 'Low'}
      dpr={dpr}
      onCreated={(state) => {
        const { gl } = state
        const el = gl.domElement
        liveCanvas = el
        el.addEventListener('webglcontextlost', (e) => {
          e.preventDefault() // lets the browser restore the context instead of leaving a dead canvas
          // ignore the event a disposed canvas fires on its way out, otherwise recovery would retrigger itself
          if (liveCanvas !== el || performance.now() - lastRestore < 3000) return
          useStore.getState().setError('lost')
        })
        el.addEventListener('webglcontextrestored', () => {
          if (liveCanvas !== el) return
          lastRestore = performance.now()
          useStore.getState().restoreScene()
        })
        if (process.env.NODE_ENV !== 'production') {
          ;(window as unknown as Record<string, unknown>).__gl = gl
          ;(window as unknown as Record<string, unknown>).__r3f = state
        }
      }}
      camera={{ fov: 38, near: 0.5, far: 2400, position: [-6, 14, 40] }}
      gl={{ antialias: false, toneMapping: THREE.NoToneMapping, powerPreference: 'high-performance', failIfMajorPerformanceCaveat: false }}
    >
      <color attach="background" args={[t.fog]} />
      <fog attach="fog" args={[t.fog, 520, 3600]} />
      <Sky />
      <Lighting />
      <Lights />
      <Director />
      <AutoQuality />
      <Suspense fallback={null}>
        <Office />
        <Surroundings />
        <City />
      </Suspense>
      <Effects />
    </Canvas>
  )
}
