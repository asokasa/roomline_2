import type { Booking } from '../types'
import sharedStyles from '../components/Shared.module.css'
import styles from './BookingsPage.module.css'

type BookingsPageProps = {
  bookings: Booking[]
  loading: boolean
  selectedBookingId: number | null
  adminMode: boolean
  onSelectBooking: (id: number) => void
  onRefresh: () => void
  onBookingStatus: (bookingId: number, status: 'accepted' | 'declined') => void
}

export function BookingsPage({
  bookings,
  loading,
  selectedBookingId,
  adminMode,
  onSelectBooking,
  onRefresh,
  onBookingStatus,
}: BookingsPageProps) {
  const selectedBooking =
    bookings.find((booking) => booking.id === selectedBookingId) ?? null

  return (
    <main className={styles.bookingPage}>
      <section className={`${sharedStyles.panel} ${styles.bookingListPanel}`}>
        <div className={styles.panelTitleRow}>
          <div>
            <h2>{adminMode ? 'Beerkezett foglalasok' : 'Foglalasaim'}</h2>
            <p>{bookings.length} foglalas</p>
          </div>
          <button
            type="button"
            className={sharedStyles.button}
            onClick={onRefresh}
          >
            Frissites
          </button>
        </div>

        {loading ? <p>Foglalasok betoltese...</p> : null}
        {!loading && bookings.length === 0 ? (
          <p className={styles.emptyState}>Meg nincs foglalas.</p>
        ) : null}
        <div className={styles.bookingList}>
          {bookings.map((booking) => (
            <button
              type="button"
              key={booking.id}
              className={[
                styles.bookingRow,
                selectedBookingId === booking.id ? styles.bookingRowActive : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => onSelectBooking(booking.id)}
            >
              <strong>{booking.tableName}</strong>
              <span>
                {booking.date} {booking.startTime}-{booking.endTime}
              </span>
              <em className={styles[booking.status]}>{booking.status}</em>
            </button>
          ))}
        </div>
      </section>

      <section className={`${sharedStyles.panel} ${styles.bookingDetailPanel}`}>
        {selectedBooking ? (
          <>
            <div className={styles.panelTitleRow}>
              <div>
                <h2>{selectedBooking.tableName}</h2>
                <p>
                  {selectedBooking.date}, {selectedBooking.startTime}-
                  {selectedBooking.endTime}
                </p>
              </div>
              <span
                className={`${styles.statusPill} ${styles[selectedBooking.status]}`}
              >
                {selectedBooking.status}
              </span>
            </div>
            <dl className={styles.detailList}>
              <div>
                <dt>Nev</dt>
                <dd>{selectedBooking.name}</dd>
              </div>
              <div>
                <dt>Email</dt>
                <dd>{selectedBooking.email}</dd>
              </div>
              <div>
                <dt>Telefon</dt>
                <dd>{selectedBooking.phone}</dd>
              </div>
              <div>
                <dt>Letszam</dt>
                <dd>{selectedBooking.headcount}</dd>
              </div>
              <div>
                <dt>Megjegyzes</dt>
                <dd>{selectedBooking.notes ?? '-'}</dd>
              </div>
            </dl>
            {adminMode ? (
              <div className={styles.actionRow}>
                <button
                  type="button"
                  className={`${sharedStyles.button} ${sharedStyles.buttonPrimary}`}
                  onClick={() => onBookingStatus(selectedBooking.id, 'accepted')}
                >
                  Elfogadas
                </button>
                <button
                  type="button"
                  className={`${sharedStyles.button} ${sharedStyles.buttonDanger}`}
                  onClick={() => onBookingStatus(selectedBooking.id, 'declined')}
                >
                  Elutasitas
                </button>
              </div>
            ) : null}
          </>
        ) : (
          <>
            <h2>Foglalas reszletei</h2>
            <p>Valassz foglalast a listabol.</p>
          </>
        )}
      </section>
    </main>
  )
}
