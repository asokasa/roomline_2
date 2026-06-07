import type { Dispatch, FormEvent, SetStateAction } from 'react'
import { CATEGORY_LABELS, TABLE_TYPE_LABELS } from '../constants'
import { shiftDate, slotKey } from '../appHelpers'
import type { BookingForm } from '../appTypes'
import type { GameTable, Timeslot } from '../types'
import { TableFacts } from './TableFacts'
import sharedStyles from './Shared.module.css'
import formStyles from './FormLayouts.module.css'
import styles from './BookingPanel.module.css'

type BookingPanelProps = {
  selectedTable: GameTable | null
  selectedDate: string
  timeslots: Timeslot[]
  timeslotsLoading: boolean
  selectedSlot: string | null
  bookingForm: BookingForm
  bookingSubmitting: boolean
  onDateChange: (date: string) => void
  onSelectSlot: (slotKey: string | null) => void
  onBookingFormChange: Dispatch<SetStateAction<BookingForm>>
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

export function BookingPanel({
  selectedTable,
  selectedDate,
  timeslots,
  timeslotsLoading,
  selectedSlot,
  bookingForm,
  bookingSubmitting,
  onDateChange,
  onSelectSlot,
  onBookingFormChange,
  onSubmit,
}: BookingPanelProps) {
  if (!selectedTable) {
    return (
      <section className={`${sharedStyles.panel} ${formStyles.panelStack}`}>
        <h2>Foglalas</h2>
        <p>Valassz egy asztalt a teremben.</p>
      </section>
    )
  }

  return (
    <section className={`${sharedStyles.panel} ${formStyles.panelStack}`}>
      <div className={formStyles.panelTitleRow}>
        <div>
          <h2>{selectedTable.name ?? TABLE_TYPE_LABELS[selectedTable.type]}</h2>
          <p>{CATEGORY_LABELS[selectedTable.category]} kategoria</p>
        </div>
        {selectedTable.isLocked ? (
          <span className={sharedStyles.pill}>fix</span>
        ) : null}
      </div>

      <TableFacts table={selectedTable} />

      <div className={styles.dateStepper}>
        <button
          type="button"
          className={sharedStyles.button}
          onClick={() => onDateChange(shiftDate(selectedDate, -1))}
        >
          Elozo
        </button>
        <label className={sharedStyles.field}>
          <span>Nap</span>
          <input
            type="date"
            value={selectedDate}
            onChange={(event) => onDateChange(event.target.value)}
          />
        </label>
        <button
          type="button"
          className={sharedStyles.button}
          onClick={() => onDateChange(shiftDate(selectedDate, 1))}
        >
          Kovetkezo
        </button>
      </div>

      <div className={styles.slotGrid} aria-label="Idopontok">
        {timeslotsLoading ? <p>Idopontok betoltese...</p> : null}
        {!timeslotsLoading &&
          timeslots.map((slot) => {
            const key = slotKey(slot.startTime, slot.endTime)
            const selected = selectedSlot === key

            return (
              <button
                type="button"
                key={key}
                className={[
                  styles.slotButton,
                  selected ? styles.slotButtonSelected : '',
                  !slot.isAvailable ? styles.slotButtonUnavailable : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                disabled={!slot.isAvailable}
                onClick={() => onSelectSlot(key)}
              >
                <strong>
                  {slot.startTime}-{slot.endTime}
                </strong>
                <span>{slot.isAvailable ? 'Szabad' : 'Foglalt'}</span>
              </button>
            )
          })}
      </div>

      <form className={formStyles.formStack} onSubmit={onSubmit}>
        <label className={sharedStyles.field}>
          <span>Foglalas neve</span>
          <input
            required
            value={bookingForm.name}
            onChange={(event) =>
              onBookingFormChange((current) => ({
                ...current,
                name: event.target.value,
              }))
            }
          />
        </label>
        <label className={sharedStyles.field}>
          <span>Email</span>
          <input
            required
            type="email"
            value={bookingForm.email}
            onChange={(event) =>
              onBookingFormChange((current) => ({
                ...current,
                email: event.target.value,
              }))
            }
          />
        </label>
        <label className={sharedStyles.field}>
          <span>Telefon</span>
          <input
            required
            value={bookingForm.phone}
            onChange={(event) =>
              onBookingFormChange((current) => ({
                ...current,
                phone: event.target.value,
              }))
            }
          />
        </label>
        <label className={sharedStyles.field}>
          <span>Letszam</span>
          <input
            required
            type="number"
            min="1"
            value={bookingForm.headcount}
            onChange={(event) =>
              onBookingFormChange((current) => ({
                ...current,
                headcount: Number(event.target.value),
              }))
            }
          />
        </label>
        <label className={sharedStyles.field}>
          <span>Megjegyzes</span>
          <textarea
            value={bookingForm.notes}
            onChange={(event) =>
              onBookingFormChange((current) => ({
                ...current,
                notes: event.target.value,
              }))
            }
          />
        </label>
        <button
          type="submit"
          className={`${sharedStyles.button} ${sharedStyles.buttonPrimary} ${sharedStyles.buttonWide}`}
          disabled={bookingSubmitting || !selectedSlot}
        >
          {bookingSubmitting ? 'Foglalas...' : 'Asztal lefoglalasa'}
        </button>
      </form>
    </section>
  )
}
