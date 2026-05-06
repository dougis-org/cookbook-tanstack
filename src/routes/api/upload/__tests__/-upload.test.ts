import { beforeEach, describe, expect, it, vi } from "vitest"
import { File as NodeFile } from "node:buffer"

const {
  mockGetSession,
  mockUpload,
  mockDeleteFile,
  mockToFile,
  mockInsertOne,
  mockFindOne,
  mockDeleteOne,
  mockCollection,
  mockDb,
} = vi.hoisted(() => {
  const mockInsertOne = vi.fn()
  const mockFindOne = vi.fn()
  const mockDeleteOne = vi.fn()
  const mockCollection = vi.fn(() => ({
    insertOne: mockInsertOne,
    findOne: mockFindOne,
    deleteOne: mockDeleteOne,
  }))
  const mockDb = vi.fn(() => ({ collection: mockCollection }))

  return {
    mockGetSession: vi.fn(),
    mockUpload: vi.fn(),
    mockDeleteFile: vi.fn(),
    mockToFile: vi.fn(),
    mockInsertOne,
    mockFindOne,
    mockDeleteOne,
    mockCollection,
    mockDb,
  }
})

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

vi.mock("@imagekit/nodejs", () => ({
  toFile: mockToFile,
}))

vi.mock("@/db", () => ({
  getMongoClient: vi.fn(() => ({ db: mockDb })),
}))

vi.mock("@/lib/imagekit", () => ({
  getImageKit: vi.fn(() => ({
    files: {
      upload: mockUpload,
      delete: mockDeleteFile,
    },
  })),
}))

type PostHandler = (args: { request: Request }) => Promise<Response>
type DeleteHandler = (args: {
  request: Request
  params: { fileId: string }
}) => Promise<Response>

async function getPostHandler() {
  const { Route } = await import("../../upload")
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

async function postUpload(file: unknown) {
  const handler = await getPostHandler()
  return handler({ request: createUploadRequest(createFormData(file)) })
}

async function deleteFile(fileId: string) {
  const handler = await getDeleteHandler()
  return handler({
    request: new Request(`http://localhost/api/upload/${fileId}`, { method: "DELETE" }),
    params: { fileId },
  })
}

async function expectJsonResponse(response: Response, body: unknown, status: number) {
  await expect(response.json()).resolves.toEqual(body)
  expect(response.status).toBe(status)
}

describe("POST /api/upload", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetSession.mockResolvedValue({ user: { id: "user-1" } })
    mockUpload.mockResolvedValue({
      url: "https://ik.imagekit.io/demo/recipe.jpg",
      fileId: "file-123",
    })
    mockToFile.mockImplementation(async (file, fileName, options) => ({
      file,
      fileName,
      options,
    }))
    mockFindOne.mockResolvedValue({
      fileId: "file-123",
      userId: "user-1",
    })
  })

  it("returns url and fileId for an authenticated valid image upload", async () => {
    const file = new NodeFile(["image-bytes"], "recipe.jpg", {
      type: "image/jpeg",
    }) as unknown as File

    const response = await postUpload(file)

    await expectJsonResponse(response, {
      url: "https://ik.imagekit.io/demo/recipe.jpg",
      fileId: "file-123",
    }, 200)
    const uploadArgs = mockUpload.mock.calls[0]?.[0]
    expect(Buffer.isBuffer(uploadArgs.file.file)).toBe(true)
    expect(mockToFile).toHaveBeenCalledWith(expect.any(Buffer), "recipe.jpg", {
      type: "image/jpeg",
    })
    expect(uploadArgs).toEqual(
      expect.objectContaining({
        fileName: "recipe.jpg",
        folder: "/cookbook/recipes/",
      }),
    )
    expect(mockCollection).toHaveBeenCalledWith("image_upload")
    expect(mockInsertOne).toHaveBeenCalledWith(
      expect.objectContaining({
        fileId: "file-123",
        userId: "user-1",
        url: "https://ik.imagekit.io/demo/recipe.jpg",
        createdAt: expect.any(Date),
      }),
    )
  })

  it("returns 401 when the request is unauthenticated", async () => {
    mockGetSession.mockResolvedValue(null)
    const response = await postUpload(new NodeFile(["image-bytes"], "recipe.jpg"))

    await expectJsonResponse(response, { error: "Unauthorized" }, 401)
    expect(mockUpload).not.toHaveBeenCalled()
  })

  it("returns 403 when the user has not verified their email", async () => {
    mockGetSession.mockResolvedValue({ user: { id: "user-1", emailVerified: false } })
    const response = await postUpload(new NodeFile(["image-bytes"], "recipe.jpg"))

    await expectJsonResponse(response, { error: "Email verification required" }, 403)
    expect(mockUpload).not.toHaveBeenCalled()
  })

  it("returns 400 when the file field is missing", async () => {
    const response = await postUpload(null)

    await expectJsonResponse(response, { error: "No file provided" }, 400)
    expect(mockUpload).not.toHaveBeenCalled()
  })

  it("returns 400 when the uploaded file is not an allowed image type", async () => {
    const file = new NodeFile(["text"], "recipe.txt", {
      type: "text/plain",
    }) as unknown as File

    const response = await postUpload(file)

    await expectJsonResponse(response, { error: "File must be a JPEG, PNG, WebP, or GIF image" }, 400)
    expect(mockUpload).not.toHaveBeenCalled()
  })

  it("returns 500 when ImageKit upload throws", async () => {
    mockUpload.mockRejectedValue(new Error("ImageKit unavailable"))
    const response = await postUpload(new NodeFile(["image-bytes"], "recipe.jpg"))

    await expectJsonResponse(response, { error: "Upload failed" }, 500)
  })
})

describe("DELETE /api/upload/:fileId", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetSession.mockResolvedValue({ user: { id: "user-1" } })
    mockDeleteFile.mockResolvedValue(undefined)
    mockFindOne.mockResolvedValue({
      fileId: "file-123",
      userId: "user-1",
    })
  })

  it("deletes an ImageKit file for an authenticated user", async () => {
    const response = await deleteFile("file-123")

    await expectJsonResponse(response, { success: true }, 200)
    expect(mockFindOne).toHaveBeenCalledWith({
      fileId: "file-123",
      userId: "user-1",
    })
    expect(mockDeleteFile).toHaveBeenCalledWith("file-123")
    expect(mockDeleteOne).toHaveBeenCalledWith({
      fileId: "file-123",
      userId: "user-1",
    })
  })

  it("returns 401 when deleting without a session", async () => {
    mockGetSession.mockResolvedValue(null)
    const response = await deleteFile("file-123")

    await expectJsonResponse(response, { error: "Unauthorized" }, 401)
    expect(mockDeleteFile).not.toHaveBeenCalled()
  })

  it("returns 403 when deleting a file not owned by the current user", async () => {
    mockFindOne.mockResolvedValue(null)
    const response = await deleteFile("file-123")

    await expectJsonResponse(response, { error: "Forbidden" }, 403)
    expect(mockDeleteFile).not.toHaveBeenCalled()
  })

  it("returns success when ImageKit reports the file is missing but DB record exists", async () => {
    mockDeleteFile.mockRejectedValue({ status: 404 })
    const response = await deleteFile("missing-file")

    await expectJsonResponse(response, { success: true }, 200)
    expect(mockDeleteOne).toHaveBeenCalledWith({
      fileId: "missing-file",
      userId: "user-1",
    })
  })
})
