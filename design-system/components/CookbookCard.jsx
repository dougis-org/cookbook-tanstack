// CookbookCard — collection card used on /cookbooks.
// Source: src/components/cookbooks/CookbookCard.tsx
function CookbookCard({ cookbook, isOwner, onOpen }) {
  return (
    <div className="cb-card cb-cookbook-card" onClick={() => onOpen?.(cookbook)}>
      <div className="cb-card-image cb-cookbook-card-image" style={{ backgroundImage: cookbook.imageUrl ? `url(${cookbook.imageUrl})` : cookbook.gradient }} />
      <div className="cb-card-body">
        <h3 className="cb-card-title cb-cookbook-title">
          {!cookbook.imageUrl && <Icon name="BookOpen" size={18} className="cb-fg-muted" />}
          <span>{cookbook.name}</span>
        </h3>
        {cookbook.description && <p className="cb-card-notes">{cookbook.description}</p>}
        <div className="cb-cookbook-meta">
          <div className="cb-cookbook-counts">
            {isOwner && <Icon name="User" size={14} className="cb-accent" aria-label="You own this" />}
            <span>
              {cookbook.recipeCount ?? 0} {cookbook.recipeCount === 1 ? "recipe" : "recipes"}
              {(cookbook.chapterCount ?? 0) > 0 && (
                <> · {cookbook.chapterCount} {cookbook.chapterCount === 1 ? "chapter" : "chapters"}</>
              )}
            </span>
          </div>
          {!cookbook.isPublic && <span className="cb-private-tag">Private</span>}
        </div>
      </div>
    </div>
  );
}

window.CookbookCard = CookbookCard;
