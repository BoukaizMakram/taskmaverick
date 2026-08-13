// ---------------------------------------------------------------------------
// FeatureSplit — a two-column marketing block: art on one side, text on the
// other. Pass `art` (a node) or leave it for the built-in Zone-Coverage art.
// `artSide` defaults to 'left' (art left, text right).
// ---------------------------------------------------------------------------

function ZoneCoverageArt() {
  // A simple floor-plan schematic: rooms/zones with staff dots, the busy
  // "high-touch" zones getting more coverage.
  return (
    <svg className="fsplit-svg" viewBox="0 0 400 300" role="img" aria-label="Facility zones with staff coverage">
      <rect x="10" y="10" width="380" height="280" rx="14" fill="#ffffff" stroke="#e3e9f2" />
      {/* zones */}
      <rect x="28" y="28" width="150" height="110" rx="10" fill="#eaf3fb" stroke="#cfe4f6" />
      <rect x="196" y="28" width="176" height="70" rx="10" fill="#f4f8fd" stroke="#dce8f5" />
      <rect x="196" y="116" width="176" height="70" rx="10" fill="#eaf3fb" stroke="#cfe4f6" />
      <rect x="28" y="156" width="150" height="116" rx="10" fill="#f4f8fd" stroke="#dce8f5" />
      <rect x="196" y="204" width="176" height="68" rx="10" fill="#eaf3fb" stroke="#cfe4f6" />

      {/* zone labels */}
      <text x="40" y="48" fill="#6b7688" fontSize="11" fontWeight="600">Entrance</text>
      <text x="208" y="46" fill="#6b7688" fontSize="11" fontWeight="600">Aisle A</text>
      <text x="208" y="134" fill="#6b7688" fontSize="11" fontWeight="600">Checkout</text>
      <text x="40" y="176" fill="#6b7688" fontSize="11" fontWeight="600">Stockroom</text>
      <text x="208" y="222" fill="#6b7688" fontSize="11" fontWeight="600">Restrooms</text>

      {/* staff dots — more where it's busy (high-touch) */}
      <g fill="#1271b7">
        {/* entrance (high touch) */}
        <circle cx="70" cy="95" r="6" />
        <circle cx="98" cy="108" r="6" />
        <circle cx="128" cy="92" r="6" />
        {/* checkout (high touch) */}
        <circle cx="250" cy="160" r="6" />
        <circle cx="286" cy="168" r="6" />
        <circle cx="322" cy="158" r="6" />
        {/* others (lighter coverage) */}
        <circle cx="286" cy="74" r="6" opacity="0.55" />
        <circle cx="96" cy="230" r="6" opacity="0.55" />
        <circle cx="286" cy="248" r="6" opacity="0.55" />
      </g>
    </svg>
  );
}

export default function FeatureSplit({ kicker, title, children, art, artSide = 'left' }) {
  return (
    <section className="lp-section">
      <div className="lp-container">
        <div className={`fsplit ${artSide === 'right' ? 'fsplit--art-right' : ''}`}>
          <div className="fsplit-art" aria-hidden={art ? undefined : true}>
            {art || <ZoneCoverageArt />}
          </div>
          <div className="fsplit-text">
            {kicker ? <span className="lp-kicker">{kicker}</span> : null}
            <h2 className="lp-h2">{title}</h2>
            <p className="lp-lead">{children}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
