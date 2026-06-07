import type {
  Booking,
  TableCategory,
  TableColor,
  TableType,
} from './types'

export type Page =
  | 'room'
  | 'login'
  | 'register'
  | 'my-bookings'
  | 'add-table'
  | 'admin-bookings'

export type ToastKind = 'success' | 'error' | 'info'

export type Toast = {
  id: number
  kind: ToastKind
  message: string
}

export type TableForm = {
  name: string
  type: TableType
  category: TableCategory
  color: TableColor
  status: number
  x: number
  y: number
  isLocked: boolean
}

export type BookingForm = {
  name: string
  email: string
  phone: string
  headcount: number
  notes: string
}

export type LoginForm = {
  email: string
  password: string
}

export type RegisterForm = LoginForm & {
  name: string
}

export type BookingSelection = {
  bookings: Booking[]
  selectedId: number | null
}
