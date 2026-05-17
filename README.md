# My CookBooks - Recipe Management Application

A TanStack Start migration of the Laravel recipe application. This is a full-stack recipe management system called My CookBooks,
built with TanStack Start, React, and Tailwind CSS.

## Project Structure

This application includes the following pages and features:

- **Home Page**: Landing page with feature overview
- **Recipes**: Browse, view, create, and edit recipes
- **Categories**: Explore recipes by category
- **Recipe Details**: View detailed recipe information including ingredients and instructions
- **Recipe Forms**: Create and edit recipes with a comprehensive form

## Getting Started

To run this application:

```bash
npm install
npm run dev
```

The application will be available at `http://localhost:3000`

## Environment Configuration

Copy `.env.example` to `.env.local` and provide the required local secrets before running database-backed or
upload flows.

Recipe image uploads and pending-upload deletion require an ImageKit private/API key. Use
`IMAGE_KIT_API_KEY`, or `IMAGEKIT_PRIVATE_KEY` if you prefer the SDK-native env name:

```bash
IMAGE_KIT_API_KEY=
# IMAGEKIT_PRIVATE_KEY=
```

ImageKit private keys are server-side only and must never be exposed in client code.

### Stripe Setup (Billing)

Stripe billing is integrated at the subscription tier level. To configure locally:

1. Create a Stripe account at https://stripe.com and use Test mode keys
2. Add your test `STRIPE_SECRET_KEY` and `VITE_STRIPE_PUBLISHABLE_KEY` to `.env.local`
3. Install the [Stripe CLI](https://stripe.com/docs/stripe-cli) and run:
   ```bash
   stripe listen --print-secret
   ```
   Copy the printed webhook signing secret to `STRIPE_WEBHOOK_SECRET` in `.env.local`
   (The webhook forwarding endpoint `/api/webhooks/stripe` will be added in a future PR)
4. Create price objects in your Stripe dashboard and add their IDs to `.env.local` (see `.env.example` for all six tier price IDs)

`STRIPE_SECRET_KEY` is server-side only and must never be exposed to the client.

Google AdSense is wired into the shared page layout for public marketing/content pages only. The client library is
not loaded for paid tiers (`prep-cook`, `sous-chef`, `executive-chef`), admins, or non-ad page roles.

To finish production AdSense setup:

1. Keep the checked-in `public/ads.txt` file deployed at `/ads.txt`.
2. Use the built-in `google-adsense-account` meta tag for `ca-pub-3814997299935267`.
3. Create your top/bottom display ad units in Google AdSense and add their numeric slot IDs to `.env.local` or
   your production environment:

```bash
VITE_GOOGLE_ADSENSE_TOP_SLOT_ID=
VITE_GOOGLE_ADSENSE_BOTTOM_SLOT_ID=
```

AdSense slots render only in production builds so local development stays free of third-party ad requests.

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for:

- Quick start guide
- Development workflow
- Repository standards and conventions

For comprehensive guidelines on code quality, testing, analysis, and CI/CD, see
[docs/standards/](./docs/standards/).

## Building For Production

To build this application for production:

```bash
npm run build
```

## Testing

This project uses [Vitest](https://vitest.dev/) for testing. You can run the tests with:

```bash
npm run test
```

## Project Status

This application is a full-stack recipe management system featuring:

- **Backend API**: Integrated tRPC API layer for type-safe data fetching and mutations.
- **Database**: MongoDB integration with Mongoose for robust data modeling and persistence.
- **Authentication**: Secure user authentication powered by Better Auth.
- **Recipe Management**: Full CRUD operations for recipes, cookbooks, and related metadata (categories, sources, etc.).

## Tech Stack

- **TanStack Start**: Full-stack React framework
- **TanStack Router**: Type-safe routing
- **React 19**: UI library
- **Tailwind CSS**: Utility-first CSS framework
- **tRPC**: End-to-end type-safe API
- **Better Auth**: Authentication framework
- **MongoDB & Mongoose**: Database and ODM
- **TypeScript**: Type safety
- **Vite**: Build tool
- **Nitro**: Server deployment

## Learn More

- [TanStack Start Documentation](https://tanstack.com/start)
- [TanStack Router Documentation](https://tanstack.com/router)
- [Tailwind CSS Documentation](https://tailwindcss.com)
