(() => {
  if (!window.gsap) return;
  const media = gsap.matchMedia();
  media.add('(prefers-reduced-motion: no-preference) and (hover: hover) and (pointer: fine)', () => {
    const cleanups = [];
    // Transform inner artwork only: existing card reveals and preview hover own their transforms.
    for (const [surface, target] of [
      [document.querySelector('.production-visual'), document.querySelector('.war-title')],
      [document.querySelector('.portfolio-preview'), document.querySelector('.preview-content strong')]
    ]) {
      const move = event => {
        const rect = surface.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - .5;
        const y = (event.clientY - rect.top) / rect.height - .5;
        gsap.to(target, { rotationY: x * 5, rotationX: -y * 4, x: x * 4, y: y * 3, transformPerspective: 900, duration: .45, overwrite: true });
        surface.style.setProperty('--depth-x', `${(x + .5) * 100}%`);
        surface.style.setProperty('--depth-y', `${(y + .5) * 100}%`);
      };
      const leave = () => gsap.to(target, { rotationX: 0, rotationY: 0, x: 0, y: 0, duration: .6, overwrite: true });
      surface.addEventListener('pointermove', move); surface.addEventListener('pointerleave', leave);
      cleanups.push(() => { surface.removeEventListener('pointermove', move); surface.removeEventListener('pointerleave', leave); gsap.killTweensOf(target); gsap.set(target, { clearProps: 'transform' }); });
    }
    return () => cleanups.forEach(cleanup => cleanup());
  });
  window.addEventListener('pagehide', event => { if (!event.persisted) media.revert(); });
})();
