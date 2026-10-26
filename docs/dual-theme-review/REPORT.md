# OralAI dual-theme refinement

25 October 2026. Presentation-only refinement against the supplied dark/light reference. The existing page structure, copy, sections, tooth asset, handlers, routes, theme persistence, and animation behavior remain unchanged.

## Changes in this pass

The only application source file modified is `frontend/src/pages/Home.css`.

- Reduced desktop hero height from 620 to 550 px, and wide-desktop height from 720 to 630 px. Adjusted typography, description leading, capability margins, and CTA spacing to form a more compact composition without removing sections.
- Reduced standard floating-card minimum height from 168 to 154 px and wide-desktop minimum height from 190 to 170 px. Kept full titles and descriptions, with consistent padding and the existing arrangement in both themes.
- Dark mode: richer navy atmosphere, more defined glass surfaces, restrained violet edges, clearer supporting text, and a layered metallic pedestal with cyan edge lighting.
- Light mode: calmer white/ice-blue background, stronger navy text, distinct frosted panels, subtle layered shadows, and pale icon containers replacing the earlier dark blocks.
- Light-mode tooth: reduced ambient glow, internal bloom, and projection intensity; lowered brightness and saturation and increased contrast to reveal the existing enamel anatomy. Energy rings remain visible with less bloom.
- Refined platform materials and concentric ring lighting independently for each theme, while retaining identical platform dimensions and positioning.
- Refined the theme toggle border and added a defined Login button surface. Existing controls, notification behavior, menu, and destinations were not changed.
- Preserved the existing tablet/mobile breakpoints, stacked mobile cards, focus styling, reduced-motion behavior, and tooth levitation/parallax.

No JSX, backend, AI logic, API service, authentication, database, environment, or business-rule file was changed in this pass. No new asset, project dependency, package-manifest change, or lockfile change was introduced.

## Recovery and Git

Verified the previously approved full local archive at `C:\Users\User\AppData\Local\Temp\OralAI-recovery-20261025-175228\project-before-redesign.tar`: 2,064,715,776 bytes, 44,341 entries. Read its file index and verified archived Git HEAD, authentication/theme contexts, and tooth artwork against unchanged current files. Successfully recovered an archived homepage sample to a separate temporary file and verified its bytes. No new full backup was needed.

The working tree already contained the earlier 14 modified frontend files and untracked presentation assets, stylesheet, utility, and prior review evidence. No staged changes were present. Existing changes were preserved. Current-source hashes were recorded before this pass; the final comparison confirms only `Home.css` changed among existing application source files. The homepage and tooth JSX are byte-for-byte unchanged from the start of this pass. See [source-verification.json](source-verification.json).

The HEAD-relative Git diff includes earlier work and therefore does not isolate this refinement. [presentation.diff](presentation.diff) contains the exact CSS changes relative to the start of this pass. New files are confined to this review directory: the browser audit script, JSON evidence, screenshots, diff, and this report.

No commit, push, deployment, reset, clean, rebase, or discard operation was performed.

## Build

`npm.cmd run build --prefix frontend` passed using Vite 6.4.3, with 549 modules transformed. Generated CSS is 92.08 kB (17.62 kB gzip); JavaScript is 963.78 kB (278.41 kB gzip). The existing large-JavaScript-chunk warning remains. No application bundling or architecture changes were made.

## Browser validation

Used isolated headless Chrome against the running local Vite application. Existing temporary Playwright tooling was reused; project dependencies were not changed. No fake API responses or authenticated account fixtures were used.

- All 12 combinations of 375, 430, 768, 1024, 1440, and 1920 px with dark/light mode passed checks for horizontal overflow, four visible service cards, card collisions, cards outside the viewport, cards covering the tooth, clipped titles/descriptions, blocked hero buttons, platform bounds, and platform overlap with the lower strip.
- Measured hero, copy, tooth, viewport, cards, and feature-strip geometry is exactly identical between themes at every tested width.
- All 22 guest navigation/theme checks passed: Start Detection, Learn More, Login, Get Started; six protected navbar destinations; all four desktop service cards; Enter-key activation of the detection card; all four lower-strip links; mobile menu expansion and AI Assistant navigation; theme switching and persistence after reload.
- A supplementary desktop capture with normal motion confirmed pointer movement still changes the existing tooth scene transform. Main layout captures use reduced motion for repeatable measurements.
- No browser runtime or error-console messages were recorded.
- Desktop and mobile screenshots were visually inspected to assess contrast, anatomy, spacing, full card copy, and the visible platform.

Raw results: [browser-results.json](browser-results.json). Reusable browser audit: [check-browser.cjs](check-browser.cjs).

## Screenshots

| Width | Dark | Light |
| --- | --- | --- |
| 375 | [Mobile](dark-375.png) | [Mobile](light-375.png) |
| 430 | [Mobile](dark-430.png) | [Mobile](light-430.png) |
| 768 | [Tablet](dark-768.png) | [Tablet](light-768.png) |
| 1024 | [Tablet/desktop](dark-1024.png) | [Tablet/desktop](light-1024.png) |
| 1440 | [Desktop](dark-1440.png) | [Desktop](light-1440.png) |
| 1920 | [Wide desktop](dark-1920.png) | [Wide desktop](light-1920.png) |

[Desktop with animations and pointer parallax enabled](dark-1440-motion.png).

## Untested workflows and remaining differences

No end-to-end claims are made about login submission/JWT refresh, registration, authenticated role-specific navigation and dashboards, uploads/predictions, Gemini responses, video conferencing, appointments, prescriptions, pharmacy ordering/validation, payments, profile/medicine management, notifications with live account data, or MongoDB/backend connectivity. Those require appropriate accounts and running services. Their implementations were not changed.

The reference uses bespoke rendered scenery, photographic/3D feature thumbnails, and a different tooth silhouette. This pass preserves the existing raster tooth and SVG iconography; CSS atmosphere remains less detailed than that rendered environment. No unavailable appointment route, fake notification count, identity, statistic, medical accuracy metric, certification, or availability claim was added. The informational annotation column in the supplied reference is not part of the application homepage.
