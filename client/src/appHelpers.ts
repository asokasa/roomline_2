import { ApiError } from './api'
import {
  TABLE_TYPE_LABELS,
} from './constants'
import type {
  Booking,
  GameTable,
  NewTableDraft,
  TablePayload,
} from './types'
import { roundPosition } from './utils/tableGeometry'
import type { BookingForm, Page, TableForm } from './appTypes'

export const pageTitles: Record<Page, string> = {
  room: 'Terem',
  login: 'Bejelentkezes',
  register: 'Regisztracio',
  'my-bookings': 'Foglalasaim',
  'add-table': 'Asztal hozzaadasa',
  'admin-bookings': 'Beerkezett foglalasok',
}

export function formatDate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

export function todayIso() {
  return formatDate(new Date())
}

export function shiftDate(value: string, days: number) {
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(year, month - 1, day + days)

  return formatDate(date)
}

export function getErrorMessage(error: unknown) {
  return error instanceof ApiError
    ? error.message
    : 'Varatlan hiba tortent.'
}

export function slotKey(startTime: string, endTime: string) {
  return `${startTime}-${endTime}`
}

function validStatus(status: number) {
  return Math.min(Math.max(status, 1), 10)
}

export function emptyTableForm(): TableForm {
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

export function tableFormFromTable(table: GameTable): TableForm {
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

export function payloadFromTableForm(form: TableForm): TablePayload {
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

export function draftFromTableForm(form: TableForm): NewTableDraft {
  return {
    name: form.name.trim() || undefined,
    type: form.type,
    category: form.category,
    color: form.color,
    status: validStatus(form.status),
    isLocked: form.isLocked,
  }
}

export function bookingFormForUser(name = '', email = ''): BookingForm {
  return {
    name,
    email,
    phone: '',
    headcount: 1,
    notes: '',
  }
}

export function keepSelectedBooking(
  bookings: Booking[],
  currentId: number | null,
) {
  return bookings.some((booking) => booking.id === currentId)
    ? currentId
    : bookings[0]?.id ?? null
}
