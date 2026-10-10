import * as THREE from 'three'

const cache = new Map<string, THREE.CanvasTexture>()

function make(key: string, w: number, h: number, draw: (g: CanvasRenderingContext2D) => void, repeat = false) {
  const hit = cache.get(key)
  if (hit) return hit
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  draw(c.getContext('2d')!)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping
  cache.set(key, t)
  return t
}

/** Light timber floor planks. Tile with repeat. */
export function plankTexture(base = '#ede0c6') {
  return make(`plank${base}`, 256, 256, (g) => {
    g.fillStyle = base
    g.fillRect(0, 0, 256, 256)
    const rows = 8
    for (let r = 0; r < rows; r++) {
      const y = (r * 256) / rows
      g.fillStyle = r % 2 ? 'rgba(120,90,50,0.07)' : 'rgba(255,255,255,0.07)'
      g.fillRect(0, y, 256, 256 / rows)
      g.fillStyle = 'rgba(110,80,40,0.35)'
      g.fillRect(0, y, 256, 1.5)
      const off = (r * 83) % 256
      g.fillRect(off, y, 1.5, 256 / rows)
    }
  }, true)
}

/** Building facade: grid of windows on a flat wall colour. */
export function facadeTexture(wall: string, glass: string) {
  return make(`facade${wall}${glass}`, 128, 128, (g) => {
    g.fillStyle = wall
    g.fillRect(0, 0, 128, 128)
    for (let y = 0; y < 2; y++) {
      for (let x = 0; x < 2; x++) {
        const px = x * 64 + 10
        const py = y * 64 + 12
        g.fillStyle = 'rgba(0,0,0,0.18)'
        g.fillRect(px - 3, py - 3, 50, 46)
        g.fillStyle = glass
        g.fillRect(px, py, 44, 40)
        g.fillStyle = 'rgba(255,255,255,0.18)'
        g.fillRect(px, py, 44, 12)
        g.fillStyle = 'rgba(0,0,0,0.22)'
        g.fillRect(px + 21, py, 2, 40)
      }
    }
  }, true)
}

/** Rounded sign panel with centred text. */
export function labelTexture(text: string, bg: string, fg = '#ffffff', w = 512, h = 128, font = '700') {
  return make(`label${text}${bg}${fg}`, w, h, (g) => {
    g.fillStyle = bg
    g.fillRect(0, 0, w, h)
    g.fillStyle = fg
    g.font = `${font} ${Math.round(h * 0.42)}px Helvetica, Arial, sans-serif`
    g.textAlign = 'center'
    g.textBaseline = 'middle'
    g.fillText(text, w / 2, h / 2 + 2)
  })
}

/** Dark editor window full of green code lines. */
export function screenTexture(seed = 0) {
  return make(`screen${seed}`, 128, 96, (g) => {
    g.fillStyle = '#1b2a25'
    g.fillRect(0, 0, 128, 96)
    for (let i = 0; i < 12; i++) {
      const w = 20 + ((i * 37 + seed * 11) % 70)
      const x = 8 + ((i * 13) % 3) * 8
      g.fillStyle = i % 4 === 0 ? '#ffcf6a' : i % 3 === 0 ? '#7fe3d0' : '#46c2a8'
      g.fillRect(x, 8 + i * 7, w, 3)
    }
  })
}

/** Football net. */
export function netTexture() {
  return make('net', 64, 64, (g) => {
    g.clearRect(0, 0, 64, 64)
    g.strokeStyle = 'rgba(255,255,255,0.85)'
    g.lineWidth = 2
    for (let i = 0; i <= 64; i += 16) {
      g.beginPath()
      g.moveTo(i, 0)
      g.lineTo(i, 64)
      g.moveTo(0, i)
      g.lineTo(64, i)
      g.stroke()
    }
  }, true)
}

/** Neutral grey grain + soft blotches. Multiplies any colour to give it surface detail. */
export function detailTexture() {
  return make('detail', 256, 256, (g) => {
    const img = g.createImageData(256, 256)
    let seed = 7
    const rnd = () => {
      seed = (seed * 16807) % 2147483647
      return seed / 2147483647
    }
    for (let i = 0; i < 256 * 256; i++) {
      const v = 232 + rnd() * 23
      img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = v
      img.data[i * 4 + 3] = 255
    }
    g.putImageData(img, 0, 0)
    for (let i = 0; i < 90; i++) {
      const x = rnd() * 256
      const y = rnd() * 256
      const r = 8 + rnd() * 34
      const grad = g.createRadialGradient(x, y, 0, x, y, r)
      const dark = rnd() < 0.55
      grad.addColorStop(0, dark ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.14)')
      grad.addColorStop(1, 'rgba(0,0,0,0)')
      g.fillStyle = grad
      g.fillRect(x - r, y - r, r * 2, r * 2)
    }
  }, true)
}

/** Soft white cloud puff for sprites. */
export function cloudTexture() {
  return make('cloud', 256, 128, (g) => {
    g.clearRect(0, 0, 256, 128)
    for (let i = 0; i < 14; i++) {
      const x = 40 + (i / 13) * 176 + Math.sin(i * 2.1) * 10
      const y = 70 + Math.sin(i * 1.7) * 14 - Math.sin((i / 13) * Math.PI) * 14
      const r = 26 + Math.abs(Math.sin(i * 3.3)) * 18
      const grad = g.createRadialGradient(x, y, 0, x, y, r)
      grad.addColorStop(0, 'rgba(255,255,255,0.55)')
      grad.addColorStop(1, 'rgba(255,255,255,0)')
      g.fillStyle = grad
      g.fillRect(x - r, y - r, r * 2, r * 2)
    }
  })
}

/** Matches facadeTexture's 2x2 windows: lit windows in white on black, for emissive night windows. */
export function facadeGlowTexture(variant: number) {
  return make(`glow${variant}`, 128, 128, (g) => {
    g.fillStyle = '#000'
    g.fillRect(0, 0, 128, 128)
    const lit = [[1, 1, 0, 1], [0, 1, 1, 1], [1, 0, 1, 0], [1, 1, 1, 0]][variant % 4]
    for (let i = 0; i < 4; i++) {
      if (!lit[i]) continue
      const px = (i % 2) * 64 + 10
      const py = Math.floor(i / 2) * 64 + 12
      g.fillStyle = '#fff'
      g.fillRect(px, py, 44, 40)
    }
  }, true)
}
