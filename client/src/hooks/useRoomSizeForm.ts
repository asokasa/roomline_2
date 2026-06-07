import { useEffect, useState } from 'react'
import { MAX_ROOM_SIZE, MIN_ROOM_SIZE } from '../constants'
import type { RoomSize } from '../types'

type UseRoomSizeFormProps = {
  roomSize: RoomSize
  onApplyRoomSize: (roomSize: RoomSize) => void
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

export function useRoomSizeForm({
  roomSize,
  onApplyRoomSize,
}: UseRoomSizeFormProps) {
  const [width, setWidth] = useState(roomSize.width)
  const [height, setHeight] = useState(roomSize.height)

  useEffect(() => {
    setWidth(roomSize.width)
    setHeight(roomSize.height)
  }, [roomSize])

  const applyRoomSize = () => {
    onApplyRoomSize({
      width: clamp(width, MIN_ROOM_SIZE.width, MAX_ROOM_SIZE.width),
      height: clamp(height, MIN_ROOM_SIZE.height, MAX_ROOM_SIZE.height),
    })
  }

  return {
    width,
    height,
    setWidth,
    setHeight,
    applyRoomSize,
  }
}
