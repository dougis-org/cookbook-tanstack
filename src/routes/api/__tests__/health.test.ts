import { beforeEach, describe, expect, it, vi } from "vitest"

const mockMongoose = {
  connection: {
    readyState: 1,
  },
}

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (opts: Record<string, unknown>) => opts,
}))

vi.mock("@/db", () => ({
  default: mockMongoose,
}))

const { handleHealthCheck } = await import("../health")

describe("GET /api/health endpoint", () => {
  beforeEach(() => {
    mockMongoose.connection.readyState = 1
  })

  // TC-H-01: Healthy response body shape when DB connected
  it("should return 200 with status ok, db connected, and uptime when ready", async () => {
    mockMongoose.connection.readyState = 1

    const response = await handleHealthCheck()
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toHaveProperty("status", "ok")
    expect(body).toHaveProperty("db", "connected")
    expect(body).toHaveProperty("uptime")
    expect(typeof body.uptime).toBe("number")
    expect(body.uptime).toBeGreaterThanOrEqual(0)
  })

  // TC-H-02: Response has exactly the expected fields
  it("healthy response should have only status, db, and uptime fields", async () => {
    mockMongoose.connection.readyState = 1

    const response = await handleHealthCheck()
    const body = await response.json()

    const keys = Object.keys(body).sort()
    expect(keys).toEqual(["db", "status", "uptime"])
  })

  // TC-H-03: Returns 503 when DB disconnected (readyState = 0)
  it("should return 503 with degraded status when DB is disconnected", async () => {
    mockMongoose.connection.readyState = 0

    const response = await handleHealthCheck()
    const body = await response.json()

    expect(response.status).toBe(503)
    expect(body).toEqual({
      status: "degraded",
      db: "disconnected",
      uptime: expect.any(Number),
    })
    expect(body.uptime).toBeGreaterThanOrEqual(0)
  })

  // TC-H-04: Returns 503 when DB connecting (readyState = 2)
  it("should return 503 with degraded status when DB is connecting", async () => {
    mockMongoose.connection.readyState = 2

    const response = await handleHealthCheck()
    const body = await response.json()

    expect(response.status).toBe(503)
    expect(body).toEqual({
      status: "degraded",
      db: "disconnected",
      uptime: expect.any(Number),
    })
    expect(body.uptime).toBeGreaterThanOrEqual(0)
  })

  // TC-H-05: Degraded response validation
  it("degraded response should have status, db, and uptime fields", async () => {
    mockMongoose.connection.readyState = 0

    const response = await handleHealthCheck()
    const body = await response.json()

    const keys = Object.keys(body).sort()
    expect(keys).toEqual(["db", "status", "uptime"])
  })
})
