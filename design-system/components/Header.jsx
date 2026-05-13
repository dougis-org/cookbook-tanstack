// Header — top bar that's present on every screen.
// Includes brand mark, search, auth controls, and a slide-out drawer that
// hosts primary navigation + the theme picker (the four-theme switcher is
// the brand's signature interaction).
//
// Source: src/components/Header.tsx + ThemeContext.tsx in cookbook-tanstack.

const THEMES = [
  { id: "dark",        label: "Dark (blues)" },
  { id: "dark-greens", label: "Dark (greens)" },
  { id: "light-cool",  label: "Light (cool)" },
  { id: "light-warm",  label: "Light (warm)" },
];

function Header({ session, theme, onThemeChange, onNavigate, currentRoute }) {
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [themeOpen, setThemeOpen]   = React.useState(false);
  const [previewId, setPreviewId]   = React.useState(null);
  const [searchValue, setSearchValue] = React.useState("");

  const displayTheme = previewId ?? theme;
  const displayLabel = THEMES.find((t) => t.id === displayTheme)?.label ?? "";

  function selectTheme(id) {
    setPreviewId(id === theme ? null : id);
    document.documentElement.className = id;
  }
  function commitTheme() {
    if (previewId) onThemeChange(previewId);
    setPreviewId(null);
    setThemeOpen(false);
    setDrawerOpen(false);
  }
  function cancelTheme() {
    document.documentElement.className = theme;
    setPreviewId(null);
    setThemeOpen(false);
  }

  function go(route) {
    onNavigate(route);
    setDrawerOpen(false);
  }

  function submitSearch(e) {
    if (e) e.preventDefault();
    onNavigate("recipes", { search: searchValue.trim() || undefined });
  }

  return (
    <>
      <header className="cb-header">
        <button className="cb-icobtn" aria-label="Open menu" onClick={() => setDrawerOpen(true)}>
          <Icon name="Menu" size={22} />
        </button>
        <button className="cb-brand" onClick={() => go("/")}>
          <Icon name="BookSteam" size={28} className="cb-brand-icon" />
          <span className="cb-brand-text">My CookBooks</span>
        </button>

        <form className="cb-search" onSubmit={submitSearch}>
          <Icon name="Search" size={14} className="cb-search-icon" />
          <input
            type="search"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Search recipes…"
          />
          {searchValue.trim() && <span className="cb-search-dot" aria-hidden="true" />}
        </form>

        <div className="cb-header-right">
          {session ? (
            <>
              <button className="cb-user" onClick={() => go("account")}>
                <Icon name="User" size={16} />
                <span className="cb-hide-sm">{session.name}</span>
              </button>
              <button className="cb-link-btn" onClick={() => onNavigate("logout")}>
                <Icon name="LogOut" size={16} />
                <span className="cb-hide-sm">Logout</span>
              </button>
            </>
          ) : (
            <>
              <button className="cb-link-btn" onClick={() => go("login")}>
                <Icon name="LogIn" size={16} />
                <span className="cb-hide-sm">Login</span>
              </button>
              <button className="cb-btn cb-btn--primary cb-btn--sm" onClick={() => go("register")}>
                <Icon name="UserPlus" size={14} />
                <span className="cb-hide-sm">Register</span>
              </button>
            </>
          )}
        </div>
      </header>

      {drawerOpen && (
        <div className="cb-overlay" onClick={() => setDrawerOpen(false)} />
      )}

      <aside className={`cb-drawer ${drawerOpen ? "cb-drawer--open" : ""}`}>
        <div className="cb-drawer-head">
          <div className="cb-brand cb-brand--static">
            <Icon name="BookSteam" size={26} className="cb-brand-icon" />
            <span className="cb-brand-text">My CookBooks</span>
          </div>
          <button className="cb-icobtn" aria-label="Close menu" onClick={() => setDrawerOpen(false)}>
            <Icon name="X" size={22} />
          </button>
        </div>

        <nav className="cb-nav">
          <DrawerItem icon="Home"     label="Home"       active={currentRoute === "/"}        onClick={() => go("/")} />
          <DrawerItem icon="BookOpen" label="Recipes"    active={currentRoute === "recipes"}  onClick={() => go("recipes")} />
          <DrawerItem icon="ChefHat"  label="Categories" active={currentRoute === "categories"} onClick={() => go("categories")} />
          <DrawerItem icon="BookOpen" label="Cookbooks"  active={currentRoute === "cookbooks"} onClick={() => go("cookbooks")} />
          <DrawerItem icon="DollarSign" label="Pricing"  active={currentRoute === "pricing"}    onClick={() => go("pricing")} />
          {session && (
            <DrawerItem icon="Plus"   label="New Recipe" active={currentRoute === "new-recipe"} onClick={() => go("new-recipe")} />
          )}
        </nav>

        <div className="cb-drawer-theme">
          <div className="cb-eyebrow">Theme</div>
          <button className="cb-theme-trigger" onClick={() => setThemeOpen((v) => !v)} aria-expanded={themeOpen}>
            <span>{displayLabel}</span>
            <Icon name="ChevronDown" size={14} style={{ transform: themeOpen ? "rotate(180deg)" : "none", transition: "transform .15s" }} />
          </button>
          {themeOpen && (
            <div className="cb-theme-list" role="listbox">
              {THEMES.map((t) => {
                const selected = t.id === (previewId ?? theme);
                return (
                  <div
                    key={t.id}
                    role="option"
                    aria-selected={selected}
                    onClick={() => selectTheme(t.id)}
                    className={`cb-theme-opt ${selected ? "cb-theme-opt--selected" : ""}`}
                  >
                    <span className="cb-theme-swatch" data-theme={t.id} />
                    {t.label}
                  </div>
                );
              })}
            </div>
          )}
          {previewId && previewId !== theme && (
            <div className="cb-theme-actions">
              <button className="cb-btn cb-btn--primary cb-btn--sm" onClick={commitTheme}>OK</button>
              <button className="cb-btn cb-btn--subtle cb-btn--sm" onClick={cancelTheme}>Cancel</button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

function DrawerItem({ icon, label, active, onClick }) {
  return (
    <button className={`cb-nav-item ${active ? "cb-nav-item--active" : ""}`} onClick={onClick}>
      <Icon name={icon} size={20} />
      <span>{label}</span>
    </button>
  );
}

window.Header = Header;
window.THEMES = THEMES;
