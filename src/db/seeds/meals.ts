import { Meal } from '../models'

const mealData = [
  { name: 'Breakfast', slug: 'breakfast', description: 'Morning meals' },
  { name: 'Brunch', slug: 'brunch', description: 'Late morning meals' },
  { name: 'Lunch', slug: 'lunch', description: 'Midday meals' },
  { name: 'Dinner', slug: 'dinner', description: 'Evening meals' },
  { name: 'Snack', slug: 'snack', description: 'Light bites between meals' },
  { name: 'Dessert', slug: 'dessert', description: 'Sweet treats' },
  { name: 'Appetizer', slug: 'appetizer', description: 'Starters before the main meal' },
]

export async function seedMeals() {
  let count = 0
  for (const data of mealData) {
    const result = await Meal.updateOne({ slug: data.slug }, { $set: data }, { upsert: true })
    if (result.upsertedCount) count++
  }
  console.log(`Seeded ${count} new meals`)
}
