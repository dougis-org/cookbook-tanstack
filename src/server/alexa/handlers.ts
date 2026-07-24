import type { HandlerInput, RequestHandler } from "ask-sdk-core";
import {
  getRequestType,
  getIntentName,
  getSlotValue,
  getUserId,
  getAccountLinkingAccessToken,
  getSupportedInterfaces,
} from "ask-sdk-core";
import { alexaAdapter } from "@/server/trpc/routers/alexa";
import { getProgress, saveProgress } from "@/server/alexa/progress-store";
import { searchResultsDocument, recipeDetailDocument, cookbookBrowseDocument } from "@/server/alexa/apl-documents";

function supportsApl(input: HandlerInput): boolean {
  return !!getSupportedInterfaces(input.requestEnvelope)["Alexa.Presentation.APL"];
}

function addAplDirective(input: HandlerInput, document: object, datasources: object) {
  if (!supportsApl(input)) return;
  input.responseBuilder.addDirective({
    type: "Alexa.Presentation.APL.RenderDocument",
    document,
    datasources,
  } as never);
}

function isIntent(input: HandlerInput, name: string): boolean {
  return getRequestType(input.requestEnvelope) === "IntentRequest" && getIntentName(input.requestEnvelope) === name;
}

export const LaunchRequestHandler: RequestHandler = {
  canHandle(input) {
    return getRequestType(input.requestEnvelope) === "LaunchRequest";
  },
  handle(input) {
    return input.responseBuilder
      .speak("Welcome to My CookBooks. You can search for a recipe, or ask for one of your own recipes or cookbooks.")
      .reprompt("What would you like to cook?")
      .getResponse();
  },
};

export const SearchRecipesIntentHandler: RequestHandler = {
  canHandle(input) {
    return isIntent(input, "SearchRecipesIntent");
  },
  async handle(input) {
    const query = getSlotValue(input.requestEnvelope, "query");
    const result = await alexaAdapter.searchRecipes({ query });

    if (result.items.length === 0) {
      return input.responseBuilder
        .speak(`I couldn't find any recipes matching "${query}". Try a different search term.`)
        .getResponse();
    }

    const top = result.items[0];
    addAplDirective(input, searchResultsDocument, { results: { items: result.items } });
    return input.responseBuilder
      .speak(`I found ${result.items.length} recipe${result.items.length === 1 ? "" : "s"}. The first is ${top.name}.`)
      .withSimpleCard("Recipe Search Results", result.items.map((r) => r.name).join(", "))
      .getResponse();
  },
};

export const GetRecipeDetailsIntentHandler: RequestHandler = {
  canHandle(input) {
    return isIntent(input, "GetRecipeDetailsIntent");
  },
  async handle(input) {
    const recipeId = getSlotValue(input.requestEnvelope, "recipeId");
    if (!recipeId) {
      return input.responseBuilder.speak("Which recipe would you like to hear about?").getResponse();
    }
    const recipe = await alexaAdapter.recipeDetail({ id: recipeId });
    if (!recipe) {
      return input.responseBuilder.speak("I couldn't find that recipe.").getResponse();
    }

    const alexaUserId = getUserId(input.requestEnvelope);
    if (alexaUserId) {
      await saveProgress(alexaUserId, { recipeId: recipe.id, stepIndex: 0 });
    }

    addAplDirective(input, recipeDetailDocument, { recipe });
    return input.responseBuilder
      .speak(
        `${recipe.name}. It has ${recipe.ingredients.length} ingredients. The first step is: ${recipe.steps[0] ?? "no instructions available"}.`,
      )
      .withSimpleCard(recipe.name, recipe.ingredients.join(", "))
      .getResponse();
  },
};

async function stepNavigation(input: HandlerInput, direction: 1 | -1) {
  const alexaUserId = getUserId(input.requestEnvelope);
  const progress = alexaUserId ? await getProgress(alexaUserId) : null;

  if (!progress) {
    return input.responseBuilder
      .speak("No recipe is currently in progress. Try searching for a recipe first.")
      .getResponse();
  }

  const recipe = await alexaAdapter.recipeDetail({ id: progress.recipeId });
  if (!recipe) {
    return input.responseBuilder.speak("I couldn't find that recipe anymore.").getResponse();
  }

  const nextIndex = progress.stepIndex + direction;
  if (nextIndex < 0) {
    return input.responseBuilder.speak("You're already at the first step.").getResponse();
  }
  if (nextIndex >= recipe.steps.length) {
    return input.responseBuilder.speak(`That's the last step. ${recipe.name} is complete. Enjoy!`).getResponse();
  }

  if (alexaUserId) {
    await saveProgress(alexaUserId, { recipeId: recipe.id, stepIndex: nextIndex });
  }

  addAplDirective(input, recipeDetailDocument, { recipe, currentStepIndex: nextIndex });
  return input.responseBuilder
    .speak(`Step ${nextIndex + 1} of ${recipe.steps.length}: ${recipe.steps[nextIndex]}`)
    .getResponse();
}

