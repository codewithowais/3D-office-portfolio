import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { SPH, rbox } from './primitives'

/**
 * A person is built from a handful of merged, vertex-coloured meshes (body, 2 arms, 2 thighs, 2 shins)
 * instead of ~25 little ones, and a single merged "far" mesh for when they are too distant to see detail.
 * Rigs are cached per outfit, so a crowd of similar people shares geometry.
 */
const CAP = new THREE.CapsuleGeometry(0.5, 1, 6, 12)
const TORSO = rbox(0.5, 0.6, 0.28, 0.12)
const SHOE = rbox(0.15, 0.09, 0.3, 0.04)

export const VERTEX_MAT = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85, metalness: 0 })

const _q = new THREE.Quaternion()
const _e = new THREE.Euler()
const _v = new THREE.Vector3()
const _s = new THREE.Vector3()

function xf(pos: [number, number, number], scale: [number, number, number] | number = 1, rot: [number, number, number] = [0, 0, 0]) {
  const sc = typeof scale === 'number' ? ([scale, scale, scale] as const) : scale
  return new THREE.Matrix4().compose(_v.set(pos[0], pos[1], pos[2]), _q.setFromEuler(_e.set(rot[0], rot[1], rot[2])), _s.set(sc[0], sc[1], sc[2]))
}

/** A copy of `geo` transformed by `m` and painted one colour (as vertex colours). */
function paint(geo: THREE.BufferGeometry, m: THREE.Matrix4, color: string) {
  // every part must be non-indexed so they can be merged together (rounded boxes ship un-indexed)
  const g = (geo.index ? geo.toNonIndexed() : geo.clone()).applyMatrix4(m)
  const c = new THREE.Color(color)
  const n = g.attributes.position.count
  const arr = new Float32Array(n * 3)
  for (let i = 0; i < n; i++) {
    arr[i * 3] = c.r
    arr[i * 3 + 1] = c.g
    arr[i * 3 + 2] = c.b
  }
  g.setAttribute('color', new THREE.BufferAttribute(arr, 3))
  return g
}

const merge = (parts: THREE.BufferGeometry[]) => {
  const g = mergeGeometries(parts, false)!
  parts.forEach((p) => p.dispose())
  return g
}

export interface Rig {
  body: THREE.BufferGeometry
  arm: THREE.BufferGeometry
  thigh: THREE.BufferGeometry
  shin: THREE.BufferGeometry
  /** whole person in one mesh, standing / seated, for the distance */
  farStand: THREE.BufferGeometry
  farSit: THREE.BufferGeometry
}

/** `c` mixed toward white by `k` (0..1). */
function tint(c: string, k: number) {
  return '#' + new THREE.Color(c).lerp(new THREE.Color('#ffffff'), k).getHexString()
}

const cache = new Map<string, Rig>()
const EYE = '#1a1512'
const SHOE_C = '#2a2622'

