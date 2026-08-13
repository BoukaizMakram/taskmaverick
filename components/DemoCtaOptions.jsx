/* "Use Cases by Industry" entry point that sits under the Chapters panel:
   a dark-purple chip that pops/reveals an arrow on hover, with a FAQ chip to
   its left. */

function ArrowIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h13M12 6l6 6-6 6" />
    </svg>
  );
}

export default function DemoCtaOptions() {
  return (
    <div className="cta-hang">
      <a href="#faq" className="cta-faq">FAQ</a>
      <a href="#use-cases" className="cta-purple">
        <span className="cta-purple-text">Use Cases by Industry</span>
        <span className="cta-purple-arrow"><ArrowIcon /></span>
      </a>
    </div>
  );
}
