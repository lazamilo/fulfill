(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGsap = typeof gsap !== 'undefined';
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  /* Duplicate marquee for seamless loop */
  const track = $('.marquee__track');
  if (track) track.innerHTML += track.innerHTML;

  /* Split mission statement into words */
  $$('[data-words]').forEach(el => {
    el.innerHTML = el.textContent.trim().split(/\s+/).map(w => `<span class="w">${w}</span>`).join(' ');
  });

  /* Nav: solid on scroll, hide on scroll down */
  const nav = $('[data-nav]');
  let lastY = 0;
  const onScroll = y => {
    nav.classList.toggle('is-solid', y > 40);
    if (!nav.classList.contains('is-open') && !document.body.classList.contains('menu-open')) {
      nav.classList.toggle('is-hidden', y > lastY && y > 400);
    }
    lastY = y;
  };

  /* Mega menu */
  const mega = $('[data-mega]');
  const inner = $('.mega__inner');
  let closeT;
  const openMenu = key => {
    clearTimeout(closeT);
    $$('.mega__panel').forEach(p => p.classList.toggle('is-active', p.dataset.panel === key));
    $$('.nav__item').forEach(i => i.classList.toggle('is-active', i.dataset.menu === key));
    nav.classList.add('is-open');
    mega.style.height = inner.offsetHeight + 'px';
  };
  const closeMenu = () => {
    closeT = setTimeout(() => {
      mega.style.height = '0px';
      nav.classList.remove('is-open');
      $$('.nav__item').forEach(i => i.classList.remove('is-active'));
    }, 120);
  };
  $$('.nav__item[data-menu]').forEach(i => {
    i.addEventListener('mouseenter', () => openMenu(i.dataset.menu));
    i.querySelector('button').addEventListener('click', () => openMenu(i.dataset.menu));
  });
  $$('.nav__item:not([data-menu])').forEach(i => i.addEventListener('mouseenter', closeMenu));
  nav.addEventListener('mouseleave', closeMenu);
  mega.addEventListener('mouseenter', () => clearTimeout(closeT));
  $$('.mega a').forEach(a => a.addEventListener('click', closeMenu));

  /* Mobile menu */
  $('[data-burger]').addEventListener('click', () => document.body.classList.toggle('menu-open'));
  $$('.mobile-menu a').forEach(a => a.addEventListener('click', () => document.body.classList.remove('menu-open')));

  /* Programs hover swap */
  const stageImgs = $$('[data-stage] img');
  const items = $$('.programs__list li');
  const setProg = n => {
    stageImgs.forEach(img => img.classList.toggle('is-active', img.dataset.img === String(n)));
    items.forEach(li => li.classList.toggle('is-active', li.dataset.prog === String(n)));
  };
  items.forEach(li => li.addEventListener('mouseenter', () => setProg(li.dataset.prog)));
  setProg(0);

  /* Counters */
  const fmt = (v, d) => d ? v.toFixed(d) : Math.round(v).toLocaleString('en-US');
  const countUp = el => {
    const end = parseFloat(el.dataset.count), d = parseInt(el.dataset.decimals || 0, 10);
    if (reduce || !hasGsap) { el.textContent = fmt(end, d); return; }
    const o = { v: 0 };
    gsap.to(o, { v: end, duration: 2, ease: 'power3.out', onUpdate: () => el.textContent = fmt(o.v, d), onComplete: () => el.textContent = fmt(end, d) });
  };

  const finishLoader = () => { const l = $('.loader'); if (l) l.remove(); };

  if (!hasGsap || reduce) {
    finishLoader();
    $$('[data-count]').forEach(countUp);
    $$('.mission__statement .w').forEach(w => w.style.color = 'inherit');
    addEventListener('scroll', () => onScroll(scrollY), { passive: true });
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  /* Lenis smooth scroll */
  let lenis;
  if (typeof Lenis !== 'undefined') {
    lenis = new Lenis({ lerp: 0.1 });
    lenis.on('scroll', ScrollTrigger.update);
    lenis.on('scroll', e => onScroll(e.scroll));
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
      const id = a.getAttribute('href');
      if (id.length > 1 && $(id)) { e.preventDefault(); lenis.scrollTo($(id), { offset: -80 }); }
    }));
  } else {
    addEventListener('scroll', () => onScroll(scrollY), { passive: true });
  }

  /* Intro: logo loader, then hero */
  const intro = gsap.timeline();
  intro.to('.loader img', { opacity: 1, y: 0, duration: .6, ease: 'power2.out' })
       .to('.loader', { clipPath: 'inset(0 0 100% 0)', duration: .9, ease: 'expo.inOut' }, '+=.35')
       .add(finishLoader)
       .from('.hero__media img', { scale: 1.35, duration: 2.2, ease: 'expo.out' }, '-=.75')
       .from('.hero__title .line>span', { yPercent: 105, duration: 1.2, stagger: .1, ease: 'expo.out' }, '<.15')
       .from(['.hero__lede', '.hero__actions', '.nav'], { y: 24, opacity: 0, duration: .9, stagger: .08, ease: 'power3.out' }, '<.4');
  gsap.set('.loader', { clipPath: 'inset(0 0 0% 0)' });
  gsap.set('.loader img', { y: 14 });

  /* Hero parallax */
  gsap.to('.hero__media img', { yPercent: 12, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });

  /* Generic reveals */
  $$('.reveal').forEach(el => {
    gsap.from(el, { y: 60, opacity: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 88%' } });
  });

  /* Counters on view */
  $$('[data-count]').forEach(el => ScrollTrigger.create({ trigger: el, start: 'top 90%', once: true, onEnter: () => countUp(el) }));

  /* Mission word colour scrub */
  gsap.to('.mission__statement .w', {
    color: '#22266e', stagger: .05, ease: 'none',
    scrollTrigger: { trigger: '.mission__statement', start: 'top 80%', end: 'bottom 45%', scrub: true }
  });

  /* Image parallax inside frames */
  $$('.parallax img').forEach(img => {
    gsap.fromTo(img, { yPercent: -10 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
  });

  /* Path to Plenty expanding frame */
  gsap.to('[data-expand]', {
    width: '100%', height: '100%', borderRadius: 0, ease: 'none',
    scrollTrigger: { trigger: '.plenty__pin', start: 'top top', end: '+=90%', scrub: true, pin: true }
  });
  gsap.from('.plenty__overlay > *', { y: 50, opacity: 0, stagger: .1, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: '.plenty__pin', start: 'top 40%' } });

  /* Paths: staggered lift */
  gsap.from('.path figure img', { scale: 1.25, duration: 1.6, ease: 'expo.out', stagger: .12, scrollTrigger: { trigger: '.paths__grid', start: 'top 80%' } });

  /* Programs: activate by scroll on desktop */
  items.forEach(li => ScrollTrigger.create({ trigger: li, start: 'top 55%', end: 'bottom 55%', onToggle: s => s.isActive && setProg(li.dataset.prog) }));

  /* Footer giant line */
  gsap.from('.footer__giant', { xPercent: 8, opacity: 0, duration: 1.6, ease: 'expo.out', scrollTrigger: { trigger: '.footer__giant', start: 'top 95%' } });

  addEventListener('load', () => ScrollTrigger.refresh());
})();
