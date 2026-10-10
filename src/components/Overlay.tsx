'use client'
import { useStore } from '@/lib/store'
import Dialogue from './Dialogue'
import BackToOffice from './ui/BackToOffice'
import Caption from './ui/Caption'
import Controls from './ui/Controls'
import Notices from './ui/Notices'
import RoomMenu from './ui/RoomMenu'
import Splash from './ui/Splash'
import TopBar from './ui/TopBar'
import WalkPad from './ui/WalkPad'

/** Maps the 3D "Time" theme to the UI token set in globals.css. */
const UI_THEME = { Day: 'day', 'Golden hour': 'golden', Night: 'night' } as const

export default function Overlay() {
  const theme = useStore((s) => s.theme)
  return (
    <div data-ui-theme={UI_THEME[theme]} className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="pointer-events-none absolute inset-0 select-none text-[var(--ui-text)]">
        <TopBar />
        <RoomMenu />
        <Caption />
        <Controls />
        <WalkPad />
        <BackToOffice />
        <Notices />
        <Dialogue />
      </div>
      <Splash />
    </div>
  )
}
