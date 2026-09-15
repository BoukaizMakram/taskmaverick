import LoadingLogo from './LoadingLogo';

// Static restore loader — rendered once in the root layout so it exists in the
// server HTML (an inline <head> script flags the restore before first paint, so
// there's no flash of the landing before it appears). Visibility + fade are
// driven by classes on <html> (.tm-boot-restore / .tm-boot-restore-out), set by
// that head script and cleared by Landing once the page settles.
//
// The Taskmaverick logo's four petals dim, then a highlight rotates
// blue → orange → red → green until the page is ready.
export default function RestoreLoader() {
  return (
    <div className="tm-loader" id="tm-boot-loader" aria-hidden="true">
      <LoadingLogo />
    </div>
  );
}
