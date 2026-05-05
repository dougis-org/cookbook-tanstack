import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { vi } from "vitest";
import Stripe from "stripe";

describe("Stripe singleton", () => {
  const originalEnv = process.env.STRIPE_SECRET_KEY;

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.STRIPE_SECRET_KEY = originalEnv;
    }
  });

  it("should throw an error with clear message if STRIPE_SECRET_KEY is missing", async () => {
    const { getStripe } = await import("@/lib/stripe");

    expect(() => getStripe()).toThrow("STRIPE_SECRET_KEY env var not set.");
  });

  it("should return a Stripe client when STRIPE_SECRET_KEY is set", async () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_valid_key_here";
    const { getStripe } = await import("@/lib/stripe");

    const client = getStripe();

    expect(client).toBeDefined();
    expect(client).toBeInstanceOf(Stripe);
  });

  it("should return the same instance on subsequent calls", async () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_valid_key_here";
    const { getStripe } = await import("@/lib/stripe");

    const client1 = getStripe();
    const client2 = getStripe();

    expect(client1).toBe(client2);
  });
});