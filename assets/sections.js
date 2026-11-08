/*
 * NetImpulse Theme – Bausteine der Inhalts-Sections
 * Problem-Karten, Leistungs-Orbit, Leistungs-Leiste, Werte-Streifen, Paket-Baukasten.
 */
(function () {
  'use strict';
  const NI = window.NI;
  if (!NI) return;

  /* Scroll-Fortschritt eines Elements (0..1), Port von useScrollProgress */
  function scrollProgress(el, span, cb) {
    if (NI.reduced()) {
      cb(1);
      return () => {};
    }
    let raf = 0;
    const on = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        const vh = window.innerHeight;
        cb(Math.round(Math.max(0, Math.min(1, (vh - r.top) / (vh * span))) * 100) / 100);
      });
    };
    on();
    window.addEventListener('scroll', on, { passive: true });
    window.addEventListener('resize', on);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', on);
      window.removeEventListener('resize', on);
    };
  }

  /* ---------- Problem-Karten ---------- */
  class ProblemRow extends HTMLElement {
    connectedCallback() {
      if (this.stop) return;
      const row = this.querySelector('.pb-row');
      const goal = this.querySelector('.pb-goal');
      this.stop = scrollProgress(this, 0.6, (p) => {
        const m = Math.max(0, Math.min(1, (p - 0.75) / 0.25));
        this.style.setProperty('--p', p);
        this.style.setProperty('--m', m);
        row.classList.toggle('is-joined', p >= 0.98);
        if (goal) goal.classList.toggle('is-on', m >= 1);
      });
    }
    disconnectedCallback() {
      if (this.stop) this.stop();
      this.stop = null;
    }
  }
  NI.define('problem-row', ProblemRow);

  /* ---------- Leistungs-Orbit ---------- */
  const R = 160;
  const SVG_NS = 'http://www.w3.org/2000/svg';

  class ServiceOrbit extends HTMLElement {
    connectedCallback() {
      if (this._ready) return;
      this._ready = true;
      this.nodes = Array.from(this.querySelectorAll('.orbit-node'));
      this.n = this.nodes.length;
      if (!this.n) return;
      this.step = 360 / this.n;
      this.active = 0;
      this.angle = 0;
      this.stage = this.querySelector('.orbit-stage');
      this.rot = this.querySelector('.orbit-rot');
      this.spokes = this.querySelector('[data-spokes]');
      this.chords = this.querySelector('[data-chords]');
      this.detail = this.dataset.mode === 'detail';
      this.keys = this.nodes.map((b) => b.dataset.key);

      this.layout();
      this.paint();

      this.nodes.forEach((b, i) => b.addEventListener('click', () => this.go(i)));

      if (this.detail) {
        this.cards = this.keys.map((k) => this.querySelector(`.oc[data-key="${k}"]`)).filter(Boolean);
        this.io = new IntersectionObserver(
          (entries) => {
            const vis = entries.filter((e) => e.isIntersecting);
            if (vis[0]) this.turnTo(this.cards.indexOf(vis[0].target));
          },
          { rootMargin: '-44% 0px -44% 0px' }
        );
        this.cards.forEach((c) => this.io.observe(c));
      }

      this.onBlockSelect = (e) => {
        const i = this.nodes.findIndex((b) => b.contains(e.target) || b === e.target);
        if (i >= 0) this.turnTo(i);
      };
      document.addEventListener('shopify:block:select', this.onBlockSelect);
    }
    pos(i) {
      const a = (i * this.step * Math.PI) / 180;
      return [Math.cos(a), Math.sin(a)];
    }
    layout() {
      const C = 2 * Math.PI * R;
      const g1 = this.nodes.filter((b) => b.dataset.group !== 'a2').length;
      const arc = (el, from, count) => {
        if (!el) return;
        if (!count) {
          el.style.display = 'none';
          return;
        }
        const len = ((count * this.step - 4) / 360) * C;
        const start = from * this.step - this.step / 2 + 2;
        el.setAttribute('stroke-dasharray', `${len} ${C}`);
        el.setAttribute('stroke-dashoffset', String((-start / 360) * C));
      };
      arc(this.querySelector('[data-arc="a1"]'), 0, g1);
      arc(this.querySelector('[data-arc="a2"]'), g1, this.n - g1);

      this.spokes.innerHTML = '';
      this.nodes.forEach((b, i) => {
        const [x, y] = this.pos(i);
        b.style.setProperty('--cx', x);
        b.style.setProperty('--cy', y);
        const line = document.createElementNS(SVG_NS, 'line');
        line.setAttribute('class', 'spoke');
        line.setAttribute('x1', 200);
        line.setAttribute('y1', 200);
        line.setAttribute('x2', 200 + R * x);
        line.setAttribute('y2', 200 + R * y);
        this.spokes.append(line);
      });
    }
    pairsOf(i) {
      const raw = (this.nodes[i].dataset.pairs || '').split(',').map((s) => s.trim().toLowerCase().replace(/\s+/g, '-')).filter(Boolean);
      return raw.map((k) => this.keys.indexOf(k)).filter((x) => x >= 0 && x !== i);
    }
    paint() {
      const i = this.active;
      const cur = this.nodes[i];
      const pairs = this.pairsOf(i);
      this.nodes.forEach((b, j) => {
        b.classList.toggle('is-on', j === i);
        b.classList.toggle('is-pair', pairs.includes(j));
        b.setAttribute('aria-pressed', j === i ? 'true' : 'false');
      });
      Array.from(this.spokes.children).forEach((l, j) => l.classList.toggle('is-on', j === i));
      this.chords.innerHTML = '';
      const [x1, y1] = this.pos(i);
      pairs.forEach((j) => {
        const [x2, y2] = this.pos(j);
        const line = document.createElementNS(SVG_NS, 'line');
        line.setAttribute('class', 'chord');
        line.setAttribute('x1', 200 + R * x1);
        line.setAttribute('y1', 200 + R * y1);
        line.setAttribute('x2', 200 + R * x2);
        line.setAttribute('y2', 200 + R * y2);
        this.chords.append(line);
      });
      const a2 = cur.dataset.group === 'a2';
      this.stage.classList.toggle('sk-a2', a2);
      this.stage.style.setProperty('--oa', a2 ? 'var(--a2)' : 'var(--a1)');
      this.rot.style.setProperty('--rot', this.angle + 'deg');
      const core = this.querySelector('.orbit-core');
      core.querySelector('.orbit-core-name').textContent = cur.dataset.name;
      core.querySelector('.orbit-core-long').textContent = cur.dataset.long;
      core.querySelector('[data-core-group]').textContent = a2 ? this.dataset.group2 : this.dataset.group1;
      if (this.cards) this.cards.forEach((c, j) => c.classList.toggle('is-on', j === i));
    }
    turnTo(target) {
      if (target < 0 || target === this.active) return;
      const half = Math.floor(this.n / 2);
      const d = ((target - this.active + this.n + half) % this.n) - half;
      this.active = target;
      this.angle -= d * this.step;
      this.paint();
    }
    go(i) {
      const target = (i + this.n) % this.n;
      const key = this.keys[target];
      if (this.detail) {
        const el = this.cards[target];
        if (el) {
          const top = el.getBoundingClientRect().top + window.scrollY - window.innerHeight / 2 + Math.min(el.offsetHeight / 2, 160);
          window.scrollTo({ top, behavior: NI.reduced() ? 'auto' : 'smooth' });
        }
      } else if (document.getElementById('l-' + key)) {
        NI.scrollToId('l-' + key);
      }
      this.turnTo(target);
    }
    disconnectedCallback() {
      this._ready = false;
      if (this.io) this.io.disconnect();
      document.removeEventListener('shopify:block:select', this.onBlockSelect);
    }
  }
  NI.define('service-orbit', ServiceOrbit);

  NI.scrollProgress = scrollProgress;
})();
