import type { CSSProperties, PointerEvent } from 'react'
import {
  CATEGORY_LABELS,
  TABLE_SPECS,
  TABLE_TYPE_LABELS,
} from '../constants'
import type { GameTable as GameTableData } from '../types'
import { getTableDisplayColor } from '../utils/tableGeometry'
import styles from './GameTable.module.css'

type TableStyle = CSSProperties & {
  '--table-color': string
}

type GameTableProps = {
  table: GameTableData
  selected: boolean
  hasClearanceIssue: boolean
  isDragging: boolean
  interactive: boolean
  draggable: boolean
  onSelect: (id: number) => void
  onPointerDown: (
    table: GameTableData,
    event: PointerEvent<HTMLButtonElement>,
  ) => void
  onPointerMove: (
    table: GameTableData,
    event: PointerEvent<HTMLButtonElement>,
  ) => void
  onPointerUp: (
    table: GameTableData,
    event: PointerEvent<HTMLButtonElement>,
  ) => void
}

export function GameTable({
  table,
  selected,
  hasClearanceIssue,
  isDragging,
  interactive,
  draggable,
  onSelect,
  onPointerDown,
  onPointerMove,
  onPointerUp,
}: GameTableProps) {
  const spec = TABLE_SPECS[table.type]
  const style: TableStyle = {
    left: table.position.x,
    top: table.position.y,
    width: spec.width,
    height: spec.height,
    '--table-color': getTableDisplayColor(table.color, table.status),
  }

  const categoryClass = {
    competition: styles.competition,
    normal: styles.normal,
    kids: styles.kids,
  }[table.category]

  const classes = [
    styles.gameTable,
    categoryClass,
    selected ? styles.selected : '',
    hasClearanceIssue ? styles.issue : '',
    isDragging ? styles.dragging : '',
    !interactive ? styles.readOnly : '',
    !draggable && interactive ? styles.selectOnly : '',
    table.isLocked ? styles.locked : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button
      type="button"
      className={classes}
      style={style}
      aria-label={`${TABLE_TYPE_LABELS[table.type]}, ${
        CATEGORY_LABELS[table.category]
      }, állapot ${table.status}/10`}
      disabled={!interactive}
      onClick={(event) => {
        event.stopPropagation()
        if (interactive) {
          onSelect(table.id)
        }
      }}
      onPointerDown={(event) => onPointerDown(table, event)}
      onPointerMove={(event) => onPointerMove(table, event)}
      onPointerUp={(event) => onPointerUp(table, event)}
    >
      <span className={styles.type}>{TABLE_TYPE_LABELS[table.type]}</span>
      <span className={styles.status}>{table.status}/10</span>
      <span className={styles.category}>
        {CATEGORY_LABELS[table.category]}
      </span>
      {table.isLocked ? <span className={styles.lock}>Fix</span> : null}
    </button>
  )
}
