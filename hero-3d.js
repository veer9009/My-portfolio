// Failure isolation: portfolio information never depends on this module.
(async () => {
  const hero = document.querySelector('#home');
  const mount = document.querySelector('.hero-scene');
  const canvas = mount.querySelector('canvas');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const mobile = matchMedia('(max-width: 900px)');
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  let scene, context, motionMedia, cameraTimeline, resizeObserver, intersectionObserver;
  let refreshFrame = 0;
  let frame = 0, visible = true, disposed = false, lastTime = 0, elapsed = 0;
  let slowFrames = 0, samples = 0, frameCost = 0, quality = 0;
  let sceneFactory, three, sceneMobile;
  const state = { x: 2.5, y: 1, z: 19, focusY: 0, stage: -1, pointerX: 0, pointerY: 0, motion: true, opacity: 1 };
  const names = ['GitHub', 'Jenkins', 'Docker', 'Kubernetes', 'AWS'];
  const pointer = { x: 0, y: 0 };
  function stop() {
    cancelAnimationFrame(frame); frame = 0; lastTime = 0;
    if (!disposed) hero.dataset.rendering = reduced.matches ? 'static' : 'paused';
  }
  function resize() {
    if (!scene || disposed) return;
    const rect = mount.getBoundingClientRect();
    try { scene.resize(Math.max(1, rect.width), Math.max(1, rect.height), quality ? 1 : Math.min(devicePixelRatio || 1, mobile.matches ? 1.25 : 2)); }
    catch { return fallback(); }
    draw();
  }
  function draw() {
    if (!scene || disposed || document.hidden || !visible) return;
    state.motion = !reduced.matches;
    try { scene.render(elapsed, state); }
    catch { return fallback(); }
    mount.style.opacity = state.opacity;
    hero.dataset.stage = names[Math.max(0, Math.min(4, Math.round(state.stage)))] || 'GitHub';
  }
  function tick(now) {
    frame = 0;
    if (disposed || document.hidden || !visible || reduced.matches) return stop();
    if (mobile.matches && lastTime && now - lastTime < 32) {
      frame = requestAnimationFrame(tick); return;
    }
    const delta = lastTime ? Math.min(now - lastTime, 100) : 16;
    lastTime = now; elapsed += delta / 1000;
    state.pointerX += (pointer.x - state.pointerX) * .04;
    state.pointerY += (pointer.y - state.pointerY) * .04;
    const start = performance.now();
    try { draw(); } catch { return fallback(); }
    if (disposed) return;
    frameCost += performance.now() - start;
    samples++;
    if (delta > 65) slowFrames++; else slowFrames = Math.max(0, slowFrames - 1);
    if (samples >= 120) {
      // Lower quality once; sustained costly rendering returns to HTML.
      if (frameCost / samples > 22 || slowFrames > 85) {
        if (quality) return fallback();
        quality = 1; resize();
      }
      samples = 0; frameCost = 0; slowFrames = 0;
    }
    frame = requestAnimationFrame(tick);
  }
  function resume() {
    if (disposed) return;
    stop();
    if (document.hidden || !visible) return;
    draw();
    if (disposed) return;
    if (!reduced.matches) { hero.dataset.rendering = 'running'; frame = requestAnimationFrame(tick); }
  }
  function configure() {
    if (!scene || disposed) return;
    clearCamera();
    if (sceneMobile !== mobile.matches) {
      stop(); scene.dispose();
      try { scene = sceneFactory(three, canvas, mobile.matches); sceneMobile = mobile.matches; }
      catch { return fallback(); }
    }
    Object.assign(state, { x: 2.5, y: 1, z: 19, focusY: 0, stage: -1, pointerX: 0, pointerY: 0, opacity: 1 });
    pointer.x = pointer.y = 0;
    hero.classList.toggle('scene-static', reduced.matches);
    if (!reduced.matches && window.gsap && window.ScrollTrigger) {
      gsap.registerPlugin(ScrollTrigger);
      context = gsap.context(() => {
        const timeline = cameraTimeline = gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: {
          id: 'hero-camera', trigger: hero, start: 'top 68px', end: mobile.matches ? '+=420' : '+=1800',
          pin: !mobile.matches, refreshPriority: 1, scrub: .55, invalidateOnRefresh: true, onUpdate: () => { if (reduced.matches) return; draw(); }
        } });
        names.forEach((_, i) => {
          timeline.to(state, { stage: i, focusY: (4.6 - i * 2.3) * .22, y: 1 + (4.6 - i * 2.3) * .12, x: 1.8, z: mobile.matches ? 18 : 16.5, duration: .16 });
        });
        timeline.to(state, { x: 2.5, y: 1, z: 22, focusY: 0, opacity: .25, duration: .2 });
      });
    }
    resize();
    window.ScrollTrigger?.refresh();
    // GSAP's existing matchMedia context also rebuilds on preference changes.
    // Measure again after those handlers have finished changing the layout.
    cancelAnimationFrame(refreshFrame);
    refreshFrame = requestAnimationFrame(() => { refreshFrame = 0; if (!disposed) window.ScrollTrigger?.refresh(); });
    resume();
    return clearCamera;
  }
  function clearCamera() {
    cameraTimeline?.scrollTrigger?.kill(); cameraTimeline?.kill(); cameraTimeline = null;
    context?.revert(); context = null;
  }
  function move(event) {
    if (reduced.matches || mobile.matches || !fine.matches) return;
    pointer.x = (event.clientX / innerWidth - .5) * .32;
    pointer.y = (.5 - event.clientY / innerHeight) * .18;
  }
  const leave = () => { pointer.x = pointer.y = 0; };
  const visibility = () => { if (document.hidden) stop(); else resume(); };
  function teardown() {
    if (disposed) return;
    stop(); disposed = true;
    cancelAnimationFrame(refreshFrame); refreshFrame = 0;
    clearCamera();
    motionMedia?.revert(); motionMedia = null;
    resizeObserver?.disconnect(); intersectionObserver?.disconnect();
    reduced.removeEventListener('change', configure); mobile.removeEventListener('change', configure);
    document.removeEventListener('visibilitychange', visibility);
    hero.removeEventListener('pointermove', move); hero.removeEventListener('pointerleave', leave);
    window.removeEventListener('pagehide', pagehide); window.removeEventListener('pageshow', pageshow);
    canvas.removeEventListener('webglcontextlost', lost);
    scene?.dispose(); scene = null;
    mount.style.opacity = ''; hero.classList.remove('scene-ready', 'scene-static');
    hero.dataset.rendering = 'paused';
  }
  function fallback() { teardown(); hero.dataset.scene = 'fallback'; }
  function lost(event) { event.preventDefault(); fallback(); }
  function pagehide(event) { if (event.persisted) stop(); else teardown(); }
  function pageshow(event) { if (event.persisted) { window.ScrollTrigger?.refresh(); resume(); } }
  try {
    const [T, { createScene }] = await Promise.all([import('./vendor/three.module.min.js'), import('./hero-scene.js')]);
    three = T; sceneFactory = createScene; sceneMobile = mobile.matches;
    scene = createScene(T, canvas, mobile.matches);
    resize(); // Keep HTML visible until the first successful WebGL frame.
    if (disposed) return;
    hero.classList.add('scene-ready'); hero.dataset.scene = 'ready';
    if (window.gsap) {
      motionMedia = gsap.matchMedia();
      motionMedia.add({ reduced: '(prefers-reduced-motion: reduce)', mobile: '(max-width: 900px)', desktop: '(min-width: 901px)' }, configure);
    } else configure();
    if (disposed) return;
    resizeObserver = new ResizeObserver(resize); resizeObserver.observe(mount);
    intersectionObserver = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; resume(); });
    intersectionObserver.observe(mount);
    if (!motionMedia) { reduced.addEventListener('change', configure); mobile.addEventListener('change', configure); }
    document.addEventListener('visibilitychange', visibility);
    hero.addEventListener('pointermove', move, { passive: true }); hero.addEventListener('pointerleave', leave);
    canvas.addEventListener('webglcontextlost', lost);
    window.addEventListener('pagehide', pagehide); window.addEventListener('pageshow', pageshow);
    document.fonts.ready.then(() => { if (!disposed) { resize(); window.ScrollTrigger?.refresh(); } });
  } catch { fallback(); }
})();
