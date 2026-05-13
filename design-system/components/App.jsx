// App — click-thru prototype of the cookbook web app.
// Routes (string keys, not real URLs):
//   "/"           anonymous marketing home (with hero)
//   "home"        logged-in dashboard
//   "recipes"     recipe grid with sidebar filters
//   "recipe"      recipe detail
//   "cookbooks"   cookbook grid
//   "categories"  classification grid
//   "pricing"     tier cards
//   "login" / "register" / "logout"  auth stubs

// ─────────────────────────── Demo data ───────────────────────────
const RECIPES = [
  {
    id: "1", name: "Roasted Tomato Soup",
    classificationName: "Italian",
    notes: "Slow-roasted Romas with garlic and a splash of cream. Comforting and bright.",
    prepTime: 15, cookTime: 35, difficulty: "easy", servings: 4,
    sourceName: "Ottolenghi · Plenty More", sourceUrl: "#",
    ingredients: "2 lb Roma tomatoes\n1 large yellow onion, sliced\n6 cloves garlic\n3 tbsp olive oil\n4 sprigs fresh thyme\n\n2 cups vegetable stock\n1/2 cup heavy cream\nSalt and pepper to taste\nFresh basil for garnish",
    instructions: "Preheat oven to 400°F.\nHalve the tomatoes, scatter with onion and garlic on a sheet pan, drizzle with olive oil, season generously.\nRoast for 35 minutes until edges blister.\n\nTransfer everything to a blender with the stock. Blend until smooth.\nReturn to a pot, stir in the cream, warm gently.\nLadle into bowls, top with torn basil.",
    badges: { meal: ["Lunch", "Dinner"], course: ["Main"], preparation: ["Roasted"] },
    gradient: "linear-gradient(135deg, #ea580c, #b91c1c)",
    marked: true, isOwner: true,
  },
  {
    id: "2", name: "Herbed Spring Risotto",
    classificationName: "Vegetarian",
    notes: "Peas, mint, parsley, and lemon zest. Best with a glass of crisp white.",
    prepTime: 10, cookTime: 25, difficulty: "medium", servings: 4,
    badges: { meal: ["Dinner"], course: ["Main"] },
    gradient: "linear-gradient(135deg, #166534, #064e3b)",
    marked: false, isOwner: true,
  },
  {
    id: "3", name: "Brown Butter Banana Bread",
    classificationName: "American",
    notes: "Nuttier and richer than the standard. Worth dirtying the extra pan.",
    prepTime: 15, cookTime: 60, difficulty: "easy",
    badges: { meal: ["Breakfast", "Snack"], course: ["Dessert"] },
    gradient: "linear-gradient(135deg, #92400e, #451a03)",
    marked: true,
  },
  {
    id: "4", name: "Sheet Pan Harissa Chicken",
    classificationName: "Moroccan",
    notes: "Crispy-skinned thighs with charred broccolini and lemon.",
    prepTime: 10, cookTime: 35, difficulty: "easy",
    badges: { meal: ["Dinner"], course: ["Main"] },
    gradient: "linear-gradient(135deg, #b45309, #78350f)",
    marked: false,
  },
  {
    id: "5", name: "Miso Caramel Cookies",
    classificationName: "Japanese",
    notes: "Salty-sweet, with crackly tops and chewy middles.",
    prepTime: 20, cookTime: 12, difficulty: "medium",
    badges: { course: ["Dessert"], preparation: ["Baked"] },
    gradient: "linear-gradient(135deg, #facc15, #78350f)",
    marked: false,
  },
  {
    id: "6", name: "Lemony White Bean Salad",
    classificationName: "Mediterranean",
    notes: "Cannellinis, shallot, parsley, a brave amount of olive oil.",
    prepTime: 10, cookTime: 0, difficulty: "easy",
    badges: { meal: ["Lunch"], course: ["Side", "Main"], preparation: ["No-cook"] },
    gradient: "linear-gradient(135deg, #84cc16, #365314)",
    marked: false,
  },
];

