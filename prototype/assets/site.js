/* NetImpulse Prototyp: Verhalten für alle Seiten. Jeder Baustein startet nur, wenn sein Markup da ist. */
(() => {
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGsap = typeof gsap !== 'undefined';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  if (hasGsap) gsap.registerPlugin(ScrollTrigger);

  /* Hinweis-Leiste */
  const toastEl = document.createElement('div');
  toastEl.className = 'toast'; toastEl.setAttribute('role', 'status');
  document.body.appendChild(toastEl);
  let toastTimer;
  const toast = (text) => { toastEl.textContent = text; toastEl.classList.add('is-on'); clearTimeout(toastTimer); toastTimer = setTimeout(() => toastEl.classList.remove('is-on'), 3200); };

  /* Weiches Scrollen */
  let lenis = null;
  if (hasGsap && !calm && typeof Lenis !== 'undefined') {
    lenis = new Lenis({ duration: 1.05 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  const jump = (target) => { if (lenis) lenis.scrollTo(target, { offset: -76 }); else target.scrollIntoView(); };
  $$('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
    const id = a.getAttribute('href');
    const t = id.length > 1 && $(id);
    if (t) { e.preventDefault(); jump(t); }
  }));
  if (location.hash && $(location.hash)) setTimeout(() => jump($(location.hash)), 300);

  /* Menü: Aufklapper und mobile Fläche */
  const dd = $('.dd');
  if (dd) {
    const btn = $('button', dd), panel = $('.dd-panel', dd);
    const set = (open) => { panel.hidden = !open; btn.setAttribute('aria-expanded', open); };
    btn.addEventListener('click', () => set(panel.hidden));
    document.addEventListener('click', (e) => { if (!dd.contains(e.target)) set(false); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !panel.hidden) { set(false); btn.focus(); } });
  }
  const sheet = $('.sheet-nav'), burger = $('.burger');
  if (sheet && burger) {
    const set = (open) => { sheet.hidden = !open; burger.setAttribute('aria-expanded', open); document.documentElement.style.overflow = open ? 'hidden' : ''; if (lenis) open ? lenis.stop() : lenis.start(); if (open) $('button', sheet).focus(); };
    burger.addEventListener('click', () => set(true));
    $('button', sheet).addEventListener('click', () => { set(false); burger.focus(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !sheet.hidden) { set(false); burger.focus(); } });
    $$('a', sheet).forEach((a) => a.addEventListener('click', () => set(false)));
  }

  /* Hero: Zeilen der Überschrift fahren einmal ein */
  const lines = $$('.hero h1 .ln > span');
  if (lines.length && hasGsap && !calm) gsap.from(lines, { yPercent: 105, duration: 0.9, ease: 'power3.out', stagger: 0.09, delay: 0.05 });

  /* Rad */
  $$('.orbit').forEach((orbit) => {
    const data = JSON.parse($('script', orbit).textContent);
    const mode = orbit.dataset.mode;
    const holder = $('.orbit-nodes', orbit);
    const arc = $('.arc', orbit), links = $('.links', orbit);
    const title = $('[data-core-title]', orbit), sub = $('[data-core-sub]', orbit), link = $('[data-core-link]', orbit);
    const n = data.length, step = 360 / n, R = 0.42;
    const state = { rot: 0 };
    let active = 0, timer = null;
    const nodes = data.map((s, i) => {
      const el = document.createElement('div'); el.className = 'orbit-node';
      const b = document.createElement('button'); b.type = 'button'; b.textContent = s.name; b.setAttribute('aria-pressed', 'false');
      b.addEventListener('click', () => { select(i); stop(); if (mode === 'jump') { const t = document.getElementById('l-' + s.key); if (t) jump(t); } });
      el.appendChild(b); holder.appendChild(el); return el;
    });
    const pos = (i) => { const a = (i * step + state.rot - 90) * Math.PI / 180; return [Math.cos(a), Math.sin(a)]; };
    const place = () => {
      const r = orbit.clientWidth * R;
      nodes.forEach((el, i) => { const [x, y] = pos(i); el.style.transform = `translate(${x * r}px, ${y * r}px)`; });
      /* gestrichelte Verbindungen zu den Leistungen, mit denen die aktive zusammenarbeitet */
      links.innerHTML = '';
      (data[active].pairs || []).forEach((key) => {
        const j = data.findIndex((d) => d.key === key); if (j < 0) return;
        const [x1, y1] = pos(active), [x2, y2] = pos(j);
        const l = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        l.setAttribute('class', 'link');
        l.setAttribute('x1', 200 + x1 * 168); l.setAttribute('y1', 200 + y1 * 168); l.setAttribute('x2', 200 + x2 * 168); l.setAttribute('y2', 200 + y2 * 168);
        links.appendChild(l);
      });
    };
    function select(i) {
      active = (i + n) % n;
      const s = data[active];
      nodes.forEach((el, k) => { el.classList.toggle('is-on', k === active); el.firstChild.setAttribute('aria-pressed', k === active); });
      title.textContent = s.promise; sub.textContent = s.long; link.href = s.url; $('span', link).textContent = s.label;
      const len = 2 * Math.PI * 168; arc.style.strokeDasharray = len; arc.style.strokeDashoffset = len * (1 - (active + 1) / n);
      let target = -active * step;
      while (target - state.rot > 180) target -= 360;
      while (target - state.rot < -180) target += 360;
      if (hasGsap && !calm) gsap.to(state, { rot: target, duration: 0.9, ease: 'power3.inOut', onUpdate: place });
      else { state.rot = target; place(); }
    }
    const start = () => { if (!calm && !timer && mode !== 'jump') timer = setInterval(() => select(active + 1), 3400); };
    const stop = () => { clearInterval(timer); timer = null; };
    orbit.addEventListener('pointerenter', stop);
    orbit.addEventListener('focusin', stop);
    orbit.addEventListener('pointerleave', start);
    new ResizeObserver(place).observe(orbit);
    select(0); start();
  });

  /* Hero-Ringe drehen mit dem Scrollen leicht mit */
  const rings = $('.hero-rings');
  if (rings && hasGsap && !calm) gsap.to(rings, { rotate: 40, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 0.6 } });

  /* Leistungsstrecke */
  const run = $('.run');
  if (run) {
    const track = $('.run-track', run), bar = $('.run-bar i', run);
    const wide = matchMedia('(min-width: 900px) and (min-height: 640px)');
    if (hasGsap && !calm && wide.matches) {
      const dist = () => Math.max(0, track.scrollWidth - window.innerWidth);
      gsap.to(track, { x: () => -dist(), ease: 'none', scrollTrigger: { trigger: '.run-pin', pin: true, start: 'top top', end: () => '+=' + dist(), scrub: 0.5, invalidateOnRefresh: true, onUpdate: (s) => { bar.style.transform = `scaleX(${s.progress})`; } } });
    } else run.classList.add('is-native');
  }

  /* Entwurf wird zur fertigen Seite */
  $$('.wipe').forEach((wipe) => {
    const range = $('input', wipe);
    let touched = false;
    const set = (v) => wipe.style.setProperty('--cut', v + '%');
    range.addEventListener('input', () => { touched = true; set(range.value); });
    if (hasGsap && !calm) {
      const o = { v: 12 };
      set(12);
      gsap.to(o, { v: 100, ease: 'none', scrollTrigger: { trigger: wipe, start: 'top 80%', end: 'bottom 55%', scrub: 0.5 }, onUpdate: () => { if (!touched) { set(o.v); range.value = o.v; } } });
    } else set(range.value);
  });

  /* Pfad auf Über uns zeichnet sich */
  const vline = $('.vpath svg path');
  if (vline && hasGsap && !calm) {
    const len = vline.getTotalLength();
    gsap.set(vline, { strokeDasharray: len, strokeDashoffset: len });
    gsap.to(vline, { strokeDashoffset: 0, ease: 'none', scrollTrigger: { trigger: '.vpath', start: 'top 70%', end: 'bottom 75%', scrub: 0.6 } });
  }

  /* Baukasten auf den Leistungsseiten */
  const cat = $('[data-catalog]');
  if (cat) {
    const offers = $$('.offer', cat), count = $('[data-count]', cat), go = $('[data-go]', cat);
    const total = offers.length;
    const update = () => {
      const picked = offers.filter((o) => o.getAttribute('aria-pressed') === 'true').map((o) => $('b', o).textContent);
      count.textContent = picked.length ? `${picked.length} von ${total} ausgewählt: ${picked.join(', ')}` : cat.dataset.empty;
      go.toggleAttribute('disabled', !picked.length);
      try { sessionStorage.setItem('ni-auswahl', JSON.stringify({ topic: cat.dataset.topic, items: picked })); } catch (e) {}
    };
    offers.forEach((o) => o.addEventListener('click', () => { o.setAttribute('aria-pressed', o.getAttribute('aria-pressed') !== 'true'); update(); }));
    go.addEventListener('click', () => { location.href = 'kontakt.html'; });
    update();
  }

  /* Anfrage-Band */
  $$('[data-ask]').forEach((form) => form.addEventListener('submit', (e) => {
    e.preventDefault();
    const picked = $$('input:checked', form).map((i) => i.value);
    try { sessionStorage.setItem('ni-auswahl', JSON.stringify({ topic: picked.join(', '), items: [] })); } catch (err) {}
    location.href = 'kontakt.html';
  }));

  /* Kontaktformular */
  const form = $('[data-contact]');
  if (form) {
    try {
      const saved = JSON.parse(sessionStorage.getItem('ni-auswahl') || 'null');
      if (saved) {
        $$('.chips input', form).forEach((i) => { if (saved.topic && saved.topic.includes(i.value)) i.checked = true; });
        if (saved.items && saved.items.length) $('#f-message').value = 'Mich interessieren diese Bausteine: ' + saved.items.join(', ') + '.\n\nKurz zu meinem Projekt: ';
      }
    } catch (e) {}
    const rules = { 'f-name': (v) => v.trim() ? '' : 'Bitte gib deinen Namen an.', 'f-email': (v) => /^\S+@\S+\.\S+$/.test(v.trim()) ? '' : 'Bitte gib eine gültige E-Mail-Adresse an.', 'f-message': (v) => v.trim().length > 9 ? '' : 'Schreib uns bitte kurz, worum es geht.' };
    const check = (id) => { const el = document.getElementById(id), msg = rules[id](el.value), err = document.getElementById(id + '-err'); err.textContent = msg; el.setAttribute('aria-invalid', msg ? 'true' : 'false'); return !msg; };
    Object.keys(rules).forEach((id) => document.getElementById(id).addEventListener('blur', () => check(id)));
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const bad = Object.keys(rules).filter((id) => !check(id));
      if (bad.length) { document.getElementById(bad[0]).focus(); return; }
      const btn = $('button[type="submit"]', form);
      btn.disabled = true; btn.firstChild.textContent = 'Wird vorbereitet … ';
      setTimeout(() => { form.hidden = true; $('.form-done').hidden = false; $('.form-done').focus(); try { sessionStorage.removeItem('ni-auswahl'); } catch (err) {} }, 700);
    });
  }

  /* Theme-Detail */
  const device = $('.device');
  if (device) $$('.seg button').forEach((b) => b.addEventListener('click', () => {
    $$('.seg button').forEach((x) => x.setAttribute('aria-pressed', x === b));
    device.classList.toggle('is-phone', b.dataset.view === 'phone');
  }));
  const buy = $('[data-buy]');
  if (buy) buy.addEventListener('click', () => {
    const extra = $$('.addon input:checked').map((i) => i.value);
    toast('Im Prototyp wird nichts gekauft. Gewählt: Theme Werkbank' + (extra.length ? ' mit ' + extra.join(', ') : ''));
  });
})();
