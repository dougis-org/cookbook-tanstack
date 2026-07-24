// @vitest-environment node
import { describe, it, expect, vi } from "vitest";

const { verifyAlexaRequest, invoke } = vi.hoisted(() => ({
  verifyAlexaRequest: vi.fn(),
  invoke: vi.fn(),
}));
vi.mock("@/server/alexa/verify-request", () => ({ verifyAlexaRequest }));
vi.mock("@/server/alexa/skill", () => ({ skill: { invoke } }));

import { Route } from "../skill";

function postHandler() {
  const handlers = Route.options.server!.handlers as unknown as {
    POST: (args: { request: Request }) => Promise<Response>;
  };
  return handlers.POST;
}

describe("POST /api/alexa/skill", () => {
  it("rejects a request that fails signature verification", async () => {
    verifyAlexaRequest.mockRejectedValue(new Error("bad signature"));
    const request = new Request("https://cookbook.test/api/alexa/skill", {
      method: "POST",
      body: JSON.stringify({ request: { type: "LaunchRequest" } }),
    });

    const response = await postHandler()({ request });

    expect(response.status).toBe(401);
    expect(invoke).not.toHaveBeenCalled();
  });

  it("invokes the skill with the parsed request envelope on a verified request", async () => {
    verifyAlexaRequest.mockResolvedValue(undefined);
    invoke.mockResolvedValue({ version: "1.0", response: { shouldEndSession: true } });
    const envelope = { request: { type: "LaunchRequest" } };
    const request = new Request("https://cookbook.test/api/alexa/skill", {
      method: "POST",
      body: JSON.stringify(envelope),
    });

    const response = await postHandler()({ request });
    const body = await response.json();

    expect(invoke).toHaveBeenCalledWith(envelope);
    expect(body).toEqual({ version: "1.0", response: { shouldEndSession: true } });
  });
});
