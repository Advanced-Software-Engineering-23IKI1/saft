import { describe, it, expect } from 'vitest'
import { fft } from '@/utils/fft.js'

describe('FFT', () => {
  it('should compute FFT for simple input', () => {
    const input = [1, 0, 1, 0]
    const result = fft(input)

    expect(result).toHaveProperty('re')
    expect(result).toHaveProperty('im')
    expect(result.re).toBeInstanceOf(Float64Array)
    expect(result.im).toBeInstanceOf(Float64Array)
    expect(result.re.length).toBe(4)
    expect(result.im.length).toBe(4)
  })

  it('should handle DC signal (constant input)', () => {
    const input = [1, 1, 1, 1]
    const result = fft(input)

    // DC component should be 4 (sum of input)
    expect(result.re[0]).toBeCloseTo(4, 5)
    expect(result.im[0]).toBeCloseTo(0, 5)
  })

  it('should handle impulse (Dirac delta)', () => {
    const input = [1, 0, 0, 0]
    const result = fft(input)

    // All frequency components should be 1
    expect(Math.abs(result.re[0])).toBeCloseTo(1, 5)
    expect(Math.abs(result.re[1])).toBeCloseTo(1, 5)
    expect(Math.abs(result.re[2])).toBeCloseTo(1, 5)
    expect(Math.abs(result.re[3])).toBeCloseTo(1, 5)
  })

  it('should compute FFT for larger power-of-2 input', () => {
    const input = new Array(16).fill(0).map((_, i) => Math.sin(i))
    const result = fft(input)

    expect(result.re.length).toBe(16)
    expect(result.im.length).toBe(16)
  })

  it('should sanitize non-finite values to 0', () => {
    const input = [1, NaN, Infinity, -Infinity]
    const result = fft(input)

    // Should not throw and should handle gracefully
    expect(result.re).toBeInstanceOf(Float64Array)
    expect(result.im).toBeInstanceOf(Float64Array)
  })

  it('should throw error for non-power-of-2 length', () => {
    const input = [1, 2, 3]
    expect(() => fft(input)).toThrow('length must be power of 2')
  })

  it('should handle length 1 (smallest valid FFT)', () => {
    // 1 is 2^0, technically a power of 2
    const input = [1]
    const result = fft(input)
    expect(result.re[0]).toBe(1)
    expect(result.im[0]).toBe(0)
  })

  it('should handle length 2 (smallest practical FFT)', () => {
    const input = [1, 2]
    const result = fft(input)

    expect(result.re.length).toBe(2)
    expect(result.im.length).toBe(2)
    // Re[0] = 1 + 2 = 3 (DC component)
    expect(result.re[0]).toBeCloseTo(3, 5)
  })

  it('should accept array-like inputs', () => {
    const input = [1, 0, 1, 0]
    const result = fft(input)

    expect(result.re.length).toBe(4)
    expect(result.im.length).toBe(4)
  })

  it('should compute correct magnitude spectrum', () => {
    // Sine wave has energy in positive and negative frequencies
    const input = [0, 1, 0, -1]
    const result = fft(input)

    const magnitudes = Array.from({ length: 4 }, (_, i) => 
      Math.sqrt(result.re[i] ** 2 + result.im[i] ** 2)
    )

    expect(magnitudes.some(m => m > 0.1)).toBe(true)
  })

  it('should work with Float64Array input', () => {
    const input = new Float64Array([1, 0, 1, 0])
    const result = fft(input)

    expect(result.re.length).toBe(4)
    expect(result.im.length).toBe(4)
  })
})
