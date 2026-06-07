import { MAX_ROOM_SIZE, MIN_ROOM_SIZE } from '../constants'
import { useRoomSizeForm } from '../hooks/useRoomSizeForm'
import type { RoomSize } from '../types'
import sharedStyles from './Shared.module.css'
import styles from './RoomControls.module.css'

type RoomControlsProps = {
  roomSize: RoomSize
  tableCount: number
  onApplyRoomSize: (roomSize: RoomSize) => void
  onOpenAddTable: () => void
  onReloadInitialTables: () => void
}

export function RoomControls({
  roomSize,
  tableCount,
  onApplyRoomSize,
  onOpenAddTable,
  onReloadInitialTables,
}: RoomControlsProps) {
  const { width, height, setWidth, setHeight, applyRoomSize } =
    useRoomSizeForm({ roomSize, onApplyRoomSize })

  return (
    <section className={`${sharedStyles.panel} ${styles.controlsPanel}`}>
      <div className={sharedStyles.panelTitleRow}>
        <div>
          <h2>vezerlo panel</h2>
          <p>{tableCount} asztalok szama</p>
        </div>
      </div>

      <button
        type="button"
        className={`${sharedStyles.button} ${sharedStyles.buttonPrimary} ${sharedStyles.buttonWide}`}
        onClick={onOpenAddTable}
      >
        uj asztal felvetel
      </button>

      <form
        className={styles.roomSizeForm}
        onSubmit={(event) => {
          event.preventDefault()
          applyRoomSize()
        }}
      >
        <label className={sharedStyles.field}>
          <span>Terem szelesseg</span>
          <input
            type="number"
            min={MIN_ROOM_SIZE.width}
            max={MAX_ROOM_SIZE.width}
            value={width}
            onChange={(event) => setWidth(Number(event.target.value))}
          />
        </label>

        <label className={sharedStyles.field}>
          <span>Terem magassag</span>
          <input
            type="number"
            min={MIN_ROOM_SIZE.height}
            max={MAX_ROOM_SIZE.height}
            value={height}
            onChange={(event) => setHeight(Number(event.target.value))}
          />
        </label>

        <button
          type="submit"
          className={`${sharedStyles.button} ${sharedStyles.buttonSecondary} ${sharedStyles.buttonWide}`}
        >
          meret alkalmazasa
        </button>
      </form>

      <button
        type="button"
        className={`${sharedStyles.button} ${sharedStyles.buttonWide}`}
        onClick={onReloadInitialTables}
      >
        Kiindulo asztalok
      </button>
    </section>
  )
}
