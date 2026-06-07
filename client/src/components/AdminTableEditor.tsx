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
  GameTable,
  TableCategory,
  TableColor,
  TableType,
} from '../types'
import type { TableForm } from '../appTypes'
import sharedStyles from './Shared.module.css'
import formStyles from './FormLayouts.module.css'

type AdminTableEditorProps = {
  selectedTable: GameTable | null
  tableEditor: TableForm | null
  tableSaving: boolean
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onChange: <K extends keyof TableForm>(key: K, value: TableForm[K]) => void
}

export function AdminTableEditor({
  selectedTable,
  tableEditor,
  tableSaving,
  onSubmit,
  onChange,
}: AdminTableEditorProps) {
  if (!selectedTable || !tableEditor) {
    return (
      <section className={`${sharedStyles.panel} ${formStyles.panelStack}`}>
        <h2>Asztal szerkesztese</h2>
        <p>Valassz egy asztalt a teremben.</p>
      </section>
    )
  }

  return (
    <section className={`${sharedStyles.panel} ${formStyles.panelStack}`}>
      <div className={formStyles.panelTitleRow}>
        <div>
          <h2>Asztal szerkesztese</h2>
          <p>{selectedTable.name ?? TABLE_TYPE_LABELS[selectedTable.type]}</p>
        </div>
        {selectedTable.isLocked ? (
          <span className={sharedStyles.pill}>fix</span>
        ) : null}
      </div>

      <form className={formStyles.formStack} onSubmit={onSubmit}>
        <label className={sharedStyles.field}>
          <span>Nev</span>
          <input
            value={tableEditor.name}
            onChange={(event) => onChange('name', event.target.value)}
          />
        </label>
        <label className={sharedStyles.field}>
          <span>Tipus</span>
          <select
            value={tableEditor.type}
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
            value={tableEditor.category}
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
            value={tableEditor.color}
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
              value={tableEditor.status}
              onChange={(event) => onChange('status', Number(event.target.value))}
            />
            <strong>{tableEditor.status}/10</strong>
          </div>
        </label>
        <div className={formStyles.twoColumn}>
          <label className={sharedStyles.field}>
            <span>x koordinata</span>
            <input
              type="number"
              min="0"
              value={tableEditor.x}
              onChange={(event) => onChange('x', Number(event.target.value))}
            />
          </label>
          <label className={sharedStyles.field}>
            <span>y koordinata</span>
            <input
              type="number"
              min="0"
              value={tableEditor.y}
              onChange={(event) => onChange('y', Number(event.target.value))}
            />
          </label>
        </div>
        <label className={formStyles.checkboxField}>
          <input
            type="checkbox"
            checked={tableEditor.isLocked}
            onChange={(event) => onChange('isLocked', event.target.checked)}
          />
          <span>is-locked: nem mozgathato draggel</span>
        </label>
        <button
          type="submit"
          className={`${sharedStyles.button} ${sharedStyles.buttonPrimary} ${sharedStyles.buttonWide}`}
          disabled={tableSaving}
        >
          {tableSaving ? 'Mentes...' : 'Modositas mentese'}
        </button>
      </form>
    </section>
  )
}
