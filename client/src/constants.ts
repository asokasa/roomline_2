import type { RoomSize, TableCategory, TableColor, TableType } from './types'

export const INITIAL_ROOM_SIZE: RoomSize = {
  width: 720,
  height: 460,
}

export const MIN_ROOM_SIZE: RoomSize = {
  width: 360,
  height: 260,
}

export const MAX_ROOM_SIZE: RoomSize = {
  width: 1200,
  height: 800,
}

export const TABLE_TYPES: TableType[] = ['snooker', 'air-hockey', 'foosball']

export const TABLE_CATEGORIES: TableCategory[] = [
  'competition',
  'normal',
  'kids',
]

export const TABLE_COLOR_OPTIONS: TableColor[] = [
  'green',
  'blue',
  'red',
  'yellow',
  'purple',
]

export const TABLE_SPECS: Record<
  TableType,
  { width: number; height: number; clearance: number }
> = {
  snooker: { width: 190, height: 100, clearance: 50 },
  'air-hockey': { width: 140, height: 70, clearance: 40 },
  foosball: { width: 120, height: 60, clearance: 30 },
}

export const TABLE_TYPE_LABELS: Record<TableType, string> = {
  snooker: 'biliard',
  'air-hockey': 'leghoki',
  foosball: 'csocso',
}

export const CATEGORY_LABELS: Record<TableCategory, string> = {
  competition: 'verseny',
  normal: 'normal',
  kids: 'gyerek',
}

export const COLOR_LABELS: Record<TableColor, string> = {
  green: 'zold',
  blue: 'kek',
  red: 'piros',
  yellow: 'sarga',
  purple: 'lila',
}

export const COLOR_RGB: Record<TableColor, [number, number, number]> = {
  green: [48, 255, 171],
  blue: [66, 189, 255],
  red: [255, 75, 124],
  yellow: [255, 224, 86],
  purple: [192, 110, 255],
}
