import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGetSession = vi.fn();
const mockCollaboratorFind = vi.fn();

vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession: mockGetSession } },
}));

vi.mock("@/db/models", () => ({
  Collaborator: { find: mockCollaboratorFind },
}));

const fetchOpts = {
  req: new Request("http://localhost/api/trpc"),
  resHeaders: new Headers(),
  info: {} as never,
};

describe("createContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCollaboratorFind.mockReturnValue({ lean: () => Promise.resolve([]) });
  });

  it("returns session and user when authenticated", async () => {
    const { createContext } = await import("@/server/trpc/context");
    mockGetSession.mockResolvedValue({
      session: { id: "session-1" },
      user: { id: "user-1", email: "test@example.com" },
    });

    const ctx = await createContext(fetchOpts);

    expect(ctx.session).toEqual({ id: "session-1" });
    expect(ctx.user).toEqual({ id: "user-1", email: "test@example.com" });
  });

  it("returns null session and user when unauthenticated", async () => {
    const { createContext } = await import("@/server/trpc/context");
    mockGetSession.mockResolvedValue(null);

    const ctx = await createContext(fetchOpts);

    expect(ctx.session).toBeNull();
    expect(ctx.user).toBeNull();
  });

  it("passes the incoming request headers to Better Auth session lookup", async () => {
    const { createContext } = await import("@/server/trpc/context");
    mockGetSession.mockResolvedValue(null);
    const headers = new Headers({
      cookie: "better-auth.session_token=test-token",
      "x-forwarded-host": "localhost:3000",
    });

    await createContext({
      ...fetchOpts,
      req: new Request("http://localhost/api/trpc", { headers }),
    });

    const [{ headers: passedHeaders }] = mockGetSession.mock.calls[0] as [
      { headers: Headers },
    ];

    expect(passedHeaders.get("cookie")).toBe(
      "better-auth.session_token=test-token",
    );
    expect(passedHeaders.get("x-forwarded-host")).toBe("localhost:3000");
  });

  it("does not include a db property on the context", async () => {
    const { createContext } = await import("@/server/trpc/context");
    mockGetSession.mockResolvedValue(null);

    const ctx = await createContext(fetchOpts);

    expect(ctx).not.toHaveProperty("db");
  });

  describe("collabCookbookIds", () => {
    const VALID_USER_ID = "aaaaaaaaaaaaaaaaaaaaaaaa";

    function mockSessionWithUser(userId: string) {
      mockGetSession.mockResolvedValue({ session: { id: "s1" }, user: { id: userId } });
    }

    it("returns empty array when unauthenticated", async () => {
      const { createContext } = await import("@/server/trpc/context");
      mockGetSession.mockResolvedValue(null);

      const ctx = await createContext(fetchOpts);

      expect(ctx.collabCookbookIds).toEqual([]);
      expect(mockCollaboratorFind).not.toHaveBeenCalled();
    });

    it("returns empty array when user id is not a valid ObjectId", async () => {
      const { createContext } = await import("@/server/trpc/context");
      mockSessionWithUser("not-an-object-id");

      const ctx = await createContext(fetchOpts);

      expect(ctx.collabCookbookIds).toEqual([]);
      expect(mockCollaboratorFind).not.toHaveBeenCalled();
    });

    it("returns empty array when user has no collaborations", async () => {
      const { createContext } = await import("@/server/trpc/context");
      mockSessionWithUser(VALID_USER_ID);
      mockCollaboratorFind.mockReturnValue({ lean: () => Promise.resolve([]) });

      const ctx = await createContext(fetchOpts);

      expect(ctx.collabCookbookIds).toEqual([]);
    });

    it("returns cookbook ids when user is a collaborator", async () => {
      const { createContext } = await import("@/server/trpc/context");
      const cbId1 = "bbbbbbbbbbbbbbbbbbbbbbbb";
      const cbId2 = "cccccccccccccccccccccccc";
      mockSessionWithUser(VALID_USER_ID);
      mockCollaboratorFind.mockReturnValue({
        lean: () => Promise.resolve([
          { cookbookId: { toString: () => cbId1 } },
          { cookbookId: { toString: () => cbId2 } },
        ]),
      });

      const ctx = await createContext(fetchOpts);

      expect(ctx.collabCookbookIds).toEqual([cbId1, cbId2]);
    });

    it("queries Collaborator by the authenticated user id", async () => {
      const { createContext } = await import("@/server/trpc/context");
      mockSessionWithUser(VALID_USER_ID);

      await createContext(fetchOpts);

      expect(mockCollaboratorFind).toHaveBeenCalledWith(
        { userId: VALID_USER_ID },
        { cookbookId: 1 },
      );
    });
  });
});
