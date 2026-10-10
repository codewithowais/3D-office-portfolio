'use client'
import { useMemo } from 'react'
import * as THREE from 'three'
import { Environment, Lightformer } from '@react-three/drei'
import { EffectComposer, N8AO, Bloom, SMAA, Vignette, ToneMapping, BrightnessContrast, HueSaturation } from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'
import { useStore } from '@/lib/store'
import { THEMES } from '@/lib/themes'
import { cloudTexture } from './world/textures'

export const useTheme = () => THEMES[useStore((s) => s.theme)]

/** Gradient sky dome + soft clouds. Fog colour matches the horizon so the city fades naturally. */
export function Sky() {
  const t = useTheme()
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
        uniforms: { top: { value: new THREE.Color(t.sky[0]) }, mid: { value: new THREE.Color(t.sky[1]) }, bottom: { value: new THREE.Color(t.sky[2]) } },
        vertexShader: 'varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
        fragmentShader: `uniform vec3 top; uniform vec3 mid; uniform vec3 bottom; varying vec3 vP;
          void main(){ float h = normalize(vP).y;
            vec3 c = mix(bottom, mid, smoothstep(0.0, 0.2, h));
            c = mix(c, top, smoothstep(0.15, 0.75, h));
            gl_FragColor = vec4(c, 1.0); }`,
      }),
    [t],
  )
  const cloud = useMemo(() => new THREE.SpriteMaterial({ map: cloudTexture(), transparent: true, opacity: t.cloud.opacity, color: t.cloud.tint, depthWrite: false, fog: false }), [t])
  const clouds = useMemo(
    () =>
      Array.from({ length: 16 }, (_, i) => {
        const a = (i / 16) * Math.PI * 2 + 0.4
        const r = 900 + (i % 3) * 120
        return { p: [Math.cos(a) * r, 220 + (i % 4) * 55, Math.sin(a) * r] as [number, number, number], s: 420 + (i % 5) * 90 }
      }),
    [],
  )
  return (
    <group>
      <mesh material={mat} renderOrder={-10} scale={1700}>
        <sphereGeometry args={[1, 32, 16]} />
      </mesh>
      {clouds.map((c, i) => (
        <sprite key={i} position={c.p} scale={[c.s, c.s * 0.4, 1]} material={cloud} />
      ))}
    </group>
  )
}

/** Soft studio-style reflections/fill so materials have depth instead of flat colour. */
export function Lighting() {
  const t = useTheme()
  return (
    <Environment resolution={256} environmentIntensity={t.env}>
      <Lightformer form="rect" intensity={3} color="#fff7ec" position={[10, 30, 10]} rotation-x={Math.PI / 2} scale={[60, 60, 1]} />
      <Lightformer form="rect" intensity={1.4} color="#cfe6f2" position={[-40, 14, 10]} rotation-y={Math.PI / 2} scale={[50, 20, 1]} />
      <Lightformer form="rect" intensity={1} color="#f3ece0" position={[40, 10, -30]} rotation-y={-Math.PI / 2} scale={[50, 18, 1]} />
      <Lightformer form="ring" intensity={0.8} color="#ffffff" position={[0, 12, -50]} scale={30} />
    </Environment>
  )
}

export function Effects() {
  const q = useStore((s) => s.quality)
  const t = useTheme()
  return (
    <EffectComposer multisampling={q === 'High' ? 0 : 4} enableNormalPass={false}>
      {q === 'High' ? <N8AO aoRadius={1.6} distanceFalloff={1} intensity={2.6} quality="medium" halfRes /> : <></>}
      {q !== 'Low' ? <Bloom intensity={t.bloom.intensity} luminanceThreshold={t.bloom.threshold} luminanceSmoothing={0.25} mipmapBlur /> : <></>}
      <ToneMapping mode={ToneMappingMode.NEUTRAL} />
      <HueSaturation saturation={t.sat} />
      <BrightnessContrast contrast={t.contrast} brightness={t.brightness} />
      {q === 'High' ? <Vignette offset={0.32} darkness={0.4} /> : <></>}
      {q === 'High' ? <SMAA /> : <></>}
    </EffectComposer>
  )
}
