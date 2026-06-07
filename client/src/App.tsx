import { useCallback, useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { api, storeAuth } from './api'
import {
  bookingFormForUser,
  draftFromTableForm,
  emptyTableForm,
  getErrorMessage,
  keepSelectedBooking,
  payloadFromTableForm,
  slotKey,
  tableFormFromTable,
  todayIso,
} from './appHelpers'
import type { Page, TableForm, Toast, ToastKind } from './appTypes'
import { AppShell } from './components/AppShell'
import { AdminTableEditor } from './components/AdminTableEditor'
import { BookingPanel } from './components/BookingPanel'
import { ToastStack } from './components/ToastStack'
import { INITIAL_ROOM_SIZE } from './constants'
import { AddTablePage } from './pages/AddTablePage'
import { AuthPage } from './pages/AuthPage'
import { BookingsPage } from './pages/BookingsPage'
import { RoomPage } from './pages/RoomPage'
import {
  clearAuthState,
  setAuthState,
  setTheme,
} from './store'
import type { AppDispatch, RootState } from './store'
import type { Booking, GameTable, NewTableDraft, Position } from './types'
import {
  getClearanceIssueIds,
  getPlacementError,
  roundPosition,
} from './utils/tableGeometry'

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
  const canSelectTables = auth.user !== null
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
        pushToast(
          `Idopontok betoltese sikertelen: ${getErrorMessage(error)}`,
          'error',
        )
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
        keepSelectedBooking(loadedBookings, currentId),
      )
    } catch (error) {
      pushToast(
        `Foglalasaim betoltese sikertelen: ${getErrorMessage(error)}`,
        'error',
      )
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
        keepSelectedBooking(loadedBookings, currentId),
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
  }, [auth.token, dispatch])

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
  }, [isAdmin, selectedTable])

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
    pushToast(
      'Mozgasd az egeret a teremben, majd kattints a lerakasi pontra.',
      'info',
    )
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

  const roomSidebar =
    auth.user?.role === 'user' ? (
      <BookingPanel
        selectedTable={selectedTable}
        selectedDate={selectedDate}
        timeslots={timeslots}
        timeslotsLoading={timeslotsLoading}
        selectedSlot={selectedSlot}
        bookingForm={bookingForm}
        bookingSubmitting={bookingSubmitting}
        onDateChange={handleDateChange}
        onSelectSlot={setSelectedSlot}
        onBookingFormChange={setBookingForm}
        onSubmit={handleCreateBooking}
      />
    ) : isAdmin ? (
      <AdminTableEditor
        selectedTable={selectedTable}
        tableEditor={tableEditor}
        tableSaving={tableSaving}
        onSubmit={handleSaveTable}
        onChange={updateTableEditor}
      />
    ) : null

  const renderCurrentPage = () => {
    if (page === 'login') {
      return (
        <AuthPage
          mode="login"
          loginForm={loginForm}
          registerForm={registerForm}
          onLoginFormChange={setLoginForm}
          onRegisterFormChange={setRegisterForm}
          onLogin={handleLogin}
          onRegister={handleRegister}
        />
      )
    }

    if (page === 'register') {
      return (
        <AuthPage
          mode="register"
          loginForm={loginForm}
          registerForm={registerForm}
          onLoginFormChange={setLoginForm}
          onRegisterFormChange={setRegisterForm}
          onLogin={handleLogin}
          onRegister={handleRegister}
        />
      )
    }

    if (page === 'add-table') {
      return (
        <AddTablePage
          isAdmin={isAdmin}
          newTableForm={newTableForm}
          newTableSaving={newTableSaving}
          onSubmit={handleCreateTable}
          onStartPlacement={handleStartTablePlacement}
          onChange={updateNewTable}
        />
      )
    }

    if (page === 'my-bookings') {
      return (
        <BookingsPage
          bookings={myBookings}
          loading={myBookingsLoading}
          selectedBookingId={selectedMyBookingId}
          adminMode={false}
          onSelectBooking={setSelectedMyBookingId}
          onRefresh={() => {
            void refreshMyBookings()
          }}
          onBookingStatus={(bookingId, status) => {
            void handleBookingStatus(bookingId, status)
          }}
        />
      )
    }

    if (page === 'admin-bookings') {
      return (
        <BookingsPage
          bookings={adminBookings}
          loading={adminBookingsLoading}
          selectedBookingId={selectedAdminBookingId}
          adminMode
          onSelectBooking={setSelectedAdminBookingId}
          onRefresh={() => {
            void refreshAdminBookings()
          }}
          onBookingStatus={(bookingId, status) => {
            void handleBookingStatus(bookingId, status)
          }}
        />
      )
    }

    return (
      <RoomPage
        tables={tables}
        roomSize={roomSize}
        selectedId={selectedId}
        clearanceIssueIds={clearanceIssueIds}
        pendingTable={pendingTable}
        canSelectTables={canSelectTables}
        canDragTables={canDragTables}
        tablesLoading={tablesLoading}
        tablesError={tablesError}
        sidebar={roomSidebar}
        onSelectTable={handleSelectTable}
        onMoveTable={handleMoveTable}
        onMoveFinished={handleMoveFinished}
        onPlacePendingTable={(position) => {
          void handlePlacePendingTable(position)
        }}
        onCancelPendingTable={handleCancelTablePlacement}
      />
    )
  }

  return (
    <>
      <AppShell
        page={page}
        user={auth.user}
        theme={theme}
        isAdmin={isAdmin}
        tableCount={tables.length}
        roomSize={roomSize}
        onNavigate={setPage}
        onToggleTheme={() =>
          dispatch(setTheme(theme === 'dark' ? 'light' : 'dark'))
        }
        onLogout={() => {
          void handleLogout()
        }}
      >
        {renderCurrentPage()}
      </AppShell>
      <ToastStack toasts={toasts} />
    </>
  )
}

export default App
