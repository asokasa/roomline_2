import {
  CATEGORY_LABELS,
  COLOR_LABELS,
  TABLE_TYPE_LABELS,
} from '../constants'
import type { GameTable } from '../types'
import styles from './TableFacts.module.css'

type TableFactsProps = {
  table: GameTable
}

export function TableFacts({ table }: TableFactsProps) {
  return (
    <dl className={styles.detailList}>
      <div>
        <dt>Tipus</dt>
        <dd>{TABLE_TYPE_LABELS[table.type]}</dd>
      </div>
      <div>
        <dt>Kategoria</dt>
        <dd>{CATEGORY_LABELS[table.category]}</dd>
      </div>
      <div>
        <dt>Szin</dt>
        <dd>{COLOR_LABELS[table.color]}</dd>
      </div>
      <div>
        <dt>Allapot</dt>
        <dd>{table.status}/10</dd>
      </div>
      <div>
        <dt>Pozicio</dt>
        <dd>
          x: {table.position.x}, y: {table.position.y}
        </dd>
      </div>
    </dl>
  )
}
