// PageLayout — outer container used by every route. Centered max-width
// container with optional title + description block.
// Source: src/components/layout/PageLayout.tsx
function PageLayout({ title, description, children, wide = false }) {
  return (
    <div className="cb-page">
      <div className={`cb-container ${wide ? "cb-container--wide" : ""}`}>
        {(title || description) && (
          <div className="cb-page-titleblock">
            {title && <h1 className="cb-page-title">{title}</h1>}
            {description && <p className="cb-page-desc">{description}</p>}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

window.PageLayout = PageLayout;
