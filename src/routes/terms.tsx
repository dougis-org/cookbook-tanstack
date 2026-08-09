import { createFileRoute, Link } from "@tanstack/react-router"
import PageLayout from "@/components/layout/PageLayout"
import Accordion from "@/components/ui/Accordion"
import type { AccordionItem } from "@/components/ui/Accordion"

export const Route = createFileRoute("/terms")({
  component: TermsPage,
})

const LAST_UPDATED = "Last updated: August 8, 2026"
const TERMS_CONTACT_EMAIL = "privacy@mycookbooks.com"

const SECTIONS: AccordionItem[] = [
  {
    id: "your-account",
    title: "Your Account",
    content: (
      <div className="space-y-3">
        <p>
          You must be at least 13 years old to create a My CookBooks account.
          You're responsible for keeping your login credentials secure and
          for all activity that happens under your account.
        </p>
        <p>
          Let us know right away if you suspect unauthorized access to your
          account so we can help you secure it.
        </p>
      </div>
    ),
  },
  {
    id: "your-content",
    title: "Your Content",
    content: (
      <div className="space-y-3">
        <p>
          The recipes, cookbooks, notes, and photos you create are yours.
          Creating them here doesn't transfer ownership to us.
        </p>
        <p>
          To operate the service, you grant My CookBooks a limited license to
          store, display, and process your content — for example, to render
          it in your account, in a cookbook you build, or on a public recipe
          page if you choose to make it public.
        </p>
      </div>
    ),
  },
  {
    id: "acceptable-use",
    title: "Acceptable Use",
    content: (
      <div className="space-y-3">
        <p>
          Use My CookBooks for its intended purpose: saving, organizing, and
          sharing recipes and cookbooks. Don't upload content you don't have
          the right to share, attempt to disrupt the service, or use
          automated tools to scrape or abuse the platform.
        </p>
        <p>
          We may suspend or remove content or accounts that violate these
          terms.
        </p>
      </div>
    ),
  },
  {
    id: "billing-subscriptions",
    title: "Billing & Subscriptions",
    content: (
      <div className="space-y-3">
        <p>
          Paid tiers are billed through Stripe. Subscriptions renew
          automatically at the end of each billing period until you cancel.
        </p>
        <p>
          You can cancel a subscription at any time from your account
          settings; cancellation takes effect at the end of the current
          billing period. If something doesn't feel right about a charge,
          reach out to us and we'll work with you on a case-by-case basis.
        </p>
      </div>
    ),
  },
  {
    id: "third-party-connections",
    title: "Third-Party Connections",
    content: (
      <div className="space-y-3">
        <p>
          If you choose to connect a third-party client — such as Amazon
          Alexa — to your account, that connection is read-only and
          consent-based, established through an OAuth flow you explicitly
          approve. You can revoke a connected client's access at any time
          from your account settings.
        </p>
        <p>
          For the specific data-sharing scope and limits of a connected
          client, see our{" "}
          <Link
            to="/privacy-policy"
            className="underline text-[var(--theme-accent)] hover:text-[var(--theme-accent-hover)] transition-colors"
          >
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    ),
  },
  {
    id: "termination",
    title: "Termination",
    content: (
      <div className="space-y-3">
        <p>
          You can delete your account at any time from your account settings.
          We may suspend or terminate an account that violates these terms,
          such as repeated abuse or attempts to disrupt the service.
        </p>
      </div>
    ),
  },
  {
    id: "disclaimers",
    title: "Disclaimers",
    content: (
      <div className="space-y-3">
        <p>
          My CookBooks is provided "as is," without warranties of any kind.
          We don't guarantee the service will be uninterrupted or error-free,
          and we're not responsible for the accuracy of user-submitted recipe
          content.
        </p>
      </div>
    ),
  },
  {
    id: "changes-to-these-terms",
    title: "Changes to These Terms",
    content: (
      <div className="space-y-3">
        <p>
          If we make a meaningful change to these terms, we'll update this
          page and revise the date below. Continuing to use My CookBooks
          after a change means you accept the updated terms.
        </p>
        <p>
          Questions about these terms? Reach us at{" "}
          <a
            href={`mailto:${TERMS_CONTACT_EMAIL}`}
            className="underline text-[var(--theme-accent)] hover:text-[var(--theme-accent-hover)] transition-colors"
          >
            {TERMS_CONTACT_EMAIL}
          </a>
          .
        </p>
        <p className="text-[var(--theme-fg-subtle)]">{LAST_UPDATED}</p>
      </div>
    ),
  },
]

export function TermsPage() {
  return (
    <PageLayout
      role="public-marketing"
      title="Terms of Service"
      description="The terms that govern your use of My CookBooks."
    >
      <p className="text-sm text-[var(--theme-fg-subtle)] mb-6">{LAST_UPDATED}</p>
      <Accordion items={SECTIONS} />
    </PageLayout>
  )
}
