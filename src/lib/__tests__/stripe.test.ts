import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { getStripe } from "@/lib/stripe";

describe("Stripe singleton", () => {
  const originalEnv = process.env.STRIPE_SECRET_KEY;

  beforeEach(() => {
    delete (global as any)._stripe;
    delete process.env.STRIPE_SECRET_KEY;
  });

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.STRIPE_SECRET_KEY = originalEnv;
    }
  });

  it("should throw an error with clear message if STRIPE_SECRET_KEY is missing", () => {
    expect(() => getStripe()).toThrow("STRIPE_SECRET_KEY env var not set.");
  });

  it("should return a Stripe client when STRIPE_SECRET_KEY is set", () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_valid_key_here";

    const client = getStripe();

    expect(client).toBeDefined();
  });

  it("should return the same instance on subsequent calls", () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_valid_key_here";

    const client1 = getStripe();
    const client2 = getStripe();

    expect(client1).toBe(client2);
  });
});