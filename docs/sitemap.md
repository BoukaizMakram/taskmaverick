# Sitemap (localhost)

Every route in `app/`, as of 2026-09-28, as full `http://localhost:3000` URLs.

## Public pages: linked from navbar, footer or landing

http://localhost:3000/
http://localhost:3000/about
http://localhost:3000/book
http://localhost:3000/contact
http://localhost:3000/signin
http://localhost:3000/terms

### Industry use cases (landing "Use cases" grid)

http://localhost:3000/industries/restaurant
http://localhost:3000/industries/retail
http://localhost:3000/industries/veterinarian
http://localhost:3000/industries/consulting
http://localhost:3000/industries/manufacturing
http://localhost:3000/industries/security
http://localhost:3000/industries/delivery
http://localhost:3000/industries/health
http://localhost:3000/industries/fitness-gyms

## Public pages: hidden (work in production, nothing links to them)

http://localhost:3000/demo
http://localhost:3000/industries
http://localhost:3000/automation-demo
http://localhost:3000/increased-efficiency
http://localhost:3000/increased-efficiency-demo
http://localhost:3000/improving-quality
http://localhost:3000/improved-quality-demo
http://localhost:3000/live-oversight-demo

### Industry cases

http://localhost:3000/industries/restaurant/cases
http://localhost:3000/industries/retail/cases
http://localhost:3000/industries/veterinarian/cases
http://localhost:3000/industries/consulting/cases
http://localhost:3000/industries/manufacturing/cases
http://localhost:3000/industries/security/cases
http://localhost:3000/industries/delivery/cases
http://localhost:3000/industries/health/cases
http://localhost:3000/industries/fitness-gyms/cases

## Dev-only pages (404 in production)

http://localhost:3000/admin
http://localhost:3000/tablet
http://localhost:3000/phone
http://localhost:3000/missions
http://localhost:3000/overview
http://localhost:3000/running
http://localhost:3000/running?preview=1
http://localhost:3000/quality
http://localhost:3000/quality-assets
http://localhost:3000/quality-assets/preview
http://localhost:3000/figma-ui-capture

## API routes

http://localhost:3000/api/landing-content
http://localhost:3000/api/landing-upload
http://localhost:3000/api/demo-text/increased-efficiency
http://localhost:3000/api/demo-text/improved-quality
http://localhost:3000/api/demo-text/live-oversight

### Dev-only reference images

http://localhost:3000/quality-assets/reference/mobile-checklist.png
http://localhost:3000/quality-assets/reference/mobile-loading.png
http://localhost:3000/quality-assets/reference/mobile-missions.png
http://localhost:3000/quality-assets/reference/mobile-quiz.png
http://localhost:3000/quality-assets/reference/mobile-training-list.png
http://localhost:3000/quality-assets/reference/tablet-checklist.png
http://localhost:3000/quality-assets/reference/tablet-home.png
http://localhost:3000/quality-assets/reference/tablet-mission-opened.png
http://localhost:3000/quality-assets/reference/tablet-missions.png
http://localhost:3000/quality-assets/reference/tablet-quiz.png
http://localhost:3000/quality-assets/reference/tablet-team-menu.png
http://localhost:3000/quality-assets/reference/tablet-training-lesson.png

## Notes

- `/quality-assets/preview` needs `?asset=…&device=…&state=…`; open it from the
  Clean preview link on http://localhost:3000/quality-assets.
- There is no `app/sitemap.js` or `robots.js` yet, so search engines get no sitemap.
