'use client'

import { useRef, useEffect } from 'react'
import gsap from 'gsap'

const CELL_COLORS = [
  '#ffffff', // white        — bright highlight
  '#dbeafe', // blue-100     — very light
  '#bfdbfe', // blue-200     — light
  '#93c5fd', // blue-300     — medium light
  '#60a5fa', // blue-400     — medium
  '#1e40af', // blue-800     — dark contrast
  '#1e3a8a', // blue-900     — very dark
  '#e0e7ff', // indigo-100   — slight purple cast
]

const COLS = 60
const ROWS = 45
const TOTAL = COLS * ROWS

export function generateGridData(): { order: number[]; colors: string[] } {
  const indices = Array.from({ length: TOTAL }, (_, i) => i)
  // Fisher-Yates shuffle
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[indices[i], indices[j]] = [indices[j], indices[i]]
  }
  const colors = Array.from({ length: TOTAL }, () =>
    CELL_COLORS[Math.floor(Math.random() * CELL_COLORS.length)]
  )
  return { order: indices, colors }
}

interface PixelGridProps {
  gridOrder: number[]
  cellColors: string[]
  revealedCount: number
}

export function PixelGrid({ gridOrder, cellColors, revealedCount }: PixelGridProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const prevCountRef = useRef(0)

  useEffect(() => {
    if (!containerRef.current) return

    const prev = prevCountRef.current
    const curr = revealedCount

    if (curr > prev) {
      // Reveal newly added cells with spring animation
      for (let i = prev; i < curr; i++) {
        const cellIndex = gridOrder[i]
        const cell = containerRef.current.children[cellIndex] as HTMLElement
        if (!cell) continue
        // Pre-promote the cell to its own GPU layer before animating so Safari
        // doesn't create the layer mid-frame (which causes the blur flash).
        cell.style.willChange = 'transform, opacity'
        gsap.fromTo(
          cell,
          { scale: 0, opacity: 0 },
          {
            scale: 1,
            opacity: 1,
            duration: 0.6,
            ease: 'elastic.out(1, 0.4)',
            force3D: true,
            onComplete: () => { cell.style.willChange = '' },
          }
        )
      }
    } else if (curr < prev) {
      // Hide removed cells
      for (let i = curr; i < prev; i++) {
        const cellIndex = gridOrder[i]
        const cell = containerRef.current.children[cellIndex] as HTMLElement
        if (!cell) continue
        cell.style.willChange = 'transform, opacity'
        gsap.to(cell, {
          scale: 0,
          opacity: 0,
          duration: 0.15,
          ease: 'power2.in',
          force3D: true,
          onComplete: () => { cell.style.willChange = '' },
        })
      }
    }

    prevCountRef.current = curr
  }, [revealedCount, gridOrder])

  return (
    <div
      ref={containerRef}
      className="w-full h-full"
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${COLS}, 1fr)`,
        gridTemplateRows: `repeat(${ROWS}, 1fr)`,
        gap: '1px',
        // Force GPU compositing layer so Safari doesn't "upgrade" the
        // container mid-animation (which causes the blur flash).
        transform: 'translateZ(0)',
        WebkitTransform: 'translateZ(0)',
      }}
      aria-hidden="true"
    >
      {Array.from({ length: TOTAL }, (_, i) => (
        <div
          key={i}
          style={{ backgroundColor: cellColors[i], opacity: 0, transform: 'scale(0)' }}
        />
      ))}
    </div>
  )
}
