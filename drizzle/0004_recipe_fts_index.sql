-- Add GIN index for full-text search across recipe name, ingredients, and instructions.
-- Uses expression index so no stored column is needed; the same expression is evaluated
-- at query time in WHERE clauses and Postgres matches them automatically.
CREATE INDEX IF NOT EXISTS idx_recipes_fts
  ON "recipes"
  USING GIN (
    to_tsvector('english',
      coalesce("name", '') || ' ' ||
      coalesce("ingredients", '') || ' ' ||
      coalesce("instructions", '')
    )
  );
