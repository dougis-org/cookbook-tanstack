import { config } from "dotenv"

// dotenv must run before db/index.ts is imported (ESM hoisting workaround)
config({ path: ".env.local" })
config({ path: ".env.test" })
config()

// Dynamic import ensures db/index.ts evaluates after env vars are set
const { default: mongoose } = await import("../index")

async function main() {
  try {
    console.log("Starting database seed...\n")
    // Wait for connection
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connection.asPromise()
    }

    const { seedMeals } = await import("./meals")
    const { seedCourses } = await import("./courses")
    const { seedPreparations } = await import("./preparations")

    await seedMeals()
    await seedCourses()
    await seedPreparations()

    console.log("\nSeed complete!")
  } finally {
    await mongoose.disconnect()
  }
}

main().catch((error) => {
  console.error("Seed failed:", error)
  process.exit(1)
})