const COOKBOOKS = [
  { id: "wd", name: "Weeknight Dinners", description: "Quick meals under 30 minutes for busy weekdays.",
    isPublic: true, recipeCount: 24, chapterCount: 4, isOwner: true,
    gradient: "linear-gradient(135deg, #92400e, #3f1818)" },
  { id: "sb", name: "Sunday Brunch", description: "Pancakes, frittatas, and slow-cooked things for the weekend.",
    isPublic: false, recipeCount: 12, isOwner: true,
    gradient: "linear-gradient(135deg, #1e3a8a, #042f2e)" },
  { id: "fh", name: "Family Heirlooms", description: "Recipes handed down from grandma's stained index cards.",
    isPublic: false, recipeCount: 3, isOwner: true,
    gradient: "linear-gradient(135deg, #7f1d1d, #1c1917)" },
  { id: "vg", name: "Vegetarian Mains", description: "Hearty plant-forward dinners that don't feel like compromise.",
    isPublic: true, recipeCount: 31, chapterCount: 5,
    gradient: "linear-gradient(135deg, #166534, #064e3b)" },
];

const CATEGORIES = [
  { id: "italian",     name: "Italian",       count: 42 },
  { id: "mexican",     name: "Mexican",       count: 28 },
  { id: "japanese",    name: "Japanese",      count: 19 },
  { id: "american",    name: "American",      count: 67 },
  { id: "med",         name: "Mediterranean", count: 33 },
  { id: "moroccan",    name: "Moroccan",      count: 12 },
  { id: "vegetarian",  name: "Vegetarian",    count: 88 },
  { id: "indian",      name: "Indian",        count: 24 },
];

const TIERS = [
  { id: "home-cook",      displayName: "Home Cook",      description: "Just getting started.", annual: null, monthly: null,
    recipes: 25, cookbooks: 2, canPrivate: false, canImport: false, showsAds: true },
  { id: "prep-cook",      displayName: "Prep Cook",      description: "For regular cooks.", annual: 24, monthly: 2.5,
    recipes: 100, cookbooks: 10, canPrivate: true, canImport: false, showsAds: false },
  { id: "sous-chef",      displayName: "Sous Chef",      description: "Building a real library.", annual: 48, monthly: 5,
    recipes: 500, cookbooks: 25, canPrivate: true, canImport: true, showsAds: false },
  { id: "executive-chef", displayName: "Executive Chef", description: "Power users & collectors.", annual: 96, monthly: 10,
    recipes: "Unlimited", cookbooks: "Unlimited", canPrivate: true, canImport: true, showsAds: false },
];

// ─────────────────────────── App ───────────────────────────
function App() {
  const [theme, setTheme] = React.useState(() => {
    try { return localStorage.getItem("cookbook-theme") || "dark"; } catch { return "dark"; }
  });
  React.useEffect(() => {
    document.documentElement.className = theme;
    try { localStorage.setItem("cookbook-theme", theme); } catch {}
  }, [theme]);

  const [session, setSession] = React.useState(null);          // null | { name }
  const [route, setRoute]     = React.useState("/");
  const [routeParams, setRouteParams] = React.useState({});

  function navigate(to, params = {}) {
    if (to === "login")    { setSession({ name: "doug" }); setRoute("home"); return; }
    if (to === "register") { setSession({ name: "doug" }); setRoute("home"); return; }
    if (to === "logout")   { setSession(null); setRoute("/"); return; }
    if (to === "new-recipe") { setRoute("new-recipe"); return; }
    setRoute(to);
    setRouteParams(params);
    window.scrollTo({ top: 0, behavior: "instant" });
  }

  return (
    <>
      <Header
        session={session}
        theme={theme}
        onThemeChange={setTheme}
        onNavigate={navigate}
        currentRoute={route}
      />
      {route === "/"          && <PublicHome  onNavigate={navigate} />}
      {route === "home"       && <AuthedHome  session={session} onNavigate={navigate} />}
      {route === "recipes"    && <RecipesList onNavigate={navigate} initialSearch={routeParams.search} />}
      {route === "recipe"     && <RecipeDetailPage recipe={routeParams.recipe} onNavigate={navigate} />}
      {route === "cookbooks"  && <CookbooksList onNavigate={navigate} />}
      {route === "categories" && <CategoriesList onNavigate={navigate} />}
      {route === "pricing"    && <PricingPage session={session} onNavigate={navigate} />}
      {route === "new-recipe" && <NewRecipePage onNavigate={navigate} />}
    </>
  );
}

