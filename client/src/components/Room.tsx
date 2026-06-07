import { useState } from 'react'
import type { CSSProperties, MouseEvent, PointerEvent } from 'react'
import { TABLE_SPECS, TABLE_TYPE_LABELS } from '../constants'
import { useTableDrag } from '../hooks/useTableDrag'
import type { GameTable, NewTableDraft, Position, RoomSize } from '../types'
import {
  getPlacementError,
  getTableDisplayColor,
} from '../utils/tableGeometry'
import { GameTable as GameTableView } from './GameTable'
import { ParticlesBackground } from './ParticlesBackground'
import sharedStyles from './Shared.module.css'
import styles from './Room.module.css'

type RoomStyle = CSSProperties & {
  '--room-width': string
  '--room-height': string
}

type PreviewStyle = CSSProperties & {
  '--table-color': string
}

type RoomProps = {
  tables: GameTable[]
  roomSize: RoomSize
  selectedId: number | null
  clearanceIssueIds: Set<number>
  pendingTable: NewTableDraft | null
  canSelectTables: boolean
  canDragTables: boolean
  onSelectTable: (id: number) => void
  onMoveTable: (id: number, position: Position) => void
  onMoveFinished: (
    id: number,
    originPosition: Position,
    finalPosition: Position,
  ) => void
  onPlacePendingTable: (position: Position) => void
  onCancelPendingTable: () => void
}

function previewTableFrom(draft: NewTableDraft, position: Position): GameTable {
  return {
    ...draft,
    id: -1,
    position,
  }
}

export function Room({
  tables,
  roomSize,
  selectedId,
  clearanceIssueIds,
  pendingTable,
  canSelectTables,
  canDragTables,
  onSelectTable,
  onMoveTable,
  onMoveFinished,
  onPlacePendingTable,
  onCancelPendingTable,
}: RoomProps) {
  const [previewPosition, setPreviewPosition] = useState<Position | null>(null)
  const {
    roomRef,
    draggingId,
    getRoomPosition,
    handleTablePointerDown,
    handleTablePointerMove,
    handleTablePointerUp,
  } = useTableDrag({
    roomSize,
    pendingTable,
    canDragTables,
    onSelectTable,
    onMoveTable,
    onMoveFinished,
  })

  const roomStyle: RoomStyle = {
    '--room-width': `${roomSize.width}px`,
    '--room-height': `${roomSize.height}px`,
  }

  const previewTable =
    pendingTable && previewPosition
      ? previewTableFrom(pendingTable, previewPosition)
      : null
  const previewError = previewTable
    ? getPlacementError(previewTable, tables, roomSize)
    : null

  const handleRoomPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!pendingTable || draggingId !== null) {
      return
    }

    const nextPreview = getRoomPosition(
      event,
      previewTableFrom(pendingTable, { x: 0, y: 0 }),
    )

    setPreviewPosition(nextPreview)
  }

  const handleRoomClick = (event: MouseEvent<HTMLDivElement>) => {
    if (!pendingTable || event.target !== event.currentTarget) {
      return
    }

    const nextPosition = getRoomPosition(
      event,
      previewTableFrom(pendingTable, { x: 0, y: 0 }),
    )

    onPlacePendingTable(nextPosition)
  }

  return (
    <section className={styles.roomSection} aria-label="Terem">
      <div className={styles.roomSectionHeader}>
        <div>
          <h2>Terem</h2>
          <p>
            {roomSize.width} x {roomSize.height} px
          </p>
        </div>
        {pendingTable ? (
          <button
            type="button"
            className={`${sharedStyles.button} ${sharedStyles.buttonGhost}`}
            onClick={onCancelPendingTable}
          >
            lerakas abbahagy
          </button>
        ) : null}
      </div>

      <div className={styles.roomScroller}>
        <div
          ref={roomRef}
          className={styles.room}
          style={roomStyle}
          onPointerMove={handleRoomPointerMove}
          onPointerLeave={() => setPreviewPosition(null)}
          onClick={handleRoomClick}
        >
          <ParticlesBackground quantity={95} color="#38f8ff" />

          {tables.map((table) => (
            <GameTableView
              key={table.id}
              table={table}
              selected={selectedId === table.id}
              hasClearanceIssue={clearanceIssueIds.has(table.id)}
              isDragging={draggingId === table.id}
              interactive={canSelectTables}
              draggable={canDragTables && !table.isLocked}
              onSelect={onSelectTable}
              onPointerDown={handleTablePointerDown}
              onPointerMove={handleTablePointerMove}
              onPointerUp={handleTablePointerUp}
            />
          ))}

          {previewTable ? (
            <div
              className={[
                styles.placementPreview,
                previewError ? styles.placementPreviewInvalid : '',
              ]
                .filter(Boolean)
                .join(' ')}
              style={
                {
                  left: previewTable.position.x,
                  top: previewTable.position.y,
                  width: TABLE_SPECS[previewTable.type].width,
                  height: TABLE_SPECS[previewTable.type].height,
                  '--table-color': getTableDisplayColor(
                    previewTable.color,
                    previewTable.status,
                  ),
                } as PreviewStyle
              }
            >
              {TABLE_TYPE_LABELS[previewTable.type]}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}
