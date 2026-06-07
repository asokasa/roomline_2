import type { FormEvent } from 'react'
import {
  CATEGORY_LABELS,
  COLOR_LABELS,
  TABLE_CATEGORIES,
  TABLE_COLOR_OPTIONS,
  TABLE_TYPE_LABELS,
  TABLE_TYPES,
} from '../constants'
import type {
  TableCategory,
  TableColor,
  TableType,
} from '../types'
import type { TableForm } from '../appTypes'
import sharedStyles from '../components/Shared.module.css'
import formStyles from '../components/FormLayouts.module.css'
import styles from './AddTablePage.module.css'

type AddTablePageProps = {
  isAdmin: boolean
  newTableForm: TableForm
  newTableSaving: boolean
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onStartPlacement: () => void
  onChange: <K extends keyof TableForm>(key: K, value: TableForm[K]) => void
}

export function AddTablePage({
  isAdmin,
  newTableForm,
  newTableSaving,
  onSubmit,
  onStartPlacement,
  onChange,
}: AddTablePageProps) {
  if (!isAdmin) {
    return (
      <main className={styles.centerPage}>
        <section className={`${sharedStyles.panel} ${styles.card}`}>
          <h2>Nincs jogosultsag</h2>
          <p>Asztalt csak adminisztrator hozhat letre.</p>
        </section>
      </main>
    )
  }

  return (
    <main className={styles.centerPage}>
      <section className={`${sharedStyles.panel} ${styles.card}`}>
        <h2>Asztal hozzaadasa</h2>
        <form className={formStyles.formStack} onSubmit={onSubmit}>
          <label className={sharedStyles.field}>
            <span>Nev</span>
            <input
              value={newTableForm.name}
              onChange={(event) => onChange('name', event.target.value)}
              placeholder="Pelda: Biliard 4"
            />
          </label>
          <label className={sharedStyles.field}>
            <span>Tipus</span>
            <select
              value={newTableForm.type}
              onChange={(event) =>
                onChange('type', event.target.value as TableType)
              }
            >
              {TABLE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {TABLE_TYPE_LABELS[type]}
                </option>
              ))}
            </select>
          </label>
          <label className={sharedStyles.field}>
            <span>Kategoria</span>
            <select
              value={newTableForm.category}
              onChange={(event) =>
                onChange('category', event.target.value as TableCategory)
              }
            >
              {TABLE_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {CATEGORY_LABELS[category]}
                </option>
              ))}
            </select>
          </label>
          <label className={sharedStyles.field}>
            <span>Szin</span>
            <select
              value={newTableForm.color}
              onChange={(event) =>
                onChange('color', event.target.value as TableColor)
              }
            >
              {TABLE_COLOR_OPTIONS.map((color) => (
                <option key={color} value={color}>
                  {COLOR_LABELS[color]}
                </option>
              ))}
            </select>
          </label>
          <label className={sharedStyles.field}>
            <span>Allapot</span>
            <div className={sharedStyles.rangeRow}>
              <input
                type="range"
                min="1"
                max="10"
                value={newTableForm.status}
                onChange={(event) => onChange('status', Number(event.target.value))}
              />
              <strong>{newTableForm.status}/10</strong>
            </div>
          </label>
          <div className={formStyles.twoColumn}>
            <label className={sharedStyles.field}>
              <span>x koordinata</span>
              <input
                type="number"
                min="0"
                value={newTableForm.x}
                onChange={(event) => onChange('x', Number(event.target.value))}
              />
            </label>
            <label className={sharedStyles.field}>
              <span>y koordinata</span>
              <input
                type="number"
                min="0"
                value={newTableForm.y}
                onChange={(event) => onChange('y', Number(event.target.value))}
              />
            </label>
          </div>
          <label className={formStyles.checkboxField}>
            <input
              type="checkbox"
              checked={newTableForm.isLocked}
              onChange={(event) => onChange('isLocked', event.target.checked)}
            />
            <span>is-locked: nem mozgathato draggel</span>
          </label>
          <button
            type="submit"
            className={`${sharedStyles.button} ${sharedStyles.buttonPrimary} ${sharedStyles.buttonWide}`}
            disabled={newTableSaving}
          >
            {newTableSaving ? 'Letrehozas...' : 'Asztal letrehozasa'}
          </button>
          <button
            type="button"
            className={`${sharedStyles.button} ${sharedStyles.buttonSecondary} ${sharedStyles.buttonWide}`}
            disabled={newTableSaving}
            onClick={onStartPlacement}
          >
            Drag/drop lerakas a teremben
          </button>
        </form>
      </section>
    </main>
  )
}
