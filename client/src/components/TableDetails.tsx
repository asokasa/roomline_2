import {
  CATEGORY_LABELS,
  COLOR_LABELS,
  TABLE_SPECS,
  TABLE_TYPE_LABELS,
} from '../constants'
import type { GameTable } from '../types'
import sharedStyles from './Shared.module.css'
import styles from './TableDetails.module.css'

type TableDetailsProps = {
  table: GameTable | null
  hasClearanceIssue: boolean
  onDelete: (id: number) => void
  onStatusChange: (id: number, status: number) => void
}

export function TableDetails({
  table,
  hasClearanceIssue,
  onDelete,
  onStatusChange,
}: TableDetailsProps) {
  if (!table) {
    return (
      <section className={`${sharedStyles.panel} ${styles.detailsPanel}`}>
        <h2>asztal reszletei</h2>
        <p className={styles.emptyState}>valassz asztalt</p>
      </section>
    )
  }

  const spec = TABLE_SPECS[table.type]

  return (
    <section className={`${sharedStyles.panel} ${styles.detailsPanel}`}>
      <div className={sharedStyles.panelTitleRow}>
        <div>
          <h2>{TABLE_TYPE_LABELS[table.type]}</h2>
          <p>{CATEGORY_LABELS[table.category]} kategória</p>
        </div>
        {table.isLocked ? <span className={sharedStyles.pill}>fix</span> : null}
      </div>

      <dl className={styles.detailList}>
        <div>
          <dt>tipus</dt>
          <dd>{TABLE_TYPE_LABELS[table.type]}</dd>
        </div>
        <div>
          <dt>kat</dt>
          <dd>{CATEGORY_LABELS[table.category]}</dd>
        </div>
        <div>
          <dt>szin</dt>
          <dd>{COLOR_LABELS[table.color]}</dd>
        </div>
        <div>
          <dt>meret</dt>
          <dd>
            {spec.width} x {spec.height} px
          </dd>
        </div>
        <div>
          <dt>pozi</dt>
          <dd>
            x: {table.position.x}, y: {table.position.y}
          </dd>
        </div>
      </dl>

      <label className={sharedStyles.field}>
        <span>allapot</span>
        <div className={sharedStyles.rangeRow}>
          <input
            type="range"
            min="1"
            max="10"
            value={table.status}
            onChange={(event) =>
              onStatusChange(table.id, Number(event.target.value))
            }
          />
          <strong>{table.status}/10</strong>
        </div>
      </label>

      {hasClearanceIssue ? (
        <p className={styles.warningText}>Az asztal helyigenye serult.</p>
      ) : null}

      <button
        type="button"
        className={`${sharedStyles.button} ${sharedStyles.buttonDanger}`}
        onClick={() => onDelete(table.id)}
      >
        Asztal torlese
      </button>
    </section>
  )
}
