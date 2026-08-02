import { useCallback, useEffect, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'

/**
 * Resizable floating panel (used by the Idrizz chat): drag a handle to
 * resize, clamped to min/max, size remembered in localStorage.
 */

export interface PanelSize {
  width: number
  height: number
}

export interface PanelBounds {
  minWidth: number
  maxWidth: number
  minHeight: number
  maxHeight: number
}

export function clampPanelSize(size: PanelSize, bounds: PanelBounds): PanelSize {
  return {
    width: Math.min(bounds.maxWidth, Math.max(bounds.minWidth, size.width)),
    height: Math.min(bounds.maxHeight, Math.max(bounds.minHeight, size.height)),
  }
}

export interface ResizablePanelOptions extends PanelBounds {
  defaultSize: PanelSize
  storageKey?: string
}

export function useResizablePanel({
  defaultSize,
  minWidth,
  maxWidth,
  minHeight,
  maxHeight,
  storageKey,
}: ResizablePanelOptions) {
  const [size, setSize] = useState<PanelSize>(() => {
    if (!storageKey) return defaultSize
    try {
      const raw = window.localStorage.getItem(storageKey)
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<PanelSize>
        if (typeof parsed.width === 'number' && typeof parsed.height === 'number') {
          return clampPanelSize(
            { width: parsed.width, height: parsed.height },
            { minWidth, maxWidth, minHeight, maxHeight },
          )
        }
      }
    } catch {
      // corrupted storage: fall back to defaults
    }
    return defaultSize
  })

  const dragRef = useRef<{
    startX: number
    startY: number
    startWidth: number
    startHeight: number
  } | null>(null)

  const onPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      event.preventDefault()
      dragRef.current = {
        startX: event.clientX,
        startY: event.clientY,
        startWidth: size.width,
        startHeight: size.height,
      }

      const onMove = (ev: PointerEvent) => {
        const drag = dragRef.current
        if (!drag) return
        setSize(
          clampPanelSize(
            {
              width: drag.startWidth + (ev.clientX - drag.startX),
              height: drag.startHeight + (ev.clientY - drag.startY),
            },
            { minWidth, maxWidth, minHeight, maxHeight },
          ),
        )
      }
      const onUp = () => {
        dragRef.current = null
        window.removeEventListener('pointermove', onMove)
        window.removeEventListener('pointerup', onUp)
      }
      window.addEventListener('pointermove', onMove)
      window.addEventListener('pointerup', onUp)
    },
    [size, minWidth, maxWidth, minHeight, maxHeight],
  )

  useEffect(() => {
    if (!storageKey) return
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(size))
    } catch {
      // private mode: just don't remember
    }
  }, [size, storageKey])

  return { size, onPointerDown }
}