export const NextStepIntentHandler: RequestHandler = {
  canHandle(input) {
    return isIntent(input, "NextStepIntent");
  },
  handle(input) {
    return stepNavigation(input, 1);
  },
};

export const PreviousStepIntentHandler: RequestHandler = {
  canHandle(input) {
    return isIntent(input, "PreviousStepIntent");
  },
  handle(input) {
    return stepNavigation(input, -1);
  },
};

export const MyRecipesIntentHandler: RequestHandler = {
  canHandle(input) {
    return isIntent(input, "MyRecipesIntent");
  },
  async handle(input) {
    const token = getAccountLinkingAccessToken(input.requestEnvelope);
    if (!token) {
      return input.responseBuilder
        .speak("You'll need to link your My CookBooks account to hear your own recipes. Check your Alexa app.")
        .withLinkAccountCard()
        .getResponse();
    }

    const { items } = await alexaAdapter.myRecipes({ token });
    if (items.length === 0) {
      return input.responseBuilder.speak("You don't have any recipes yet.").getResponse();
    }

    return input.responseBuilder
      .speak(`You have ${items.length} recipe${items.length === 1 ? "" : "s"}. The first is ${items[0].name}.`)
      .withSimpleCard("My Recipes", items.map((r) => r.name).join(", "))
      .getResponse();
  },
};

export const BrowseCookbookIntentHandler: RequestHandler = {
  canHandle(input) {
    return isIntent(input, "BrowseCookbookIntent");
  },
  async handle(input) {
    const token = getAccountLinkingAccessToken(input.requestEnvelope);
    if (!token) {
      return input.responseBuilder
        .speak("You'll need to link your My CookBooks account to browse your cookbooks. Check your Alexa app.")
        .withLinkAccountCard()
        .getResponse();
    }

    const cookbookName = getSlotValue(input.requestEnvelope, "cookbookName");
    const { items } = await alexaAdapter.myCookbooks({ token });
    const match = items.find((cb) => cb.name.toLowerCase() === cookbookName?.toLowerCase());
    if (!match) {
      return input.responseBuilder.speak("I couldn't find that cookbook.").getResponse();
    }

    const cookbook = await alexaAdapter.cookbookDetail({ token, id: match.id });
    if (!cookbook) {
      return input.responseBuilder.speak("I couldn't find that cookbook.").getResponse();
    }

    addAplDirective(input, cookbookBrowseDocument, { cookbook });
    return input.responseBuilder
      .speak(`${cookbook.name} has ${cookbook.recipes.length} recipes across ${cookbook.chapters.length} chapters.`)
      .withSimpleCard(cookbook.name, cookbook.recipes.map((r) => r.name).join(", "))
      .getResponse();
  },
};

export const HelpIntentHandler: RequestHandler = {
  canHandle(input) {
    return isIntent(input, "AMAZON.HelpIntent");
  },
  handle(input) {
    return input.responseBuilder
      .speak("You can say things like: find me a chicken recipe, or read me my cookbook.")
      .reprompt("What would you like to do?")
      .getResponse();
  },
};

export const CancelAndStopIntentHandler: RequestHandler = {
  canHandle(input) {
    return isIntent(input, "AMAZON.CancelIntent") || isIntent(input, "AMAZON.StopIntent");
  },
  handle(input) {
    return input.responseBuilder.speak("Goodbye!").withShouldEndSession(true).getResponse();
  },
};

export const FallbackIntentHandler: RequestHandler = {
  canHandle(input) {
    return isIntent(input, "AMAZON.FallbackIntent");
  },
  handle(input) {
    return input.responseBuilder
      .speak("Sorry, I didn't understand that. You can ask me to find a recipe.")
      .reprompt("What would you like to do?")
      .getResponse();
  },
};

export const SessionEndedRequestHandler: RequestHandler = {
  canHandle(input) {
    return getRequestType(input.requestEnvelope) === "SessionEndedRequest";
  },
  handle(input) {
    return input.responseBuilder.getResponse();
  },
};
