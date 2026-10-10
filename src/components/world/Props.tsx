'use client'
import { Ball, Box, Cyl, RBox, mat } from './primitives'

const GLOW = mat('#bfe9ff', { emissive: '#7fd0ff', ei: 0.6 })
const WATER = mat('#7cc4ee', { opacity: 0.7 })
const SNACKS = ['#ff6f59', '#ffc233', '#4cc2a0', '#2f80d0', '#ff8fc0', '#f4f6f8']

/**
 * The small things you can use in walk mode. Plain static meshes: they are rendered inside
 * <StaticMerge> with the rest of the office, so they cost a few triangles and no extra draw calls.
 * Positions match the entries in lib/talkables.ts and the obstacles in lib/collision.ts.
 */
export function Props() {
  return (
    <group>
      {/* water cooler (corridor, east wall), faces the corridor */}
      <group position={[2.6, 0, -3.2]} rotation={[0, -Math.PI / 2, 0]}>
        <RBox p={[0, 0.45, 0]} s={[0.42, 0.9, 0.4]} c="#f4f6f8" />
        <Box p={[0, 0.68, 0.21]} s={[0.3, 0.06, 0.02]} c="#2f80d0" cast={false} />
        <Box p={[0, 0.5, 0.22]} s={[0.1, 0.06, 0.06]} c="#e8584a" cast={false} />
        <Cyl p={[0, 1.18, 0]} rad={0.18} h={0.46} m={WATER} cast={false} />
        <Cyl p={[0, 1.44, 0]} rad={0.07} h={0.06} c="#dbe7ef" />
      </group>

      {/* vending machine (lounge, east wall) */}
      <group position={[19.35, 0, 6.4]} rotation={[0, -Math.PI / 2, 0]}>
        <RBox p={[0, 0.95, 0]} s={[1, 1.9, 0.8]} c="#e8584a" />
        <Box p={[-0.12, 1.2, 0.41]} s={[0.66, 1.2, 0.02]} c="#1b2430" cast={false} />
        {[0, 1, 2, 3].map((row) =>
          [0, 1, 2].map((col) => <Box key={`${row}${col}`} p={[-0.3 + col * 0.18, 1.62 - row * 0.28, 0.43]} s={[0.12, 0.18, 0.02]} c={SNACKS[(row * 3 + col) % SNACKS.length]} cast={false} />),
        )}
        <Box p={[0.34, 1.2, 0.41]} s={[0.2, 0.7, 0.02]} m={GLOW} cast={false} />
        <Box p={[0, 0.3, 0.41]} s={[0.7, 0.16, 0.02]} c="#232a27" cast={false} />
        <Box p={[0, 1.9, 0.4]} s={[0.9, 0.1, 0.02]} m={GLOW} cast={false} />
      </group>

      {/* printer / photocopier on a little table (operations) */}
      <group position={[-19.4, 0, -7]} rotation={[0, Math.PI / 2, 0]}>
        <RBox p={[0, 0.38, 0]} s={[0.7, 0.76, 1]} c="#e6b980" />
        <RBox p={[0, 0.98, 0]} s={[0.6, 0.45, 0.8]} c="#f4f6f8" />
        <Box p={[0, 1.22, 0]} s={[0.56, 0.04, 0.7]} c="#2b3238" />
        <Box p={[0.05, 0.9, 0.42]} s={[0.4, 0.04, 0.03]} c="#d3dbe2" cast={false} />
        <Box p={[0.1, 1.05, 0.41]} s={[0.12, 0.08, 0.02]} m={GLOW} cast={false} />
      </group>

      {/* whiteboard on the design room wall */}
      <group position={[9, 1.75, -3.82]}>
        <Box p={[0, 0, 0]} s={[3.1, 1.5, 0.05]} c="#f7f9fb" />
        <Box p={[0, 0.77, 0.01]} s={[3.2, 0.06, 0.07]} c="#8a96a0" />
        <Box p={[0, -0.77, 0.03]} s={[3.2, 0.06, 0.1]} c="#8a96a0" />
        <Box p={[-0.7, 0.2, 0.03]} s={[1.2, 0.04, 0.01]} c="#2f80d0" cast={false} />
        <Box p={[-0.9, -0.1, 0.03]} s={[0.8, 0.04, 0.01]} c="#2f80d0" cast={false} />
        <Box p={[0.7, 0.3, 0.03]} s={[0.7, 0.5, 0.01]} c="#ff6f59" cast={false} />
        <Box p={[0.7, 0.3, 0.035]} s={[0.62, 0.42, 0.01]} c="#f7f9fb" cast={false} />
        <Box p={[0.2, -0.35, 0.03]} s={[1.6, 0.04, 0.01]} c="#0f8b8d" cast={false} />
      </group>

      {/* fire extinguisher and bin */}
      <Cyl p={[2.7, 0.3, 5.6]} rad={0.1} h={0.55} c="#d83a2e" />
      <Cyl p={[2.7, 0.62, 5.6]} rad={0.04} h={0.1} c="#232a27" />
      <Box p={[2.82, 0.9, 5.6]} s={[0.04, 0.3, 0.22]} c="#f4f6f8" cast={false} />
      <Cyl p={[-2.7, 0.24, -5]} rad={0.19} h={0.48} c="#59616b" />
      <Cyl p={[-2.7, 0.5, -5]} rad={0.2} h={0.05} c="#3b4349" />

      {/* light switch plate */}
      <Box p={[2.84, 1.3, -6.2]} s={[0.03, 0.14, 0.09]} c="#f4f6f8" cast={false} />
      <Ball p={[2.82, 1.3, -6.2]} rad={0.02} c="#9aa6b0" cast={false} />
    </group>
  )
}
