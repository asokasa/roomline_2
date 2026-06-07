import {
  CATEGORY_LABELS,
  TABLE_CATEGORIES,
  TABLE_TYPE_LABELS,
  TABLE_TYPES,
} from '../constants'
import type { GameTable } from '../types'
import sharedStyles from './Shared.module.css'
import styles from './SummaryPanel.module.css'

type SummaryPanelProps = {
  tables: GameTable[]
}

function formatAverage(tables: GameTable[]) {
  if (tables.length === 0) {
    return '-'
  }

  const average =
    tables.reduce((sum, table) => sum + table.status, 0) / tables.length

  return average.toFixed(1)
}

export function SummaryPanel({ tables }: SummaryPanelProps) {
  return (
    <section className={`${sharedStyles.panel} ${styles.summaryPanel}`}>
      <h2>Osszesites</h2>

      <div className={styles.summaryTotal}>
        <span>lehelyezett asztalok</span>
        <strong>{tables.length}</strong>
      </div>

      <div className={styles.summaryList}>
        {TABLE_TYPES.map((tableType) => {
          const tablesByType = tables.filter((table) => table.type === tableType)

          return (
            <div className={styles.summaryRow} key={tableType}>
              <span>{TABLE_TYPE_LABELS[tableType]}</span>
              <strong>
                {tablesByType.length} db / {formatAverage(tablesByType)}
              </strong>
            </div>
          )
        })}
      </div>

      <div className={styles.categorySummary}>
        {TABLE_CATEGORIES.map((category) => (
          <span key={category}>
            {CATEGORY_LABELS[category]}:{' '}
            {tables.filter((table) => table.category === category).length}
          </span>
        ))}
      </div>
    </section>
  )
}
