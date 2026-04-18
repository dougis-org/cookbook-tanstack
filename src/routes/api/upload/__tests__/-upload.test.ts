import { beforeEach, describe, expect, it, vi } from "vitest"
import { File as NodeFile } from "node:buffer"

const { mockGetSession, mockUpload, mockDeleteFile } = vi.hoisted(() => ({
  mockGetSession: vi.fn(),
  mockUpload: vi.fn(),
  mockDeleteFile: vi.fn(),
}))

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (opts: Record<string, unknown>) => opts,
}))

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: mockGetSession,
    },
  },
}))

vi.mock("@/lib/imagekit", () => ({
  imagekit: {
    files: {
      upload: mockUpload,
      delete: mockDeleteFile,
    },
  },
}))

type PostHandler = (args: { request: Request }) => Promise<Response>
type DeleteHandler = (args: {
  request: Request
  params: { fileId: string }
}) => Promise<Response>

async function getPostHandler() {
  const { Route } = await import("../index")
  const route = Route as unknown as { server: { handlers: { POST: PostHandler } } }
  return route.server.handlers.POST
}

async function getDeleteHandler() {
  const { Route } = await import("../$fileId")
  const route = Route as unknown as { server: { handlers: { DELETE: DeleteHandler } } }
  return route.server.handlers.DELETE
}

function createFormData(file: unknown) {
  return {
    get: vi.fn((field: string) => (field === "file" ? file : null)),
  } as unknown as FormData
}

function createUploadRequest(formData: FormData) {
  return {
    headers: new Headers(),
    formData: vi.fn().mockResolvedValue(formData),
  } as unknown as Request
}

describe("POST /api/upload", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetSession.mockResolvedValue({ user: { id: "user-1" } })
    mockUpload.mockResolvedValue({
      url: "https://ik.imagekit.io/demo/recipe.jpg",
      fileId: "file-123",
    })
  })

  it("returns url and fileId for an authenticated valid image upload", async () => {
    const file = new NodeFile(["image-bytes"], "recipe.jpg", {
      type: "image/jpeg",
    }) as unknown as File

    const handler = await getPostHandler()
    const response = await handler({
      request: createUploadRequest(createFormData(file)),
    })

    await expect(response.json()).resolves.toEqual({
      url: "https://ik.imagekit.io/demo/recipe.jpg",
      fileId: "file-123",
    })
    expect(response.status).toBe(200)
    expect(mockUpload).toHaveBeenCalledWith(
      expect.objectContaining({
        file,
        fileName: "recipe.jpg",
        folder: "/cookbook/recipes/",
      }),
    )
  })

  it("returns 401 when the request is unauthenticated", async () => {
    mockGetSession.mockResolvedValue(null)
    const handler = await getPostHandler()
    const response = await handler({
      request: createUploadRequest(
        createFormData(new NodeFile(["image-bytes"], "recipe.jpg")),
      ),
    })

    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" })
    expect(response.status).toBe(401)
    expect(mockUpload).not.toHaveBeenCalled()
  })

  it("returns 400 when the file field is missing", async () => {
    const handler = await getPostHandler()
    const response = await handler({
      request: createUploadRequest(createFormData(null)),
    })

    await expect(response.json()).resolves.toEqual({
      error: "No file provided",
    })
    expect(response.status).toBe(400)
    expect(mockUpload).not.toHaveBeenCalled()
  })

  it("returns 500 when ImageKit upload throws", async () => {
    mockUpload.mockRejectedValue(new Error("ImageKit unavailable"))
    const handler = await getPostHandler()
    const response = await handler({
      request: createUploadRequest(
        createFormData(new NodeFile(["image-bytes"], "recipe.jpg")),
      ),
    })

    await expect(response.json()).resolves.toEqual({ error: "Upload failed" })
    expect(response.status).toBe(500)
  })
})

describe("DELETE /api/upload/:fileId", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetSession.mockResolvedValue({ user: { id: "user-1" } })
    mockDeleteFile.mockResolvedValue(undefined)
  })

  it("deletes an ImageKit file for an authenticated user", async () => {
    const handler = await getDeleteHandler()
    const response = await handler({
      request: new Request("http://localhost/api/upload/file-123", {
        method: "DELETE",
      }),
      params: { fileId: "file-123" },
    })

    await expect(response.json()).resolves.toEqual({ success: true })
    expect(response.status).toBe(200)
    expect(mockDeleteFile).toHaveBeenCalledWith("file-123")
  })

  it("returns 401 when deleting without a session", async () => {
    mockGetSession.mockResolvedValue(null)

    const handler = await getDeleteHandler()
    const response = await handler({
      request: new Request("http://localhost/api/upload/file-123", {
        method: "DELETE",
      }),
      params: { fileId: "file-123" },
    })

    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" })
    expect(response.status).toBe(401)
    expect(mockDeleteFile).not.toHaveBeenCalled()
  })

  it("returns 404 when ImageKit reports the file is missing", async () => {
    mockDeleteFile.mockRejectedValue({ status: 404 })

    const handler = await getDeleteHandler()
    const response = await handler({
      request: new Request("http://localhost/api/upload/missing-file", {
        method: "DELETE",
      }),
      params: { fileId: "missing-file" },
    })

    await expect(response.json()).resolves.toEqual({
      error: "File not found",
    })
    expect(response.status).toBe(404)
  })
})
