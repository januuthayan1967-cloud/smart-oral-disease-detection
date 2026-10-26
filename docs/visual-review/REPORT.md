# OralAI visual redesign quality report

Completed on 25 October 2026. The homepage now uses the supplied reference's midnight navy and cyan palette, glass navigation styling, editorial headline, four numbered floating service panels, illuminated tooth and pedestal, and horizontal feature strip. Tablet cards rebalance into a grid; mobile uses a stacked composition. Light mode uses ice-blue surfaces and navy text.

## Recovery checkpoint

- Branch at start: `main`; HEAD: `228dc56`. HEAD was identified, but was not established as a tested working baseline.
- Complete pre-edit archive: `C:\Users\User\AppData\Local\Temp\OralAI-recovery-20261025-175228\project-before-redesign.tar`.
- Archive size: 2,064,715,776 bytes; 44,341 entries. Includes Git metadata, uncommitted and untracked files, existing dependencies, model assets, and local configuration. Archive remains local and contains sensitive configuration; it has not been published.
- Verified archive copies of Git HEAD, homepage, navbar, tooth component, untracked artwork, and frontend configuration against the original bytes before editing.
- The initial working tree already contained 14 modified frontend files plus untracked artwork and `motion.js`. Those existing changes were preserved. No commit, push, deployment, reset, clean, pull, or rebase was performed.

## Files changed in this session

| File | Change |
| --- | --- |
| `frontend/src/pages/Home.jsx` | Homepage presentation and accurate service copy; keeps the existing detection handler and Learn More destinations; respects reduced motion for the text entrance. |
| `frontend/src/components/ToothMascot.jsx` | Presentation class hooks, tooth SVG icon, decorative labels and service descriptions. Existing navigation, authentication guard, pointer handlers, state, effects, and animation configuration remain intact. |
| `frontend/src/pages/Home.css` | New homepage-scoped atmosphere, lighting, navigation appearance, glass panels, tooth sizing, platform styling, light theme, focus styling, and responsive layout. |
| `docs/visual-review/` | Browser audit script, results, screenshots, source comparison, and this report. |

Existing backend, AI services/models, frontend services, authentication/theme contexts, router, shared navbar implementation, shared stylesheet, unrelated pages, package manifests, and lockfiles were not edited in this session. Homepage navbar appearance is applied through scoped CSS.

Compared 141 existing source/configuration files from the frontend source, backend, and AI service against the recovery archive. Only the two existing presentation files listed above differ. The detection handler and tooth component's existing hooks/handlers are textually identical to the checkpoint. See [source-verification.json](source-verification.json).

## Assets and dependencies

Reused `frontend/public/assets/3d-tooth.png`, existing SVGs, Framer Motion, and existing fonts. No new runtime assets, project dependencies, or heavy 3D libraries were added. Playwright was installed in a temporary tools directory for a supplementary browser check; package manifests and lockfiles are unchanged. The main audit script uses Node's native WebSocket and Chrome debugging protocol.

The tooth is an existing raster illustration with levitation and pointer parallax, not a newly created interactive 3D model. The pedestal, beams, rings, and optical grid are decorative presentation effects.

## Build and source checks

- Final `npm.cmd run build --prefix frontend`: passed, Vite 6.4.3, 549 transformed modules.
- Final generated CSS: 88.21 kB, 16.82 kB gzip. JavaScript: 963.78 kB, 278.41 kB gzip.
- Build retains the large-chunk warning. No bundling or application architecture changes were made to address it.
- `git diff --check` for the two edited existing source files: passed.
- Whole-tree `git diff --check` reports an existing blank line at EOF in `frontend/src/index.css:588`. That file is unchanged from the recovery checkpoint.

## Browser verification actually performed

Used isolated headless Chrome against the real local Vite application, without mocking APIs or authenticated users.

