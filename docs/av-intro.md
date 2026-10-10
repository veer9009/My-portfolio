# Cinematic AV intro

Run `npm.cmd start` on Windows (or `npm start` elsewhere), then open
http://127.0.0.1:4173. No build or extra dependency is needed.

The intro plays on every page load, including normal and hard refreshes,
deep links, and reloads with restored scroll positions. It does not read or
write browser storage; an old `av-intro-seen` flag has no effect. Reduced-motion
preferences bypass the animation and reveal the portfolio immediately.

## Architecture

- `av-intro.js` owns the overlay, per-document animation clock, skip/input
  handlers, loading watchdog, and disposal. It dynamically imports the existing
  vendored Three.js and the isolated scene module.
- `av-intro-scene.js` builds custom extruded A and V shapes with silver faces,
  deep graphite bevels, illuminated gold contour inlays, amber seams, and blue studio rim lighting. A small generated
  texture adds brushing. Procedural studio panels are baked into a PMREM
  environment; there are no external models, images, or postprocessing passes.
- A material shader reveals the geometry with a narrow sweep. A broad shader ribbon
  carries a moving bright head around an actual 3D orbit; depth testing hides its
  rear portions behind the AV. Its head also moves an amber point light and a
  restrained horizontal flare. Two large segmented torus rings rotate and pulse
  behind the letters. Additive sprites, plus a desktop procedural noise veil,
  provide fog and amber floor lighting. Inverted, attenuated geometry approximates a polished floor
  reflection without another render target. This is an artistic reflection, not
  a physically simulated reflective plane.
- GSAP's existing easing function controls the sweep and camera push. A single
  requestAnimationFrame clock drives the scene using elapsed time.
- The overlay starts black while the scene prepares. After preparation: black
  through 0.2 seconds, light sweep through 1 second, ribbon/rings through 2.5 seconds,
  camera approach through 3.5 seconds, hold through 3.8 seconds,
  dissolve through 4.8 seconds. A five-second total deadline includes loading;
  startup reduces the available playback duration proportionally. If fewer than
  2.4 seconds remain after preparation, the intro yields directly to the portfolio.
  Skip appears after the first 250 milliseconds even if an import is stalled.
- The hero renders independently underneath. The final one-second opacity fade
  reveals it without modifying its scene, camera, content, or scroll behavior.
- Mobile starts with fewer particles, fewer bevel/ring/ribbon segments, simpler fog,
  and device pixel ratio capped at 1. Desktop caps pixel ratio at 1.5. Resizing
  updates the camera framing and renderer dimensions.
- Skip, keyboard input, wheel/touch scroll input, page hiding, reduced-motion changes, WebGL
  failure/context loss, and completion use the same idempotent cleanup. It cancels
  timers/frames, removes listeners, disposes geometries/materials/textures/PMREM,
  and releases the WebGL context. Automatic scroll restoration does not dismiss
  the intro, and disabled storage cannot affect playback.

## Validation

`npm.cmd test` runs the complete Playwright suite, including intro behavior.
`node tools/check-content.cjs` verifies preservation of original portfolio content,
scripts, styles, vendor libraries, and resume against Git HEAD.

With the local server running, `node tools/av-visual-check.cjs` captures black,
reveal, orbit, hold, dissolve, and hero frames at 1920x1080, 1366x768, and 390x844 into
`test-results/av-*.png`. It also checks uncaught exceptions and console errors.
Screenshots use a controlled clock so the short phases can be inspected reliably.
They do not measure real-device frame rate.
The intro tests include rendered-image checks for prominent gold coverage, a
readable silver face, and gold in the upper composition on desktop and mobile.

No commit, push, deployment, or deployment configuration change is part of this work.
