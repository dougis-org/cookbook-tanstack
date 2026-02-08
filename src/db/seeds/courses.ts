import { db } from '../index'
import { courses } from '../schema'

const courseData = [
  { name: 'Appetizer', slug: 'appetizer', description: 'Starters and small plates' },
  { name: 'Main Course', slug: 'main-course', description: 'Primary dish of the meal' },
  { name: 'Side Dish', slug: 'side-dish', description: 'Accompaniments to the main course' },
  { name: 'Dessert', slug: 'dessert', description: 'Sweet course to finish the meal' },
  { name: 'Soup', slug: 'soup', description: 'Liquid-based dishes' },
  { name: 'Salad', slug: 'salad', description: 'Fresh vegetable-based dishes' },
  { name: 'Beverage', slug: 'beverage', description: 'Drinks and refreshments' },
  { name: 'Bread', slug: 'bread', description: 'Baked bread and rolls' },
  { name: 'Sauce', slug: 'sauce', description: 'Condiments and dressings' },
]

export async function seedCourses() {
  const result = await db.insert(courses).values(courseData).onConflictDoNothing()
  console.log(`Seeded ${result.rowCount ?? 0} courses`)
}
