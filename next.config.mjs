/** @type {import('next').NextConfig} */

// Baseline security headers applied to every response. These are safe for a
// static marketing site and do not change how any page looks or behaves:
//  - nosniff            → stop MIME-type sniffing
//  - X-Frame-Options    → block being iframed by other origins (clickjacking)
//  - Referrer-Policy    → don't leak full URLs to third parties
//  - Permissions-Policy → deny powerful features the site never uses
//  - HSTS               → force HTTPS (only takes effect once served over TLS)
// Note: a full Content-Security-Policy is intentionally left out — Next.js
// injects inline bootstrap scripts, so a strict CSP needs nonces and per-page
// testing; add it once the site has a stable deploy target.
const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
];

const nextConfig = {
  reactStrictMode: true,
  // Don't advertise the framework/version in the X-Powered-By header.
  poweredByHeader: false,
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

export default nextConfig;
