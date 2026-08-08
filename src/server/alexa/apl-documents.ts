/**
 * APL documents for the three visual states (design.md Decision 5): search
 * results, recipe detail, and cookbook browse. Mirrors the app's content
 * hierarchy (title > meta > body). Taxonomy badge colors (amber/violet/
 * emerald/cyan, per design.md Decision 5) aren't wired in yet — the v1
 * adapter doesn't surface meal/course data to these documents — so badges
 * are a follow-up once that data flows through.
 */

export const searchResultsDocument = {
  type: "APL",
  version: "2023.3",
  mainTemplate: {
    parameters: ["results"],
    items: [
      {
        type: "Sequence",
        width: "100%",
        height: "100%",
        data: "${results.items}",
        items: [
          {
            type: "Container",
            direction: "row",
            items: [
              { type: "Image", source: "${data.imageUrl}", width: 120, height: 120 },
              {
                type: "Text",
                text: "${data.name}",
                fontFamily: "Fraunces",
                fontSize: "24dp",
                fontWeight: "600",
              },
            ],
          },
        ],
      },
    ],
  },
};

export const recipeDetailDocument = {
  type: "APL",
  version: "2023.3",
  mainTemplate: {
    parameters: ["recipe", "currentStepIndex"],
    items: [
      {
        type: "Container",
        width: "100%",
        height: "100%",
        items: [
          { type: "Image", source: "${recipe.imageUrl}", width: "100%", height: "40%" },
          { type: "Text", text: "${recipe.name}", fontFamily: "Fraunces", fontSize: "32dp", fontWeight: "600" },
          {
            type: "Text",
            text: "Ingredients: ${recipe.ingredients}",
            fontFamily: "Inter",
            fontSize: "18dp",
          },
          {
            type: "Text",
            text: "Step ${(currentStepIndex || 0) + 1} of ${recipe.steps.length}: ${recipe.steps[currentStepIndex || 0]}",
            fontFamily: "Inter",
            fontSize: "20dp",
            fontWeight: "500",
          },
        ],
      },
    ],
  },
};

export const cookbookBrowseDocument = {
  type: "APL",
  version: "2023.3",
  mainTemplate: {
    parameters: ["cookbook"],
    items: [
      {
        type: "Container",
        width: "100%",
        height: "100%",
        items: [
          { type: "Text", text: "${cookbook.name}", fontFamily: "Fraunces", fontSize: "32dp", fontWeight: "600" },
          {
            type: "Sequence",
            data: "${cookbook.chapters}",
            items: [{ type: "Text", text: "${data.name}", fontFamily: "Inter", fontSize: "20dp" }],
          },
        ],
      },
    ],
  },
};
