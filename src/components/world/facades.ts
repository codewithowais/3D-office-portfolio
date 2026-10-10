import * as THREE from 'three'

export type FacadeStyle = 'glass' | 'brick' | 'concrete'

interface Rect {
  x: number
  y: number
  w: number
  h: number
}

/** One texture tile = 7 m x 7 m = 2 columns x 2 floors of 3.5 m cells, drawn at 256 px. */
const CELL = 128

/** Window rectangles per style, used by both the colour and the night-glow textures. */
export function windowRects(style: FacadeStyle): Rect[] {
  const out: Rect[] = []
  for (let cy = 0; cy < 2; cy++)
    for (let cx = 0; cx < 2; cx++) {
      const x = cx * CELL
      const y = cy * CELL
      if (style === 'glass') out.push({ x: x + 6, y: y + 8, w: 116, h: 84 })
      else if (style === 'brick') out.push({ x: x + 28, y: y + 24, w: 72, h: 72 })
      else out.push({ x: x + 6, y: y + 32, w: 116, h: 60 })
    }
  return out
}

const cache = new Map<string, THREE.CanvasTexture>()

function tex(key: string, draw: (g: CanvasRenderingContext2D) => void, srgb = true) {
  const hit = cache.get(key)
  if (hit) return hit
  const c = document.createElement('canvas')
  c.width = c.height = 256
  draw(c.getContext('2d')!)
  const t = new THREE.CanvasTexture(c)
  if (srgb) t.colorSpace = THREE.SRGBColorSpace
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.anisotropy = 8
  cache.set(key, t)
  return t
}

function shade(hex: string, f: number) {
  const c = new THREE.Color(hex)
  c.multiplyScalar(f)
  return `#${c.getHexString()}`
}

function glassPane(g: CanvasRenderingContext2D, r: Rect, glass: string) {
  const grad = g.createLinearGradient(r.x, r.y, r.x + r.w * 0.3, r.y + r.h)
  grad.addColorStop(0, shade(glass, 1.35))
  grad.addColorStop(0.55, glass)
  grad.addColorStop(1, shade(glass, 0.55))
  g.fillStyle = grad
  g.fillRect(r.x, r.y, r.w, r.h)
  // sky reflection streak
  g.fillStyle = 'rgba(255,255,255,0.16)'
  g.beginPath()
  g.moveTo(r.x + r.w * 0.15, r.y)
  g.lineTo(r.x + r.w * 0.5, r.y)
  g.lineTo(r.x + r.w * 0.2, r.y + r.h)
  g.lineTo(r.x, r.y + r.h)
  g.closePath()
  g.fill()
}

function brickBackground(g: CanvasRenderingContext2D, wall: string, bump: boolean) {
  g.fillStyle = bump ? '#000' : '#d3cdc2'
  g.fillRect(0, 0, 256, 256)
  let seed = 11
  const rnd = () => {
    seed = (seed * 16807) % 2147483647
    return seed / 2147483647
  }
  const bh = 8
  const bw = 24
  for (let row = 0; row < 256 / bh; row++) {
    const off = row % 2 ? bw / 2 : 0
    for (let x = -bw; x < 256 + bw; x += bw) {
      g.fillStyle = bump ? '#fff' : shade(wall, 0.82 + rnd() * 0.34)
      g.fillRect(x + off + 1, row * bh + 1, bw - 2, bh - 2)
    }
  }
}

