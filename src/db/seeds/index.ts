import { config } from "dotenv"

// Load environment variables BEFORE importing db modules that validate them
config({ path: ".env.local" })
config() // fallback to .env

import { pool } from "../index"

async function main() {
  try {
    console.log("Starting database seed...\n");

    const { seedMeals } = await import("./meals");
    const { seedCourses } = await import("./courses");
    const { seedPreparations } = await import("./preparations");

    await seedMeals();
    await seedCourses();
    await seedPreparations();

    console.log("\nSeed complete!");
  } finally {
    // Gracefully close the database connection pool
    await pool.end();
  }
}

main().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
