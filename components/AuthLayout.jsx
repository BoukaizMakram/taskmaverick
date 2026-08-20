// Two-panel auth/marketing shell: a soft branded visual on the left and a
// centered form on the right. Used by the sign in / contact / book-a-demo pages.
export default function AuthLayout({ heading, children, back = '/' }) {
  return (
    <div className="auth">
      <a href={back} className="auth-back">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Back
      </a>

      <aside className="auth-visual" aria-hidden="true">
        <div className="auth-visual-logo">
          <img src="/logo.svg" alt="" />
        </div>
      </aside>

      <section className="auth-panel">
        <div className="auth-box">
          <img src="/logo.svg" alt="Taskmaverick" className="auth-mini-logo" />
          <h1 className="auth-heading">{heading}</h1>
          {children}
          <p className="auth-support">
            For Assistance Contact <a href="mailto:contact@taskmaverick.com">Customer Support</a>
          </p>
        </div>
      </section>
    </div>
  );
}
