import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGetSession = vi.fn();
const mockCollaboratorFind = vi.fn();
const mockLibraryShareAggregate = vi.fn();

vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession: mockGetSession } },
}));

vi.mock("@/db/models", () => ({
  Collaborator: { find: mockCollaboratorFind },
  LibraryShare: { aggregate: mockLibraryShareAggregate },
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
    mockLibraryShareAggregate.mockResolvedValue([]);
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

  describe("getCollabCookbookIds", () => {
    const VALID_USER_ID = "aaaaaaaaaaaaaaaaaaaaaaaa";

    function mockSessionWithUser(userId: string) {
      mockGetSession.mockResolvedValue({ session: { id: "s1" }, user: { id: userId } });
    }

    it("resolves to an empty array when unauthenticated, without querying Collaborator", async () => {
      const { createContext } = await import("@/server/trpc/context");
      mockGetSession.mockResolvedValue(null);

      const ctx = await createContext(fetchOpts);

      expect(await ctx.getCollabCookbookIds()).toEqual([]);
      expect(mockCollaboratorFind).not.toHaveBeenCalled();
    });

    it("resolves to an empty array when user id is not a valid ObjectId", async () => {
      const { createContext } = await import("@/server/trpc/context");
      mockSessionWithUser("not-an-object-id");

      const ctx = await createContext(fetchOpts);

      expect(await ctx.getCollabCookbookIds()).toEqual([]);
      expect(mockCollaboratorFind).not.toHaveBeenCalled();
    });

    it("resolves to an empty array when user has no collaborations", async () => {
      const { createContext } = await import("@/server/trpc/context");
      mockSessionWithUser(VALID_USER_ID);
      mockCollaboratorFind.mockReturnValue({ lean: () => Promise.resolve([]) });

      const ctx = await createContext(fetchOpts);

      expect(await ctx.getCollabCookbookIds()).toEqual([]);
    });

    it("resolves to cookbook ids when user is a collaborator", async () => {
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

      expect(await ctx.getCollabCookbookIds()).toEqual([cbId1, cbId2]);
    });

    it("queries Collaborator by the authenticated user id", async () => {
      const { createContext } = await import("@/server/trpc/context");
      mockSessionWithUser(VALID_USER_ID);

      const ctx = await createContext(fetchOpts);
      await ctx.getCollabCookbookIds();

      expect(mockCollaboratorFind).toHaveBeenCalledWith(
        { userId: VALID_USER_ID },
        { cookbookId: 1 },
      );
    });

    it("does not query Collaborator during createContext itself — the lookup is lazy", async () => {
      const { createContext } = await import("@/server/trpc/context");
      mockSessionWithUser(VALID_USER_ID);

      await createContext(fetchOpts);

      expect(mockCollaboratorFind).not.toHaveBeenCalled();
    });

    it("memoizes repeated and concurrent calls to a single underlying query", async () => {
      const { createContext } = await import("@/server/trpc/context");
      mockSessionWithUser(VALID_USER_ID);
      mockCollaboratorFind.mockReturnValue({
        lean: () => Promise.resolve([{ cookbookId: { toString: () => "bbbbbbbbbbbbbbbbbbbbbbbb" } }]),
      });

      const ctx = await createContext(fetchOpts);
      const [first, second] = await Promise.all([
        ctx.getCollabCookbookIds(),
        ctx.getCollabCookbookIds(),
      ]);
      const third = await ctx.getCollabCookbookIds();

      expect(mockCollaboratorFind).toHaveBeenCalledTimes(1);
      expect(first).toEqual(second);
      expect(second).toEqual(third);
    });

    it("rejects with a retry-friendly TRPCError instead of the raw exception on lookup failure", async () => {
      const { createContext } = await import("@/server/trpc/context");
      const { TRPCError } = await import("@trpc/server");
      mockSessionWithUser(VALID_USER_ID);
      mockCollaboratorFind.mockReturnValue({ lean: () => Promise.reject(new Error("db blip")) });

      const ctx = await createContext(fetchOpts);

      await expect(ctx.getCollabCookbookIds()).rejects.toBeInstanceOf(TRPCError);
      await expect(ctx.getCollabCookbookIds()).rejects.toMatchObject({
        code: "INTERNAL_SERVER_ERROR",
        message: "Unable to load cookbook collaborations. Please try again.",
      });
    });

    it("logs the original error before rejecting", async () => {
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const { createContext } = await import("@/server/trpc/context");
      mockSessionWithUser(VALID_USER_ID);
      const originalError = new Error("db blip");
      mockCollaboratorFind.mockReturnValue({ lean: () => Promise.reject(originalError) });

      const ctx = await createContext(fetchOpts);
      await ctx.getCollabCookbookIds().catch(() => {});

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("[context.collabCookbookIds]"),
        originalError,
      );
      consoleErrorSpy.mockRestore();
    });

    it("resolves independently in a fresh context after a prior context's lookup failed", async () => {
      const { createContext } = await import("@/server/trpc/context");
      mockSessionWithUser(VALID_USER_ID);
      mockCollaboratorFind.mockReturnValueOnce({ lean: () => Promise.reject(new Error("transient blip")) });

      const ctxA = await createContext(fetchOpts);
      await expect(ctxA.getCollabCookbookIds()).rejects.toThrow();

      mockCollaboratorFind.mockReturnValueOnce({
        lean: () => Promise.resolve([{ cookbookId: { toString: () => "bbbbbbbbbbbbbbbbbbbbbbbb" } }]),
      });
      const ctxB = await createContext(fetchOpts);

      await expect(ctxB.getCollabCookbookIds()).resolves.toEqual(["bbbbbbbbbbbbbbbbbbbbbbbb"]);
    });
  });
});
