# Cinematic scroll upgrade — 7 October 2026

The existing portfolio was enhanced in place. Its sections, project facts, experience entries, navigation, links, resume and lightweight project effects remain intact. Identity in the hero, About introduction and metadata now uses **Software Engineer & Team Lead**. DevOps and cloud remain prominent skills. The infrastructure sequence is explicitly conceptual and is separate from the professional film project.

## Files

Modified:
- `index.html`: background layer, requested identity and disciplines, pipeline stage caption.
- `styles.css`: independent cinematic layers, cover scaling, responsive refinements and reduced-motion background treatment.
- `hero-3d.js`: one scrubbed desktop/mobile pin timeline, camera progression, background zoom, parallax, stage captions/commands, rendering cache and quality reduction.
- `hero-scene.js`: distinct procedural hardware silhouettes, shared infrastructure bay, warm accents and scroll-position packet movement.
- `script.js`: removed the old competing hero-grid trigger and time-driven pipeline/terminal loop. Existing section/project animations remain.

Created:
- `assets/engineering-environment.svg`: original 2.1 KB vector infrastructure corridor; no tool nodes or logos baked into it.
- `tests/cinematic-scroll.spec.cjs`: four cinematic reversal, fallback/identity and idle-rendering tests.
- `tools/cinematic-visual-check.cjs`: six-width browser validation and screenshot capture.
- This verification report.

Neither existing test file nor `project-depth.js` was changed. No dependencies, models or external assets were added. No commit, push, deployment or infrastructure changes were made.

## Behavior

The existing renderer is retained. A single GSAP timeline scrubs through GitHub → Jenkins → Docker → Kubernetes → AWS; reversing scroll reverses camera position, background zoom, foreground/grid movement, node emphasis, packets and illustrative terminal text. Background zoom is capped at 1.16 on desktop and 1.10 on mobile. The sequence fades toward its end, then releases the pin into normal document flow. Scroll distance is based on viewport height: 2.4 desktop viewports or 2 mobile viewports. Tall mobile heroes scroll naturally into their lower viewport before pinning, keeping all controls reachable.

## Verification

Final complete suite: `npm.cmd test -- --workers=1` — **26 tests executed: 20 passed, 6 failed, none skipped**.

The six failures are the existing `content and animations work at …px` cases at **1920, 1440, 1024, 768, 430 and 390px**. Every failure is at `tests/portfolio.spec.cjs:9`: it requires `DevOps Engineer & Team Lead`, conflicting with the requested `Software Engineer & Team Lead`. Those assertions were preserved. The suite therefore remains red; no claim of an entirely passing suite is made.

All four new tests and all thirteen existing WebGL tests passed. The existing mobile menu/keyboard/resume-download, reduced-motion/no-JavaScript, and navigation/timeline/progress/live-preference tests also passed. New behavior tests were observed failing before implementation; the idle-rendering test specifically observed increasing WebGL draw calls before the cache fix and no additional calls once settled afterward.

Additional commands:
- `node tools/hero-visual-check.cjs`: six widths, Docker/exit screenshots, no console/page errors.
- `node tools/cinematic-visual-check.cjs`: forward and reverse stage visits, no horizontal overflow, normal section accessibility, pin-release continuity, reduced-motion static treatment and browser/asset error collection. Screenshots use `test-results/cinematic-*.png`.
- `node --check` for `hero-3d.js`, `hero-scene.js`, `script.js` and `tools/cinematic-visual-check.cjs`: passed.
- Read-only diff inspection: changes confined to the listed files; project facts and existing tests preserved.

Responsive checks use 1920, 1440, 1024 and 768px widths at 900px height, and 430/390px widths at 844px height in the cinematic visual check. Automated tests additionally exercise resize across desktop/mobile breakpoints. Desktop and mobile screenshots were inspected, including mid-sequence and exit states. These are Chrome browser checks, not physical-phone testing or cross-browser certification.

## Performance and accessibility

- One WebGL renderer; shared lightweight geometry/materials and small canvas label textures.
- No real-time shadows, downloaded models, bloom/composer passes or project WebGL scenes. A soft glow sprite and simple lighting supply atmosphere.
- Desktop DPR cap 1.5; mobile cap 1.25. Quality degradation lowers DPR to 1, then 0.85 rather than removing the cinematic sequence on slow devices.
- Mobile particles reduced from 180 to 70, packets from three to one per connection, rack geometry reduced, directional light and antialiasing omitted. Pointer parallax is disabled on mobile/coarse pointers.
- The mobile animation loop is throttled to about 30 FPS; the lowest quality tier uses about 20 FPS. GSAP scroll updates can cause additional renders, so these are loop limits rather than measured FPS guarantees.
- Settled input stops WebGL draw calls. Hidden/offscreen pages stop expensive rendering. Resize/configure invalidates the frame cache; geometries, materials, textures and observers are disposed during teardown.
- Reduced motion removes pinning, zoom, camera travel and pointer motion. The dim static scene and readable HTML pipeline remain; all content stays accessible and no ScrollTriggers remain.
- Unavailable WebGL, blocked Three.js, context loss or render exceptions restore the static cinematic environment and original HTML pipeline. Name, title, navigation, CTAs and portfolio sections remain available.

The browser checks collected no normal-operation JavaScript, Three.js, GSAP, ScrollTrigger, console or missing-asset errors. Deliberately aborted imports in failure tests are expected simulated failures. The CLI emitted its environment-level NO_COLOR/FORCE_COLOR warning.

## Local review

Open `http://localhost:4173/` while the local server is running. Otherwise start it with `npm.cmd start` from this folder. For a physical phone on the same network, use the computer's LAN IP with port 4173; localhost on the phone points to the phone itself. Physical phone performance and touch scrolling still need the user's review before any commit or push.
