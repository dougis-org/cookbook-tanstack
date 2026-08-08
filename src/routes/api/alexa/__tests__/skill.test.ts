// @vitest-environment node
import { describe, it, expect, vi } from "vitest";

const { verifyAlexaRequest, verifyAlexaSkillId, invoke } = vi.hoisted(() => ({
  verifyAlexaRequest: vi.fn(),
  verifyAlexaSkillId: vi.fn(),
  invoke: vi.fn(),
}));
vi.mock("@/server/alexa/verify-request", () => ({ verifyAlexaRequest, verifyAlexaSkillId }));
vi.mock("@/server/alexa/skill", () => ({ skill: { invoke } }));

import { Route } from "../skill";

function postHandler() {
  const handlers = Route.options.server!.handlers as unknown as {
    POST: (args: { request: Request }) => Promise<Response>;
  };
  return handlers.POST;
}

function buildSkillRequest(envelope: object = { request: { type: "LaunchRequest" } }) {
  return new Request("https://cookbook.test/api/alexa/skill", {
    method: "POST",
    body: JSON.stringify(envelope),
  });
}

describe("POST /api/alexa/skill", () => {
  it.each([
    ["fails signature verification", () => verifyAlexaRequest.mockRejectedValue(new Error("bad signature"))],
    [
      "has an application ID that doesn't match this skill",
      () => {
        verifyAlexaRequest.mockResolvedValue(undefined);
        verifyAlexaSkillId.mockImplementation(() => {
          throw new Error("mismatched skill id");
        });
      },
    ],
  ])("rejects a request that %s", async (_label, arrangeMocks) => {
    arrangeMocks();
    const response = await postHandler()({ request: buildSkillRequest() });

    expect(response.status).toBe(401);
    expect(invoke).not.toHaveBeenCalled();
  });

  it("invokes the skill with the parsed request envelope on a verified request", async () => {
    verifyAlexaRequest.mockResolvedValue(undefined);
    verifyAlexaSkillId.mockImplementation(() => undefined);
    invoke.mockResolvedValue({ version: "1.0", response: { shouldEndSession: true } });
    const envelope = { request: { type: "LaunchRequest" } };

    const response = await postHandler()({ request: buildSkillRequest(envelope) });
    const body = await response.json();

    expect(invoke).toHaveBeenCalledWith(envelope);
    expect(body).toEqual({ version: "1.0", response: { shouldEndSession: true } });
  });
});
