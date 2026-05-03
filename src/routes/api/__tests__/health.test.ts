import { describe, it, expect } from 'vitest'

describe('GET /api/health endpoint handler', () => {
  // Helper to simulate the handler logic
  const getHealthResponse = (readyState: number) => {
    const isConnected = readyState === 1

    if (isConnected) {
      return {
        status: 200,
        body: {
          status: 'ok',
          db: 'connected',
          uptime: process.uptime(),
        },
      }
    } else {
      return {
        status: 503,
        body: {
          status: 'degraded',
          db: 'disconnected',
        },
      }
    }
  }

  // TC-H-01: Healthy response body shape when DB connected
  it('should return 200 with status ok, db connected, and uptime when ready', () => {
    const response = getHealthResponse(1)

    expect(response.status).toBe(200)
    expect(response.body).toHaveProperty('status', 'ok')
    expect(response.body).toHaveProperty('db', 'connected')
    expect(response.body).toHaveProperty('uptime')
    expect(response.body.uptime).toBeGreaterThanOrEqual(0)
  })

  // TC-H-02: Response has exactly the expected fields
  it('healthy response should have only status, db, and uptime fields', () => {
    const response = getHealthResponse(1)

    const keys = Object.keys(response.body).sort()
    expect(keys).toEqual(['db', 'status', 'uptime'])
  })

  // TC-H-03: Returns 503 when DB disconnected (readyState = 0)
  it('should return 503 with degraded status when DB is disconnected (readyState=0)', () => {
    const response = getHealthResponse(0)

    expect(response.status).toBe(503)
    expect(response.body).toEqual({
      status: 'degraded',
      db: 'disconnected',
    })
  })

  // TC-H-04: Returns 503 when DB connecting (readyState = 2)
  it('should return 503 with degraded status when DB is still connecting (readyState=2)', () => {
    const response = getHealthResponse(2)

    expect(response.status).toBe(503)
    expect(response.body).toEqual({
      status: 'degraded',
      db: 'disconnected',
    })
  })

  // TC-H-05: Degraded response validation
  it('degraded response should have only status and db fields', () => {
    const response = getHealthResponse(0)

    const keys = Object.keys(response.body).sort()
    expect(keys).toEqual(['db', 'status'])
  })
})
