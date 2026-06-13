# Stripe Product & Price Catalog

This document defines the Stripe Product and Price structure for **My CookBooks**. It acts as the reference for Stripe configuration in both the Test Sandbox and Live production environments.

> [!NOTE]
> The **Home Cook** tier is a free, entry-level tier. It does not require a Stripe Product or Price object.

---

## Catalog Overview

```
                      My CookBooks Stripe Catalog Schema
                      ══════════════════════════════════
                      
      [Home Cook] ──▶ Free Tier (No Stripe configuration required)
      
      [Prep Cook] ──▶ Product: "Prep Cook"
                      ├── Monthly: $2.99/mo (lookup_key: prep_cook_monthly)
                      └── Annual:  $27.99/yr (lookup_key: prep_cook_annual)
                      
      [Sous Chef] ──▶ Product: "Sous Chef"
                      ├── Monthly: $5.99/mo (lookup_key: sous_chef_monthly)
                      └── Annual:  $59.99/yr (lookup_key: sous_chef_annual)
                      
      [Exec Chef] ──▶ Product: "Executive Chef"
                      ├── Monthly: $9.99/mo (lookup_key: executive_chef_monthly)
                      └── Annual:  $99.99/yr (lookup_key: executive_chef_annual)
```

---

## Products, Prices, and Environment Variables

| Tier | Billing Period | Price | Interval | Price Lookup Key | Environment Variable |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Prep Cook** | Monthly | `$2.99` | `month` | `prep_cook_monthly` | `STRIPE_PRICE_PREP_COOK_MONTHLY` |
| **Prep Cook** | Annual | `$27.99` | `year` | `prep_cook_annual` | `STRIPE_PRICE_PREP_COOK_ANNUAL` |
| **Sous Chef** | Monthly | `$5.99` | `month` | `sous_chef_monthly` | `STRIPE_PRICE_SOUS_CHEF_MONTHLY` |
| **Sous Chef** | Annual | `$59.99` | `year` | `sous_chef_annual` | `STRIPE_PRICE_SOUS_CHEF_ANNUAL` |
| **Executive Chef** | Monthly | `$9.99` | `month` | `executive_chef_monthly` | `STRIPE_PRICE_EXEC_CHEF_MONTHLY` |
| **Executive Chef** | Annual | `$99.99` | `year` | `executive_chef_annual` | `STRIPE_PRICE_EXEC_CHEF_ANNUAL` |

---

## Stripe Configuration Standards

### 1. Pricing Structure & Billing Models
- **Interval Counts**: Annual plans must be configured with `interval: year` and `interval_count: 1`. Do **not** use `interval: month` with `interval_count: 12`. While they appear similar, they use completely different billing engines under the hood and will cause misalignment with Stripe's Customer Portal upgrades and downgrades.
- **Lookup Keys**: Every price must have its exact `lookup_key` set as listed above. This allows the application to dynamically resolve Stripe Prices at runtime rather than relying strictly on hardcoded environment variable IDs, which simplifies multi-environment management.

### 2. Environment Variables Mapping
For local development, copy these price IDs into your `.env.local` file:
```bash
STRIPE_PRICE_PREP_COOK_MONTHLY=price_xxxxxx
STRIPE_PRICE_PREP_COOK_ANNUAL=price_yyyyyy
STRIPE_PRICE_SOUS_CHEF_MONTHLY=price_zzzzzz
STRIPE_PRICE_SOUS_CHEF_ANNUAL=price_aaaaaa
STRIPE_PRICE_EXEC_CHEF_MONTHLY=price_bbbbbb
STRIPE_PRICE_EXEC_CHEF_ANNUAL=price_cccccc
```

### 3. Customer Portal Configuration
To allow users to self-manage their tier changes, the Stripe Customer Portal must be enabled in the dashboard with the following features active:
- **Allow switching plans**: Wire all 6 prices together in the Portal configuration so customers can upgrade or downgrade between tiers.
- **Proration behavior**: Enable "Prorate charges" so upgrades credit the remaining time of the active billing period.
- **Allow cancellation**: Enable self-service cancellation, with the option to cancel at the end of the billing period (recommended).

### 4. Webhook Subscriptions
Webhooks should be registered to point to `/api/webhooks/stripe`. The backend requires the following event subscriptions:
- `checkout.session.completed` — Handles initial tier purchases.
- `customer.subscription.updated` — Handles upgrades, downgrades, and billing renewals.
- `customer.subscription.deleted` — Handles cancellations (reverts user to `home-cook` tier).
