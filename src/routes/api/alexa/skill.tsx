import { createFileRoute } from "@tanstack/react-router"
import { skill } from "@/server/alexa/skill"
import { verifyAlexaRequest, verifyAlexaSkillId } from "@/server/alexa/verify-request"

export const Route = createFileRoute("/api/alexa/skill")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        // The exact raw bytes Alexa signed — read before any JSON parsing,
        // since Alexa's signature is computed over the literal request body
        // (see design.md Decision 1).
        const rawBody = await request.text()

        try {
          await verifyAlexaRequest(rawBody, request.headers)
        } catch {
          return new Response("Invalid request signature", { status: 401 })
        }

        const requestEnvelope = JSON.parse(rawBody)

        // Signature verification proves the request is genuinely from Alexa
        // infrastructure, but not that it's addressed to *this* skill —
        // anyone can point their own registered skill's endpoint here.
        try {
          verifyAlexaSkillId(requestEnvelope)
        } catch {
          return new Response("Unrecognized skill application ID", { status: 401 })
        }

        const responseEnvelope = await skill.invoke(requestEnvelope)
        return new Response(JSON.stringify(responseEnvelope), {
          headers: { "Content-Type": "application/json" },
        })
      },
    },
  },
})
