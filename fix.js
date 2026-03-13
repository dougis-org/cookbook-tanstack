const fs = require('fs');

let helpers = fs.readFileSync('src/server/trpc/routers/_helpers.ts', 'utf8');
helpers = `/**
 * Escapes characters with special meaning in regular expressions.
 */
export function escapeRegex(text: string) {
  return text.replace(/[-[\\]{}()*+?.,\\\\^$|#\\s]/g, "\\\\$&");
}

` + helpers;
fs.writeFileSync('src/server/trpc/routers/_helpers.ts', helpers);

let sources = fs.readFileSync('src/server/trpc/routers/sources.ts', 'utf8');
sources = sources.replace('import { Source } from "@/db/models";', 'import { Source } from "@/db/models";\nimport { escapeRegex } from "./_helpers";');
sources = sources.replace(
  'const trimmed = input.query.trim();\n      return Source.find({ name: { $regex: trimmed, $options: "i" } })',
  'const trimmed = input.query.trim();\n      const safeQuery = escapeRegex(trimmed);\n      return Source.find({ name: { $regex: safeQuery, $options: "i" } })'
);
fs.writeFileSync('src/server/trpc/routers/sources.ts', sources);

let recipes = fs.readFileSync('src/server/trpc/routers/recipes.ts', 'utf8');
recipes = recipes.replace('import { visibilityFilter, verifyOwnership } from "./_helpers";', 'import { visibilityFilter, verifyOwnership, escapeRegex } from "./_helpers";');
recipes = recipes.replace(
  'filter.$or = [\n            { name: { $regex: term, $options: "i" } },\n            { ingredients: { $regex: term, $options: "i" } },\n          ];',
  'const safeSearch = escapeRegex(term);\n          filter.$or = [\n            { name: { $regex: safeSearch, $options: "i" } },\n            { ingredients: { $regex: safeSearch, $options: "i" } },\n          ];'
);
fs.writeFileSync('src/server/trpc/routers/recipes.ts', recipes);

let cookbooks = fs.readFileSync('src/server/trpc/routers/cookbooks.ts', 'utf8');
cookbooks = cookbooks.replace(
  'if (!alreadyIn) {\n        const nextIndex = recipes.length;',
  'if (!alreadyIn) {\n        const maxIndex = recipes.length > 0 ? Math.max(...recipes.map(r => r.orderIndex)) : -1;\n        const nextIndex = maxIndex + 1;'
);
fs.writeFileSync('src/server/trpc/routers/cookbooks.ts', cookbooks);

let classifications = fs.readFileSync('src/server/trpc/routers/classifications.ts', 'utf8');
classifications = classifications.replace(
  'const withCounts = await Promise.all(\n      classificationDocs.map(async (c) => {\n        const recipeCount = await Recipe.countDocuments({\n          classificationId: c._id,\n        });\n        return { ...c, recipeCount };\n      }),\n    );\n\n    return withCounts;',
  'const counts = await Recipe.aggregate([\n      { $group: { _id: "$classificationId", count: { $sum: 1 } } },\n    ]);\n    const countMap = new Map<string, number>(\n      counts.map((c) => [c._id?.toString() ?? "", c.count]),\n    );\n\n    return classificationDocs.map((c) => ({\n      ...c,\n      recipeCount: countMap.get(c._id.toString()) ?? 0,\n    }));'
);
fs.writeFileSync('src/server/trpc/routers/classifications.ts', classifications);

let dbIndex = fs.readFileSync('src/db/index.ts', 'utf8');
dbIndex = dbIndex.replace(
  'if (mongoose.connection.readyState === 0) {\n  mongoose.connect(MONGODB_URI);\n}\n\nexport function getMongoClient() {\n  return mongoose.connection.getClient();\n}',
  'let mongoPromise: Promise<mongoose.Mongoose>;\n\nif (mongoose.connection.readyState === 0) {\n  mongoPromise = mongoose.connect(MONGODB_URI).catch((err) => {\n    console.error("Failed to connect to MongoDB", err);\n    throw err;\n  });\n} else {\n  mongoPromise = mongoose.connection.asPromise();\n}\n\nexport const mongoReady = mongoPromise;\n\nexport async function getMongoClient() {\n  await mongoReady;\n  return mongoose.connection.getClient();\n}'
);
fs.writeFileSync('src/db/index.ts', dbIndex);

let authTs = fs.readFileSync('src/lib/auth.ts', 'utf8');
authTs = authTs.replace(
  'database: mongodbAdapter(getMongoClient().db()),',
  'database: mongodbAdapter(getMongoClient().then((c) => c.db())),'
);
fs.writeFileSync('src/lib/auth.ts', authTs);

