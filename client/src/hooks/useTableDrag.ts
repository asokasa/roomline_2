import { useRef, useState } from 'react'
import type { MouseEvent, PointerEvent } from 'react'
import type { GameTable, NewTableDraft, Position, RoomSize } from '../types'
import { clampPhysicalPosition, roundPosition } from '../utils/tableGeometry'

type DragState = {
  id: number
  offsetX: number
  offsetY: number
  originPosition: Position
  currentPosition: Position
}

type UseTableDragProps = {
  roomSize: RoomSize
  pendingTable: NewTableDraft | null
  canDragTables: boolean
  onSelectTable: (id: number) => void
  onMoveTable: (id: number, position: Position) => void
  onMoveFinished: (
    id: number,
    originPosition: Position,
    finalPosition: Position,
  ) => void
}

export function useTableDrag({
  roomSize,
  pendingTable,
  canDragTables,
  onSelectTable,
  onMoveTable,
  onMoveFinished,
}: UseTableDragProps) {
  const roomRef = useRef<HTMLDivElement>(null)
  const [dragState, setDragState] = useState<DragState | null>(null)

  const getRoomPosition = (
    event: PointerEvent | MouseEvent,
    table: GameTable,
    offset: Position = { x: 0, y: 0 },
  ) => {
    const roomRect = roomRef.current?.getBoundingClientRect()

    if (!roomRect) {
      return table.position
    }

    return clampPhysicalPosition(
      table,
      {
        x: event.clientX - roomRect.left - offset.x,
        y: event.clientY - roomRect.top - offset.y,
      },
      roomSize,
    )
  }

  const handleTablePointerDown = (
    table: GameTable,
    event: PointerEvent<HTMLButtonElement>,
  ) => {
    if (event.button !== 0) {
      return
    }

    event.stopPropagation()
    onSelectTable(table.id)

    if (!canDragTables || table.isLocked || pendingTable) {
      return
    }

    const roomRect = roomRef.current?.getBoundingClientRect()

    if (!roomRect) {
      return
    }

    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)

    setDragState({
      id: table.id,
      offsetX: event.clientX - roomRect.left - table.position.x,
      offsetY: event.clientY - roomRect.top - table.position.y,
      originPosition: table.position,
      currentPosition: table.position,
    })
  }

  const handleTablePointerMove = (
    table: GameTable,
    event: PointerEvent<HTMLButtonElement>,
  ) => {
    if (dragState?.id !== table.id) {
      return
    }

    event.preventDefault()

    const nextPosition = getRoomPosition(event, table, {
      x: dragState.offsetX,
      y: dragState.offsetY,
    })

    onMoveTable(table.id, nextPosition)
    setDragState((currentState) =>
      currentState
        ? { ...currentState, currentPosition: nextPosition }
        : currentState,
    )
  }

  const handleTablePointerUp = (
    table: GameTable,
    event: PointerEvent<HTMLButtonElement>,
  ) => {
    if (dragState?.id !== table.id) {
      return
    }

    event.preventDefault()

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }

    onMoveFinished(
      table.id,
      dragState.originPosition,
      roundPosition(dragState.currentPosition),
    )
    setDragState(null)
  }

  return {
    roomRef,
    draggingId: dragState?.id ?? null,
    getRoomPosition,
    handleTablePointerDown,
    handleTablePointerMove,
    handleTablePointerUp,
  }
}
