import { Classification } from '../models'

const classificationData = [
  { name: 'Appetizers', slug: 'appetizers', description: 'Small dishes served before the main course' },
  { name: 'Main Dishes', slug: 'main-dishes', description: 'Primary dishes of a meal' },
  { name: 'Desserts', slug: 'desserts', description: 'Sweet dishes served after the main course' },
  { name: 'Salads', slug: 'salads', description: 'Dishes made of mixed vegetables' },
  { name: 'Soups', slug: 'soups', description: 'Liquid food, typically made by boiling meat, fish, or vegetables' },
  { name: 'Breads', slug: 'breads', description: 'Baked food made from dough' },
  { name: 'Beverages', slug: 'beverages', description: 'Drinks other than water' },
]

export async function seedClassifications() {
  let count = 0
  for (const data of classificationData) {
    const result = await Classification.updateOne({ slug: data.slug }, { $set: data }, { upsert: true })
    if (result.upsertedCount) count++
  }
  console.log(`Seeded ${count} new classifications`)
}
