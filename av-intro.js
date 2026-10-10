// The hero stays independent: this short-lived overlay owns all of its resources.
const mount = document.querySelector('.av-intro');
const canvas = mount.querySelector('canvas');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
let renderer, scene, frame, timer, loadingHint, finished = false;

function finish() {
  if (finished) return;
  finished = true;
  mount.hidden = true;
  mount.dataset.phase = 'complete';
  cancelAnimationFrame(frame);
  clearTimeout(timer);
  clearTimeout(loadingHint);
  window.removeEventListener('resize', resize);
  window.removeEventListener('pagehide', finish);
  window.removeEventListener('wheel', finish);
  window.removeEventListener('touchmove', finish);
  document.removeEventListener('keydown', finish);
  document.removeEventListener('visibilitychange', visibility);
  reduced.removeEventListener('change', finish);
  canvas.removeEventListener('webglcontextlost', lost);
  mount.removeEventListener('click', finish);
  scene?.dispose();
  renderer?.dispose();
  renderer?.forceContextLoss();
  renderer = scene = null;
  canvas.width = canvas.height = 1;
}
function lost(event) { event.preventDefault(); finish(); }
function visibility() { if (document.hidden) finish(); }
function resize() { scene?.resize(); }

async function start() {
  if (reduced.matches || document.hidden) return finish();
  // Each document gets one playback, independent of storage, hash and restored scroll.
  mount.hidden = false;
  mount.dataset.phase = 'black';
  const opened = performance.now();
  timer = setTimeout(finish, 5000); // One total deadline, including imports and GPU startup.
  loadingHint = setTimeout(() => {
    mount.querySelector('button').style.opacity = '1';
  }, 250);
  window.addEventListener('pagehide', finish);
  // User scroll input can skip; browser scroll restoration must not skip a reload.
  window.addEventListener('wheel', finish, { passive: true });
  window.addEventListener('touchmove', finish, { passive: true });
  document.addEventListener('keydown', finish);
  document.addEventListener('visibilitychange', visibility);
  reduced.addEventListener('change', finish);
  mount.addEventListener('click', finish); // Click, not pointerdown: prevents click-through.
  canvas.addEventListener('webglcontextlost', lost);
  try {
    const [T, { createIntroScene }] = await Promise.all([
      import('./vendor/three.module.min.js'), import('./av-intro-scene.js')
    ]);
    if (finished) return;
    renderer = new T.WebGLRenderer({ canvas, alpha: false, antialias: true, powerPreference: 'low-power' });
    renderer.setClearColor(0x000000, 1);
    renderer.outputColorSpace = T.SRGBColorSpace;
    renderer.toneMapping = T.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    scene = createIntroScene(T, renderer);
    scene.render(0);
    if (finished) return;
    mount.dataset.ready = 'true';
    window.addEventListener('resize', resize);
    const duration = Math.min(4.8, (5000 - (performance.now() - opened)) / 1000);
    // Very slow devices should get the portfolio, not an abruptly rushed reveal.
    if (duration < 2.4) return finish();
    let started;
    function tick(now) {
      if (finished) return;
      started ??= now;
      const seconds = (now - started) / 1000 * (4.8 / duration);
      if (seconds >= 4.8) return finish();
      mount.dataset.phase = seconds < .2 ? 'black' : seconds < 1 ? 'revealing' : seconds < 2.5 ? 'orbiting'
        : seconds < 3.5 ? 'approaching' : seconds < 3.8 ? 'holding' : 'dissolving';
      const fade = Math.min(1, Math.max(0, seconds - 3.8));
      mount.style.opacity = String(1 - fade * fade * (3 - 2 * fade));
      mount.style.setProperty('--intro-caption', String(Math.min(1, Math.max(0, (seconds - 2.3) * 2))));
      try { scene.render(seconds); } catch { return finish(); }
      frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
  } catch { finish(); }
}
start();
