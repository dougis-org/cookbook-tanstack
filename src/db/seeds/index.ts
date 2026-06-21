import { config } from "dotenv"

// dotenv must run before db/index.ts is imported (ESM hoisting workaround)
config({ path: ".env.local" })
config({ path: ".env.test" })
config()

// Dynamic import ensures db/index.ts evaluates after env vars are set
const { default: mongoose } = await import("../index")

export async function main() {
  console.log("Starting database seed...\n")
  // Wait for connection
  if (mongoose.connection.readyState !== 1) {
    await mongoose.connection.asPromise()
  }

  const { seedMeals } = await import("./meals")
  const { seedCourses } = await import("./courses")
  const { seedPreparations } = await import("./preparations")
  const { seedClassifications } = await import("./classifications")
  const { backfillSourceSlugs, seedSources } = await import("./sources")

  await seedMeals()
  await seedCourses()
  await seedPreparations()
  await seedClassifications()
  await backfillSourceSlugs()
  await seedSources()

  console.log("\nSeed complete!")
}

if (!process.env.VITEST && !process.env.VITEST_POOL_ID) {
  main()
    .catch((error) => {
      console.error("Seed failed:", error)
      process.exit(1)
    })
    .finally(async () => {
      await mongoose.disconnect()
    })
}
