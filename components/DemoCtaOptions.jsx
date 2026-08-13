'use client';

/* Three design options for the "cases by industry" entry point that sits
   under the Chapters panel. Toggle between them (or compare all three) with
   the keyboard shortcuts wired up in Landing.jsx:
     0 / Esc → see all three at once   ·   1 → button   ·   2 → purple   ·   3 → ticket
*/

function ArrowIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h13M12 6l6 6-6 6" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

/* Option 1 — a plain, dependable button */
export function CtaButton() {
  return (
    <a href="#use-cases" className="cta-btn">
      <span>Use Cases by Industry</span>
      <ArrowIcon />
    </a>
  );
}

/* Option 2 — dark-purple chip hanging under the chapters that pops/reveals on
   hover, with a FAQ chip to its left */
export function CtaPurple() {
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

/* Option 3 — a blue gradient bar that hangs under the chapters panel */
export function CtaTicket() {
  return (
    <a href="#use-cases" className="cta-hangbar">
      <span className="cta-hangbar-text">Use Cases by Industry</span>
      <span className="cta-hangbar-chev"><ChevronIcon /></span>
    </a>
  );
}

export default function DemoCtaOptions({ view = 'all' }) {
  if (view === 'button') return <CtaButton />;
  if (view === 'purple') return <CtaPurple />;
  if (view === 'ticket') return <CtaTicket />;

  return (
    <div className="cta-compare">
      <div className="cta-opt">
        <span className="cta-opt-tag">Option 1 · Button</span>
        <CtaButton />
      </div>
      <div className="cta-opt">
        <span className="cta-opt-tag">Option 2 · Purple reveal + FAQ</span>
        <CtaPurple />
      </div>
      <div className="cta-opt">
        <span className="cta-opt-tag">Option 3 · Hanging bar (Apple-style)</span>
        <CtaTicket />
      </div>
      <p className="cta-hint">
        Preview — press <kbd>1</kbd> <kbd>2</kbd> <kbd>3</kbd> to isolate an option, <kbd>0</kbd> for all.
      </p>
    </div>
  );
}
