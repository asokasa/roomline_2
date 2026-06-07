import { COLOR_RGB, TABLE_SPECS } from '../constants'
import type {
  GameTable,
  Position,
  RawGameTable,
  RoomSize,
  TableColor,
} from '../types'

type Rect = {
  left: number
  top: number
  right: number
  bottom: number
}

export function normalizeTables(tables: RawGameTable[]): GameTable[] {
  return tables.map((table) => ({
    id: table.id,
    type: table.type,
    category: table.category,
    color: table.color,
    status: table.status,
    position: table.position,
    isLocked: table['is-locked'],
  }))
}

export function getTableRect(table: GameTable): Rect {
  const spec = TABLE_SPECS[table.type]

  return {
    left: table.position.x,
    top: table.position.y,
    right: table.position.x + spec.width,
    bottom: table.position.y + spec.height,
  }
}

export function getClearanceRect(table: GameTable): Rect {
  const spec = TABLE_SPECS[table.type]
  const rect = getTableRect(table)

  return {
    left: rect.left - spec.clearance,
    top: rect.top - spec.clearance,
    right: rect.right + spec.clearance,
    bottom: rect.bottom + spec.clearance,
  }
}

export function rectsOverlap(first: Rect, second: Rect): boolean {
  return (
    first.left < second.right &&
    first.right > second.left &&
    first.top < second.bottom &&
    first.bottom > second.top
  )
}

export function clampPhysicalPosition(
  table: GameTable,
  position: Position,
  roomSize: RoomSize,
): Position {
  const spec = TABLE_SPECS[table.type]

  return {
    x: Math.round(Math.min(Math.max(position.x, 0), roomSize.width - spec.width)),
    y: Math.round(
      Math.min(Math.max(position.y, 0), roomSize.height - spec.height),
    ),
  }
}

export function getPlacementError(
  candidate: GameTable,
  existingTables: GameTable[],
  roomSize: RoomSize,
): string | null {
  const candidateRect = getTableRect(candidate)
  const candidateClearance = getClearanceRect(candidate)

  if (
    candidateClearance.left < 0 ||
    candidateClearance.top < 0 ||
    candidateClearance.right > roomSize.width ||
    candidateClearance.bottom > roomSize.height
  ) {
    return 'Az asztal a saját helyigényével együtt nem fér el a teremben.'
  }

  const otherTables = existingTables.filter((table) => table.id !== candidate.id)

  if (
    otherTables.some((table) => rectsOverlap(candidateRect, getTableRect(table)))
  ) {
    return 'Az asztalok nem fedhetik egymást.'
  }

  if (
    otherTables.some((table) =>
      rectsOverlap(candidateClearance, getTableRect(table)),
    )
  ) {
    return 'Ehhez az asztalhoz nincs meg a szükséges szabad játéktér.'
  }

  return null
}

export function getClearanceIssueIds(
  tables: GameTable[],
  roomSize: RoomSize,
): Set<number> {
  const issueIds = new Set<number>()

  tables.forEach((table) => {
    const clearanceRect = getClearanceRect(table)

    if (
      clearanceRect.left < 0 ||
      clearanceRect.top < 0 ||
      clearanceRect.right > roomSize.width ||
      clearanceRect.bottom > roomSize.height
    ) {
      issueIds.add(table.id)
      return
    }

    const isBlocked = tables.some(
      (otherTable) =>
        otherTable.id !== table.id &&
        rectsOverlap(clearanceRect, getTableRect(otherTable)),
    )

    if (isBlocked) {
      issueIds.add(table.id)
    }
  })

  return issueIds
}

export function getTableDisplayColor(
  color: TableColor,
  status: number,
): string {
  const [red, green, blue] = COLOR_RGB[color]
  const strength = 0.3 + Math.min(Math.max(status, 1), 10) * 0.07
  const mixWithChrome = (channel: number) =>
    Math.round(178 * (1 - strength) + channel * strength)

  return `rgb(${mixWithChrome(red)}, ${mixWithChrome(green)}, ${mixWithChrome(
    blue,
  )})`
}

export function roundPosition(position: Position): Position {
  return {
    x: Math.round(position.x),
    y: Math.round(position.y),
  }
}
