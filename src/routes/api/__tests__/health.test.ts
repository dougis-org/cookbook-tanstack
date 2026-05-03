import { describe, it, expect, vi, beforeEach } from 'vitest'
import { handleHealthCheck } from '../health'
import * as mongoose from 'mongoose'

describe('GET /api/health endpoint', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // TC-H-01: Healthy response body shape when DB connected
  it('should return 200 with status ok, db connected, and uptime when ready', async () => {
    // Mock mongoose connection ready state
    const originalReadyState = Object.getOwnPropertyDescriptor(
      mongoose.connection,
      'readyState',
    )
    Object.defineProperty(mongoose.connection, 'readyState', {
      configurable: true,
      value: 1,
    })

    const response = await handleHealthCheck()
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toHaveProperty('status', 'ok')
    expect(body).toHaveProperty('db', 'connected')
    expect(body).toHaveProperty('uptime')
    expect(typeof body.uptime).toBe('number')
    expect(body.uptime).toBeGreaterThanOrEqual(0)

    // Restore original descriptor
    if (originalReadyState) {
      Object.defineProperty(mongoose.connection, 'readyState', originalReadyState)
    }
  })

  // TC-H-02: Response has exactly the expected fields
  it('healthy response should have only status, db, and uptime fields', async () => {
    Object.defineProperty(mongoose.connection, 'readyState', {
      configurable: true,
      value: 1,
    })

    const response = await handleHealthCheck()
    const body = await response.json()

    const keys = Object.keys(body).sort()
    expect(keys).toEqual(['db', 'status', 'uptime'])
  })

  // TC-H-03: Returns 503 when DB disconnected (readyState = 0)
  it('should return 503 with degraded status when DB is disconnected', async () => {
    Object.defineProperty(mongoose.connection, 'readyState', {
      configurable: true,
      value: 0,
    })

    const response = await handleHealthCheck()
    const body = await response.json()

    expect(response.status).toBe(503)
    expect(body).toEqual({
      status: 'degraded',
      db: 'disconnected',
    })
  })

  // TC-H-04: Returns 503 when DB connecting (readyState = 2)
  it('should return 503 with degraded status when DB is connecting', async () => {
    Object.defineProperty(mongoose.connection, 'readyState', {
      configurable: true,
      value: 2,
    })

    const response = await handleHealthCheck()
    const body = await response.json()

    expect(response.status).toBe(503)
    expect(body).toEqual({
      status: 'degraded',
      db: 'disconnected',
    })
  })

  // TC-H-05: Degraded response validation
  it('degraded response should have only status and db fields', async () => {
    Object.defineProperty(mongoose.connection, 'readyState', {
      configurable: true,
      value: 0,
    })

    const response = await handleHealthCheck()
    const body = await response.json()

    const keys = Object.keys(body).sort()
    expect(keys).toEqual(['db', 'status'])
  })
})
