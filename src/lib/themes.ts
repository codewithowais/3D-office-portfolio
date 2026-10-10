import type { V3 } from './math'

export type ThemeName = 'Day' | 'Golden hour' | 'Night'
export const THEME_NAMES: ThemeName[] = ['Day', 'Golden hour', 'Night']

export interface Theme {
  sky: [top: string, mid: string, bottom: string]
  fog: string
  sun: { color: string; intensity: number; pos: V3 }
  hemi: { sky: string; ground: string; intensity: number }
  env: number
  bloom: { intensity: number; threshold: number }
  sat: number
  contrast: number
  brightness: number
  /** emissive strength of street-lamp bulbs */
  lamp: number
  /** emissive strength of lit windows */
  windows: number
  /** intensity of the office interior lights */
  interior: number
  cloud: { opacity: number; tint: string }
}

export const THEMES: Record<ThemeName, Theme> = {
  Day: {
    sky: ['#3f9be8', '#a9dcf5', '#eaf5f8'],
    fog: '#eaf5f8',
    sun: { color: '#fff6e6', intensity: 2.5, pos: [55, 95, 70] },
    hemi: { sky: '#ffffff', ground: '#8fa6b4', intensity: 0.55 },
    env: 0.5,
    bloom: { intensity: 0.2, threshold: 0.95 },
    sat: 0.12,
    contrast: 0.1,
    brightness: 0,
    lamp: 0.3,
    windows: 0,
    interior: 0,
    cloud: { opacity: 0.9, tint: '#ffffff' },
  },
  'Golden hour': {
    sky: ['#4a6fd0', '#ff9f7a', '#ffd9a6'],
    fog: '#ffd2a0',
    sun: { color: '#ffa860', intensity: 3.6, pos: [-95, 34, 62] },
    hemi: { sky: '#ffd6b0', ground: '#7a6a8a', intensity: 0.5 },
    env: 0.45,
    bloom: { intensity: 0.4, threshold: 0.85 },
    sat: 0.2,
    contrast: 0.12,
    brightness: -0.02,
    lamp: 1.2,
    windows: 0.5,
    interior: 0.35,
    cloud: { opacity: 0.85, tint: '#ffc9a0' },
  },
  Night: {
    sky: ['#040a22', '#0e1f4a', '#2b3f78'],
    fog: '#1b2b58',
    sun: { color: '#8fb0ff', intensity: 0.7, pos: [40, 85, -45] },
    hemi: { sky: '#5a74c0', ground: '#101a38', intensity: 0.3 },
    env: 0.12,
    bloom: { intensity: 1.0, threshold: 0.6 },
    sat: 0.18,
    contrast: 0.14,
    brightness: 0.02,
    lamp: 4,
    windows: 2.4,
    interior: 1,
    cloud: { opacity: 0.18, tint: '#5a6fb0' },
  },
}
