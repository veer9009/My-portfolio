# Cinematic DevOps enhancement — 7 October 2026

## Intent and inspected baseline

Upgrade the existing portfolio locally with an original cinematic infrastructure hero. Preserve all identity, factual content, employment titles, project descriptions, links, resume, navigation, responsive layouts, and working GSAP animations. No commits, pushes, or deployment.

The current site uses semantic sections in index.html, shared CSS variables and section styles in styles.css, and a GSAP matchMedia context in script.js. Existing motion includes hero entrances, word and section reveals, technology cards, timeline progress, production artwork parallax, page progress, ambient pipeline packets, and hover effects. Responsive breakpoints are 1600, 1200, 900, and 600px. Navigation remains available without JavaScript. GSAP, ScrollTrigger, fonts, and the resume are local assets; project visuals are generated with HTML/CSS rather than image files.

tests/portfolio.spec.cjs already checks six viewport widths, visible sections, overflow, GSAP triggers, mobile navigation, resume downloads, reduced motion, no JavaScript, scroll progress, and live motion preference changes. tools/visual-check.cjs checks screenshots, anchors, and local asset responses. These checks must remain intact.

## Chosen approach

Add a separate hero rendering module and locally served, version-pinned Three.js with its license. Retain static HTML delivery and the current script.js animation context. A WebGL canvas is decorative, aria-hidden, and pointer-events:none. Foreground identity, description, and existing CTA links remain HTML. Preserve the existing pipeline markup as the accessible conceptual description and visual fallback, revealing the enhanced presentation only after a successful first render.

Alternatives considered: a CSS-only scene would be lighter but would not satisfy the real WebGL request; extending the existing animation script with all rendering code would couple navigation and content reveals to renderer failures. An isolated module provides the clearest failure boundary.

## Visual and scroll design

Use navy fog, restrained cyan edges, soft procedural glow planes, a sparse network field, and five floating geometric infrastructure cards. Labels are SOURCE/GitHub, CI/CD/Jenkins, CONTAINER/Docker, ORCHESTRATION/Kubernetes, and CLOUD/AWS. Textures use canvas text, with no trademark logo assets. Connected paths carry small luminous packets. These are illustrative design elements, never live infrastructure or production claims.

Keep the current hero composition and readable foreground text. The scene occupies its background and pipeline visual area, with shading behind text. A dedicated GSAP timeline travels slowly through the five nodes, emphasizes the active node, then pulls away and dims before the existing About reveals take priority. Scope timeline ownership and cleanup to the new module; never kill existing triggers globally. Use a modest desktop-only sticky scene sequence if needed for readable stage travel, with a shorter unpinned mobile sequence and no navigation scroll interception.

Add small pointer tilt and border illumination to existing professional artwork and the personal preview. Use separate inner visual targets so these effects do not overwrite existing reveal or hover transforms. Touch devices receive no pointer parallax.

## Lifecycle, performance, and fallback

Use lightweight shared geometry/materials and small fixed-size particle buffers; no models or postprocessing pipeline. Cap desktop DPR at 2 and mobile DPR at a lower level. Reduce particles and lighting on mobile. Reuse vectors and buffers in the frame loop. Pause requestAnimationFrame when hidden or outside the hero; use ResizeObserver to update renderer size and camera aspect.

Reduced motion shows a stable composition with no camera, packet, or pointer travel and creates no new ScrollTriggers. Respect live preference changes. WebGL initialization/import failure, context loss, or sustained poor frame performance returns to the existing HTML/CSS illustration. Navigation, content, and CTAs remain usable independently. Dispose geometries, materials, textures, renderer resources, observers, listeners, and owned timelines on final teardown; account for browser back/forward caching.

## Short implementation plan

1. Establish the existing test baseline and verify local preview tooling.
2. Add meaningful Playwright cases for initialization, renderer resize, stage progression, pause/resume, reduced motion, blocked Three.js, and failed WebGL without weakening current tests.
3. Vendor Three.js and its license; add isolated scene and lifecycle code with additive HTML/CSS integration.
4. Connect the scene's own GSAP/ScrollTrigger timeline and add restrained project visual tilt using independent transform targets.
5. Run the existing and new tests at 1920, 1440, 1024, 768, 430, and 390px. Inspect desktop/mobile screenshots, console output, overflow, navigation, PDF response/download, link integrity, fallbacks, and live motion preference changes.
6. Document actual changed files, architecture, performance/mobile behavior, verification results, and remaining limitations. Leave all work uncommitted and undeployed.

## Acceptance and limitations

All original factual content and links remain unchanged. Existing animations continue normally. Rendering failures never hide portfolio information. No horizontal overflow or new console errors across requested sizes. The enhanced canvas resizes correctly, pauses offscreen, and respects accessibility preferences. Browser automation can verify behavior and emulated mobile layouts; actual phone GPU performance and externally hosted link availability require separate observation and must not be claimed without evidence.
