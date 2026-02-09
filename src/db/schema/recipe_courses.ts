import { pgTable, uuid, primaryKey, index } from 'drizzle-orm/pg-core'
import { recipes } from './recipes'
import { courses } from './courses'

export const recipeCourses = pgTable(
  'recipe_courses',
  {
    recipeId: uuid('recipe_id')
      .notNull()
      .references(() => recipes.id, { onDelete: 'cascade' }),
    courseId: uuid('course_id')
      .notNull()
      .references(() => courses.id, { onDelete: 'cascade' }),
  },
  (table) => [
    primaryKey({ columns: [table.recipeId, table.courseId] }),
    index('recipe_courses_recipe_id_idx').on(table.recipeId),
    index('recipe_courses_course_id_idx').on(table.courseId),
  ],
)
