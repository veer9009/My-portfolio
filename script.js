(() => {
  'use strict';
  document.documentElement.classList.add('js-enabled');
  const menu = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.nav');
  const header = document.querySelector('.site-header');
  const systemPanel = document.querySelector('.system-panel');
  if (systemPanel) {
    const panelViewport = matchMedia('(min-width: 1280px)');
    const heroLayout = document.querySelector('.hero-layout');
    const placePanel = () => {
      // Keep the phone card outside the pinned section so existing CTAs stay reachable.
      if (panelViewport.matches) heroLayout.append(systemPanel);
      else document.querySelector('.capability-strip').before(systemPanel);
      heroLayout.classList.toggle('has-system-panel', panelViewport.matches);
      window.ScrollTrigger?.refresh();
    };
    placePanel();
    panelViewport.addEventListener('change', placePanel);
    window.addEventListener('pagehide', event => {
      if (!event.persisted) panelViewport.removeEventListener('change', placePanel);
    });
  }
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const links = [...nav.querySelectorAll('a')];
  function closeMenu(returnFocus = false) {
    nav.classList.remove('open');
    menu.setAttribute('aria-expanded', 'false');
    if (returnFocus) menu.focus();
  }
  menu.addEventListener('click', () => {
    const open = menu.getAttribute('aria-expanded') !== 'true';
    nav.classList.toggle('open', open);
    menu.setAttribute('aria-expanded', String(open));
    if (open && window.gsap && !reducedMotion.matches) {
      gsap.fromTo(links, { y: -8, opacity: 0 }, { y: 0, opacity: 1, duration: .3, stagger: .035, clearProps: 'all', overwrite: true });
    }
  });
  links.forEach(link => link.addEventListener('click', () => closeMenu()));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && nav.classList.contains('open')) closeMenu(true);
  });
  document.addEventListener('click', event => {
    if (!header.contains(event.target)) closeMenu();
  });
  matchMedia('(min-width: 901px)').addEventListener('change', () => closeMenu());
  // Active navigation and sticky-header state are independent of GSAP.
  let queued = false;
  const sections = links.map(link => document.querySelector(link.hash));
  function updateNavigation() {
    queued = false;
    header.classList.toggle('scrolled', scrollY > 20);
    let active = sections[0];
    sections.forEach(section => { if (section.getBoundingClientRect().top <= 160) active = section; });
    if (innerHeight + scrollY >= document.documentElement.scrollHeight - 5) active = sections[sections.length - 1];
    links.forEach(link => {
      if (link.hash === '#' + active.id) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }
  window.addEventListener('scroll', () => {
    if (!queued) { queued = true; requestAnimationFrame(updateNavigation); }
  }, { passive: true });
  updateNavigation();
  // Original decorative waveform: no production footage or performance claims.
  const waveform = document.querySelector('.waveform');
  for (let i = 0; i < 80; i++) {
    const bar = document.createElement('span');
    bar.style.setProperty('--bar', `${10 + Math.abs(Math.sin(i * .64) * Math.cos(i * .19)) * 85}%`);
    waveform.append(bar);
  }
  if (!window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);
  // Pin measurements temporarily reset scroll position. CSS smooth scrolling
  // must not animate those resets or the hero's start is measured mid-scroll.
  let refreshScrollFrame = 0;
  let savedScrollBehavior;
  const refreshScrollStart = () => {
    cancelAnimationFrame(refreshScrollFrame);
    if (savedScrollBehavior === undefined) savedScrollBehavior = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = 'auto';
  };
  const refreshScrollEnd = () => {
    refreshScrollFrame = requestAnimationFrame(() => {
      document.documentElement.style.scrollBehavior = savedScrollBehavior;
      savedScrollBehavior = undefined;
      refreshScrollFrame = 0;
    });
  };
  ScrollTrigger.addEventListener('refreshInit', refreshScrollStart);
  ScrollTrigger.addEventListener('refresh', refreshScrollEnd);
  // Context owns all animation/ScrollTrigger instances. matchMedia reverts on
  // preference and breakpoint changes; listeners are removed in each context.
  const media = gsap.matchMedia();
  let headingOriginals = [];
  function splitWords() {
    document.querySelectorAll('.reveal-heading').forEach(heading => {
      headingOriginals.push([heading, heading.innerHTML]);
      const walker = document.createTreeWalker(heading, NodeFilter.SHOW_TEXT);
      const nodes = [];
      while (walker.nextNode()) nodes.push(walker.currentNode);
      nodes.forEach(node => {
        const fragment = document.createDocumentFragment();
        node.textContent.split(/(\s+)/).forEach(word => {
          if (!word.trim()) fragment.append(document.createTextNode(word));
          else {
            const span = document.createElement('span');
            span.className = 'motion-word'; span.textContent = word;
            fragment.append(span);
          }
        });
        node.replaceWith(fragment);
      });
    });
  }
  media.add({ animate: '(prefers-reduced-motion: no-preference)', desktop: '(min-width: 901px)' }, context => {
    if (!context.conditions.animate) return;
    splitWords();
    const desktop = context.conditions.desktop;
    const entrance = gsap.timeline({ defaults: { ease: 'power3.out', duration: .9 } });
    entrance.from('.hero-topline, .hero-role', { y: 15, opacity: 0, stagger: .1 })
      .from('.hero h1 > span', { y: 30, opacity: 0, stagger: .14 }, '-=.65')
      .from('.hero-headline, .hero-description, .hero-actions', { y: 20, opacity: 0, stagger: .12 }, '-=.6')
      .from('.pipeline', { y: 24, opacity: 0, duration: 1 }, '-=.9')
      .from('.pipeline-node', { x: 16, opacity: 0, stagger: .08, duration: .5 }, '-=.6')
      // This HTML panel stays visible from first paint; only its position enters.
      .from('.system-panel', { y: 8, duration: .55, clearProps: 'transform' }, 0);
    gsap.utils.toArray('.reveal-heading').forEach(heading => {
      gsap.from(heading.querySelectorAll('.motion-word'), { y: desktop ? 24 : 12, opacity: 0, duration: .65, stagger: .035, ease: 'power2.out', scrollTrigger: { trigger: heading, start: 'top 93%', once: true } });
    });
    gsap.utils.toArray('.reveal').forEach(element => {
      gsap.from(element, { y: desktop ? 30 : 18, opacity: 0, duration: .7, ease: 'power2.out', scrollTrigger: { trigger: element, start: 'top 93%', once: true } });
    });
    gsap.from('.tech-card', { y: 24, opacity: 0, duration: .6, stagger: .045, scrollTrigger: { trigger: '.technology-grid', start: 'top 90%', once: true } });
    gsap.from('.timeline-track > span', { scaleY: 0, ease: 'none', scrollTrigger: { trigger: '.timeline', start: 'top 70%', end: 'bottom 65%', scrub: .5 } });
    gsap.from('.production-visual', { opacity: .3, scale: .97, duration: 1, scrollTrigger: { trigger: '.production-visual', start: 'top 90%', once: true } });
    gsap.from('.production-contributions li', { y: 15, opacity: 0, stagger: .12, scrollTrigger: { trigger: '.production-contributions', start: 'top 90%', once: true } });
    gsap.from('.production-summary .tags > span', { y: 10, opacity: 0, stagger: .08, scrollTrigger: { trigger: '.production-summary .tags', start: 'top 93%', once: true } });
    gsap.to('.scroll-progress', { scaleX: 1, ease: 'none', scrollTrigger: { trigger: document.documentElement, start: 0, end: 'max', scrub: .15 } });
    if (desktop) {
      gsap.to('.visual-grid', { y: 45, ease: 'none', scrollTrigger: { trigger: '.production-visual', start: 'top bottom', end: 'bottom top', scrub: 1 } });
    }
    const hoverCleanups = [];
    if (matchMedia('(hover: hover)').matches) {
      document.querySelectorAll('.button, .contact-arrow, .tech-card, .portfolio-preview').forEach(element => {
        const target = element.classList.contains('portfolio-preview') ? element.querySelector('.preview-content') : element;
        const enter = () => gsap.to(target, { y: -4, scale: element.classList.contains('portfolio-preview') ? 1.025 : 1, duration: .3, overwrite: true });
        const leave = () => gsap.to(target, { y: 0, scale: 1, duration: .3, overwrite: true });
        element.addEventListener('mouseenter', enter); element.addEventListener('mouseleave', leave);
        hoverCleanups.push(() => { element.removeEventListener('mouseenter', enter); element.removeEventListener('mouseleave', leave); gsap.killTweensOf(target); gsap.set(target, { clearProps: 'transform' }); });
      });
    }
    return () => {
      hoverCleanups.forEach(cleanup => cleanup());
      headingOriginals.forEach(([heading, html]) => { heading.innerHTML = html; });
      headingOriginals = [];
    };
  });
  document.fonts.ready.then(() => ScrollTrigger.refresh());
  window.addEventListener('pagehide', event => { if (!event.persisted) media.revert(); });
  window.addEventListener('pageshow', event => { if (event.persisted) ScrollTrigger.refresh(); });
})();
