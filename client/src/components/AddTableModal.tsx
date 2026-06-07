import { useState } from 'react'
import {
  CATEGORY_LABELS,
  COLOR_LABELS,
  TABLE_CATEGORIES,
  TABLE_COLOR_OPTIONS,
  TABLE_SPECS,
  TABLE_TYPE_LABELS,
  TABLE_TYPES,
} from '../constants'
import type {
  NewTableDraft,
  Position,
  RoomSize,
  TableCategory,
  TableColor,
  TableType,
} from '../types'
import { roundPosition } from '../utils/tableGeometry'
import sharedStyles from './Shared.module.css'
import styles from './AddTableModal.module.css'

type AddTableModalProps = {
  open: boolean
  roomSize: RoomSize
  onClose: () => void
  onAddAtCoordinates: (draft: NewTableDraft, position: Position) => void
  onStartPlacement: (draft: NewTableDraft) => void
}

export function AddTableModal({
  open,
  roomSize,
  onClose,
  onAddAtCoordinates,
  onStartPlacement,
}: AddTableModalProps) {
  const [type, setType] = useState<TableType>('snooker')
  const [category, setCategory] = useState<TableCategory>('normal')
  const [color, setColor] = useState<TableColor>('green')
  const [status, setStatus] = useState(7)
  const [position, setPosition] = useState<Position>({ x: 60, y: 60 })
  const [isLocked, setIsLocked] = useState(false)

  if (!open) {
    return null
  }

  const draft: NewTableDraft = {
    type,
    category,
    color,
    status,
    isLocked,
  }
  const spec = TABLE_SPECS[type]

  const updatePosition = (axis: keyof Position, value: string) => {
    setPosition((currentPosition) => ({
      ...currentPosition,
      [axis]: Number(value),
    }))
  }

  return (
    <div className={styles.modalBackdrop} role="presentation">
      <section className={styles.modal} role="dialog" aria-modal="true">
        <div className={styles.modalHeader}>
          <div>
            <h2>uj asztal felvetel</h2>
            <p>{spec.width} x {spec.height} px</p>
          </div>
          <button
            type="button"
            className={sharedStyles.iconButton}
            aria-label="Bezárás"
            onClick={onClose}
          >
            x
          </button>
        </div>

        <form
          className={styles.formGrid}
          onSubmit={(event) => {
            event.preventDefault()
            onAddAtCoordinates(draft, roundPosition(position))
          }}
        >
          <label className={sharedStyles.field}>
            <span>tipus</span>
            <select
              value={type}
              onChange={(event) => setType(event.target.value as TableType)}
            >
              {TABLE_TYPES.map((tableType) => (
                <option key={tableType} value={tableType}>
                  {TABLE_TYPE_LABELS[tableType]}
                </option>
              ))}
            </select>
          </label>

          <label className={sharedStyles.field}>
            <span>kategoria</span>
            <select
              value={category}
              onChange={(event) =>
                setCategory(event.target.value as TableCategory)
              }
            >
              {TABLE_CATEGORIES.map((tableCategory) => (
                <option key={tableCategory} value={tableCategory}>
                  {CATEGORY_LABELS[tableCategory]}
                </option>
              ))}
            </select>
          </label>

          <label className={sharedStyles.field}>
            <span>szin</span>
            <select
              value={color}
              onChange={(event) => setColor(event.target.value as TableColor)}
            >
              {TABLE_COLOR_OPTIONS.map((tableColor) => (
                <option key={tableColor} value={tableColor}>
                  {COLOR_LABELS[tableColor]}
                </option>
              ))}
            </select>
          </label>

          <label className={sharedStyles.field}>
            <span>lehasznaltsag</span>
            <div className={sharedStyles.rangeRow}>
              <input
                type="range"
                min="1"
                max="10"
                value={status}
                onChange={(event) => setStatus(Number(event.target.value))}
              />
              <strong>{status}/10</strong>
            </div>
          </label>

          <label className={sharedStyles.field}>
            <span>x koordinata</span>
            <input
              type="number"
              min="0"
              max={Math.max(0, roomSize.width - spec.width)}
              value={position.x}
              onChange={(event) => updatePosition('x', event.target.value)}
            />
          </label>

          <label className={sharedStyles.field}>
            <span>y koordinata</span>
            <input
              type="number"
              min="0"
              max={Math.max(0, roomSize.height - spec.height)}
              value={position.y}
              onChange={(event) => updatePosition('y', event.target.value)}
            />
          </label>

          <label className={styles.checkboxField}>
            <input
              type="checkbox"
              checked={isLocked}
              onChange={(event) => setIsLocked(event.target.checked)}
            />
            <span>fix hely</span>
          </label>

          <div className={styles.modalActions}>
            <button
              type="button"
              className={sharedStyles.button}
              onClick={onClose}
            >
              megse
            </button>
            <button
              type="button"
              className={`${sharedStyles.button} ${sharedStyles.buttonSecondary}`}
              onClick={() => onStartPlacement(draft)}
            >
              drag n drop
            </button>
            <button
              type="submit"
              className={`${sharedStyles.button} ${sharedStyles.buttonPrimary}`}
            >
              koordinatara teves
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
