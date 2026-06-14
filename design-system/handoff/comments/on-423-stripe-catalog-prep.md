# Comment to add on #423 — preparation guide for Stripe Product Catalog

> **How to use this**: open https://github.com/dougis-org/cookbook-tanstack/issues/423,
> click "Comment", paste this block, post.

---

This comment outlines the exact manual (human) steps required to configure the Stripe Product Catalog for the application in both test and production modes, along with the codebase references showing where these catalog configurations are stored.

## Codebase Locations for Catalog Configuration

1. **Entitlements and Pricing Definitions:**
   - [src/lib/tier-entitlements.ts](file:///home/doug/dev/cookbook-tanstack/src/lib/tier-entitlements.ts#L80-L86) — Defines `TIER_PRICING` (names and annual/monthly price values):
     * **Prep Cook**: $2.99 / month, $27.99 / year
     * **Sous Chef**: $5.99 / month, $59.99 / year
     * **Executive Chef**: $9.99 / month, $99.99 / year
   - [docs/user-tier-feature-sets.md](file:///home/doug/dev/cookbook-tanstack/docs/user-tier-feature-sets.md) — The master documentation of features and limits per tier.

2. **Environment Variable Configuration:**
   - [.env.example](file:///home/doug/dev/cookbook-tanstack/.env.example#L39-L45) — Defines the Stripe Price ID variables that must be populated in local `.env.local` or server deployment environments:
     * `STRIPE_PRICE_PREP_COOK_MONTHLY`
     * `STRIPE_PRICE_PREP_COOK_ANNUAL`
     * `STRIPE_PRICE_SOUS_CHEF_MONTHLY`
     * `STRIPE_PRICE_SOUS_CHEF_ANNUAL`
     * `STRIPE_PRICE_EXEC_CHEF_MONTHLY`
     * `STRIPE_PRICE_EXEC_CHEF_ANNUAL`

---

## Human Steps to Prepare the Stripe Product Catalog

To wire payments into the application, a administrator/developer must manually set up the products in the Stripe Dashboard (or via Stripe CLI) and retrieve the price IDs. Follow these steps:

### Step 1: Access the Stripe Dashboard
1. Log in to the [Stripe Dashboard](https://dashboard.stripe.com).
2. Toggle **Test Mode** in the top-right header (highly recommended for local development and testing). For production, toggle Test Mode off.

### Step 2: Create the Products and Prices
For each of the three paid tiers, perform the following steps to create the products and associate the monthly and annual prices:

#### 1. Create **Prep Cook** Product
1. Navigate to **Product Catalog** -> **Products** and click **+ Add product**.
2. **Name**: `Prep Cook`
3. **Description**: `Grow your library with up to 100 recipes and 10 cookbooks (Ad-free).`
4. Under **Price information**:
   - **Pricing model**: Standard pricing
   - **Price**: `2.99` USD
   - **Billing period**: Monthly
   - Click **Add another price** to define the annual option.
   - **Price**: `27.99` USD
   - **Billing period**: Yearly
5. Click **Save product** in the top-right.

#### 2. Create **Sous Chef** Product
1. Click **+ Add product**.
2. **Name**: `Sous Chef`
3. **Description**: `Unlock private recipes and room for 500 recipes and 25 cookbooks (Ad-free).`
4. Under **Price information**:
   - **Pricing model**: Standard pricing
   - **Price**: `5.99` USD
   - **Billing period**: Monthly
   - Click **Add another price**.
   - **Price**: `59.99` USD
   - **Billing period**: Yearly
5. Click **Save product**.

#### 3. Create **Executive Chef** Product
1. Click **+ Add product**.
2. **Name**: `Executive Chef`
3. **Description**: `The full My CookBooks experience — 2500 recipes, 200 cookbooks, and every feature (Ad-free).`
4. Under **Price information**:
   - **Pricing model**: Standard pricing
   - **Price**: `9.99` USD
   - **Billing period**: Monthly
   - Click **Add another price**.
   - **Price**: `99.99` USD
   - **Billing period**: Yearly
5. Click **Save product**.

### Step 3: Copy Price IDs and Configure the Environment
Once all products and prices have been created:
1. Navigate to each product you just created in the dashboard.
2. Locate the **API ID** for each price (e.g., `price_1O...`).
3. Add these IDs to your `.env.local` (local) or your deployment environment variables (production) matching the respective keys:
   ```env
   STRIPE_PRICE_PREP_COOK_MONTHLY=price_xxxxxx...
   STRIPE_PRICE_PREP_COOK_ANNUAL=price_xxxxxx...
   STRIPE_PRICE_SOUS_CHEF_MONTHLY=price_xxxxxx...
   STRIPE_PRICE_SOUS_CHEF_ANNUAL=price_xxxxxx...
   STRIPE_PRICE_EXEC_CHEF_MONTHLY=price_xxxxxx...
   STRIPE_PRICE_EXEC_CHEF_ANNUAL=price_xxxxxx...
   ```
4. Additionally, verify that `STRIPE_SECRET_KEY` and `VITE_STRIPE_PUBLISHABLE_KEY` are retrieved from the **Developers -> API keys** tab and added to the environment configurations.
