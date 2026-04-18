import { createFileRoute } from "@tanstack/react-router"
import { auth } from "@/lib/auth"
import { imagekit } from "@/lib/imagekit"
import { getMongoClient } from "@/db"

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  })
}

function isNotFoundError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    ("status" in error || "statusCode" in error) &&
    ((error as { status?: unknown }).status === 404 ||
      (error as { statusCode?: unknown }).statusCode === 404)
  )
}

export const Route = createFileRoute("/api/upload/$fileId")({
  server: {
    handlers: {
      DELETE: async ({
        request,
        params,
      }: {
        request: Request
        params: { fileId: string }
      }) => {
        const session = await auth.api.getSession({
          headers: request.headers,
        })

        if (!session) {
          return jsonResponse({ error: "Unauthorized" }, 401)
        }

        try {
          const uploadsCollection = getMongoClient().db().collection("image_upload")
          const upload = await uploadsCollection.findOne({
            fileId: params.fileId,
            userId: session.user.id,
          })

          if (!upload) {
            return jsonResponse({ error: "Forbidden" }, 403)
          }

          await imagekit.files.delete(params.fileId)
          await uploadsCollection.deleteOne({
            fileId: params.fileId,
            userId: session.user.id,
          })
          return jsonResponse({ success: true })
        } catch (error) {
          if (isNotFoundError(error)) {
            return jsonResponse({ error: "File not found" }, 404)
          }

          return jsonResponse({ error: "Delete failed" }, 500)
        }
      },
    },
  },
})
