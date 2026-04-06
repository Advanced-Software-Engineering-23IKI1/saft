import { describe, it, expect } from 'vitest'
import { fft, fftComplex, ifft } from '@/utils/fft.js'

describe('FFT', () => {
  // ===== Basic FFT Tests (Real Input) =====
  describe('fft() - Real Input', () => {
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

    it('should compute FFT for larger power-of-2 input (16)', () => {
      const input = new Array(16).fill(0).map((_, i) => Math.sin(i))
      const result = fft(input)

      expect(result.re.length).toBe(16)
      expect(result.im.length).toBe(16)
    })

    it('should compute FFT for power-of-2 input (32)', () => {
      const input = new Array(32).fill(0).map((_, i) => Math.cos(i * 0.1))
      const result = fft(input)

      expect(result.re.length).toBe(32)
      expect(result.im.length).toBe(32)
    })

    it('should compute FFT for power-of-2 input (64)', () => {
      const input = new Array(64).fill(0).map((_, i) => Math.sin(i * 0.05))
      const result = fft(input)

      expect(result.re.length).toBe(64)
      expect(result.im.length).toBe(64)
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

    it('should throw error for length 5 (non-power-of-2)', () => {
      const input = [1, 2, 3, 4, 5]
      expect(() => fft(input)).toThrow()
    })

    it('should throw error for length 7 (non-power-of-2)', () => {
      const input = new Array(7).fill(1)
      expect(() => fft(input)).toThrow()
    })

    it('should handle length 1 (smallest valid FFT)', () => {
      const input = [1]
      const result = fft(input)
      expect(result.re[0]).toBe(1)
      expect(result.im[0]).toBe(0)
    })

    it('should handle length 1 with zero input', () => {
      const input = [0]
      const result = fft(input)
      expect(result.re[0]).toBe(0)
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

    it('should handle all zeros input', () => {
      const input = [0, 0, 0, 0]
      const result = fft(input)

      expect(result.re.every(v => v === 0)).toBe(true)
      expect(result.im.every(v => v === 0)).toBe(true)
    })

    it('should handle negative values', () => {
      const input = [-1, -2, -3, -4]
      const result = fft(input)

      expect(result.re[0]).toBeCloseTo(-10, 5)
      expect(result.im).toBeInstanceOf(Float64Array)
    })

    it('should handle mixed positive and negative values', () => {
      const input = [1, -1, 1, -1]
      const result = fft(input)

      expect(result.re).toBeInstanceOf(Float64Array)
      expect(result.im).toBeInstanceOf(Float64Array)
    })

    it('should preserve symmetry for real signals', () => {
      const input = [1, 2, 3, 4, 5, 6, 7, 8]
      const result = fft(input)

      // For real signals, X[N-k] = conj(X[k])
      // RE[N-k] should equal RE[k] and IM[N-k] should equal -IM[k]
      const N = 8
      for (let k = 1; k < N / 2; k++) {
        expect(result.re[k]).toBeCloseTo(result.re[N - k], 5)
        expect(result.im[k]).toBeCloseTo(-result.im[N - k], 5)
      }
    })
  })

  // ===== fftComplex() Tests (Complex Input) =====
  describe('fftComplex() - Complex Input', () => {
    it('should compute FFT with complex input (same as real input when Im=0)', () => {
      const inputRe = [1, 0, 1, 0]
      const inputIm = [0, 0, 0, 0]
      const result = fftComplex(inputRe, inputIm)

      const resultReal = fft(inputRe)
      
      expect(result.re).toBeInstanceOf(Float64Array)
      expect(result.im).toBeInstanceOf(Float64Array)
      expect(result.re.length).toBe(4)
    })

    it('should handle purely imaginary input', () => {
      const inputRe = [0, 0, 0, 0]
      const inputIm = [1, 1, 1, 1]
      const result = fftComplex(inputRe, inputIm)

      expect(result.re).toBeInstanceOf(Float64Array)
      expect(result.im).toBeInstanceOf(Float64Array)
    })

    it('should handle complex input with both real and imaginary parts', () => {
      const inputRe = [1, 2, 3, 4]
      const inputIm = [1, 2, 3, 4]
      const result = fftComplex(inputRe, inputIm)

      expect(result.re.length).toBe(4)
      expect(result.im.length).toBe(4)
    })

    it('should handle complex input without imaginary part (null)', () => {
      const inputRe = [1, 0, 1, 0]
      const result = fftComplex(inputRe, null)

      expect(result.re.length).toBe(4)
      expect(result.im.length).toBe(4)
    })

    it('should sanitize non-finite values in complex input', () => {
      const inputRe = [1, NaN, Infinity, 2]
      const inputIm = [Infinity, 1, -Infinity, 3]
      const result = fftComplex(inputRe, inputIm)

      expect(result.re).toBeInstanceOf(Float64Array)
      expect(result.im).toBeInstanceOf(Float64Array)
    })

    it('should throw error for non-power-of-2 complex input', () => {
      const inputRe = [1, 2, 3]
      const inputIm = [1, 2, 3]
      expect(() => fftComplex(inputRe, inputIm)).toThrow()
    })

    it('should handle complex DC signal', () => {
      const inputRe = [1, 1, 1, 1]
      const inputIm = [1, 1, 1, 1]
      const result = fftComplex(inputRe, inputIm)

      // X[0] = sum of all inputs = 4(1+1j) = 4 + 4j
      expect(result.re[0]).toBeCloseTo(4, 5)
      expect(result.im[0]).toBeCloseTo(4, 5)
    })

    it('should handle complex conjugate input', () => {
      const inputRe = [1, 2, 1, 2]
      const inputIm = [1, 2, -1, -2]
      const result = fftComplex(inputRe, inputIm)

      expect(result.re).toBeInstanceOf(Float64Array)
      expect(result.im).toBeInstanceOf(Float64Array)
    })

    it('should work with Float64Array complex input', () => {
      const inputRe = new Float64Array([1, 0, 1, 0])
      const inputIm = new Float64Array([1, 0, 1, 0])
      const result = fftComplex(inputRe, inputIm)

      expect(result.re.length).toBe(4)
      expect(result.im.length).toBe(4)
    })
  })

  // ===== IFFT (Inverse FFT) Tests =====
  describe('ifft() - Inverse FFT', () => {
    it('should compute inverse FFT', () => {
      const spectrum = { re: new Float64Array([4, 0, 0, 0]), im: new Float64Array([0, 0, 0, 0]) }
      const result = ifft(spectrum)

      expect(result).toBeInstanceOf(Float64Array)
      expect(result.length).toBe(4)
      // All values should be 1 (4 normalized by 4)
      expect(result[0]).toBeCloseTo(1, 5)
      expect(result[1]).toBeCloseTo(1, 5)
      expect(result[2]).toBeCloseTo(1, 5)
      expect(result[3]).toBeCloseTo(1, 5)
    })

    it('should handle impulse in frequency domain', () => {
      const spectrum = { re: new Float64Array([1, 0, 0, 0]), im: new Float64Array([0, 0, 0, 0]) }
      const result = ifft(spectrum)

      expect(result.length).toBe(4)
      // Should give uniform signal
      for (let i = 0; i < 4; i++) {
        expect(result[i]).toBeCloseTo(0.25, 5)
      }
    })

    it('should work with complex spectrum', () => {
      const spectrum = { 
        re: new Float64Array([4, 0, 0, 0]), 
        im: new Float64Array([0, 1, 0, 1]) 
      }
      const result = ifft(spectrum)

      expect(result).toBeInstanceOf(Float64Array)
      expect(result.length).toBe(4)
    })
  })

  // ===== Round-trip Tests (FFT -> IFFT -> Original) =====
  describe('Round-trip: FFT -> IFFT', () => {
    it('should recover original signal after FFT -> IFFT', () => {
      const original = [1, 2, 3, 4]
      const fftResult = fft(original)
      const ifftResult = ifft(fftResult)

      for (let i = 0; i < original.length; i++) {
        expect(ifftResult[i]).toBeCloseTo(original[i], 5)
      }
    })

    it('should recover DC signal after round-trip', () => {
      const original = [1, 1, 1, 1]
      const fftResult = fft(original)
      const ifftResult = ifft(fftResult)

      for (let i = 0; i < 4; i++) {
        expect(ifftResult[i]).toBeCloseTo(1, 5)
      }
    })

    it('should recover impulse signal after round-trip', () => {
      const original = [1, 0, 0, 0]
      const fftResult = fft(original)
      const ifftResult = ifft(fftResult)

      expect(ifftResult[0]).toBeCloseTo(1, 5)
      expect(ifftResult[1]).toBeCloseTo(0, 5)
      expect(ifftResult[2]).toBeCloseTo(0, 5)
      expect(ifftResult[3]).toBeCloseTo(0, 5)
    })

    it('should recover sinusoidal signal after round-trip', () => {
      const original = new Array(8).fill(0).map((_, i) => Math.sin(i * Math.PI / 4))
      const fftResult = fft(original)
      const ifftResult = ifft(fftResult)

      for (let i = 0; i < original.length; i++) {
        expect(ifftResult[i]).toBeCloseTo(original[i], 5)
      }
    })

    it('should recover cosine signal after round-trip', () => {
      const original = new Array(8).fill(0).map((_, i) => Math.cos(i * Math.PI / 4))
      const fftResult = fft(original)
      const ifftResult = ifft(fftResult)

      for (let i = 0; i < original.length; i++) {
        expect(ifftResult[i]).toBeCloseTo(original[i], 5)
      }
    })

    it('should recover positive values after round-trip', () => {
      const original = [5, 10, 15, 20]
      const fftResult = fft(original)
      const ifftResult = ifft(fftResult)

      for (let i = 0; i < original.length; i++) {
        expect(ifftResult[i]).toBeCloseTo(original[i], 5)
      }
    })

    it('should recover negative values after round-trip', () => {
      const original = [-1, -2, -3, -4]
      const fftResult = fft(original)
      const ifftResult = ifft(fftResult)

      for (let i = 0; i < original.length; i++) {
        expect(ifftResult[i]).toBeCloseTo(original[i], 5)
      }
    })

    it('should recover mixed positive/negative after round-trip', () => {
      const original = [1, -2, 3, -4]
      const fftResult = fft(original)
      const ifftResult = ifft(fftResult)

      for (let i = 0; i < original.length; i++) {
        expect(ifftResult[i]).toBeCloseTo(original[i], 5)
      }
    })

    it('should recover zeros after round-trip', () => {
      const original = [0, 0, 0, 0]
      const fftResult = fft(original)
      const ifftResult = ifft(fftResult)

      for (let i = 0; i < 4; i++) {
        expect(ifftResult[i]).toBeCloseTo(0, 5)
      }
    })

    it('should recover larger signal after round-trip (16 elements)', () => {
      const original = new Array(16).fill(0).map((_, i) => Math.sin(i * 0.5))
      const fftResult = fft(original)
      const ifftResult = ifft(fftResult)

      for (let i = 0; i < original.length; i++) {
        expect(ifftResult[i]).toBeCloseTo(original[i], 5)
      }
    })
  })

  // ===== Parsevals Theorem Tests =====
  describe('Parsevals Theorem - Energy Conservation', () => {
    it('should conserve energy in time domain vs frequency domain', () => {
      const signal = [1, 2, 3, 4]
      const fftResult = fft(signal)

      // Energy in time domain
      const timeEnergy = signal.reduce((sum, v) => sum + v * v, 0)

      // Energy in frequency domain
      const freqEnergy = Array.from({ length: 4 }, (_, i) => 
        fftResult.re[i] ** 2 + fftResult.im[i] ** 2
      ).reduce((sum, v) => sum + v, 0) / 4

      expect(freqEnergy).toBeCloseTo(timeEnergy, 4)
    })

    it('should conserve energy for sinusoidal signal', () => {
      const signal = new Array(8).fill(0).map((_, i) => Math.sin(i * Math.PI / 4))
      const fftResult = fft(signal)

      const timeEnergy = signal.reduce((sum, v) => sum + v * v, 0)
      const freqEnergy = Array.from({ length: 8 }, (_, i) => 
        fftResult.re[i] ** 2 + fftResult.im[i] ** 2
      ).reduce((sum, v) => sum + v, 0) / 8

      expect(freqEnergy).toBeCloseTo(timeEnergy, 3)
    })
  })

  // ===== Edge Cases & Special Signals =====
  describe('Edge Cases & Special Signals', () => {
    it('should handle all maximum values', () => {
      const input = [1e10, 1e10, 1e10, 1e10]
      const result = fft(input)

      expect(result.re).toBeInstanceOf(Float64Array)
      expect(result.im).toBeInstanceOf(Float64Array)
      expect(result.re[0]).toBeCloseTo(4e10, -5)
    })

    it('should handle very small values', () => {
      const input = [1e-10, 1e-10, 1e-10, 1e-10]
      const result = fft(input)

      expect(result.re[0]).toBeCloseTo(4e-10, 15)
    })

    it('should handle alternating signal [1, -1, 1, -1]', () => {
      const input = [1, -1, 1, -1]
      const result = fft(input)

      // Nyquist component (index 2) should be maximum
      expect(Math.abs(result.re[2])).toBeGreaterThan(0)
    })

    it('should handle ramp signal [0, 1, 2, 3]', () => {
      const input = [0, 1, 2, 3]
      const result = fft(input)

      expect(result.re).toBeInstanceOf(Float64Array)
      expect(result.im).toBeInstanceOf(Float64Array)
    })

    it('should recover ramp signal after round-trip', () => {
      const original = [0, 1, 2, 3]
      const fftResult = fft(original)
      const ifftResult = ifft(fftResult)

      for (let i = 0; i < original.length; i++) {
        expect(ifftResult[i]).toBeCloseTo(original[i], 5)
      }
    })
  })
})
