import Stripe from "stripe";

let _stripe: Stripe | undefined;

export function getStripe(): Stripe {
  if (_stripe) {
    return _stripe;
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    throw new Error(
      "STRIPE_SECRET_KEY env var not set. Set it in .env.local (server-side only). See https://dashboard.stripe.com/test/apikeys",
    );
  }

  _stripe = new Stripe(secretKey, {
    apiVersion: "2026-04-22.dahlia",
  });

  return _stripe;
}