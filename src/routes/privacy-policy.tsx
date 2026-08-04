import { createFileRoute } from "@tanstack/react-router"
import PageLayout from "@/components/layout/PageLayout"
import Accordion from "@/components/ui/Accordion"
import type { AccordionItem } from "@/components/ui/Accordion"

export const Route = createFileRoute("/privacy-policy")({
  component: PrivacyPolicyPage,
})

const LAST_UPDATED = "Last updated: July 17, 2026"
const PRIVACY_CONTACT_EMAIL = "privacy@mycookbooks.com"

const SECTIONS: AccordionItem[] = [
  {
    id: "your-account",
    title: "Your Account",
    content: (
      <div className="space-y-3">
        <p>
          When you create a My CookBooks account, we collect your email
          address, username, and (if you provide one) a display name. Your
          password is never stored in plain text — it's hashed before it
          touches our database, and we can't recover it if you forget it.
        </p>
        <p>
          We use sessions to keep you signed in across visits. You can end
          any session at any time by logging out, and email verification
          links are used to confirm the address you registered with.
        </p>
      </div>
    ),
  },
  {
    id: "your-recipes-cookbooks",
    title: "Your Recipes & Cookbooks",
    content: (
      <div className="space-y-3">
        <p>
          Recipes and cookbooks you create belong to you. Each recipe stores
          the content you enter — ingredients, steps, notes — along with any
          meal, course, or preparation tags you apply and, if you choose to
          upload one, a photo.
        </p>
        <p>
          You control whether a recipe is public or private (subject to your
          plan's limits), and you can edit or delete your recipes and
          cookbooks at any time.
        </p>
      </div>
    ),
  },
  {
    id: "billing",
    title: "Billing",
    content: (
      <div className="space-y-3">
        <p>
          Paid plans are billed through Stripe. Your card number never
          touches our servers — Stripe collects and stores payment details
          directly. We store your Stripe customer ID, subscription ID, and
          current tier status so we know what plan you're on.
        </p>
        <p>
          If you cancel a subscription, we retain the billing records Stripe
          requires for accounting purposes, but no card data ever passes
          through us to begin with.
        </p>
      </div>
    ),
  },
  {
    id: "third-party-sharing",
    title: "Third-Party Sharing",
    content: (
      <div className="space-y-3">
        <p>
          We send transactional email (like verification links and
          notifications) through our email provider. Only the recipient
          address needed to deliver that message is shared with them — no
          other account data.
        </p>
        <p>
          If you choose to connect a third-party client such as Amazon Alexa
          to your account, that connection uses a read-only{" "}
          <code className="px-1 py-0.5 rounded bg-[var(--theme-surface-hover)] text-[var(--theme-fg)]">
            read:own-content
          </code>{" "}
          OAuth scope, established through a PKCE-based consent flow. That
          scope lets the connected client read your own recipes and
          cookbooks — nothing more. Your password, email address, and
          payment data are never shared with a connected client under any
          circumstances.
        </p>
        <p>
          You can revoke a connected account's access at any time from your
          account settings, immediately ending its ability to read your
          content.
        </p>
      </div>
    ),
  },
  {
    id: "changes-to-this-policy",
    title: "Changes to This Policy",
    content: (
      <div className="space-y-3">
        <p>
          If we make a meaningful change to how we collect, use, or share
          your data, we'll update this page and revise the date below.
          Continuing to use My CookBooks after a change means you accept the
          updated policy.
        </p>
        <p>
          Questions about this policy or your data? Reach us at{" "}
          <a
            href={`mailto:${PRIVACY_CONTACT_EMAIL}`}
            className="underline text-[var(--theme-accent)] hover:text-[var(--theme-accent-hover)] transition-colors"
          >
            {PRIVACY_CONTACT_EMAIL}
          </a>
          .
        </p>
        <p className="text-[var(--theme-fg-subtle)]">{LAST_UPDATED}</p>
      </div>
    ),
  },
]

export function PrivacyPolicyPage() {
  return (
    <PageLayout
      role="public-marketing"
      title="Privacy Policy"
      description="How My CookBooks collects, uses, and shares your data."
    >
      <p className="text-sm text-[var(--theme-fg-subtle)] mb-6">{LAST_UPDATED}</p>
      <Accordion items={SECTIONS} />
    </PageLayout>
  )
}
