// SearchFilter — sidebar panel that filters the recipe list.
// Source: src/components/ui/SearchFilter.tsx
function SearchFilter({ filters, onChange }) {
  function update(patch) { onChange({ ...filters, ...patch }); }
  return (
    <div className="cb-filter-panel">
      <h2 className="cb-filter-title">Search & Filter</h2>
      <div className="cb-field">
        <label className="cb-field-label">Search Recipes</label>
        <input
          className="cb-input"
          type="text"
          placeholder="Search by name or ingredients..."
          value={filters.search ?? ""}
          onChange={(e) => update({ search: e.target.value })}
        />
      </div>
      <div className="cb-field">
        <label className="cb-field-label">Difficulty</label>
        <select
          className="cb-input cb-select"
          value={filters.difficulty ?? ""}
          onChange={(e) => update({ difficulty: e.target.value || undefined })}
        >
          <option value="">All Difficulties</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
      </div>
      <div className="cb-filter-times">
        <div className="cb-field">
          <label className="cb-field-label">Max Prep Time</label>
          <input
            type="number"
            className="cb-input"
            placeholder="Minutes"
            value={filters.maxPrepTime ?? ""}
            onChange={(e) => update({ maxPrepTime: Number(e.target.value) || undefined })}
          />
        </div>
        <div className="cb-field">
          <label className="cb-field-label">Max Cook Time</label>
          <input
            type="number"
            className="cb-input"
            placeholder="Minutes"
            value={filters.maxCookTime ?? ""}
            onChange={(e) => update({ maxCookTime: Number(e.target.value) || undefined })}
          />
        </div>
      </div>
      <button className="cb-btn cb-btn--subtle cb-btn--block" onClick={() => onChange({})}>
        Clear Filters
      </button>
    </div>
  );
}

window.SearchFilter = SearchFilter;
