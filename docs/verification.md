# Verification — 2026-11-12

## Passed

- Production build: Vite 6.4.6, CSS/JS and logo assets bundled successfully.
- Production preview HTTP 200 for index, JS, CSS, favicon and both logo derivatives.
- Desktop rendered review in Strawberry at 1440 × 900.
- Mobile rendered review in a 390 px same-origin browser iframe. This checks CSS viewport behaviour, not physical-device/touch behaviour.
- Responsive DOM checks at widths 320, 375, 390, 768, 1024 and 1440: no horizontal document overflow, no broken images, no missing internal anchor targets.
- Mobile Menu expands; Our practices navigates and collapses menu.
- Creative CTA navigates to #enquiry and selects Work by Nish.
- Form rejects empty and whitespace-only briefs.
- Actual browser download produces grover-project-brief.txt; contents verified to contain the chosen practice, entered project description and explicit not-sent notice.
- Browser confirmation accurately says the brief is local and not sent.

## Limits / outstanding

- Automated standalone Playwright browser launch failed with SIGABRT in the sandbox. Tests were continued in Strawberry's live browser using a temporary same-origin viewport harness; harness removed after use.
- No comprehensive browser-console/network-error audit was available; production asset requests were independently checked. Do not describe this as zero console errors or a full performance/accessibility audit.
- No physical phone, Safari, screen-reader, full keyboard traversal, cross-browser suite or external contact delivery was tested.
- Static site has no authentication, API, server form, account or database surface to exercise. This is not a penetration test.
- No production deployment or DNS change. Post-deployment routes/security/caching/HTTPS remain untested.
- Legal notice needs owner/professional review; no legal sufficiency claim.
