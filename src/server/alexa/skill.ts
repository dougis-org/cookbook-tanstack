import { SkillBuilders } from "ask-sdk-core";
import {
  LaunchRequestHandler,
  SearchRecipesIntentHandler,
  GetRecipeDetailsIntentHandler,
  NextStepIntentHandler,
  PreviousStepIntentHandler,
  MyRecipesIntentHandler,
  BrowseCookbookIntentHandler,
  HelpIntentHandler,
  CancelAndStopIntentHandler,
  FallbackIntentHandler,
  SessionEndedRequestHandler,
} from "@/server/alexa/handlers";

export const skill = SkillBuilders.custom()
  .addRequestHandlers(
    LaunchRequestHandler,
    SearchRecipesIntentHandler,
    GetRecipeDetailsIntentHandler,
    NextStepIntentHandler,
    PreviousStepIntentHandler,
    MyRecipesIntentHandler,
    BrowseCookbookIntentHandler,
    HelpIntentHandler,
    CancelAndStopIntentHandler,
    FallbackIntentHandler,
    SessionEndedRequestHandler,
  )
  .create();
