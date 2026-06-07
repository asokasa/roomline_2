export type TableType = 'snooker' | 'air-hockey' | 'foosball'

export type TableCategory = 'competition' | 'normal' | 'kids'

export type TableColor = 'red' | 'blue' | 'green' | 'yellow' | 'purple'

export type Position = {
  x: number
  y: number
}

export type RoomSize = {
  width: number
  height: number
}

export type GameTable = {
  id: number
  name?: string
  type: TableType
  category: TableCategory
  color: TableColor
  status: number
  position: Position
  isLocked: boolean
}

export type RawGameTable = Omit<GameTable, 'isLocked'> & {
  'is-locked': boolean
}

export type NewTableDraft = Omit<GameTable, 'id' | 'position'>

export type UserRole = 'user' | 'admin'

export type User = {
  id: number
  name: string
  email: string
  role: UserRole
}

export type Timeslot = {
  startTime: string
  endTime: string
  isAvailable: boolean
}

export type BookingStatus = 'pending' | 'accepted' | 'declined'

export type Booking = {
  id: number
  tableId: number
  tableName: string
  userId: number
  date: string
  startTime: string
  endTime: string
  name: string
  email: string
  phone: string
  headcount: number
  notes?: string
  status: BookingStatus
}

export type AuthState = {
  user: User | null
  token: string | null
}

export type TablePayload = {
  name?: string
  type: TableType
  category: TableCategory
  color: TableColor
  status: number
  position: Position
  isLocked: boolean
}

export type TableUpdatePayload = Partial<TablePayload>

export type BookingPayload = {
  tableId: number
  date: string
  startTime: string
  endTime: string
  name: string
  email: string
  phone: string
  headcount: number
  notes?: string
}
