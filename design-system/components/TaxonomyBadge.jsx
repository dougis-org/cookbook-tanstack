// TaxonomyBadge — small rounded pill used for meal / course / preparation /
// classification tags on recipes. The four variants map to fixed brand color
// families (amber / violet / emerald / cyan) that hold across all 4 themes.
//
// Source: src/components/ui/TaxonomyBadge.tsx + ClassificationBadge.tsx
// in dougis-org/cookbook-tanstack.
function TaxonomyBadge({ name, variant = "meal", icon = false }) {
  const cls = `cb-pill cb-pill--${variant}`;
  return (
    <span className={cls}>
      {icon && <Icon name="Tag" size={12} style={{ marginRight: 2 }} />}
      {name}
    </span>
  );
}

function ClassificationBadge({ name }) {
  return <TaxonomyBadge name={name} variant="classification" icon />;
}

window.TaxonomyBadge = TaxonomyBadge;
window.ClassificationBadge = ClassificationBadge;
