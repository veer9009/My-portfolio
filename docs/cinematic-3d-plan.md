# Cinematic 3D Implementation Plan

Goal: Implement docs/cinematic-3d-design.md in the existing checkout, locally and without Git mutations.

Architecture: Isolated hero bootstrap owns renderer lifecycle and its own GSAP context. A scene builder owns procedural objects and resource disposal. Existing HTML pipeline is the fallback. Existing content and script.js remain intact.

Tech stack: HTML, CSS, JavaScript modules, local Three.js, existing GSAP/ScrollTrigger, Playwright.

Global constraints: Preserve factual content, links, resume, animations and navigation. No commit, push, deployment, or branch/worktree creation. User approved implementation in the shared local workspace.

Review focus: blocked imports; unavailable/lost WebGL; live reduced motion; mobile resizing; offscreen and hidden-page rendering.

## Task 1 — Renderer and fallback
- [x] Run existing suite as baseline.
- [x] Add tests in tests/hero-3d.spec.cjs for successful rendering/resizing at six widths, reduced motion, failed WebGL and blocked imports. Run and observe missing-enhancement failures.
- [x] Add vendor/three.module.min.js, vendor/three.core.min.js and vendor/three-LICENSE.txt (version 0.180.0).
- [x] Add hero-scene.js exporting createScene(THREE, canvas, mobile), returning render(time, state), resize(width, height, dpr), dispose().
- [x] Add hero-3d.js as independent bootstrap with import failure isolation, observers, adaptive DPR, pause/resume and context-loss fallback.
- [x] Add decorative hero canvas and additive styles in index.html/styles.css.

## Task 2 — Scroll and project depth
- [x] Add stage progression and live motion preference tests, observing failures before wiring motion.
- [x] Use a dedicated GSAP context in hero-3d.js; desktop hero sticky sequence, shorter unpinned mobile travel. Animate camera state through five stages then pull away/dim.
- [x] Add project-depth.js with fine-pointer, reduced-motion-aware inner artwork tilt and cleanup without overwriting current transforms.

## Task 3 — Verification and handoff
- [x] Run npm test, including all existing tests unchanged.
- [x] Run desktop/mobile visual inspection and asset/link checks, syntax checks and git diff --check.
- [x] Record actual outcomes in docs/cinematic-3d-verification.md and provide local preview instructions.

Execution ruling: The user's explicit instruction to proceed approves inline execution and the existing short plan. Work in place, retain documentation as the execution record, and omit all skill-suggested commits/worktrees because the user forbids Git changes.

## Execution record

Tasks 1 and 2 implemented. The existing nine tests were retained byte-for-byte. Added thirteen integration cases; observed missing-renderer failures before implementation and a hidden-rendering regression before the central guard fix.

Ruling: desktop pin measurements use refreshPriority:1 because the new asynchronously loaded pin must refresh before existing downstream triggers. A targeted unchanged timeline-progress test initially caught stale measurements; it now passes.

Ruling: use a dedicated GSAP matchMedia context for preference/breakpoint rebuilds and explicitly kill the owned timeline/trigger. Native preference handling left a residual camera trigger in the live-switch test; the dedicated context passes that regression.

Ruling: resizing a capped desktop illustration by 30px may legitimately keep the canvas width unchanged. New resize tests cross into a 430px layout to assert real responsive resizing. No existing test was altered.

Review: independent read-only review found no remaining material blockers after lifecycle fixes. Minor retained limitation: antialiasing context attributes are fixed at the initial canvas creation; a desktop-to-mobile resize retains initial antialiasing, while mobile initial loads disable it. Particle/packet/light counts and DPR still adapt on breakpoint changes.
