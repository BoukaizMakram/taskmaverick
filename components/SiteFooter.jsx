// Shared marketing footer used across the standalone pages (sign in, contact,
// book a demo). Mirrors the footer inlined on the landing / about pages.
export default function SiteFooter() {
  return (
    <footer className="lp-footer">
      <div className="lp-container lp-footer-inner">
        <img src="/logo.svg" alt="Taskmaverick" className="lp-footer-logo" />
        <nav>
          <a href="/">Demo</a>
          <a href="/about">About</a>
          <a href="/#use-cases">Use cases</a>
          <a href="/contact">Contact</a>
          <a href="/book">Book a demo</a>
          <a href="/signin">Sign in</a>
          <a href="/terms">Terms</a>
        </nav>
      </div>
    </footer>
  );
}
