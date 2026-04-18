import { createFileRoute } from "@tanstack/react-router"
import { toFile } from "@imagekit/nodejs"
import { auth } from "@/lib/auth"
import { getImageKit } from "@/lib/imagekit"
import { getMongoClient } from "@/db"
import {
  MAX_RECIPE_IMAGE_UPLOAD_SIZE_BYTES,
  MAX_RECIPE_IMAGE_UPLOAD_SIZE_MB,
  isAllowedRecipeImageFile,
} from "@/lib/recipe-image-upload"
import { jsonResponse } from "@/lib/api-response"

const UPLOAD_FOLDER = "/cookbook/recipes/"

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

export const Route = createFileRoute("/api/upload")({
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

        if (file.size > MAX_RECIPE_IMAGE_UPLOAD_SIZE_BYTES) {
          return jsonResponse({ error: `File must be under ${MAX_RECIPE_IMAGE_UPLOAD_SIZE_MB} MB` }, 400)
        }

        if (!isAllowedRecipeImageFile(file)) {
          return jsonResponse({ error: "File must be a JPEG, PNG, WebP, or GIF image" }, 400)
        }

        try {
          const buffer = Buffer.from(await file.arrayBuffer())
          const uploadFile = await toFile(buffer, file.name, { type: file.type })
          const upload = await getImageKit().files.upload({
            file: uploadFile,
            fileName: file.name,
            folder: UPLOAD_FOLDER,
          })

          await getMongoClient().db().collection("image_upload").insertOne({
            fileId: upload.fileId,
            userId: session.user.id,
            url: upload.url,
            createdAt: new Date(),
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
