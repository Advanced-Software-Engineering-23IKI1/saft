import { describe, it, expect } from 'vitest'
import { someUtilityFunction } from '@/utils/utils.js'

describe('Utils', () => {
  it('should do something correctly', () => {
    expect(someUtilityFunction(2, 3)).toBe(5)
  })

  it('handles edge cases', () => {
    expect(someUtilityFunction(0, 0)).toBe(0)
  })
})