// ─────────── Pages ───────────
function PublicHome({ onNavigate }) {
  return (
    <PageLayout>
      <section className="cb-hero">
        <div className="cb-hero-row">
          <Icon name="BookSteam" size={96} className="cb-brand-icon" />
          <div>
            <div className="cb-wordmark">My CookBooks</div>
            <p className="cb-hero-sub">Your Personal Recipe Management System</p>
          </div>
        </div>
        <p className="cb-hero-desc">Discover, create, and organize your favorite recipes.</p>
        <div className="cb-hero-ctas">
          <button className="cb-btn cb-btn--primary cb-btn--lg" onClick={() => onNavigate("recipes")}>Browse Recipes</button>
          <button className="cb-btn cb-btn--outline cb-btn--lg" onClick={() => onNavigate("pricing")}>View Plans and Pricing</button>
        </div>
      </section>

      <h2 className="cb-section-title" style={{ textAlign: "center", marginTop: 32 }}>Features</h2>
      <div className="cb-features">
        <FeatureCard icon="BookOpen" title="Recipe Collection"
          desc="Browse and manage your favorite recipes. Organize by category, difficulty, and cooking time."
          onClick={() => onNavigate("recipes")} />
        <FeatureCard icon="ChefHat" title="Categories"
          desc="Explore recipes by category. From appetizers to desserts, find exactly what you need."
          onClick={() => onNavigate("categories")} />
        <FeatureCard icon="Search" title="Search & Filter"
          desc="Find recipes quickly with advanced search and filtering options by ingredients, time, and more."
          onClick={() => onNavigate("recipes")} />
      </div>
    </PageLayout>
  );
}

function FeatureCard({ icon, title, desc, onClick }) {
  return (
    <button className="cb-feature" onClick={onClick}>
      <Icon name={icon} size={48} className="cb-feature-icon" />
      <h3 className="cb-feature-title">{title}</h3>
      <p className="cb-feature-desc">{desc}</p>
    </button>
  );
}

function AuthedHome({ session, onNavigate }) {
  return (
    <PageLayout title="Welcome Home" description={`Hi ${session?.name || ""}, what are you cooking today?`}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>
        <section>
          <h2 className="cb-section-title">Quick Actions</h2>
          <div style={{ display: "grid", gap: 12 }}>
            <ShortcutRow icon="Plus" title="Create Recipe" desc="Add a new recipe to your collection" onClick={() => onNavigate("new-recipe")} />
            <ShortcutRow icon="FileUp" title="Import Recipe" desc="Import from a URL" onClick={() => onNavigate("new-recipe")} />
          </div>
        </section>
        <section>
          <h2 className="cb-section-title">Discovery</h2>
          <div style={{ display: "grid", gap: 12 }}>
            <ShortcutRow icon="BookOpen" title="All Recipes"  onClick={() => onNavigate("recipes")} />
            <ShortcutRow icon="Layers"   title="Cookbooks"    onClick={() => onNavigate("cookbooks")} />
            <ShortcutRow icon="ChefHat"  title="Categories"   onClick={() => onNavigate("categories")} />
          </div>
        </section>
      </div>
    </PageLayout>
  );
}

function ShortcutRow({ icon, title, desc, onClick }) {
  return (
    <button className="cb-feature" style={{ display: "flex", alignItems: "flex-start", gap: 14, textAlign: "left", padding: 16 }} onClick={onClick}>
      <span style={{ padding: 8, background: "color-mix(in srgb, var(--theme-accent) 12%, transparent)", color: "var(--theme-accent)", borderRadius: 8, lineHeight: 0 }}>
        <Icon name={icon} size={20} />
      </span>
      <span>
        <h3 className="cb-feature-title" style={{ marginBottom: 2 }}>{title}</h3>
        {desc && <p className="cb-feature-desc">{desc}</p>}
      </span>
    </button>
  );
}

