// Breadcrumb — chevron-separated nav row.
// Source: src/components/ui/Breadcrumb.tsx
function Breadcrumb({ items, onNavigate }) {
  return (
    <nav aria-label="Breadcrumb" className="cb-breadcrumb">
      {items.map((item, i) => {
        const last = i === items.length - 1;
        return (
          <span key={i} className="cb-breadcrumb-item">
            {i > 0 && <Icon name="ChevronRight" size={14} className="cb-fg-muted" />}
            {last || !item.to ? (
              <span className={last ? "cb-breadcrumb-last" : ""}>{item.label}</span>
            ) : (
              <button className="cb-breadcrumb-link" onClick={() => onNavigate?.(item.to)}>
                {item.label}
              </button>
            )}
          </span>
        );
      })}
    </nav>
  );
}

window.Breadcrumb = Breadcrumb;
