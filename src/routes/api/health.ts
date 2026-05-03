import { createFileRoute } from '@tanstack/react-router'
import { jsonResponse } from '@/lib/api-response'
import '@/db'
import * as mongoose from 'mongoose'

export const Route = createFileRoute('/api/health')({
  server: {
    handlers: {
      GET: async () => {
        const readyState = mongoose.connection.readyState
        const isConnected = readyState === 1

        if (isConnected) {
          return jsonResponse({
            status: 'ok',
            db: 'connected',
            uptime: process.uptime(),
          })
        } else {
          return jsonResponse(
            {
              status: 'degraded',
              db: 'disconnected',
            },
            503,
          )
        }
      },
    },
  },
})