function RecipesList({ onNavigate, initialSearch }) {
  const [filters, setFilters] = React.useState({ search: initialSearch || "" });
  const filtered = React.useMemo(() => {
    return RECIPES.filter((r) => {
      if (filters.search) {
        const q = filters.search.toLowerCase();
        if (!r.name.toLowerCase().includes(q) && !(r.notes || "").toLowerCase().includes(q)) return false;
      }
      if (filters.difficulty && r.difficulty !== filters.difficulty) return false;
      if (filters.maxPrepTime && (r.prepTime || 0) > filters.maxPrepTime) return false;
      if (filters.maxCookTime && (r.cookTime || 0) > filters.maxCookTime) return false;
      return true;
    });
  }, [filters]);

  return (
    <PageLayout title="Recipes" description={`${filtered.length} of ${RECIPES.length} recipes`} wide>
      <div className="cb-list-page">
        <SearchFilter filters={filters} onChange={setFilters} />
        <div>
          {filtered.length === 0 ? (
            <p style={{ color: "var(--theme-fg-subtle)" }}>No recipes match your filters.</p>
          ) : (
            <div className="cb-grid-recipes">
              {filtered.map((r) => (
                <RecipeCard
                  key={r.id} recipe={r}
                  marked={r.marked} isOwner={r.isOwner}
                  onOpen={(rec) => onNavigate("recipe", { recipe: rec })}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}

function RecipeDetailPage({ recipe, onNavigate }) {
  recipe = recipe || RECIPES[0];
  const [servings, setServings] = React.useState(recipe.servings || 4);

  const ingredientLines = (recipe.ingredients || "").split("\n");
  const instructionLines = (recipe.instructions || "").split("\n");
  let stepNum = 0;

  return (
    <PageLayout>
      <Breadcrumb
        onNavigate={onNavigate}
        items={[{ label: "Recipes", to: "recipes" }, { label: recipe.name }]}
      />
      <div className="cb-detail-shell">
        <div className="cb-detail-hero" style={{ background: recipe.gradient }} />
        <div className="cb-detail-body">
          <h1 className="cb-detail-title">{recipe.name}</h1>
          {recipe.sourceName && (
            <p className="cb-detail-source">
              Source: <a href={recipe.sourceUrl || "#"} onClick={(e) => e.preventDefault()}>{recipe.sourceName}</a>
            </p>
          )}

          <div className="cb-detail-badges">
            {recipe.classificationName && <ClassificationBadge name={recipe.classificationName} />}
            {(recipe.badges?.meal || []).map((m) => <TaxonomyBadge key={"m-"+m} name={m} variant="meal" />)}
            {(recipe.badges?.course || []).map((c) => <TaxonomyBadge key={"c-"+c} name={c} variant="course" />)}
            {(recipe.badges?.preparation || []).map((p) => <TaxonomyBadge key={"p-"+p} name={p} variant="preparation" />)}
          </div>

          <div className="cb-meta-grid">
            <div>
              <p className="cb-meta-label">Prep Time</p>
              <p className="cb-meta-value">{recipe.prepTime ? `${recipe.prepTime} min` : "N/A"}</p>
            </div>
            <div>
              <p className="cb-meta-label">Cook Time</p>
              <p className="cb-meta-value">{recipe.cookTime ? `${recipe.cookTime} min` : "N/A"}</p>
            </div>
            <div>
              <p className="cb-meta-label">Servings</p>
              <div className="cb-meta-value" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button className="cb-btn cb-btn--subtle cb-btn--sm" style={{ padding: "2px 8px" }}
                  onClick={() => setServings((s) => Math.max(1, s - 1))} aria-label="Decrease servings">−</button>
                <span>{servings}</span>
                <button className="cb-btn cb-btn--subtle cb-btn--sm" style={{ padding: "2px 8px" }}
                  onClick={() => setServings((s) => s + 1)} aria-label="Increase servings">+</button>
              </div>
            </div>
            <div>
              <p className="cb-meta-label">Difficulty</p>
              <p className="cb-meta-value capitalize">{recipe.difficulty || "N/A"}</p>
            </div>
          </div>

          <section className="cb-section">
            <h2 className="cb-section-title">Ingredients</h2>
            {ingredientLines.length > 0 ? (
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {ingredientLines.map((line, i) =>
                  line.trim() === "" ? (
                    <li key={i} style={{ height: 8 }} aria-hidden="true" />
                  ) : (
                    <li key={i} className="cb-ingredient">{line}</li>
                  )
                )}
              </ul>
            ) : <p style={{ color: "var(--theme-fg-subtle)" }}>No ingredients listed</p>}
          </section>

          <section className="cb-section">
            <h2 className="cb-section-title">Instructions</h2>
            {instructionLines.length > 0 ? (
              <ol style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {instructionLines.map((line, i) => {
                  if (line.trim() === "") return <li key={i} style={{ height: 8 }} aria-hidden="true" />;
                  stepNum++;
                  return (
                    <li key={i} className="cb-step">
                      <span className="cb-step-num">{stepNum}</span>
                      <p className="cb-step-text">{line}</p>
                    </li>
                  );
                })}
              </ol>
            ) : <p style={{ color: "var(--theme-fg-subtle)" }}>No instructions provided</p>}
          </section>
        </div>
      </div>
    </PageLayout>
  );
}

function CookbooksList({ onNavigate }) {
  return (
    <PageLayout title="Cookbooks" description="Your collections and saved cookbooks.">
      <div className="cb-grid-cookbooks">
        {COOKBOOKS.map((c) => (
          <CookbookCard key={c.id} cookbook={c} isOwner={c.isOwner} onOpen={() => onNavigate("recipes")} />
        ))}
      </div>
    </PageLayout>
  );
}

function CategoriesList({ onNavigate }) {
  return (
    <PageLayout title="Categories" description="Browse recipes by classification.">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        {CATEGORIES.map((cat) => (
          <button key={cat.id} className="cb-feature" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px" }}
            onClick={() => onNavigate("recipes")}>
            <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Icon name="Tag" size={16} className="cb-accent" />
              <span style={{ fontWeight: 500 }}>{cat.name}</span>
            </span>
            <span style={{ fontSize: 13, color: "var(--theme-fg-subtle)" }}>{cat.count}</span>
          </button>
        ))}
      </div>
    </PageLayout>
  );
}

function PricingPage({ session, onNavigate }) {
  const currentTier = session ? "home-cook" : null;
  return (
    <PageLayout title="Pricing" description="Compare plans and find the right fit." wide>
      <div className="cb-grid-tiers">
        {TIERS.map((t) => <TierCard key={t.id} tier={t} current={t.id === currentTier} />)}
      </div>
      {!session && (
        <div style={{ marginTop: 32, textAlign: "center" }}>
          <button className="cb-btn cb-btn--primary cb-btn--lg" onClick={() => onNavigate("register")}>
            Get Started for Free
          </button>
        </div>
      )}
    </PageLayout>
  );
}

function NewRecipePage({ onNavigate }) {
  const [name, setName] = React.useState("");
  const [source, setSource] = React.useState("");
  const [prep, setPrep] = React.useState("");
  return (
    <PageLayout title="New Recipe" description="Add a recipe to your collection.">
      <Breadcrumb onNavigate={onNavigate}
        items={[{ label: "Recipes", to: "recipes" }, { label: "New Recipe" }]} />
      <div className="cb-filter-panel" style={{ maxWidth: 640 }}>
        <FormInput id="name" label="Recipe Name" required value={name} onChange={setName} placeholder="e.g. Roasted Tomato Soup" />
        <FormInput id="source" label="Source URL" type="url" value={source} onChange={setSource} placeholder="https://…" />
        <FormInput id="prep" label="Prep Time (minutes)" type="number" value={prep} onChange={setPrep} placeholder="15" />
        <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
          <button className="cb-btn cb-btn--primary" onClick={() => onNavigate("recipes")}>Save</button>
          <button className="cb-btn cb-btn--subtle" onClick={() => onNavigate("recipes")}>Cancel</button>
        </div>
      </div>
    </PageLayout>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
