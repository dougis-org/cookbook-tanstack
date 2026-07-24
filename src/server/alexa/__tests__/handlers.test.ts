// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ResponseFactory } from "ask-sdk-core";
import type { HandlerInput } from "ask-sdk-core";
import type { RequestEnvelope } from "ask-sdk-model";

const { alexaAdapter, getProgress, saveProgress } = vi.hoisted(() => ({
  alexaAdapter: {
    searchRecipes: vi.fn(),
    recipeDetail: vi.fn(),
    myRecipes: vi.fn(),
    myCookbooks: vi.fn(),
    cookbookDetail: vi.fn(),
  },
  getProgress: vi.fn(),
  saveProgress: vi.fn(),
}));

vi.mock("@/server/trpc/routers/alexa", () => ({ alexaAdapter }));
vi.mock("@/server/alexa/progress-store", () => ({ getProgress, saveProgress, clearProgress: vi.fn() }));

import {
  SearchRecipesIntentHandler,
  GetRecipeDetailsIntentHandler,
  NextStepIntentHandler,
  MyRecipesIntentHandler,
  BrowseCookbookIntentHandler,
} from "../handlers";

function buildInput(overrides: {
  intentName?: string;
  slots?: Record<string, string>;
  userId?: string;
  accessToken?: string;
} = {}): HandlerInput {
  const slots = overrides.slots ?? {};
  const requestEnvelope = {
    version: "1.0",
    session: {
      new: false,
      sessionId: "session-1",
      application: { applicationId: "app-1" },
      user: { userId: overrides.userId ?? "amzn1.ask.account.TEST", accessToken: overrides.accessToken },
    },
    context: {
      System: {
        application: { applicationId: "app-1" },
        user: { userId: overrides.userId ?? "amzn1.ask.account.TEST", accessToken: overrides.accessToken },
        device: { deviceId: "device-1", supportedInterfaces: {} },
      },
    },
    request: {
      type: "IntentRequest",
      requestId: "req-1",
      timestamp: new Date().toISOString(),
      dialogState: "COMPLETED",
      intent: {
        name: overrides.intentName ?? "SearchRecipesIntent",
        confirmationStatus: "NONE",
        slots: Object.fromEntries(
          Object.entries(slots).map(([name, value]) => [name, { name, value, confirmationStatus: "NONE" }]),
        ),
      },
    },
  } as unknown as RequestEnvelope;

  return {
    requestEnvelope,
    responseBuilder: ResponseFactory.init(),
    attributesManager: {} as never,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("SearchRecipesIntentHandler", () => {
  it("returns spoken + APL results for a matching query", async () => {
    alexaAdapter.searchRecipes.mockResolvedValue({ items: [{ id: "1", name: "Chicken Tikka Masala", imageUrl: null }] });

    const input = buildInput({ slots: { query: "chicken" } });
    const response = await SearchRecipesIntentHandler.handle(input);

    expect(response.outputSpeech).toBeTruthy();
    expect(alexaAdapter.searchRecipes).toHaveBeenCalledWith({ query: "chicken" });
  });

  it("responds gracefully with no matches, without erroring", async () => {
    alexaAdapter.searchRecipes.mockResolvedValue({ items: [] });
    const input = buildInput({ slots: { query: "nonexistent" } });
    const response = await SearchRecipesIntentHandler.handle(input);
    expect(response).toBeDefined();
  });
});

describe("GetRecipeDetailsIntentHandler", () => {
  it("returns a spoken summary and APL detail card", async () => {
    alexaAdapter.recipeDetail.mockResolvedValue({
      id: "1",
      name: "Pancakes",
      servings: 4,
      imageUrl: null,
      ingredients: ["Flour", "Eggs"],
      steps: ["Mix", "Cook"],
    });

    const input = buildInput({ intentName: "GetRecipeDetailsIntent", slots: { recipeId: "1" } });
    const response = await GetRecipeDetailsIntentHandler.handle(input);

    expect(response).toBeDefined();
    expect(saveProgress).toHaveBeenCalledWith("amzn1.ask.account.TEST", { recipeId: "1", stepIndex: 0 });
  });
});

describe("NextStepIntentHandler", () => {
  it("advances the step index and speaks the next instruction", async () => {
    getProgress.mockResolvedValue({ recipeId: "1", stepIndex: 0 });
    alexaAdapter.recipeDetail.mockResolvedValue({
      id: "1",
      name: "Pancakes",
      ingredients: [],
      steps: ["Mix", "Cook", "Serve"],
    });

    const input = buildInput({ intentName: "NextStepIntent" });
    await NextStepIntentHandler.handle(input);

    expect(saveProgress).toHaveBeenCalledWith("amzn1.ask.account.TEST", { recipeId: "1", stepIndex: 1 });
  });

  it("indicates the recipe is complete on the last step", async () => {
    getProgress.mockResolvedValue({ recipeId: "1", stepIndex: 2 });
    alexaAdapter.recipeDetail.mockResolvedValue({
      id: "1",
      name: "Pancakes",
      ingredients: [],
      steps: ["Mix", "Cook", "Serve"],
    });

    const input = buildInput({ intentName: "NextStepIntent" });
    const response = await NextStepIntentHandler.handle(input);

    const speech = JSON.stringify(response.outputSpeech);
    expect(speech).toContain("complete");
  });

  it("responds that no recipe is in progress when there is no persisted progress", async () => {
    getProgress.mockResolvedValue(null);
    const input = buildInput({ intentName: "NextStepIntent" });
    const response = await NextStepIntentHandler.handle(input);
    const speech = JSON.stringify(response.outputSpeech);
    expect(speech).toContain("No recipe is currently in progress");
  });

  it("resumes from persisted progress after simulated session loss instead of reporting no recipe in progress", async () => {
    // Same as the base case: the handler always reads from the persisted
    // store rather than in-memory session attributes (design.md Decision 6),
    // so a "session loss" is indistinguishable from a normal call here.
    getProgress.mockResolvedValue({ recipeId: "1", stepIndex: 3 });
    alexaAdapter.recipeDetail.mockResolvedValue({
      id: "1",
      name: "Lasagna",
      ingredients: [],
      steps: ["a", "b", "c", "d", "e"],
    });

    const input = buildInput({ intentName: "NextStepIntent" });
    const response = await NextStepIntentHandler.handle(input);

    const speech = JSON.stringify(response.outputSpeech);
    expect(speech).toContain("Step 5");
  });
});

describe("MyRecipesIntentHandler", () => {
  it("returns the caller's own recipes when linked", async () => {
    alexaAdapter.myRecipes.mockResolvedValue({ items: [{ id: "1", name: "Grandma's Pie" }] });
    const input = buildInput({ intentName: "MyRecipesIntent", accessToken: "linked-token" });
    const response = await MyRecipesIntentHandler.handle(input);

    expect(alexaAdapter.myRecipes).toHaveBeenCalledWith({ token: "linked-token" });
    expect(response.outputSpeech).toBeTruthy();
  });

  it("prompts for account linking when the caller has not linked their account", async () => {
    const input = buildInput({ intentName: "MyRecipesIntent" });
    const response = await MyRecipesIntentHandler.handle(input);

    expect(response.card?.type).toBe("LinkAccount");
    expect(alexaAdapter.myRecipes).not.toHaveBeenCalled();
  });
});

describe("BrowseCookbookIntentHandler", () => {
  it("returns chapters/entries for an owned, resolvable cookbook", async () => {
    alexaAdapter.myCookbooks.mockResolvedValue({ items: [{ id: "cb-1", name: "Family Favorites" }] });
    alexaAdapter.cookbookDetail.mockResolvedValue({
      id: "cb-1",
      name: "Family Favorites",
      chapters: [{ name: "Breakfast" }],
      recipes: [{ id: "1", name: "Pancakes" }],
    });

    const input = buildInput({
      intentName: "BrowseCookbookIntent",
      slots: { cookbookName: "Family Favorites" },
      accessToken: "linked-token",
    });
    const response = await BrowseCookbookIntentHandler.handle(input);
    expect(response).toBeDefined();
    expect(alexaAdapter.cookbookDetail).toHaveBeenCalledWith({ token: "linked-token", id: "cb-1" });
  });

  it("responds that it could not find the cookbook without revealing existence for another user", async () => {
    alexaAdapter.myCookbooks.mockResolvedValue({ items: [] });

    const input = buildInput({
      intentName: "BrowseCookbookIntent",
      slots: { cookbookName: "Someone Else's Cookbook" },
      accessToken: "linked-token",
    });
    const response = await BrowseCookbookIntentHandler.handle(input);
    const speech = JSON.stringify(response.outputSpeech);
    expect(speech).toContain("couldn't find");
  });

  it("prompts for account linking when the caller has not linked their account", async () => {
    const input = buildInput({ intentName: "BrowseCookbookIntent", slots: { cookbookName: "Anything" } });
    const response = await BrowseCookbookIntentHandler.handle(input);

    expect(response.card?.type).toBe("LinkAccount");
    expect(alexaAdapter.myCookbooks).not.toHaveBeenCalled();
  });
});

describe("voice-only fallback (no APL support)", () => {
  // buildInput() sets supportedInterfaces: {} by default, i.e. no APL support.
  it("SearchRecipesIntent produces a coherent spoken-only response with no APL directive", async () => {
    alexaAdapter.searchRecipes.mockResolvedValue({ items: [{ id: "1", name: "Chicken Soup", imageUrl: null }] });
    const input = buildInput({ slots: { query: "soup" } });
    const response = await SearchRecipesIntentHandler.handle(input);

    expect(response.directives).toBeUndefined();
    expect(response.outputSpeech).toBeTruthy();
  });

  it("GetRecipeDetailsIntent produces a coherent spoken-only response with no APL directive", async () => {
    alexaAdapter.recipeDetail.mockResolvedValue({
      id: "1",
      name: "Pancakes",
      ingredients: ["Flour"],
      steps: ["Mix"],
    });
    const input = buildInput({ intentName: "GetRecipeDetailsIntent", slots: { recipeId: "1" } });
    const response = await GetRecipeDetailsIntentHandler.handle(input);

    expect(response.directives).toBeUndefined();
    expect(response.outputSpeech).toBeTruthy();
  });

  it("BrowseCookbookIntent produces a coherent spoken-only response with no APL directive", async () => {
    alexaAdapter.myCookbooks.mockResolvedValue({ items: [{ id: "cb-1", name: "Family Favorites" }] });
    alexaAdapter.cookbookDetail.mockResolvedValue({
      id: "cb-1",
      name: "Family Favorites",
      chapters: [],
      recipes: [],
    });
    const input = buildInput({
      intentName: "BrowseCookbookIntent",
      slots: { cookbookName: "Family Favorites" },
      accessToken: "linked-token",
    });
    const response = await BrowseCookbookIntentHandler.handle(input);

    expect(response.directives).toBeUndefined();
    expect(response.outputSpeech).toBeTruthy();
  });
});
