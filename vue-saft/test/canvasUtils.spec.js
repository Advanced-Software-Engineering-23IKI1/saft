import { describe, it, expect, beforeEach, vi } from 'vitest'
import { getMidpoint, distance, getCanvasPoint, computeInternalPos } from '@/utils/canvasUtils.js'

describe('canvasUtils', () => {
  describe('getMidpoint', () => {
    it('should compute midpoint between two points', () => {
      const p1 = { x: 0, y: 0 }
      const p2 = { x: 4, y: 4 }
      const result = getMidpoint(p1, p2)

      expect(result).toEqual({ x: 2, y: 2 })
    })

    it('should handle negative coordinates', () => {
      const p1 = { x: -2, y: -2 }
      const p2 = { x: 2, y: 2 }
      const result = getMidpoint(p1, p2)

      expect(result).toEqual({ x: 0, y: 0 })
    })

    it('should handle same points', () => {
      const p1 = { x: 5, y: 5 }
      const result = getMidpoint(p1, p1)

      expect(result).toEqual({ x: 5, y: 5 })
    })

    it('should handle decimal coordinates', () => {
      const p1 = { x: 1.5, y: 2.5 }
      const p2 = { x: 3.5, y: 4.5 }
      const result = getMidpoint(p1, p2)

      expect(result).toEqual({ x: 2.5, y: 3.5 })
    })

    it('should handle zero coordinates', () => {
      const p1 = { x: 0, y: 0 }
      const p2 = { x: 0, y: 0 }
      const result = getMidpoint(p1, p2)

      expect(result).toEqual({ x: 0, y: 0 })
    })
  })

  describe('distance', () => {
    it('should compute Euclidean distance between two points', () => {
      const a = { x: 0, y: 0 }
      const b = { x: 3, y: 4 }
      const result = distance(a, b)

      expect(result).toBeCloseTo(5, 5)
    })

    it('should handle same points (distance = 0)', () => {
      const a = { x: 5, y: 5 }
      const result = distance(a, a)

      expect(result).toBeCloseTo(0, 10)
    })

    it('should handle negative coordinates', () => {
      const a = { x: -1, y: -1 }
      const b = { x: 2, y: 3 }
      const result = distance(a, b)

      expect(result).toBeCloseTo(5, 5)
    })

    it('should return distance of 1 for unit separation', () => {
      const a = { x: 0, y: 0 }
      const b = { x: 1, y: 0 }
      const result = distance(a, b)

      expect(result).toBeCloseTo(1, 5)
    })

    it('should be commutative (distance(a,b) === distance(b,a))', () => {
      const a = { x: 10, y: 20 }
      const b = { x: 30, y: 40 }
      const dist1 = distance(a, b)
      const dist2 = distance(b, a)

      expect(dist1).toBeCloseTo(dist2, 10)
    })

    it('should handle decimal coordinates', () => {
      const a = { x: 0.5, y: 0.5 }
      const b = { x: 1.5, y: 1.5 }
      const result = distance(a, b)

      expect(result).toBeCloseTo(Math.sqrt(2), 5)
    })

    it('should handle large distances', () => {
      const a = { x: 0, y: 0 }
      const b = { x: 1000, y: 1000 }
      const result = distance(a, b)

      expect(result).toBeCloseTo(Math.sqrt(2000000), 5)
    })
  })

  describe('getCanvasPoint', () => {
    let canvasRef
    let mockCanvas
    let mockEvent

    beforeEach(() => {
      mockCanvas = document.createElement('canvas')
      mockCanvas.width = 800
      mockCanvas.height = 600
      
      // Mock getBoundingClientRect
      mockCanvas.getBoundingClientRect = vi.fn().mockReturnValue({
        left: 100,
        top: 50,
        right: 900,
        bottom: 650,
        width: 800,
        height: 600,
        x: 100,
        y: 50,
      })

      canvasRef = { value: mockCanvas }
    })

    it('should compute canvas point from mouse event', () => {
      mockEvent = new MouseEvent('mousemove', {
        clientX: 200,
        clientY: 150,
      })

      const result = getCanvasPoint(mockEvent, canvasRef)

      expect(result).toEqual({ x: 100, y: 100 })
    })

    it('should handle pointer at canvas origin', () => {
      mockEvent = new MouseEvent('mousemove', {
        clientX: 100,
        clientY: 50,
      })

      const result = getCanvasPoint(mockEvent, canvasRef)

      expect(result).toEqual({ x: 0, y: 0 })
    })

    it('should handle pointer at canvas edge', () => {
      mockEvent = new MouseEvent('mousemove', {
        clientX: 900,
        clientY: 650,
      })

      const result = getCanvasPoint(mockEvent, canvasRef)

      expect(result).toEqual({ x: 800, y: 600 })
    })

    it('should handle negative relative coordinates (outside canvas)', () => {
      mockEvent = new MouseEvent('mousemove', {
        clientX: 50,
        clientY: 25,
      })

      const result = getCanvasPoint(mockEvent, canvasRef)

      expect(result).toEqual({ x: -50, y: -25 })
    })
  })

  describe('computeInternalPos', () => {
    it('should convert canvas coordinates to internal coordinates with no zoom or offsets', () => {
      const pos = { x: 100, y: 200 }
      const result = computeInternalPos(pos, 1, 1, 0, 0)

      expect(result).toEqual({ x: 100, y: 200 })
    })

    it('should apply zoom correctly', () => {
      const pos = { x: 100, y: 200 }
      const result = computeInternalPos(pos, 2, 1, 0, 0)

      expect(result).toEqual({ x: 50, y: 100 })
    })

    it('should apply scale factor', () => {
      const pos = { x: 100, y: 200 }
      const result = computeInternalPos(pos, 1, 2, 0, 0)

      expect(result).toEqual({ x: 200, y: 400 })
    })

    it('should apply both zoom and scale factor', () => {
      const pos = { x: 100, y: 200 }
      const result = computeInternalPos(pos, 2, 2, 0, 0)

      expect(result).toEqual({ x: 100, y: 200 })
    })

    it('should apply width offset', () => {
      const pos = { x: 100, y: 200 }
      const result = computeInternalPos(pos, 1, 1, 0, 50)

      expect(result).toEqual({ x: 150, y: 200 })
    })

    it('should apply height offset', () => {
      const pos = { x: 100, y: 200 }
      const result = computeInternalPos(pos, 1, 1, 30, 0)

      expect(result).toEqual({ x: 100, y: 230 })
    })

    it('should apply all parameters together', () => {
      const pos = { x: 100, y: 200 }
      const result = computeInternalPos(pos, 2, 2, 50, 40)

      expect(result).toEqual({ x: 140, y: 250 })
    })

    it('should handle zero position', () => {
      const pos = { x: 0, y: 0 }
      const result = computeInternalPos(pos, 1, 1, 100, 200)

      expect(result).toEqual({ x: 200, y: 100 })
    })

    it('should handle high zoom levels', () => {
      const pos = { x: 1000, y: 1000 }
      const result = computeInternalPos(pos, 10, 1, 0, 0)

      expect(result).toEqual({ x: 100, y: 100 })
    })

    it('should handle decimal values', () => {
      const pos = { x: 50.5, y: 75.5 }
      const result = computeInternalPos(pos, 2, 1, 10.5, 20.5)

      expect(result.x).toBeCloseTo(45.75, 5)
      expect(result.y).toBeCloseTo(48.25, 5)
    })

    it('should handle negative offsets', () => {
      const pos = { x: 100, y: 200 }
      const result = computeInternalPos(pos, 1, 1, -50, -30)

      expect(result).toEqual({ x: 70, y: 150 })
    })
  })
})
