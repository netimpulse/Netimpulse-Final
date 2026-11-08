/* Animierte Arbeitsflächen der Leistungsseiten (Port von ServiceVisuals). Start im fertigen Zustand, anhaltbar. */
(function () {
  'use strict';
  const NI = window.NI;
  if (!NI) return;

  const TIMING = {
    seo: [5, 1100, 2800],
    sea: [5, 900, 3000],
    smm: [5, 1300, 3000],
    geo: [8, 1100, 2600],
    webdesign: [5, 1200, 3000],
  };

  class ServiceVisual extends HTMLElement {
    connectedCallback() {
      if (this.loop) return;
      this.kind = this.dataset.visual;
      this.n = Number(this.dataset.rows) || 0;
      let t = TIMING[this.kind];
      if (this.kind === 'ki') t = [this.n + 1, 1100, 2600];
      if (this.kind === 'geo') t = [Math.max(2, this.n * 2), 1100, 2600];
      if (this.kind === 'smm') t = [this.n + 1, 1300, 3000];
      if (this.kind === 'sea') t = [this.n + 1, 900, 3000];
      if (this.kind === 'seo') t = [this.n + 1, 1100, 2800];
      if (this.kind === 'webdesign') {
        const steps = (this.querySelector('[data-build]').dataset.steps || '').split('|').map((x) => x.trim()).filter(Boolean);
        this.steps = steps;
        t = [Math.max(2, steps.length), 1200, 3000];
      }
      if (!t) return;
      this.btn = this.querySelector('.vis-bar .icon-btn');
      this.loop = new NI.Loop(this, { count: t[0], ms: t[1], hold: t[2], onStep: (s, paused) => this.render(s, paused) });
      this.btn.addEventListener('click', () => this.loop.toggle());
    }
    disconnectedCallback() {
      if (this.loop) this.loop.destroy();
      this.loop = null;
    }
    checks(s, from) {
      this.querySelectorAll('[data-check]').forEach((el) => {
        const i = Number(el.dataset.check);
        el.classList.toggle('is-on', s >= (from === undefined ? i : from));
      });
    }
    render(s, paused) {
      NI.setPauseButton(this.btn, paused);
      this.dataset.step = s;
      const f = this['r_' + this.kind];
      if (f) f.call(this, s);
    }
    // SEO: das eigene Ergebnis klettert nach oben
    r_seo(s) {
      const total = this.n + 1;
      const rank = Math.max(1, total - s);
      const own = this.querySelector('[data-row="own"]');
      const others = Array.from(this.querySelectorAll('.serp-rank li:not(.is-own)'));
      const order = others.slice();
      order.splice(rank - 1, 0, own);
      order.forEach((li, pos) => {
        li.style.transform = `translateY(${pos * 64}px)`;
        li.querySelector('.serp-pos').textContent = pos + 1;
      });
      this.checks(s);
    }
    // SEA: Kennzahlen erscheinen nacheinander
    r_sea(s) {
      this.querySelectorAll('.kpi').forEach((k, i) => k.classList.toggle('is-on', s > i));
    }
    // SMM: A/B-Test, am Ende gewinnt die markierte Variante
    r_smm(s) {
      const rows = Array.from(this.querySelectorAll('.ab li'));
      const done = s === rows.length;
      const cur = rows[Math.min(rows.length - 1, s)];
      const win = rows.find((r) => r.dataset.win === 'true') || rows[rows.length - 1];
      const show = done ? win : cur;
      const label = this.querySelector('[data-variant-label]');
      label.textContent = `${label.dataset.variantLabel} ${show.dataset.label}`;
      const img = this.querySelector('[data-post]');
      const p = img.querySelector('p');
      if (p.textContent !== show.dataset.text) {
        p.textContent = show.dataset.text;
        img.classList.remove('fade-in');
        void img.offsetWidth;
        img.classList.add('fade-in');
      }
      rows.forEach((r, i) => {
        const on = s >= i;
        r.classList.toggle('is-on', on);
        r.querySelector('.ab-bar i').style.transform = `scaleX(${on ? r.dataset.scale : 0})`;
        r.querySelector('.ab-r').textContent = on ? `${r.dataset.rate} %` : '–';
      });
      rows.forEach((r) => r.classList.toggle('is-win', done && r === win));
      const note = this.querySelector('[data-note]');
      note.textContent = done ? note.dataset.noteDone : note.dataset.note;
    }
    // GEO: Systeme werden der Reihe nach geprüft, die Quelle wird zitiert
    r_geo(s) {
      const e = Math.floor(s / 2);
      const cited = s % 2 === 1;
      this.querySelectorAll('.engine').forEach((el, i) => {
        const isCited = i < e || (i === e && cited);
        el.classList.toggle('is-active', i === e);
        el.classList.toggle('is-cited', isCited);
        el.querySelector('[data-check]').hidden = !isCited;
      });
      const a = this.querySelector('[data-answer]');
      if (this._e !== e) {
        this._e = e;
        a.classList.remove('fade-in');
        void a.offsetWidth;
        a.classList.add('fade-in');
      }
      a.querySelector('.chat-src').classList.toggle('is-on', cited);
    }
    // Webdesign: Seite baut sich Schritt für Schritt auf
    r_webdesign(s) {
      const total = this.steps.length;
      const title = this.querySelector('[data-vis-title]');
      title.textContent = (title.dataset.template || '').replace('[n]', String(s + 1).padStart(2, '0'));
      this.querySelector('[data-vis-tag]').textContent = this.steps[s] || '';
      this.querySelector('.build-progress i').style.transform = `scaleX(${(s + 1) / total})`;
      this.querySelector('[data-build]').className = 'build s' + s;
    }
    // KI: eine Anfrage läuft automatisch durch
    r_ki(s) {
      this.querySelectorAll('.flow li').forEach((li, i) => {
        li.classList.toggle('is-done', i < s);
        li.classList.toggle('is-on', i === s);
        li.querySelector('[data-i="orig"]').hidden = i < s;
        li.querySelector('[data-i="check"]').hidden = !(i < s);
      });
      this.checks(s, this.n);
    }
  }
  NI.define('service-visual', ServiceVisual);
})();
