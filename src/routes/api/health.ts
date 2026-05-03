import { createFileRoute } from '@tanstack/react-router'
import { jsonResponse } from '@/lib/api-response'
import mongoose from '@/db'

export async function handleHealthCheck() {
  const readyState = mongoose.connection.readyState
  const isConnected = readyState === 1

  if (isConnected) {
    return jsonResponse({
      status: 'ok',
      db: 'connected',
      uptime: process.uptime(),
    })
  }
  // When DB is unavailable, respond with degraded status (no uptime)
  return jsonResponse(
    {
      status: 'degraded',
      db: 'disconnected',
    },
    503,
  )
}

export const Route = createFileRoute('/api/health')({
  server: {
    handlers: {
      GET: handleHealthCheck,
    },
  },
})
