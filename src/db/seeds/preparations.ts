import { db } from '../index'
import { preparations } from '../schema'

const preparationData = [
  { name: 'Baked', slug: 'baked', description: 'Cooked in an oven' },
  { name: 'Fried', slug: 'fried', description: 'Cooked in hot oil' },
  { name: 'Grilled', slug: 'grilled', description: 'Cooked over direct heat' },
  { name: 'Steamed', slug: 'steamed', description: 'Cooked with steam' },
  { name: 'Roasted', slug: 'roasted', description: 'Cooked in an oven at high heat' },
  { name: 'Sautéed', slug: 'sauteed', description: 'Cooked quickly in a small amount of fat' },
  { name: 'Raw', slug: 'raw', description: 'Uncooked preparations' },
  { name: 'Slow-Cooked', slug: 'slow-cooked', description: 'Cooked at low temperature for a long time' },
  { name: 'Braised', slug: 'braised', description: 'Seared then slow-cooked in liquid' },
  { name: 'Smoked', slug: 'smoked', description: 'Cooked or flavored with smoke' },
  { name: 'Poached', slug: 'poached', description: 'Cooked gently in simmering liquid' },
  { name: 'Blanched', slug: 'blanched', description: 'Briefly boiled then ice-bathed' },
]

export async function seedPreparations() {
  const result = await db.insert(preparations).values(preparationData).onConflictDoNothing()
  console.log(`Seeded ${result.rowCount ?? 0} preparations`)
}