| Check | Result |
| --- | --- |
| 375, 430, 768, 1024, 1440, 1920 px in both themes | All 12 layouts checked and captured. |
| Horizontal overflow | None in the final matrix. |
| Four visible service panels | Passed at all widths. |
| Panel overlap / panels outside viewport / panels covering tooth | None in the final matrix. |
| Tooth image loaded | Passed at all widths. |
| Readable panels and visible pedestal | Screenshots visually inspected; descriptions are not line-clamped. |
| Guest Start Detection | Existing redirect to `/login` passed. |
| Guest Learn More | Existing destination `/register` passed. |
| Guest navbar Dashboard, Detection, AI Assistant, Consultation, Pharmacy, Profile | All retain their existing guest redirect to `/login`. |
| Mobile menu | Expands; AI Assistant selection retains guest redirect to `/login`. |
| Theme switch and reload | Theme changes and persists. |
| Lower strip destinations | Existing routes `/detect`, `/chat`, `/consultation`, `/medicines`; protected workflow completion not tested. |
| Reduced motion | Layout captures use the browser's reduced-motion setting; tooth animations use the existing reduced-motion hook; homepage text entrance is disabled. |
| Animations enabled | Additional 1440 and 375 px captures; pointer movement produces the existing scene parallax; no horizontal overflow or CTA content overflow. |
| Browser runtime / error console | No errors recorded in the final matrix or supplementary motion check. |

Raw evidence: [browser-results.json](browser-results.json), [motion-results.json](motion-results.json). Results establish presentation and guest navigation behavior, not end-to-end clinical or ordering functionality.

## Screenshots

| Width | Dark mode | Light mode |
| --- | --- | --- |
| 375 | [Mobile](dark-375.png) | [Mobile light](light-375.png) |
| 430 | [Mobile](dark-430.png) | [Mobile light](light-430.png) |
| 768 | [Tablet](dark-768.png) | [Tablet light](light-768.png) |
| 1024 | [Tablet/desktop](dark-1024.png) | [Tablet/desktop light](light-1024.png) |
| 1440 | [Desktop](dark-1440.png) | [Desktop light](light-1440.png) |
| 1920 | [Wide desktop](dark-1920.png) | [Wide desktop light](light-1920.png) |

Additional captures with animations enabled: [desktop and pointer parallax](dark-1440-motion.png), [mobile](dark-375-motion.png).

## Medical copy

Removed the homepage's unsupported `24/7`, `6+`, and trust/statistics presentation. The supported labels match `ai-service/app.py`: Dental Calculus, Dental Caries, Gingivitis, Normal Teeth, Mouth Ulcer, Tooth Discoloration. Copy describes six classification categories because one category is healthy teeth. No X-ray analysis, accuracy percentage, certification, patient count, doctor identity, or active consultation was invented. Decorative telemetry no longer claims an active clinical process.

## Unverified workflows

Registration submission, authenticated login/JWT refresh, role-specific dashboards and navigation, image upload/preprocessing and AI predictions, Gemini responses, appointment scheduling, WebRTC calls, prescriptions, pharmacy authorization and ordering, payments, medicine/profile management, notifications with real account data, and database connectivity were not exercised end to end. Suitable accounts and running backend/AI services are needed for those checks. Those implementations were left unchanged.

## Diff summary and remaining visual differences

Relative to the approved recovery checkpoint, `Home.jsx` has 45 added and 302 removed lines of presentation; `ToothMascot.jsx` has 26 added and 28 removed lines; `Home.css` is a new stylesheet. Full Git status still includes the user's pre-existing changes, so a HEAD-relative diff also includes earlier work. See the source comparison for this session's scope.

The layout, color, typography, glass surfaces, rings, and pedestal follow the reference. The existing tooth has a different anatomical silhouette and is a raster illustration rather than a wireframe 3D model. CSS atmosphere is less detailed than the reference's rendered laboratory, foliage, reflections, and volumetric lighting. Feature panels use SVG iconography instead of new photographic/3D thumbnails. A bespoke rendered environment, model, or additional artwork would require the separate asset approval requested in the original specification. Unsupported reference statistics and unavailable standalone appointment navigation are intentionally omitted.
