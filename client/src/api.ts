import type {
  AuthState,
  Booking,
  BookingPayload,
  GameTable,
  Position,
  TablePayload,
  TableUpdatePayload,
  Timeslot,
  User,
} from './types'

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'
const API_ROOT = `${API_BASE.replace(/\/$/, '')}/api/v1`

type RequestOptions = {
  token?: string | null
  body?: unknown
}

type LoginResponse = {
  token: string
  user: User
}

type RegisterResponse = {
  user: User
}

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function request<T>(
  path: string,
  method = 'GET',
  options: RequestOptions = {},
): Promise<T> {
  const headers = new Headers()

  if (options.body !== undefined) {
    headers.set('Content-Type', 'application/json')
  }

  if (options.token) {
    headers.set('Authorization', `Bearer ${options.token}`)
  }

  const response = await fetch(`${API_ROOT}${path}`, {
    method,
    headers,
    credentials: 'include',
    body:
      options.body === undefined ? undefined : JSON.stringify(options.body),
  })

  if (response.status === 204) {
    return undefined as T
  }

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    const message =
      data && typeof data.message === 'string'
        ? data.message
        : 'A szerver nem tudta teljesiteni a kerest.'
    throw new ApiError(message, response.status)
  }

  return data as T
}

export const api = {
  login(email: string, password: string) {
    return request<LoginResponse>('/auth/login', 'POST', {
      body: { email, password },
    })
  },

  register(name: string, email: string, password: string) {
    return request<RegisterResponse>('/auth/register', 'POST', {
      body: { name, email, password },
    })
  },

  me(token: string) {
    return request<User>('/auth/me', 'GET', { token })
  },

  logout(token: string | null) {
    return request<void>('/auth/logout', 'POST', { token })
  },

  getTables() {
    return request<GameTable[]>('/tables')
  },

  createTable(token: string, table: TablePayload) {
    return request<GameTable>('/tables', 'POST', { token, body: table })
  },

  updateTable(token: string, tableId: number, table: TableUpdatePayload) {
    return request<GameTable>(`/tables/${tableId}`, 'PATCH', {
      token,
      body: table,
    })
  },

  updateTablePosition(token: string, tableId: number, position: Position) {
    return request<GameTable>(`/tables/${tableId}/position`, 'PATCH', {
      token,
      body: position,
    })
  },

  getTimeslots(tableId: number, date: string) {
    const params = new URLSearchParams({ date })
    return request<Timeslot[]>(`/tables/${tableId}/timeslots?${params}`)
  },

  createBooking(token: string, booking: BookingPayload) {
    return request<Booking>('/bookings', 'POST', { token, body: booking })
  },

  getMyBookings(token: string) {
    return request<Booking[]>('/bookings/my', 'GET', { token })
  },

  getAllBookings(token: string) {
    return request<Booking[]>('/bookings', 'GET', { token })
  },

  updateBookingStatus(
    token: string,
    bookingId: number,
    status: 'accepted' | 'declined',
  ) {
    return request<Booking>(`/bookings/${bookingId}/status`, 'PATCH', {
      token,
      body: { status },
    })
  },
}

export function loadStoredAuth(): AuthState {
  const token = localStorage.getItem('roomlie-token')
  const userJson = localStorage.getItem('roomlie-user')

  if (!token || !userJson) {
    return { token: null, user: null }
  }

  try {
    return { token, user: JSON.parse(userJson) as User }
  } catch {
    localStorage.removeItem('roomlie-token')
    localStorage.removeItem('roomlie-user')
    return { token: null, user: null }
  }
}

export function storeAuth({ token, user }: AuthState) {
  if (!token || !user) {
    localStorage.removeItem('roomlie-token')
    localStorage.removeItem('roomlie-user')
    return
  }

  localStorage.setItem('roomlie-token', token)
  localStorage.setItem('roomlie-user', JSON.stringify(user))
}
