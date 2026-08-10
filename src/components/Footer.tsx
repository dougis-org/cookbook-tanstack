import { Link } from '@tanstack/react-router'

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="site-footer print:hidden border-t border-[var(--theme-border)] p-4 text-sm text-[var(--theme-fg-subtle)]">
      <p>
        © {year} My CookBooks{' '}
        <span aria-hidden="true">·</span>{' '}
        <Link to="/terms" className="hover:text-[var(--theme-fg)] transition-colors">
          Terms
        </Link>{' '}
        <span aria-hidden="true">·</span>{' '}
        <Link to="/privacy-policy" className="hover:text-[var(--theme-fg)] transition-colors">
          Privacy Policy
        </Link>
      </p>
    </footer>
  )
}