export function getRig(shirt: string, pants: string, skin: string, hair: string, female = false, scarf = ''): Rig {
  const key = `${shirt}|${pants}|${skin}|${hair}|${female ? 'f' : 'm'}|${scarf}`
  const hit = cache.get(key)
  if (hit) return hit

  // joint-local parts (the same numbers the animated rig always used)
  const body = merge([
    // women: narrower shoulders and waist, a skirt over the hips, a bun-less long hairstyle; men: broader chest, short hair
    paint(TORSO, xf([0, 0.31, 0], female ? [0.86, 0.62 / 0.6, 0.9] : [1.04, 0.62 / 0.6, 1.02]), shirt),
    paint(CAP, xf([0, 0.03, 0], [0.46, 0.12, 0.26], [0, 0, Math.PI / 2]), pants),
    ...(female
      ? [
          paint(CAP, xf([0, -0.12, 0], [0.5, 0.2, 0.34], [0, 0, Math.PI / 2]), pants),
          ...(scarf
            ? []
            : [
                paint(SPH, xf([0, 0.74, -0.075], [0.18, 0.26, 0.14]), hair),
                paint(SPH, xf([-0.15, 0.78, 0.0], [0.05, 0.14, 0.09]), hair),
                paint(SPH, xf([0.15, 0.78, 0.0], [0.05, 0.14, 0.09]), hair),
              ]),
          // lips, soft blush, lashes and brows
          paint(SPH, xf([0, 0.745, 0.15], [0.034, 0.011, 0.02]), '#b8434f'),
          paint(SPH, xf([-0.09, 0.775, 0.13], [0.03, 0.02, 0.01]), '#e59a8f'),
          paint(SPH, xf([0.09, 0.775, 0.13], [0.03, 0.02, 0.01]), '#e59a8f'),
          // bigger, brighter eyes with a highlight, long lashes and shaped brows
          paint(SPH, xf([-0.055, 0.81, 0.14], [0.027, 0.032, 0.018]), '#2b1b12'),
          paint(SPH, xf([0.055, 0.81, 0.14], [0.027, 0.032, 0.018]), '#2b1b12'),
          paint(SPH, xf([-0.047, 0.82, 0.156], 0.009), '#ffffff'),
          paint(SPH, xf([0.063, 0.82, 0.156], 0.009), '#ffffff'),
          paint(SPH, xf([-0.055, 0.84, 0.138], [0.042, 0.007, 0.014]), EYE, ),
          paint(SPH, xf([0.055, 0.84, 0.138], [0.042, 0.007, 0.014]), EYE),
          paint(SPH, xf([-0.082, 0.838, 0.134], [0.012, 0.006, 0.012], [0, 0, 0.5]), EYE),
          paint(SPH, xf([0.082, 0.838, 0.134], [0.012, 0.006, 0.012], [0, 0, -0.5]), EYE),
          paint(SPH, xf([-0.058, 0.868, 0.13], [0.045, 0.006, 0.014], [0, 0, 0.12]), '#3a2a20'),
          paint(SPH, xf([0.058, 0.868, 0.13], [0.045, 0.006, 0.014], [0, 0, -0.12]), '#3a2a20'),
        ]
      : []),
    // hijab: wrapped over the hair and neck, with a soft drape over the shoulders and chest; the face stays open
    ...(scarf
      ? [
          paint(SPH, xf([0, 0.83, -0.035], [0.19, 0.215, 0.185]), scarf),
          paint(SPH, xf([0, 0.64, -0.01], [0.17, 0.12, 0.15]), scarf),
          paint(SPH, xf([0, 0.5, 0.0], [0.3, 0.14, 0.2]), scarf),
          paint(SPH, xf([0, 0.42, 0.1], [0.14, 0.17, 0.07]), scarf),
          // lighter inner frame around the face, a gold brooch with a pearl, and a gold belt buckle
          paint(SPH, xf([0, 0.885, 0.045], [0.155, 0.06, 0.11]), tint(scarf, 0.4)),
          paint(SPH, xf([-0.145, 0.78, 0.01], [0.03, 0.12, 0.1]), tint(scarf, 0.25)),
          paint(SPH, xf([0.145, 0.78, 0.01], [0.03, 0.12, 0.1]), tint(scarf, 0.25)),
          paint(SPH, xf([0.1, 0.55, 0.15], 0.03), '#e8c26a'),
          paint(SPH, xf([0.1, 0.55, 0.178], 0.016), '#fff6e6'),
          paint(CAP, xf([0, 0.03, 0.115], [0.07, 0.04, 0.03], [0, 0, Math.PI / 2]), '#e8c26a'),
        ]
      : []),
    paint(CAP, xf([0, 0.66, 0], [0.09, 0.07, 0.09]), skin),
    paint(SPH, xf([0, 0.8, 0], [0.155, 0.17, 0.16]), skin),
    paint(SPH, xf([0, 0.855, -0.015], female ? [0.175, 0.14, 0.18] : [0.165, 0.12, 0.17]), hair),
    paint(SPH, xf([-0.055, 0.81, 0.138], 0.017), EYE),
    paint(SPH, xf([0.055, 0.81, 0.138], 0.017), EYE),
  ])
  const arm = merge([paint(CAP, xf([0, -0.27, 0], [0.115, 0.3, 0.115]), shirt), paint(SPH, xf([0, -0.58, 0], 0.062), skin)])
  const thigh = merge([paint(CAP, xf([0, -0.225, 0], [0.19, 0.25, 0.2]), pants)])
  const shin = merge([paint(CAP, xf([0, -0.225, 0], [0.155, 0.25, 0.17]), pants), paint(SHOE, xf([0, -0.45, 0.05]), SHOE_C)])

  // the far versions: every joint baked in a rest pose (hips at 0.9 standing, 0.5 seated)
  const far = (sit: boolean) => {
    const hipY = sit ? 0.5 : 0.9
    const parts: THREE.BufferGeometry[] = [body.clone().applyMatrix4(xf([0, hipY, 0]))]
    for (const sx of [-1, 1]) {
      const shoulder = xf([sx * 0.325, hipY + 0.56, 0], 1, [sit ? -0.5 : 0, 0, 0])
      parts.push(arm.clone().applyMatrix4(shoulder))
      const hip = xf([sx * 0.12, hipY, 0], 1, [sit ? -Math.PI / 2 : 0, 0, 0])
      parts.push(thigh.clone().applyMatrix4(hip))
      const knee = hip.clone().multiply(xf([0, -0.45, 0], 1, [sit ? Math.PI / 2 : 0, 0, 0]))
      parts.push(shin.clone().applyMatrix4(knee))
    }
    return merge(parts)
  }
  const rig: Rig = { body, arm, thigh, shin, farStand: far(false), farSit: far(true) }
  cache.set(key, rig)
  return rig
}
