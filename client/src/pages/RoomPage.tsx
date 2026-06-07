import type { ReactNode } from 'react'
import { Room } from '../components/Room'
import { SummaryPanel } from '../components/SummaryPanel'
import sharedStyles from '../components/Shared.module.css'
import formStyles from '../components/FormLayouts.module.css'
import type {
  GameTable,
  NewTableDraft,
  Position,
  RoomSize,
} from '../types'
import styles from './RoomPage.module.css'

type RoomPageProps = {
  tables: GameTable[]
  roomSize: RoomSize
  selectedId: number | null
  clearanceIssueIds: Set<number>
  pendingTable: NewTableDraft | null
  canSelectTables: boolean
  canDragTables: boolean
  tablesLoading: boolean
  tablesError: string | null
  sidebar: ReactNode
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

export function RoomPage({
  tables,
  roomSize,
  selectedId,
  clearanceIssueIds,
  pendingTable,
  canSelectTables,
  canDragTables,
  tablesLoading,
  tablesError,
  sidebar,
  onSelectTable,
  onMoveTable,
  onMoveFinished,
  onPlacePendingTable,
  onCancelPendingTable,
}: RoomPageProps) {
  return (
    <main className={styles.appLayout}>
      <div className={styles.workspace}>
        {tablesError ? (
          <div className={styles.feedback} role="alert">
            {tablesError}
          </div>
        ) : null}
        {tablesLoading ? (
          <section className={`${sharedStyles.panel} ${formStyles.panelStack}`}>
            <h2>Terem betoltese...</h2>
            <p>Az asztalok az API-bol erkeznek.</p>
          </section>
        ) : (
          <Room
            tables={tables}
            roomSize={roomSize}
            selectedId={selectedId}
            clearanceIssueIds={clearanceIssueIds}
            pendingTable={pendingTable}
            canSelectTables={canSelectTables}
            canDragTables={canDragTables}
            onSelectTable={onSelectTable}
            onMoveTable={onMoveTable}
            onMoveFinished={onMoveFinished}
            onPlacePendingTable={onPlacePendingTable}
            onCancelPendingTable={onCancelPendingTable}
          />
        )}

        <SummaryPanel tables={tables} />
      </div>

      {sidebar ? <aside className={styles.sidebar}>{sidebar}</aside> : null}
    </main>
  )
}
