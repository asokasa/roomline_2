import { useCallback, useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { api, ApiError, storeAuth } from './api'
import styles from './App.module.css'
import { Room } from './components/Room'
import { SummaryPanel } from './components/SummaryPanel'
import sharedStyles from './components/Shared.module.css'
import {
  CATEGORY_LABELS,
  COLOR_LABELS,
  INITIAL_ROOM_SIZE,
  TABLE_CATEGORIES,
  TABLE_COLOR_OPTIONS,
  TABLE_TYPE_LABELS,
  TABLE_TYPES,
} from './constants'
import type {
  Booking,
  GameTable,
  NewTableDraft,
  Position,
  TableCategory,
  TableColor,
  TablePayload,
  TableType,
} from './types'
import {
  clearAuthState,
  setAuthState,
  setTheme,
} from './store'
import type { AppDispatch, RootState } from './store'
import {
  getClearanceIssueIds,
  getPlacementError,
  roundPosition,
} from './utils/tableGeometry'

type Page =
  | 'room'
  | 'login'
  | 'register'
  | 'my-bookings'
  | 'add-table'
  | 'admin-bookings'

type ToastKind = 'success' | 'error' | 'info'

type Toast = {
  id: number
  kind: ToastKind
  message: string
}

type TableForm = {
  name: string
  type: TableType
  category: TableCategory
  color: TableColor
  status: number
  x: number
  y: number
  isLocked: boolean
}

type BookingForm = {
  name: string
  email: string
  phone: string
  headcount: number
  notes: string
}

const pageTitles: Record<Page, string> = {
  room: 'Terem',
  login: 'Bejelentkezes',
  register: 'Regisztracio',
  'my-bookings': 'Foglalasaim',
  'add-table': 'Asztal hozzaadasa',
  'admin-bookings': 'Beerkezett foglalasok',
}

function formatDate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function todayIso() {
  return formatDate(new Date())
}

function shiftDate(value: string, days: number) {
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(year, month - 1, day + days)

  return formatDate(date)
}

function getErrorMessage(error: unknown) {
  return error instanceof ApiError
    ? error.message
    : 'Varatlan hiba tortent.'
}

function slotKey(startTime: string, endTime: string) {
  return `${startTime}-${endTime}`
}

function validStatus(status: number) {
  return Math.min(Math.max(status, 1), 10)
}

function emptyTableForm(): TableForm {
  return {
    name: '',
    type: 'snooker',
    category: 'normal',
    color: 'green',
    status: 7,
    x: 60,
    y: 60,
    isLocked: false,
  }
}

function tableFormFromTable(table: GameTable): TableForm {
  return {
    name: table.name ?? `${TABLE_TYPE_LABELS[table.type]} ${table.id}`,
    type: table.type,
    category: table.category,
    color: table.color,
    status: table.status,
    x: table.position.x,
    y: table.position.y,
    isLocked: table.isLocked,
  }
}

function payloadFromTableForm(form: TableForm): TablePayload {
  return {
    name: form.name.trim() || undefined,
    type: form.type,
    category: form.category,
    color: form.color,
    status: validStatus(form.status),
    position: roundPosition({ x: form.x, y: form.y }),
    isLocked: form.isLocked,
  }
}

function draftFromTableForm(form: TableForm): NewTableDraft {
  return {
    name: form.name.trim() || undefined,
    type: form.type,
    category: form.category,
    color: form.color,
    status: validStatus(form.status),
    isLocked: form.isLocked,
  }
}

function bookingFormForUser(name = '', email = ''): BookingForm {
  return {
    name,
    email,
    phone: '',
    headcount: 1,
    notes: '',
  }
}

function App() {
  const dispatch = useDispatch<AppDispatch>()
  const authToken = useSelector((state: RootState) => state.session.token)
  const authUser = useSelector((state: RootState) => state.session.user)
  const theme = useSelector((state: RootState) => state.session.theme)
  const [page, setPage] = useState<Page>('room')
  const [toasts, setToasts] = useState<Toast[]>([])
  const [tables, setTables] = useState<GameTable[]>([])
  const [tablesLoading, setTablesLoading] = useState(true)
  const [tablesError, setTablesError] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [selectedDate, setSelectedDate] = useState(todayIso)
  const [timeslots, setTimeslots] = useState<
    { startTime: string; endTime: string; isAvailable: boolean }[]
  >([])
  const [timeslotsLoading, setTimeslotsLoading] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [bookingForm, setBookingForm] = useState(() =>
    bookingFormForUser(authUser?.name, authUser?.email),
  )
  const [bookingSubmitting, setBookingSubmitting] = useState(false)
  const [tableEditor, setTableEditor] = useState<TableForm | null>(null)
  const [tableSaving, setTableSaving] = useState(false)
  const [newTableForm, setNewTableForm] = useState(emptyTableForm)
  const [newTableSaving, setNewTableSaving] = useState(false)
  const [pendingTable, setPendingTable] = useState<NewTableDraft | null>(null)
  const [myBookings, setMyBookings] = useState<Booking[]>([])
  const [myBookingsLoading, setMyBookingsLoading] = useState(false)
  const [selectedMyBookingId, setSelectedMyBookingId] = useState<number | null>(
    null,
  )
  const [adminBookings, setAdminBookings] = useState<Booking[]>([])
  const [adminBookingsLoading, setAdminBookingsLoading] = useState(false)
  const [selectedAdminBookingId, setSelectedAdminBookingId] = useState<
    number | null
  >(null)
  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [registerForm, setRegisterForm] = useState({
    name: '',
    email: '',
    password: '',
  })

  const roomSize = INITIAL_ROOM_SIZE
  const auth = useMemo(
    () => ({ token: authToken, user: authUser }),
    [authToken, authUser],
  )
  const selectedTable = tables.find((table) => table.id === selectedId) ?? null
  const selectedTableId = selectedTable?.id ?? null
  const isAdmin = auth.user?.role === 'admin'
  const isSignedIn = auth.user !== null
  const canSelectTables = isSignedIn
  const canDragTables = isAdmin

  const clearanceIssueIds = useMemo(
    () => getClearanceIssueIds(tables, roomSize),
    [roomSize, tables],
  )

  const pushToast = useCallback((message: string, kind: ToastKind = 'info') => {
    const id = Date.now() + Math.random()
    setToasts((current) => [...current, { id, kind, message }].slice(-4))
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id))
    }, 4200)
  }, [])

  const refreshTables = useCallback(async () => {
    setTablesLoading(true)
    setTablesError(null)

    try {
      const loadedTables = await api.getTables()
      setTables(loadedTables)
    } catch (error) {
      const message = getErrorMessage(error)
      setTablesError(message)
      pushToast(`Asztalok betoltese sikertelen: ${message}`, 'error')
    } finally {
      setTablesLoading(false)
    }
  }, [pushToast])

  const loadTimeslots = useCallback(
    async (tableId: number, date: string) => {
      setTimeslotsLoading(true)

      try {
        const loadedSlots = await api.getTimeslots(tableId, date)
        setTimeslots(loadedSlots)
      } catch (error) {
        setTimeslots([])
        pushToast(`Idopontok betoltese sikertelen: ${getErrorMessage(error)}`, 'error')
      } finally {
        setTimeslotsLoading(false)
      }
    },
    [pushToast],
  )

  const refreshMyBookings = useCallback(async () => {
    if (!auth.token) {
      return
    }

    setMyBookingsLoading(true)

    try {
      const loadedBookings = await api.getMyBookings(auth.token)
      setMyBookings(loadedBookings)
      setSelectedMyBookingId((currentId) =>
        loadedBookings.some((booking) => booking.id === currentId)
          ? currentId
          : loadedBookings[0]?.id ?? null,
      )
    } catch (error) {
      pushToast(`Foglalasaim betoltese sikertelen: ${getErrorMessage(error)}`, 'error')
    } finally {
      setMyBookingsLoading(false)
    }
  }, [auth.token, pushToast])

  const refreshAdminBookings = useCallback(async () => {
    if (!auth.token || !isAdmin) {
      return
    }

    setAdminBookingsLoading(true)

    try {
      const loadedBookings = await api.getAllBookings(auth.token)
      setAdminBookings(loadedBookings)
      setSelectedAdminBookingId((currentId) =>
        loadedBookings.some((booking) => booking.id === currentId)
          ? currentId
          : loadedBookings[0]?.id ?? null,
      )
    } catch (error) {
      pushToast(
        `Beerkezett foglalasok betoltese sikertelen: ${getErrorMessage(error)}`,
        'error',
      )
    } finally {
      setAdminBookingsLoading(false)
    }
  }, [auth.token, isAdmin, pushToast])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('roomlie-theme', theme)
  }, [theme])

  useEffect(() => {
    void refreshTables()
  }, [refreshTables])

  useEffect(() => {
    if (!auth.token) {
      return
    }

    let cancelled = false

    api
      .me(auth.token)
      .then((user) => {
        if (!cancelled) {
          const nextAuth = { token: auth.token, user }
          dispatch(setAuthState(nextAuth))
          storeAuth(nextAuth)
        }
      })
      .catch(() => {
        if (!cancelled) {
          const nextAuth = { token: null, user: null }
          dispatch(clearAuthState())
          storeAuth(nextAuth)
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    setBookingForm((current) => ({
      ...current,
      name: auth.user?.name ?? '',
      email: auth.user?.email ?? '',
    }))
  }, [auth.user])

  useEffect(() => {
    if (!isAdmin || !selectedTable) {
      setTableEditor(null)
      return
    }

    setTableEditor(tableFormFromTable(selectedTable))
  }, [isAdmin, selectedTableId])

  useEffect(() => {
    if (auth.user?.role !== 'user' || !selectedTableId) {
      setTimeslots([])
      return
    }

    void loadTimeslots(selectedTableId, selectedDate)
  }, [auth.user?.role, loadTimeslots, selectedDate, selectedTableId])

  useEffect(() => {
    if (page === 'my-bookings' && auth.token) {
      void refreshMyBookings()
    }
  }, [auth.token, page, refreshMyBookings])

  useEffect(() => {
    if (page === 'admin-bookings' && auth.token && isAdmin) {
      void refreshAdminBookings()
    }
  }, [auth.token, isAdmin, page, refreshAdminBookings])

  const handleDateChange = (nextDate: string) => {
    setSelectedDate(nextDate)
    setSelectedSlot(null)
  }

  const handleSelectTable = (id: number) => {
    if (!canSelectTables) {
      return
    }

    setSelectedId(id)
    setSelectedSlot(null)
    setPage('room')
  }

  const handleMoveTable = (id: number, position: Position) => {
    if (!canDragTables) {
      return
    }

    setTables((currentTables) =>
      currentTables.map((table) =>
        table.id === id ? { ...table, position: roundPosition(position) } : table,
      ),
    )
  }

  const handleMoveFinished = async (
    id: number,
    originPosition: Position,
    finalPosition: Position,
  ) => {
    if (!auth.token || !canDragTables) {
      return
    }

    const movedTable = tables.find((table) => table.id === id)

    if (!movedTable) {
      return
    }

    const candidate = {
      ...movedTable,
      position: roundPosition(finalPosition),
    }
    const error = getPlacementError(candidate, tables, roomSize)

    if (error) {
      setTables((currentTables) =>
        currentTables.map((table) =>
          table.id === id ? { ...table, position: originPosition } : table,
        ),
      )
      pushToast(error, 'error')
      return
    }

    try {
      const updated = await api.updateTablePosition(auth.token, id, candidate.position)
      setTables((currentTables) =>
        currentTables.map((table) => (table.id === id ? updated : table)),
      )
      setTableEditor((current) =>
        current && selectedId === id ? tableFormFromTable(updated) : current,
      )
      pushToast('Az asztal pozicioja mentve.', 'success')
    } catch (error) {
      setTables((currentTables) =>
        currentTables.map((table) =>
          table.id === id ? { ...table, position: originPosition } : table,
        ),
      )
      pushToast(`Pozicio mentese sikertelen: ${getErrorMessage(error)}`, 'error')
    }
  }

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    try {
      const nextAuth = await api.login(loginForm.email, loginForm.password)
      dispatch(setAuthState(nextAuth))
      storeAuth(nextAuth)
      setPage('room')
      setLoginForm({ email: '', password: '' })
      pushToast('Sikeres bejelentkezes.', 'success')
    } catch (error) {
      pushToast(`Sikertelen bejelentkezes: ${getErrorMessage(error)}`, 'error')
    }
  }

  const handleRegister = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    try {
      await api.register(
        registerForm.name,
        registerForm.email,
        registerForm.password,
      )
      const nextAuth = await api.login(registerForm.email, registerForm.password)
      dispatch(setAuthState(nextAuth))
      storeAuth(nextAuth)
      setRegisterForm({ name: '', email: '', password: '' })
      setPage('room')
      pushToast('Sikeres regisztracio.', 'success')
    } catch (error) {
      pushToast(`Sikertelen regisztracio: ${getErrorMessage(error)}`, 'error')
    }
  }

  const handleLogout = async () => {
    try {
      await api.logout(auth.token)
    } catch {
      // Local logout is still useful if the stored token is already invalid.
    }

    const nextAuth = { token: null, user: null }
    dispatch(clearAuthState())
    storeAuth(nextAuth)
    setSelectedId(null)
    setSelectedSlot(null)
    setPendingTable(null)
    setMyBookings([])
    setAdminBookings([])
    setPage('room')
    pushToast('Sikeres kijelentkezes.', 'success')
  }

  const handleCreateBooking = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!auth.token || !selectedTable || !selectedSlot) {
      pushToast('Valassz asztalt es szabad idopontot.', 'error')
      return
    }

    const chosenSlot = timeslots.find(
      (slot) => slotKey(slot.startTime, slot.endTime) === selectedSlot,
    )

    if (!chosenSlot) {
      pushToast('Valassz idopontot a foglalashoz.', 'error')
      return
    }

    setBookingSubmitting(true)

    try {
      const latestSlots = await api.getTimeslots(selectedTable.id, selectedDate)
      setTimeslots(latestSlots)

      const latestChosenSlot = latestSlots.find(
        (slot) => slotKey(slot.startTime, slot.endTime) === selectedSlot,
      )

      if (!latestChosenSlot?.isAvailable) {
        setSelectedSlot(null)
        pushToast('Ez az idopont mar nem elerheto.', 'error')
        return
      }

      await api.createBooking(auth.token, {
        tableId: selectedTable.id,
        date: selectedDate,
        startTime: chosenSlot.startTime,
        endTime: chosenSlot.endTime,
        name: bookingForm.name,
        email: bookingForm.email,
        phone: bookingForm.phone,
        headcount: bookingForm.headcount,
        notes: bookingForm.notes || undefined,
      })

      setSelectedSlot(null)
      setBookingForm((current) => ({ ...current, notes: '' }))
      await loadTimeslots(selectedTable.id, selectedDate)
      pushToast('Foglalas elkuldve, admin jovahagyasra var.', 'success')
    } catch (error) {
      pushToast(`Sikertelen foglalas: ${getErrorMessage(error)}`, 'error')
    } finally {
      setBookingSubmitting(false)
    }
  }

  const handleSaveTable = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!auth.token || !selectedTable || !tableEditor) {
      return
    }

    const payload = payloadFromTableForm(tableEditor)
    const candidate: GameTable = {
      ...selectedTable,
      ...payload,
      position: payload.position,
    }
    const error = getPlacementError(candidate, tables, roomSize)

    if (error) {
      pushToast(error, 'error')
      return
    }

    setTableSaving(true)

    try {
      const updated = await api.updateTable(auth.token, selectedTable.id, payload)
      setTables((currentTables) =>
        currentTables.map((table) =>
          table.id === selectedTable.id ? updated : table,
        ),
      )
      setTableEditor(tableFormFromTable(updated))
      pushToast('Asztal modositva.', 'success')
    } catch (error) {
      pushToast(`Asztal modositasa sikertelen: ${getErrorMessage(error)}`, 'error')
    } finally {
      setTableSaving(false)
    }
  }

  const handleCreateTable = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!auth.token || !isAdmin) {
      return
    }

    const payload = payloadFromTableForm(newTableForm)
    const candidate: GameTable = {
      id: -1,
      ...payload,
      position: payload.position,
    }
    const error = getPlacementError(candidate, tables, roomSize)

    if (error) {
      pushToast(error, 'error')
      return
    }

    setNewTableSaving(true)

    try {
      const created = await api.createTable(auth.token, payload)
      setTables((currentTables) => [...currentTables, created])
      setSelectedId(created.id)
      setNewTableForm(emptyTableForm())
      setPage('room')
      pushToast('Asztal letrehozva.', 'success')
    } catch (error) {
      pushToast(`Asztal letrehozasa sikertelen: ${getErrorMessage(error)}`, 'error')
    } finally {
      setNewTableSaving(false)
    }
  }

  const handleStartTablePlacement = () => {
    if (!isAdmin) {
      return
    }

    setPendingTable(draftFromTableForm(newTableForm))
    setSelectedId(null)
    setPage('room')
    pushToast('Mozgasd az egeret a teremben, majd kattints a lerakasi pontra.', 'info')
  }

  const handleCancelTablePlacement = () => {
    setPendingTable(null)
    pushToast('Asztal lerakasa megszakitva.', 'info')
  }

  const handlePlacePendingTable = async (position: Position) => {
    if (!auth.token || !isAdmin || !pendingTable) {
      return
    }

    const roundedPosition = roundPosition(position)
    const candidate: GameTable = {
      id: -1,
      ...pendingTable,
      position: roundedPosition,
    }
    const error = getPlacementError(candidate, tables, roomSize)

    if (error) {
      pushToast(error, 'error')
      return
    }

    setNewTableSaving(true)

    try {
      const created = await api.createTable(auth.token, {
        ...pendingTable,
        position: roundedPosition,
      })
      setTables((currentTables) => [...currentTables, created])
      setSelectedId(created.id)
      setPendingTable(null)
      setNewTableForm(emptyTableForm())
      pushToast('Asztal lerakva es letrehozva.', 'success')
    } catch (error) {
      pushToast(`Asztal letrehozasa sikertelen: ${getErrorMessage(error)}`, 'error')
    } finally {
      setNewTableSaving(false)
    }
  }

  const handleBookingStatus = async (
    bookingId: number,
    status: 'accepted' | 'declined',
  ) => {
    if (!auth.token || !isAdmin) {
      return
    }

    try {
      const updated = await api.updateBookingStatus(auth.token, bookingId, status)
      setAdminBookings((currentBookings) =>
        currentBookings.map((booking) =>
          booking.id === bookingId ? updated : booking,
        ),
      )
      pushToast(
        status === 'accepted'
          ? 'Foglalas elfogadva.'
          : 'Foglalas elutasitva.',
        'success',
      )
    } catch (error) {
      pushToast(`Allapot modositas sikertelen: ${getErrorMessage(error)}`, 'error')
    }
  }

  const updateTableEditor = <K extends keyof TableForm,>(
    key: K,
    value: TableForm[K],
  ) => {
    setTableEditor((current) =>
      current ? { ...current, [key]: value } : current,
    )
  }

  const updateNewTable = <K extends keyof TableForm,>(
    key: K,
    value: TableForm[K],
  ) => {
    setNewTableForm((current) => ({ ...current, [key]: value }))
  }

  const navClass = (targetPage: Page) =>
    [styles.navLink, page === targetPage ? styles.navLinkActive : '']
      .filter(Boolean)
      .join(' ')

  const renderTableFacts = (table: GameTable) => (
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

  const renderVisitorPanel = () => (
    <section className={`${sharedStyles.panel} ${styles.sidePanel}`}>
      <h2>Latogatoi nezet</h2>
      <p>
        Az elrendezes megtekintheto, de asztalt kivalasztani vagy foglalni csak
        bejelentkezes utan lehet.
      </p>
    </section>
  )

  const renderBookingPanel = () => {
    if (!selectedTable) {
      return (
        <section className={`${sharedStyles.panel} ${styles.sidePanel}`}>
          <h2>Foglalas</h2>
          <p>Valassz egy asztalt a teremben.</p>
        </section>
      )
    }

    return (
      <section className={`${sharedStyles.panel} ${styles.sidePanel}`}>
        <div className={styles.panelTitleRow}>
          <div>
            <h2>{selectedTable.name ?? TABLE_TYPE_LABELS[selectedTable.type]}</h2>
            <p>{CATEGORY_LABELS[selectedTable.category]} kategoria</p>
          </div>
          {selectedTable.isLocked ? (
            <span className={sharedStyles.pill}>fix</span>
          ) : null}
        </div>

        {renderTableFacts(selectedTable)}

        <div className={styles.dateStepper}>
          <button
            type="button"
            className={sharedStyles.button}
            onClick={() => handleDateChange(shiftDate(selectedDate, -1))}
          >
            Elozo
          </button>
          <label className={sharedStyles.field}>
            <span>Nap</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(event) => handleDateChange(event.target.value)}
            />
          </label>
          <button
            type="button"
            className={sharedStyles.button}
            onClick={() => handleDateChange(shiftDate(selectedDate, 1))}
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
                  onClick={() => setSelectedSlot(key)}
                >
                  <strong>
                    {slot.startTime}-{slot.endTime}
                  </strong>
                  <span>{slot.isAvailable ? 'Szabad' : 'Foglalt'}</span>
                </button>
              )
            })}
        </div>

        <form className={styles.formStack} onSubmit={handleCreateBooking}>
          <label className={sharedStyles.field}>
            <span>Foglalas neve</span>
            <input
              required
              value={bookingForm.name}
              onChange={(event) =>
                setBookingForm((current) => ({
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
                setBookingForm((current) => ({
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
                setBookingForm((current) => ({
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
                setBookingForm((current) => ({
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
                setBookingForm((current) => ({
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

  const renderAdminEditor = () => {
    if (!selectedTable || !tableEditor) {
      return (
        <section className={`${sharedStyles.panel} ${styles.sidePanel}`}>
          <h2>Asztal szerkesztese</h2>
          <p>Valassz egy asztalt a teremben.</p>
        </section>
      )
    }

    return (
      <section className={`${sharedStyles.panel} ${styles.sidePanel}`}>
        <div className={styles.panelTitleRow}>
          <div>
            <h2>Asztal szerkesztese</h2>
            <p>{selectedTable.name ?? TABLE_TYPE_LABELS[selectedTable.type]}</p>
          </div>
          {selectedTable.isLocked ? (
            <span className={sharedStyles.pill}>fix</span>
          ) : null}
        </div>

        <form className={styles.formStack} onSubmit={handleSaveTable}>
          <label className={sharedStyles.field}>
            <span>Nev</span>
            <input
              value={tableEditor.name}
              onChange={(event) => updateTableEditor('name', event.target.value)}
            />
          </label>
          <label className={sharedStyles.field}>
            <span>Tipus</span>
            <select
              value={tableEditor.type}
              onChange={(event) =>
                updateTableEditor('type', event.target.value as TableType)
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
                updateTableEditor(
                  'category',
                  event.target.value as TableCategory,
                )
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
                updateTableEditor('color', event.target.value as TableColor)
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
                onChange={(event) =>
                  updateTableEditor('status', Number(event.target.value))
                }
              />
              <strong>{tableEditor.status}/10</strong>
            </div>
          </label>
          <div className={styles.twoColumn}>
            <label className={sharedStyles.field}>
              <span>x koordinata</span>
              <input
                type="number"
                min="0"
                value={tableEditor.x}
                onChange={(event) =>
                  updateTableEditor('x', Number(event.target.value))
                }
              />
            </label>
            <label className={sharedStyles.field}>
              <span>y koordinata</span>
              <input
                type="number"
                min="0"
                value={tableEditor.y}
                onChange={(event) =>
                  updateTableEditor('y', Number(event.target.value))
                }
              />
            </label>
          </div>
          <label className={styles.checkboxField}>
            <input
              type="checkbox"
              checked={tableEditor.isLocked}
              onChange={(event) =>
                updateTableEditor('isLocked', event.target.checked)
              }
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

  const renderRoomPage = () => (
    <main className={styles.appLayout}>
      <div className={styles.workspace}>
        {tablesError ? (
          <div className={styles.feedback} role="alert">
            {tablesError}
          </div>
        ) : null}
        {tablesLoading ? (
          <section className={`${sharedStyles.panel} ${styles.sidePanel}`}>
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
            onSelectTable={handleSelectTable}
            onMoveTable={handleMoveTable}
            onMoveFinished={handleMoveFinished}
            onPlacePendingTable={(position) => {
              void handlePlacePendingTable(position)
            }}
            onCancelPendingTable={handleCancelTablePlacement}
          />
        )}

        <SummaryPanel tables={tables} />
      </div>

      <aside className={styles.sidebar}>
        {!isSignedIn ? renderVisitorPanel() : null}
        {auth.user?.role === 'user' ? renderBookingPanel() : null}
        {isAdmin ? renderAdminEditor() : null}
      </aside>
    </main>
  )

  const renderAuthPage = (mode: 'login' | 'register') => {
    const isLogin = mode === 'login'

    return (
      <main className={styles.centerPage}>
        <section className={`${sharedStyles.panel} ${styles.authCard}`}>
          <h2>{isLogin ? 'Bejelentkezes' : 'Regisztracio'}</h2>
          <form
            className={styles.formStack}
            onSubmit={isLogin ? handleLogin : handleRegister}
          >
            {!isLogin ? (
              <label className={sharedStyles.field}>
                <span>Nev</span>
                <input
                  required
                  value={registerForm.name}
                  onChange={(event) =>
                    setRegisterForm((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                />
              </label>
            ) : null}
            <label className={sharedStyles.field}>
              <span>Email</span>
              <input
                required
                type="email"
                value={isLogin ? loginForm.email : registerForm.email}
                onChange={(event) =>
                  isLogin
                    ? setLoginForm((current) => ({
                        ...current,
                        email: event.target.value,
                      }))
                    : setRegisterForm((current) => ({
                        ...current,
                        email: event.target.value,
                      }))
                }
              />
            </label>
            <label className={sharedStyles.field}>
              <span>Jelszo</span>
              <input
                required
                type="password"
                minLength={isLogin ? 1 : 6}
                value={isLogin ? loginForm.password : registerForm.password}
                onChange={(event) =>
                  isLogin
                    ? setLoginForm((current) => ({
                        ...current,
                        password: event.target.value,
                      }))
                    : setRegisterForm((current) => ({
                        ...current,
                        password: event.target.value,
                      }))
                }
              />
            </label>
            <button
              type="submit"
              className={`${sharedStyles.button} ${sharedStyles.buttonPrimary} ${sharedStyles.buttonWide}`}
            >
              {isLogin ? 'Belepes' : 'Fiok letrehozasa'}
            </button>
          </form>
        </section>
      </main>
    )
  }

  const renderAddTablePage = () => {
    if (!isAdmin) {
      return (
        <main className={styles.centerPage}>
          <section className={`${sharedStyles.panel} ${styles.authCard}`}>
            <h2>Nincs jogosultsag</h2>
            <p>Asztalt csak adminisztrator hozhat letre.</p>
          </section>
        </main>
      )
    }

    return (
      <main className={styles.centerPage}>
        <section className={`${sharedStyles.panel} ${styles.authCard}`}>
          <h2>Asztal hozzaadasa</h2>
          <form className={styles.formStack} onSubmit={handleCreateTable}>
            <label className={sharedStyles.field}>
              <span>Nev</span>
              <input
                value={newTableForm.name}
                onChange={(event) => updateNewTable('name', event.target.value)}
                placeholder="Pelda: Biliard 4"
              />
            </label>
            <label className={sharedStyles.field}>
              <span>Tipus</span>
              <select
                value={newTableForm.type}
                onChange={(event) =>
                  updateNewTable('type', event.target.value as TableType)
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
                  updateNewTable('category', event.target.value as TableCategory)
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
                  updateNewTable('color', event.target.value as TableColor)
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
                  onChange={(event) =>
                    updateNewTable('status', Number(event.target.value))
                  }
                />
                <strong>{newTableForm.status}/10</strong>
              </div>
            </label>
            <div className={styles.twoColumn}>
              <label className={sharedStyles.field}>
                <span>x koordinata</span>
                <input
                  type="number"
                  min="0"
                  value={newTableForm.x}
                  onChange={(event) =>
                    updateNewTable('x', Number(event.target.value))
                  }
                />
              </label>
              <label className={sharedStyles.field}>
                <span>y koordinata</span>
                <input
                  type="number"
                  min="0"
                  value={newTableForm.y}
                  onChange={(event) =>
                    updateNewTable('y', Number(event.target.value))
                  }
                />
              </label>
            </div>
            <label className={styles.checkboxField}>
              <input
                type="checkbox"
                checked={newTableForm.isLocked}
                onChange={(event) =>
                  updateNewTable('isLocked', event.target.checked)
                }
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
              onClick={handleStartTablePlacement}
            >
              Drag/drop lerakas a teremben
            </button>
          </form>
        </section>
      </main>
    )
  }

  const renderBookingsPage = (
    bookings: Booking[],
    loading: boolean,
    selectedBookingId: number | null,
    onSelectBooking: (id: number) => void,
    adminMode: boolean,
  ) => {
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
              onClick={() =>
                adminMode ? void refreshAdminBookings() : void refreshMyBookings()
              }
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
                <span className={`${styles.statusPill} ${styles[selectedBooking.status]}`}>
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
                    onClick={() =>
                      void handleBookingStatus(selectedBooking.id, 'accepted')
                    }
                  >
                    Elfogadas
                  </button>
                  <button
                    type="button"
                    className={`${sharedStyles.button} ${sharedStyles.buttonDanger}`}
                    onClick={() =>
                      void handleBookingStatus(selectedBooking.id, 'declined')
                    }
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

  const renderCurrentPage = () => {
    if (page === 'login') {
      return renderAuthPage('login')
    }

    if (page === 'register') {
      return renderAuthPage('register')
    }

    if (page === 'add-table') {
      return renderAddTablePage()
    }

    if (page === 'my-bookings') {
      return renderBookingsPage(
        myBookings,
        myBookingsLoading,
        selectedMyBookingId,
        setSelectedMyBookingId,
        false,
      )
    }

    if (page === 'admin-bookings') {
      return renderBookingsPage(
        adminBookings,
        adminBookingsLoading,
        selectedAdminBookingId,
        setSelectedAdminBookingId,
        true,
      )
    }

    return renderRoomPage()
  }

  return (
    <div className={styles.appShell}>
      <nav className={styles.navbar} aria-label="Fo navigacio">
        <button
          type="button"
          className={styles.brand}
          onClick={() => setPage('room')}
        >
          Roomlie
        </button>

        <div className={styles.navLinks}>
          <button
            type="button"
            className={navClass('room')}
            onClick={() => setPage('room')}
          >
            Terem
          </button>
          {!auth.user ? (
            <>
              <button
                type="button"
                className={navClass('login')}
                onClick={() => setPage('login')}
              >
                Bejelentkezes
              </button>
              <button
                type="button"
                className={navClass('register')}
                onClick={() => setPage('register')}
              >
                Regisztracio
              </button>
            </>
          ) : null}
          {auth.user?.role === 'user' ? (
            <button
              type="button"
              className={navClass('my-bookings')}
              onClick={() => setPage('my-bookings')}
            >
              Foglalasaim
            </button>
          ) : null}
          {isAdmin ? (
            <>
              <button
                type="button"
                className={navClass('add-table')}
                onClick={() => setPage('add-table')}
              >
                Asztal hozzaadasa
              </button>
              <button
                type="button"
                className={navClass('admin-bookings')}
                onClick={() => setPage('admin-bookings')}
              >
                Beerkezett foglalasok
              </button>
            </>
          ) : null}
        </div>

        <div className={styles.navUser}>
          {auth.user ? (
            <span>
              {auth.user.name}
              {isAdmin ? ' (admin)' : ''}
            </span>
          ) : (
            <span>Latogato</span>
          )}
          <button
            type="button"
            className={sharedStyles.button}
            onClick={() =>
              dispatch(setTheme(theme === 'dark' ? 'light' : 'dark'))
            }
          >
            {theme === 'dark' ? 'Vilagos mod' : 'Sotet mod'}
          </button>
          {auth.user ? (
            <button
              type="button"
              className={`${sharedStyles.button} ${sharedStyles.buttonSecondary}`}
              onClick={() => void handleLogout()}
            >
              Kijelentkezes
            </button>
          ) : null}
        </div>
      </nav>

      <header className={styles.appHeader}>
        <div>
          <p className={styles.eyebrow}>Roomlie</p>
          <h1>{pageTitles[page]}</h1>
        </div>
        <div className={styles.headerMetrics} aria-label="Terem adatok">
          <span>{tables.length} asztal</span>
          <span>
            {roomSize.width} x {roomSize.height} px
          </span>
        </div>
      </header>

      {renderCurrentPage()}

      <div className={styles.toastStack} aria-live="polite" aria-label="Uzenetek">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`${styles.toast} ${styles[toast.kind]}`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </div>
  )
}

export default App
