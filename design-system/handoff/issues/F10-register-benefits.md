# F10 — Register form benefits sidebar

## Context

`src/components/auth/RegisterForm.tsx` today is four input fields + a submit button. It works. But there's no reassurance ("free forever, no credit card"), no preview of what's behind the door. Conversion impact per visitor is small, but every paid customer passes through here.

## Acceptance criteria

- [ ] On desktop (≥ md breakpoint), wrap the form in a two-column layout: form on the left, **benefits sidebar** on the right.
- [ ] On mobile (< md), benefits stack above the form.
- [ ] Sidebar content (4–5 short lines, no fluff):
  - "Free forever — no credit card required"
  - "Save up to 10 recipes"
  - "Build a cookbook"
  - "Print any recipe"
  - "Browse hundreds of public recipes"
- [ ] Each line has a small Lucide checkmark (`Check` or `CheckCircle2`) in the accent color.
- [ ] Below the form button: legal microcopy in `text-fg-subtle text-xs`: "By creating an account you agree to our Terms and Privacy Policy." Make Terms / Privacy real links if those pages exist; otherwise stub them with `href="#"` and a TODO comment.
- [ ] Form itself is unchanged — same fields, validation, submit behavior.

## Where to start

- `src/components/auth/RegisterForm.tsx` — the form
- `src/components/auth/AuthPageLayout.tsx` — may need to be widened, or wrap with a grid here
- `src/routes/auth/register.tsx` — the route

## Constraints

- Theme tokens only.
- No emoji.
- Don't change the form submit flow or field validation — pure layout + copy.
- Brand name is **My CookBooks** if it appears anywhere new.

## Out of scope

- Login page (separate cosmetic pass)
- Email verification flow (F08)

@claude please open a small PR. ~50 line diff. Run the existing RegisterForm tests; they should still pass.
