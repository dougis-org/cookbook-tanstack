import { describe, expect, it } from 'vitest'
import { getValidatedGoogleAdSenseSlotId } from '@/lib/google-adsense'

describe('getValidatedGoogleAdSenseSlotId', () => {
  it('returns trimmed numeric slot ids', () => {
    expect(getValidatedGoogleAdSenseSlotId(' 1234567890 ')).toBe('1234567890')
  })

  it('returns null for non-numeric slot ids', () => {
    expect(getValidatedGoogleAdSenseSlotId('slot-123')).toBeNull()
  })

  it('returns null for undefined slot ids', () => {
    expect(getValidatedGoogleAdSenseSlotId(undefined)).toBeNull()
  })

  it('returns null for whitespace-only slot ids', () => {
    expect(getValidatedGoogleAdSenseSlotId('   ')).toBeNull()
  })
})
