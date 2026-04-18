import { createFileRoute } from "@tanstack/react-router"
import { auth } from "@/lib/auth"
import { imagekit } from "@/lib/imagekit"

const MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024
const UPLOAD_FOLDER = "/cookbook/recipes/"

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  })
}

function isUploadFile(value: unknown): value is File {
  return (
    typeof value === "object" &&
    value !== null &&
    "name" in value &&
    typeof value.name === "string" &&
    "size" in value &&
    typeof value.size === "number" &&
    "arrayBuffer" in value &&
    typeof value.arrayBuffer === "function"
  )
}

export const Route = createFileRoute("/api/upload/")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        const session = await auth.api.getSession({
          headers: request.headers,
        })

        if (!session) {
          return jsonResponse({ error: "Unauthorized" }, 401)
        }

        const formData = await request.formData()
        const file = formData.get("file")

        if (!isUploadFile(file)) {
          return jsonResponse({ error: "No file provided" }, 400)
        }

        if (file.size > MAX_UPLOAD_SIZE_BYTES) {
          return jsonResponse({ error: "File must be under 10 MB" }, 400)
        }

        try {
          const upload = await imagekit.files.upload({
            file,
            fileName: file.name,
            folder: UPLOAD_FOLDER,
          })

          return jsonResponse({
            url: upload.url,
            fileId: upload.fileId,
          })
        } catch {
          return jsonResponse({ error: "Upload failed" }, 500)
        }
      },
    },
  },
})
