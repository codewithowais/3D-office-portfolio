'use client'
import { useEffect, useRef, type ReactNode } from 'react'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

interface Bucket {
  material: THREE.Material
  cast: boolean
  recv: boolean
  geos: THREE.BufferGeometry[]
  meshes: THREE.Mesh[]
}

const KEEP = new Set(['position', 'normal', 'uv'])

/**
 * Collapses every static mesh under `root` into one mesh per (material, shadow flags): hundreds of
 * furniture pieces become a few dozen draw calls. Anything marked `userData.dynamic` (people, cars,
 * doors, markers) and instanced meshes are left alone. Returns a function that undoes it.
 */
export function mergeStatic(root: THREE.Object3D): () => void {
  root.updateWorldMatrix(true, true)
  const inv = new THREE.Matrix4().copy(root.matrixWorld).invert()
  const buckets = new Map<string, Bucket>()
  const mat = new THREE.Matrix4()

  const walk = (o: THREE.Object3D) => {
    if (!o.visible || o.userData.dynamic) return
    const m = o as THREE.Mesh
    if (m.isMesh && !(m as THREE.InstancedMesh).isInstancedMesh && !Array.isArray(m.material) && m.geometry.attributes.position && m.geometry.attributes.normal && m.geometry.attributes.uv) {
      const indexed = !!m.geometry.index
      const key = `${m.material.uuid}|${m.castShadow ? 1 : 0}${m.receiveShadow ? 1 : 0}|${indexed ? 'i' : 'n'}`
      let b = buckets.get(key)
      if (!b) {
        b = { material: m.material, cast: m.castShadow, recv: m.receiveShadow, geos: [], meshes: [] }
        buckets.set(key, b)
      }
      const g = m.geometry.clone()
      for (const name of Object.keys(g.attributes)) if (!KEEP.has(name)) g.deleteAttribute(name)
      g.applyMatrix4(mat.copy(inv).multiply(m.matrixWorld))
      b.geos.push(g)
      b.meshes.push(m)
    }
    for (const c of o.children) walk(c)
  }
  walk(root)

  const made: THREE.Mesh[] = []
  const hidden: THREE.Mesh[] = []
  for (const b of buckets.values()) {
    if (b.geos.length === 0) continue
    const merged = b.geos.length === 1 ? b.geos[0] : mergeGeometries(b.geos, false)
    if (!merged) continue // couldn't merge: keep the originals as they are
    if (b.geos.length > 1) b.geos.forEach((g) => g.dispose())
    const mesh = new THREE.Mesh(merged, b.material)
    mesh.castShadow = b.cast
    mesh.receiveShadow = b.recv
    mesh.userData.mergedStatic = true
    root.add(mesh)
    made.push(mesh)
    for (const m of b.meshes) {
      m.visible = false
      hidden.push(m)
    }
  }

  return () => {
    for (const m of hidden) m.visible = true
    for (const m of made) {
      root.remove(m)
      m.geometry.dispose()
    }
  }
}

/** Wrap a mostly-static part of the scene: it renders normally, then gets merged after mounting. */
export function StaticMerge({ children }: { children: ReactNode }) {
  const ref = useRef<THREE.Group>(null)
  useEffect(() => {
    const g = ref.current
    if (!g) return
    return mergeStatic(g)
  }, [])
  return <group ref={ref}>{children}</group>
}
