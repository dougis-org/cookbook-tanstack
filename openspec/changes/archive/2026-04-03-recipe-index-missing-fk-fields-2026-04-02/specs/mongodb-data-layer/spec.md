## ADDED Requirements

### Requirement: Recipe schema indexes foreign key filter fields
The Recipe Mongoose schema SHALL define ascending indexes on all fields used in `$in` filter predicates by the recipe list query: `classificationId`, `sourceId`, `mealIds`, `courseIds`, `preparationIds`, and `isPublic`.

#### Scenario: classificationId index exists
- **WHEN** the Recipe Mongoose schema is inspected
- **THEN** a `{ classificationId: 1 }` index SHALL be declared on `recipeSchema`

#### Scenario: sourceId index exists
- **WHEN** the Recipe Mongoose schema is inspected
- **THEN** a `{ sourceId: 1 }` index SHALL be declared on `recipeSchema`

#### Scenario: mealIds multikey index exists
- **WHEN** the Recipe Mongoose schema is inspected
- **THEN** a `{ mealIds: 1 }` index SHALL be declared on `recipeSchema` (MongoDB creates a multikey index automatically for array fields)

#### Scenario: courseIds multikey index exists
- **WHEN** the Recipe Mongoose schema is inspected
- **THEN** a `{ courseIds: 1 }` index SHALL be declared on `recipeSchema`

#### Scenario: preparationIds multikey index exists
- **WHEN** the Recipe Mongoose schema is inspected
- **THEN** a `{ preparationIds: 1 }` index SHALL be declared on `recipeSchema`

#### Scenario: isPublic index exists
- **WHEN** the Recipe Mongoose schema is inspected
- **THEN** a `{ isPublic: 1 }` index SHALL be declared on `recipeSchema`
