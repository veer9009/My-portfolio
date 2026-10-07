# Cinematic 3D local verification — 7 October 2026

## Result

Local implementation complete. `npm.cmd test -- --workers=1` exited successfully: **22 passed (3.3m)**, comprising all nine unchanged original tests and thirteen new integration cases. No commits, branch/worktree creation, pushes, or deployment were performed.

## Files

Modified: `index.html` (two scripts and a decorative canvas container only), `styles.css` (additive enhancement rules only).

Added runtime files: `hero-3d.js`, `hero-scene.js`, `project-depth.js`, `vendor/three.module.min.js`, `vendor/three.core.min.js`, `vendor/three-LICENSE.txt`. Three.js is pinned to 0.180.0 and served locally; no build step is required.

Added verification files: `tests/hero-3d.spec.cjs`, `tools/hero-visual-check.cjs`, `tools/check-content.cjs`.

Design and execution record: `docs/cinematic-3d-design.md`, `docs/cinematic-3d-plan.md`, and this report.

## Three.js architecture

`hero-scene.js` owns the scene, camera, renderer, procedural cards, text textures, shared box/edge/packet geometry, curved network connections, packets, single-draw particle field, distant network lines, perspective grid, fog, and soft glow sprite. Labels represent the conceptual GitHub → Jenkins → Docker → Kubernetes → AWS workflow; no models or trademark logo assets are loaded.

`hero-3d.js` independently loads Three.js and the scene builder, then manages visibility, resize, rendering quality, preferences, camera motion, and disposal. The original HTML pipeline owns the layout and accessible description. It is visually replaced only after a successful render. `project-depth.js` adds restrained perspective movement to inner project artwork without overwriting existing card reveal and hover transforms.

## GSAP / ScrollTrigger

The original `script.js` remains unchanged. The enhancement uses a separate GSAP matchMedia context and an explicitly owned `hero-camera` timeline/trigger. Desktop travel pins the hero for 1800px; mobile travel is unpinned and lasts 420px. The camera moves slowly through each stage, emphasizes its border and scale, then pulls away and dims. Pointer offsets are small and independent of scroll state.

The new pin uses `refreshPriority:1` and refreshes after preference handlers complete so downstream existing triggers include its spacing. This follows the [GSAP refresh-order guidance](https://gsap.com/docs/v3/Plugins/ScrollTrigger/#refreshpriority). Cleanup kills only the enhancement's timeline/trigger and reverts its own context.

## Performance and mobile

- Desktop DPR is capped at 2; mobile DPR at 1.25. Sustained poor performance first lowers DPR to 1 and then restores HTML if costly rendering persists.
- Mobile loads disable antialiasing, use one light rather than two, 70 particles rather than 180, and one packet per connection rather than three.
- Mobile rendering is capped at approximately 30fps. Desktop uses requestAnimationFrame at display cadence.
- Desktop-to-mobile breakpoint changes rebuild scene geometry/materials and adjust DPR and pinning. No mouse parallax on mobile, touch-only devices, or reduced motion.
- Rendering stops when the scene leaves the viewport or the document is hidden. Scroll and resize callbacks also respect rendering visibility.
- Geometry, textures, materials, renderer resources, observers, listeners, refresh callbacks, RAF, and owned timelines are released on final teardown. Browser back/forward cache suspends and resumes rendering.
- No external models, shadow maps, bloom pipeline, or postprocessing passes. Vectors and packet positions are reused in rendering.

## Accessibility and fallback

The canvas is aria-hidden, excluded from sequential focus, and pointer-events:none. Text, links, CTAs, resume, and navigation remain semantic HTML. Reduced motion shows a stable scene behind the original HTML illustration, disables particle/camera/pointer travel, and creates no camera trigger. Live preference switching is tested.

Blocked Three.js, unavailable WebGL2, lost context, and rendering exceptions restore the original HTML/CSS illustration. Without JavaScript, original content and navigation remain available. Existing keyboard menu dismissal, focus behavior, and PDF download continue to work.

## Verification performed

| Check | Result |
| --- | --- |
| Complete Playwright suite | 22/22 passed; 9 original tests unchanged |
| 1920, 1440, 1024, 768, 430, 390px | WebGL ready, canvas resize verified, no horizontal overflow, readable sections |
| Existing GSAP reveals/progress/timeline | Passed at all six widths |
| Mobile navigation, Escape dismissal, resume download | Passed |
| Live reduced motion; no JavaScript | Passed |
| Camera stage progression and offscreen pause/resume | Passed |
| Blocked Three.js and unavailable WebGL | Passed |
| Context loss and rendering exception fallback | Passed |
| Hidden-page rendering during scroll/resize | Passed; instrumented WebGL draw calls did not increase |
| `node tools/hero-visual-check.cjs` | Exit 0; six hero screenshots plus Docker/exit screenshots; no page/console errors |
| Exit fade | Screenshot check reported scene opacity 0.325 at 98% travel |
| `node tools/visual-check.cjs` | Exit 0; desktop/mobile full-page screenshots, valid anchors, original local assets HTTP 200, no errors |
| `node tools/check-content.cjs` | Exit 0; original HTML/factual content/links, script.js, tests, GSAP assets and PDF preserved |
| Hero module HTTP response | HTTP 200 |
| JavaScript syntax checks and `git diff --check` | Exit 0; only existing Git line-ending notices |

Screenshots are in the ignored `test-results/` directory: `hero-1920.png`, `hero-1440.png`, `hero-1024.png`, `hero-768.png`, `hero-430.png`, `hero-390.png`, `hero-stage-Docker.png`, `hero-stage-exit.png`, and the original visual tool's full-page screenshots. Desktop, full mobile hero, and mid-sequence artwork were inspected visually.

## Remaining limitations

Physical phone GPU performance, battery usage, real touch interactions, and frame pacing have not been measured; automated mobile viewport checks run in desktop Chrome. External destinations retain their original URLs; live availability of those third-party sites was not tested. WebGL2 is required for the enhancement and older/unsupported devices receive HTML fallback.

Antialiasing is fixed when a canvas first creates its WebGL context. Resizing an initially desktop page into mobile keeps that initial antialias setting; a fresh mobile load disables it. Other mobile quality settings do adapt.

## Test locally

From `C:\Users\DELL\OneDrive\Desktop\Portfolio`, run:

```powershell
npm.cmd start
```

Open `http://localhost:4173` on the PC. On a phone connected to the same network, open `http://<your-PC-LAN-IP>:4173`. The existing server already listens on all interfaces. If the phone cannot connect, check local network isolation and Windows firewall settings. Stop the server with Ctrl+C when finished. Repeat automated checks with `npm.cmd test -- --workers=1`.
