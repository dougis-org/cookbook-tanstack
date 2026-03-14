/**
 * Diagnostic script: verifies that recipe → classification/source populate works in production.
 * Usage:
 *   DOTENV_PATH=/path/to/.env.prod npx tsx scripts/migration/diagnose-references.ts
 */
import { config } from "dotenv";

if (process.env.DOTENV_PATH) {
  config({ path: process.env.DOTENV_PATH, override: true });
} else {
  config({ path: ".env.local" });
  config();
}

async function main() {
  const { default: mongoose } = await import("../../src/db/index");
  const { Classification, Source, Recipe } = await import(
    "../../src/db/models"
  );

  if (mongoose.connection.readyState !== 1) {
    await mongoose.connection.asPromise();
  }

  const classificationCount = await Classification.countDocuments();
  const sourceCount = await Source.countDocuments();
  const recipeCount = await Recipe.countDocuments();

  console.log(`\n=== Collection Counts ===`);
  console.log(`  Classifications: ${classificationCount}`);
  console.log(`  Sources:         ${sourceCount}`);
  console.log(`  Recipes:         ${recipeCount}`);

  // Check how many recipes have classificationId set
  const recipesWithClassification = await Recipe.countDocuments({
    classificationId: { $ne: null, $exists: true },
  });
  const recipesWithSource = await Recipe.countDocuments({
    sourceId: { $ne: null, $exists: true },
  });

  console.log(`\n=== Reference Fields ===`);
  console.log(
    `  Recipes with classificationId: ${recipesWithClassification} / ${recipeCount}`,
  );
  console.log(
    `  Recipes with sourceId:         ${recipesWithSource} / ${recipeCount}`,
  );

  // Sample a recipe with classificationId and test populate
  const sampleWithClass = await Recipe.findOne({
    classificationId: { $ne: null, $exists: true },
  }).lean();

  if (sampleWithClass) {
    console.log(`\n=== Sample Recipe (with classificationId) ===`);
    console.log(`  Recipe _id:       ${sampleWithClass._id}`);
    console.log(`  Recipe name:      ${sampleWithClass.name}`);
    console.log(`  classificationId: ${sampleWithClass.classificationId}`);

    // Direct lookup to verify the classification document exists
    const cls = await Classification.findById(
      sampleWithClass.classificationId,
    ).lean();
    console.log(
      `  Classification found: ${cls ? `YES — name="${cls.name}"` : "NO — document not found!"}`,
    );

    // Test populate
    const populated = await Recipe.findById(sampleWithClass._id)
      .populate("classificationId", "name slug")
      .lean();
    const clsPopulated = populated?.classificationId as
      | { name?: string }
      | null;
    console.log(
      `  After populate:       ${clsPopulated?.name ? `"${clsPopulated.name}"` : "NULL — populate failed!"}`,
    );
  } else {
    console.log(`\n  No recipes with classificationId found!`);
  }

  // Sample a recipe with sourceId and test populate
  const sampleWithSource = await Recipe.findOne({
    sourceId: { $ne: null, $exists: true },
  }).lean();

  if (sampleWithSource) {
    console.log(`\n=== Sample Recipe (with sourceId) ===`);
    console.log(`  Recipe _id:  ${sampleWithSource._id}`);
    console.log(`  Recipe name: ${sampleWithSource.name}`);
    console.log(`  sourceId:    ${sampleWithSource.sourceId}`);

    const src = await Source.findById(sampleWithSource.sourceId).lean();
    console.log(
      `  Source found: ${src ? `YES — name="${src.name}"` : "NO — document not found!"}`,
    );

    const populated = await Recipe.findById(sampleWithSource._id)
      .populate("sourceId", "name url")
      .lean();
    const srcPopulated = populated?.sourceId as { name?: string } | null;
    console.log(
      `  After populate: ${srcPopulated?.name ? `"${srcPopulated.name}"` : "NULL — populate failed!"}`,
    );
  } else {
    console.log(`\n  No recipes with sourceId found!`);
  }

  // Show sample classification and source documents
  const sampleCls = await Classification.findOne().lean();
  const sampleSrc = await Source.findOne().lean();

  if (sampleCls) {
    console.log(`\n=== Sample Classification Document ===`);
    console.log(JSON.stringify(sampleCls, null, 2));
  }
  if (sampleSrc) {
    console.log(`\n=== Sample Source Document ===`);
    console.log(JSON.stringify(sampleSrc, null, 2));
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
