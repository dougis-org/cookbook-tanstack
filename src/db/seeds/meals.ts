import { db } from '../index'
import { meals } from '../schema'

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
  const result = await db.insert(meals).values(mealData).onConflictDoNothing()
  console.log(`Seeded ${result.rowCount ?? 0} meals`)
}