/** Colour map for a facade style. */
export function facadeMap(style: FacadeStyle, wall: string, glass: string) {
  return tex(`f-${style}-${wall}-${glass}`, (g) => {
    const rects = windowRects(style)
    if (style === 'glass') {
      // aluminium frame + opaque spandrel panels under each glass pane
      g.fillStyle = '#2a323a'
      g.fillRect(0, 0, 256, 256)
      for (const r of rects) {
        glassPane(g, r, glass)
        g.fillStyle = wall
        g.fillRect(r.x, r.y + r.h + 3, r.w, 28)
        g.fillStyle = 'rgba(0,0,0,0.22)'
        g.fillRect(r.x + r.w / 2 - 1, r.y, 2, r.h)
        g.fillRect(r.x + r.w / 4 - 1, r.y, 1.5, r.h)
        g.fillRect(r.x + (r.w * 3) / 4 - 1, r.y, 1.5, r.h)
      }
    } else if (style === 'brick') {
      brickBackground(g, wall, false)
      for (const r of rects) {
        g.fillStyle = '#efefea'
        g.fillRect(r.x - 6, r.y - 6, r.w + 12, r.h + 12) // painted frame
        g.fillStyle = '#c9c4b8'
        g.fillRect(r.x - 10, r.y + r.h + 4, r.w + 20, 6) // stone sill
        g.fillRect(r.x - 8, r.y - 12, r.w + 16, 6) // lintel
        glassPane(g, r, glass)
        g.fillStyle = '#efefea'
        g.fillRect(r.x + r.w / 2 - 2, r.y, 4, r.h)
        g.fillRect(r.x, r.y + r.h / 2 - 2, r.w, 4)
      }
    } else {
      // precast concrete with ribbon windows and floor slab lines
      g.fillStyle = wall
      g.fillRect(0, 0, 256, 256)
      let seed = 5
      for (let i = 0; i < 900; i++) {
        seed = (seed * 16807) % 2147483647
        const v = seed / 2147483647
        g.fillStyle = `rgba(${v < 0.5 ? '0,0,0' : '255,255,255'},0.05)`
        g.fillRect((v * 9973) % 256, ((v * 7919) % 256), 3, 3)
      }
      for (let cy = 0; cy < 2; cy++) {
        g.fillStyle = 'rgba(0,0,0,0.16)'
        g.fillRect(0, cy * CELL, 256, 7)
        g.fillStyle = 'rgba(255,255,255,0.18)'
        g.fillRect(0, cy * CELL + 7, 256, 2)
      }
      for (const r of rects) {
        g.fillStyle = '#30363c'
        g.fillRect(r.x - 2, r.y - 2, r.w + 4, r.h + 4)
        glassPane(g, r, glass)
        g.fillStyle = '#30363c'
        for (let i = 1; i < 4; i++) g.fillRect(r.x + (r.w / 4) * i - 1.5, r.y, 3, r.h)
      }
    }
  })
}

/** Bump map giving brick its mortar lines. */
export function brickBump() {
  return tex('f-brick-bump', (g) => {
    brickBackground(g, '#ffffff', true)
  }, false)
}

/** Night glow: a deterministic subset of the windows, warm and with varying brightness. */
export function facadeGlow(style: FacadeStyle, variant: number) {
  return tex(`glow-${style}-${variant}`, (g) => {
    g.fillStyle = '#000'
    g.fillRect(0, 0, 256, 256)
    windowRects(style).forEach((r, i) => {
      const on = ((variant * 7 + i * 5 + 3) % 4) !== 0
      if (!on) return
      const b = 150 + ((variant + i * 3) % 4) * 35
      g.fillStyle = `rgb(${b},${Math.round(b * 0.84)},${Math.round(b * 0.55)})`
      g.fillRect(r.x, r.y, r.w, r.h)
    })
  })
}

/** World-space asphalt: patches, hairline cracks and tyre wear. */
export function asphaltTexture() {
  return tex('asphalt', (g) => {
    const img = g.createImageData(256, 256)
    let seed = 21
    const rnd = () => {
      seed = (seed * 16807) % 2147483647
      return seed / 2147483647
    }
    for (let i = 0; i < 65536; i++) {
      const v = 205 + rnd() * 50
      img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = v
      img.data[i * 4 + 3] = 255
    }
    g.putImageData(img, 0, 0)
    for (let i = 0; i < 14; i++) {
      g.fillStyle = `rgba(0,0,0,${0.05 + rnd() * 0.08})`
      g.fillRect(rnd() * 256, rnd() * 256, 20 + rnd() * 60, 10 + rnd() * 40)
    }
    g.strokeStyle = 'rgba(0,0,0,0.35)'
    g.lineWidth = 1
    for (let i = 0; i < 9; i++) {
      let x = rnd() * 256
      let y = rnd() * 256
      g.beginPath()
      g.moveTo(x, y)
      for (let k = 0; k < 7; k++) {
        x += (rnd() - 0.5) * 30
        y += (rnd() - 0.3) * 24
        g.lineTo(x, y)
      }
      g.stroke()
    }
  })
}

/** World-space paving: 1.2 m slabs with joints and slight tonal variation. */
export function paverTexture() {
  return tex('paver', (g) => {
    let seed = 3
    const rnd = () => {
      seed = (seed * 16807) % 2147483647
      return seed / 2147483647
    }
    const n = 4
    const s = 256 / n
    for (let y = 0; y < n; y++)
      for (let x = 0; x < n; x++) {
        const v = 226 + rnd() * 29
        g.fillStyle = `rgb(${v},${v},${v})`
        g.fillRect(x * s, y * s, s, s)
      }
    g.fillStyle = 'rgba(0,0,0,0.28)'
    for (let i = 0; i <= n; i++) {
      g.fillRect(i * s - 1, 0, 2, 256)
      g.fillRect(0, i * s - 1, 256, 2)
    }
  })
}
