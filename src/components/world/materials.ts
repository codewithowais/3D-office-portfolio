import { C } from '@/lib/world'
import { mat } from './primitives'

/** Shared grainy ground materials. */
export const M = {
  ground: mat('#aab4bb', { detail: 0.18, rough: 1 }),
  sidewalk: mat(C.sidewalk, { detail: 0.12, rough: 0.95 }),
  asphalt: mat(C.asphalt, { detail: 0.3, rough: 0.92 }),
  grass: mat(C.grass, { detail: 0.22, rough: 1 }),
  grassDark: mat(C.grassDark, { detail: 0.22, rough: 1 }),
  pitchA: mat('#6fcf64', { detail: 0.35, rough: 1 }),
  pitchB: mat('#5bbd52', { detail: 0.35, rough: 1 }),
  sand: mat('#e8dcc0', { detail: 0.4, rough: 1 }),
}
