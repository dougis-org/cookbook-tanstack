// RecipeCard — grid card used on /recipes, /cookbooks/:id, and category pages.
// Image on top, classification badge + title below, then notes preview and a
// meta row with prep/cook time + difficulty pill.
//
// Source: src/components/recipes/RecipeCard.tsx
function RecipeCard({ recipe, marked, isOwner, onOpen }) {
  return (
    <div className="cb-card cb-recipe-card" onClick={() => onOpen?.(recipe)}>
      <div className="cb-card-image" style={{ backgroundImage: recipe.imageUrl ? `url(${recipe.imageUrl})` : recipe.gradient }} />
      <div className="cb-card-body">
        <div className="cb-card-toprow">
          <div className="cb-card-titlewrap">
            {recipe.classificationName && (
              <div className="cb-card-tagline">
                <ClassificationBadge name={recipe.classificationName} />
              </div>
            )}
            <h3 className="cb-card-title">{recipe.name}</h3>
          </div>
          <div className="cb-card-iconcol">
            {isOwner && <Icon name="User" size={16} className="cb-accent" aria-label="You own this" />}
            {marked !== undefined && (
              <Icon
                name="Heart"
                size={18}
                fill={marked ? "currentColor" : "none"}
                className={marked ? "cb-heart cb-heart--on" : "cb-heart"}
              />
            )}
          </div>
        </div>
        {recipe.notes && <p className="cb-card-notes">{recipe.notes}</p>}
        <div className="cb-card-meta">
          <div className="cb-card-meta-times">
            {recipe.prepTime && <span>Prep: {recipe.prepTime} min</span>}
            {recipe.cookTime && <span>Cook: {recipe.cookTime} min</span>}
          </div>
          {recipe.difficulty && (
            <span className="cb-diff-pill">{recipe.difficulty}</span>
          )}
        </div>
      </div>
    </div>
  );
}

window.RecipeCard = RecipeCard;
