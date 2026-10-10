export type Tier = 'low' | 'medium' | 'high'

export interface Device {
  webgl2: boolean
  mobile: boolean
  tier: Tier
  reducedMotion: boolean
  maxTexture: number
  renderer: string
}

let cached: Device | null = null

/**
 * One-off capability probe (client only). Picks a sensible starting quality so weak devices
 * never begin on settings they can't sustain.
 */
export function getDevice(): Device {
  if (cached) return cached
  if (typeof window === 'undefined') return { webgl2: true, mobile: false, tier: 'high', reducedMotion: false, maxTexture: 8192, renderer: '' }

  let webgl2 = false
  let renderer = ''
  let maxTexture = 0
  try {
    const c = document.createElement('canvas')
    const gl = c.getContext('webgl2')
    if (gl) {
      webgl2 = true
      const ext = gl.getExtension('WEBGL_debug_renderer_info')
      renderer = ext ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : ''
      maxTexture = gl.getParameter(gl.MAX_TEXTURE_SIZE) as number
      gl.getExtension('WEBGL_lose_context')?.loseContext()
    }
  } catch {
    webgl2 = false
  }

  const ua = navigator.userAgent
  const mobile = /Android|iPhone|iPad|iPod|Mobile|Silk/i.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)
  const software = /swiftshader|llvmpipe|software|basic render|microsoft basic/i.test(renderer)
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8
  const cores = navigator.hardwareConcurrency ?? 4
  // integrated / mobile GPUs struggle with the heavy post-processing, so they start a notch lower
  const weakGpu = /intel(?!.*\barc\b)|mali|adreno|powervr|videocore|apple gpu(?!.*m\d)|llvmpipe|swiftshader/i.test(renderer) && !/apple m\d/i.test(renderer)
  const veryWeakGpu = /hd graphics|uhd graphics 6|mali-[gt]?[0-5]\d\d|adreno \(?[1-5]\d\d/i.test(renderer)
  const tier: Tier =
    software || mem <= 2 || cores <= 2 || maxTexture < 4096 || veryWeakGpu ? 'low' : mobile || weakGpu || mem <= 4 || cores <= 4 ? 'medium' : 'high'
  const reducedMotion = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches

  cached = { webgl2, mobile, tier, reducedMotion, maxTexture, renderer }
  return cached
}

/** Largest pixel ratio that keeps the framebuffer inside a per-quality pixel budget. */
export function dprFor(quality: 'Low' | 'Medium' | 'High', width: number, height: number, scale = 1): number {
  const budget = quality === 'High' ? 3.4e6 : quality === 'Medium' ? 2.0e6 : 1.2e6
  const maxRatio = quality === 'High' ? 2 : quality === 'Medium' ? 1.5 : 1
  const fit = Math.sqrt(budget / Math.max(1, width * height))
  return Math.max(0.5, Math.min(maxRatio, fit, window.devicePixelRatio || 1) * scale)
}
