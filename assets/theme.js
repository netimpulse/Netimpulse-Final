/*
 * NetImpulse Theme – globale Bausteine
 * Header, Menü, Suche, Warenkorb-Hinweis, Sektions-Gliederung, Kontakt-Abschluss, Kopieren.
 * Alles als Custom Elements: Der Theme-Editor kann Sections neu rendern, connected/disconnected räumen auf.
 */
(function () {
  'use strict';

  const NI = (window.NI = window.NI || {});

  NI.reduced = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  NI.scrollToId = (id, offset = 88) => {
    const el = document.getElementById(id);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: NI.reduced() ? 'auto' : 'smooth' });
  };

  NI.define = (name, ctor) => {
    if (!customElements.get(name)) customElements.define(name, ctor);
  };

  NI.formatMoney = (cents) => {
    const fmt = (window.NI_SHOP && window.NI_SHOP.moneyFormat) || '{{amount_with_comma_separator}} €';
    const value = (cents / 100).toFixed(2);
    const [int, dec] = value.split('.');
    const withDots = int.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    const noDec = dec === '00' ? withDots : withDots + ',' + dec;
    return fmt
      .replace(/\{\{\s*amount_no_decimals_with_comma_separator\s*\}\}/, withDots)
      .replace(/\{\{\s*amount_with_comma_separator\s*\}\}/, withDots + ',' + dec)
      .replace(/\{\{\s*amount_no_decimals\s*\}\}/, int)
      .replace(/\{\{\s*amount\s*\}\}/, int + '.' + dec)
      .replace(/<[^>]*>/g, '')
      .replace(withDots + ',00', noDec);
  };

  /* ---------- Schrittweise Animation, nur sichtbar, pausierbar (Port von useLoop) ---------- */
  // Start im fertigen Zustand, damit das erste Bild vollständig ist (WCAG 2.2.2: anhaltbar).
  NI.Loop = class {
    constructor(el, { count, ms = 1000, hold = 2600, onStep }) {
      this.el = el;
      this.count = count;
      this.ms = ms;
      this.hold = hold;
      this.onStep = onStep;
      this.step = count - 1;
      this.paused = NI.reduced();
      this.visible = false;
      this.timer = null;
      this.io = new IntersectionObserver(([e]) => {
        this.visible = e.isIntersecting;
        this.schedule();
      }, { threshold: 0.25 });
      this.io.observe(el);
      this.render();
    }
    schedule() {
      clearTimeout(this.timer);
      if (this.paused || !this.visible) return;
      const wait = this.step === this.count - 1 ? this.hold : this.ms;
      this.timer = setTimeout(() => {
        this.step = (this.step + 1) % this.count;
        this.render();
        this.schedule();
      }, wait);
    }
    render() {
      if (this.onStep) this.onStep(this.step, this.paused);
    }
    toggle() {
      if (!this.paused) this.step = this.count - 1;
      this.paused = !this.paused;
      this.render();
      this.schedule();
      return this.paused;
    }
    destroy() {
      clearTimeout(this.timer);
      this.io.disconnect();
    }
  };

  // Pause-Button für Animationen: wechselt Icon und Beschriftung
  NI.setPauseButton = (btn, paused) => {
    if (!btn) return;
    btn.setAttribute('aria-label', paused ? btn.dataset.labelPlay : btn.dataset.labelPause);
    const play = btn.querySelector('[data-icon="play"]');
    const pause = btn.querySelector('[data-icon="pause"]');
    if (play) play.hidden = !paused;
    if (pause) pause.hidden = paused;
  };

  /* ---------- Dialog-Hilfe: Fokus halten, Escape, Scroll sperren ---------- */
  NI.Dialog = class {
    constructor(layer, panel, onClose) {
      this.layer = layer;
      this.panel = panel;
      this.onClose = onClose;
      this.prev = document.activeElement;
      this.onKey = this.onKey.bind(this);
      this.onClick = (e) => {
        if (e.target === this.layer) this.onClose();
      };
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', this.onKey);
      this.layer.addEventListener('click', this.onClick);
    }
    onKey(e) {
      if (e.key === 'Escape') {
        e.preventDefault();
        this.onClose();
        return;
      }
      if (e.key !== 'Tab') return;
      const f = this.panel.querySelectorAll('a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])');
      if (!f.length) return;
      const first = f[0];
      const last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
    release() {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', this.onKey);
      this.layer.removeEventListener('click', this.onClick);
      if (this.prev && this.prev.focus) this.prev.focus();
    }
  };

  /* ---------- Header ---------- */
  class SiteHeader extends HTMLElement {
    connectedCallback() {
      if (this._ready) return;
      this._ready = true;
      this.header = this.querySelector('.site-header');
      this.dd = this.querySelector('.nav-dd');
      this.ddBtn = this.dd && this.dd.querySelector('button.nav-link');
      this.ddPanel = this.dd && this.dd.querySelector('.dd-panel');
      this.closeTimer = null;

      this.onScroll = () => this.header && this.header.classList.toggle('is-scrolled', window.scrollY > 8);
      this.onKey = (e) => {
        if (e.key === 'Escape') this.setDd(false);
        const tag = (document.activeElement && document.activeElement.tagName) || '';
        if (e.key === '/' && !/input|textarea|select/i.test(tag) && !document.activeElement.isContentEditable) {
          const s = document.querySelector('search-dialog');
          if (s) {
            e.preventDefault();
            s.open();
          }
        }
      };
      this.onDown = (e) => {
        if (this.dd && !this.dd.contains(e.target)) this.setDd(false);
      };
      this.onScroll();
      window.addEventListener('scroll', this.onScroll, { passive: true });
      window.addEventListener('keydown', this.onKey);
      window.addEventListener('pointerdown', this.onDown);

      if (this.dd) {
        this.dd.addEventListener('mouseenter', () => {
          clearTimeout(this.closeTimer);
          this.setDd(true);
        });
        this.dd.addEventListener('mouseleave', () => {
          this.closeTimer = setTimeout(() => this.setDd(false), 140);
        });
        this.ddBtn.addEventListener('click', () => this.setDd(this.ddPanel.hidden));
      }
      this.querySelectorAll('[data-open-search]').forEach((b) =>
        b.addEventListener('click', () => {
          const s = document.querySelector('search-dialog');
          if (s) s.open();
        })
      );
      this.querySelectorAll('[data-open-menu]').forEach((b) =>
        b.addEventListener('click', () => {
          const m = this.querySelector('mobile-menu');
          if (m) m.open(b);
        })
      );
    }
    setDd(on) {
      if (!this.ddPanel) return;
      this.ddPanel.hidden = !on;
      this.ddBtn.setAttribute('aria-expanded', on ? 'true' : 'false');
      const chev = this.ddBtn.querySelector('.icon');
      if (chev) chev.classList.toggle('is-flipped', on);
    }
    disconnectedCallback() {
      this._ready = false;
      clearTimeout(this.closeTimer);
      window.removeEventListener('scroll', this.onScroll);
      window.removeEventListener('keydown', this.onKey);
      window.removeEventListener('pointerdown', this.onDown);
    }
  }
  NI.define('site-header', SiteHeader);

  class MobileMenu extends HTMLElement {
    open(trigger) {
      this.trigger = trigger;
      this.hidden = false;
      const layer = this.querySelector('.sheet-layer');
      const panel = this.querySelector('.sheet');
      if (trigger) trigger.setAttribute('aria-expanded', 'true');
      this.dialog = new NI.Dialog(layer, panel, () => this.close());
      const first = panel.querySelector('button');
      if (first) first.focus();
      this.querySelectorAll('[data-close]').forEach((b) => (b.onclick = () => this.close()));
      this.querySelectorAll('a').forEach((a) => (a.onclick = () => this.close(true)));
    }
    close(navigating) {
      if (this.hidden) return;
      this.hidden = true;
      if (this.trigger) this.trigger.setAttribute('aria-expanded', 'false');
      if (this.dialog) {
        if (navigating) this.dialog.prev = null;
        this.dialog.release();
      }
      this.dialog = null;
    }
    disconnectedCallback() {
      if (this.dialog) this.dialog.release();
      document.body.style.overflow = '';
    }
  }
  NI.define('mobile-menu', MobileMenu);

  /* ---------- Suche: Schnellzugriff aus einem Menü, beim Tippen Shopify Predictive Search ---------- */
  class SearchDialog extends HTMLElement {
    connectedCallback() {
      if (this._ready) return;
      this._ready = true;
      this.input = this.querySelector('input[type="search"]');
      this.list = this.querySelector('.search-results');
      this.hint = this.querySelector('.search-hint');
      this.quick = JSON.parse((this.querySelector('[data-quick]') || {}).textContent || '[]');
      this.active = 0;
      this.results = [];
      this.req = 0;
      this.input.addEventListener('input', () => this.update());
      this.input.addEventListener('keydown', (e) => this.onKey(e));
      this.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', () => this.close()));
    }
    open() {
      if (!this.hidden) return;
      this.hidden = false;
      this.dialog = new NI.Dialog(this.querySelector('.sheet-layer'), this.querySelector('.search-panel'), () => this.close());
      this.input.value = '';
      this.update();
      this.input.focus();
    }
    close() {
      if (this.hidden) return;
      this.hidden = true;
      if (this.dialog) this.dialog.release();
      this.dialog = null;
    }
    disconnectedCallback() {
      this._ready = false;
      if (this.dialog) this.dialog.release();
    }
    norm(s) {
      return (s || '').toLowerCase();
    }
    async update() {
      const q = this.input.value.trim();
      const n = this.norm(q);
      if (this.hint) this.hint.hidden = !!q;
      if (!n) {
        this.results = this.quick.filter((r) => r.featured);
        if (!this.results.length) this.results = this.quick.slice(0, 5);
        this.active = 0;
        this.render(q);
        return;
      }
      const local = this.quick.filter((r) => this.norm(r.t + ' ' + (r.sub || '') + ' ' + (r.k || '')).includes(n));
      this.results = local;
      this.active = 0;
      this.render(q);
      const id = ++this.req;
      try {
        const base = (window.NI_SHOP && window.NI_SHOP.predictiveUrl) || '/search/suggest';
        const url = `${base}.json?q=${encodeURIComponent(q)}&resources[type]=page,product,collection&resources[limit]=6&resources[options][fields]=title,product_type,variants.title,body`;
        const res = await fetch(url, { headers: { Accept: 'application/json' } });
        if (!res.ok || id !== this.req) return;
        const data = await res.json();
        const r = (data.resources && data.resources.results) || {};
        const seen = new Set(this.results.map((x) => x.u.split('?')[0]));
        const add = (items, group, sub) =>
          (items || []).forEach((it) => {
            const u = (it.url || '').split('?')[0];
            if (!u || seen.has(u)) return;
            seen.add(u);
            this.results.push({ t: it.title, u: it.url, group, sub: sub ? sub(it) : '' });
          });
        add(r.pages, this.dataset.pagesLabel);
        add(r.collections, this.dataset.pagesLabel);
        add(r.products, this.dataset.productsLabel, (p) => [p.type, p.price ? NI.formatMoney(Math.round(parseFloat(p.price) * 100)) : ''].filter(Boolean).join(' · '));
        this.results.sort((a, b) => (a.group === b.group ? 0 : a.group === this.dataset.pagesLabel ? -1 : 1));
        this.render(q);
      } catch (e) {
        /* Suche offline: lokale Treffer bleiben stehen */
      }
    }
    onKey(e) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        this.active = Math.min(this.results.length - 1, this.active + 1);
        this.paint();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        this.active = Math.max(0, this.active - 1);
        this.paint();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const r = this.results[this.active];
        if (r) window.location.href = r.u;
        else if (this.input.value.trim()) window.location.href = `${this.dataset.searchUrl}?q=${encodeURIComponent(this.input.value.trim())}`;
      }
    }
    render(q) {
      const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
      const arrow = this.querySelector('template[data-arrow]').innerHTML;
      if (!this.results.length) {
        this.list.innerHTML = `<li class="search-empty">${esc((this.dataset.empty || '').replace('[q]', q))}</li>`;
        this.input.removeAttribute('aria-activedescendant');
        return;
      }
      let last = null;
      this.list.innerHTML = this.results
        .map((r, i) => {
          const head = r.group !== last ? `<li class="search-group" role="presentation">${esc(r.group || '')}</li>` : '';
          last = r.group;
          return `${head}<li id="sr-${i}" role="option" aria-selected="false" class="search-item" data-i="${i}"><a href="${esc(r.u)}" tabindex="-1"><span>${esc(r.t)}</span>${r.sub ? `<span class="t-meta">${esc(r.sub)}</span>` : ''}${arrow}</a></li>`;
        })
        .join('');
      this.list.querySelectorAll('.search-item').forEach((li) => {
        li.addEventListener('mouseenter', () => {
          this.active = Number(li.dataset.i);
          this.paint();
        });
      });
      this.paint();
    }
    paint() {
      this.list.querySelectorAll('.search-item').forEach((li) => {
        const on = Number(li.dataset.i) === this.active;
        li.classList.toggle('is-active', on);
        li.setAttribute('aria-selected', on ? 'true' : 'false');
        if (on) {
          this.input.setAttribute('aria-activedescendant', li.id);
          li.scrollIntoView({ block: 'nearest' });
        }
      });
    }
  }
  NI.define('search-dialog', SearchDialog);

  /* ---------- Warenkorb-Hinweis ---------- */
  NI.toast = (title) => {
    const region = document.querySelector('.toast-region');
    const tpl = document.getElementById('toast-template');
    if (!region || !tpl) return;
    region.innerHTML = tpl.innerHTML.replace('[titel]', String(title).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]));
    clearTimeout(NI._toastTimer);
    NI._toastTimer = setTimeout(() => (region.innerHTML = ''), 4200);
  };

  NI.updateCartCount = async () => {
    try {
      const res = await fetch(((window.NI_SHOP && window.NI_SHOP.cartUrl) || '/cart') + '.js', { headers: { Accept: 'application/json' } });
      const cart = await res.json();
      const n = cart.items.filter((i) => !(i.properties && i.properties._addon_for)).length;
      document.querySelectorAll('[data-cart-count]').forEach((el) => {
        el.textContent = n;
        el.hidden = n === 0;
      });
      document.querySelectorAll('[data-cart-link]').forEach((el) => {
        const label = el.dataset.label || '';
        el.setAttribute('aria-label', label.replace('[n]', n));
      });
      return cart;
    } catch (e) {
      return null;
    }
  };

  /* ---------- Sektions-Gliederung (ab 1500 px) ---------- */
  class OutlineSpy extends HTMLElement {
    connectedCallback() {
      this.build();
      this.onLoad = () => this.build();
      document.addEventListener('shopify:section:load', this.onLoad);
      document.addEventListener('shopify:section:unload', this.onLoad);
      document.addEventListener('shopify:section:reorder', this.onLoad);
    }
    build() {
      if (this.io) this.io.disconnect();
      const secs = Array.from(document.querySelectorAll('[data-outline]')).filter((s) => s.getAttribute('data-outline').trim() && s.id);
      const ul = this.querySelector('ul');
      if (secs.length < 3) {
        this.hidden = true;
        return;
      }
      this.hidden = false;
      ul.innerHTML = '';
      secs.forEach((s) => {
        const li = document.createElement('li');
        const b = document.createElement('button');
        b.type = 'button';
        b.dataset.id = s.id;
        b.innerHTML = '<i aria-hidden="true"></i>';
        b.append(s.getAttribute('data-outline'));
        b.addEventListener('click', () => NI.scrollToId(s.id, 72));
        li.append(b);
        ul.append(li);
      });
      this.io = new IntersectionObserver(
        (entries) => {
          const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
          if (!vis[0]) return;
          ul.querySelectorAll('button').forEach((b) => {
            const on = b.dataset.id === vis[0].target.id;
            b.classList.toggle('is-active', on);
            if (on) b.setAttribute('aria-current', 'true');
            else b.removeAttribute('aria-current');
          });
        },
        { rootMargin: '-35% 0px -55% 0px' }
      );
      secs.forEach((s) => this.io.observe(s));
    }
    disconnectedCallback() {
      if (this.io) this.io.disconnect();
      document.removeEventListener('shopify:section:load', this.onLoad);
      document.removeEventListener('shopify:section:unload', this.onLoad);
      document.removeEventListener('shopify:section:reorder', this.onLoad);
    }
  }
  NI.define('outline-spy', OutlineSpy);

  /* ---------- Kontakt-Vorbelegung: Auswahl per URL an das Kontaktformular ---------- */
  NI.contactUrl = (base, topic, message) => {
    const p = new URLSearchParams();
    if (topic) p.set('thema', topic);
    if (message) p.set('nachricht', message);
    const qs = p.toString();
    return qs ? `${base}${base.includes('?') ? '&' : '?'}${qs}` : base;
  };

  class ContactBand extends HTMLElement {
    connectedCallback() {
      if (this._ready) return;
      this._ready = true;
      this.chips = Array.from(this.querySelectorAll('.cta-chip'));
      this.chips.forEach((c) =>
        c.addEventListener('click', () => {
          const on = c.getAttribute('aria-pressed') !== 'true';
          c.setAttribute('aria-pressed', on ? 'true' : 'false');
          c.classList.toggle('is-on', on);
          c.querySelector('[data-icon="check"]').hidden = !on;
          c.querySelector('[data-icon="plus"]').hidden = on;
        })
      );
      const btn = this.querySelector('[data-send]');
      if (btn)
        btn.addEventListener('click', () => {
          const picked = this.chips.filter((c) => c.getAttribute('aria-pressed') === 'true');
          const names = picked.map((c) => c.dataset.label);
          const topic = picked.length ? picked[0].dataset.topic : '';
          const message = names.length ? (this.dataset.message || '').replace('[auswahl]', names.join(', ')) : '';
          window.location.href = NI.contactUrl(this.dataset.contactUrl, topic, message);
        });
    }
    disconnectedCallback() {
      this._ready = false;
    }
  }
  NI.define('contact-band', ContactBand);

  /* ---------- Wert kopieren (Telefon, E-Mail) ---------- */
  class CopyValue extends HTMLElement {
    connectedCallback() {
      const btn = this.querySelector('button');
      const live = this.querySelector('[aria-live]');
      if (!btn || btn._bound) return;
      btn._bound = true;
      btn.addEventListener('click', async () => {
        const value = this.querySelector('.copy-text').textContent.trim();
        try {
          await navigator.clipboard.writeText(value);
          btn.querySelector('[data-icon="copy"]').hidden = true;
          btn.querySelector('[data-icon="check"]').hidden = false;
          if (live) live.textContent = this.dataset.done || '';
          setTimeout(() => {
            btn.querySelector('[data-icon="copy"]').hidden = false;
            btn.querySelector('[data-icon="check"]').hidden = true;
            if (live) live.textContent = '';
          }, 1800);
        } catch (e) {
          const r = document.createRange();
          r.selectNodeContents(this.querySelector('.copy-text'));
          const sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(r);
        }
      });
    }
  }
  NI.define('copy-value', CopyValue);

  /* ---------- Buttons, die zu einem Abschnitt springen ---------- */
  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-scroll-to]');
    if (!t) return;
    e.preventDefault();
    NI.scrollToId(t.getAttribute('data-scroll-to'));
  });

  // Anker-Links auf derselben Seite mit Abstand zum Header
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a || a.classList.contains('skip')) return;
    const id = decodeURIComponent(a.getAttribute('href').slice(1));
    if (!id || !document.getElementById(id)) return;
    e.preventDefault();
    NI.scrollToId(id);
  });

  document.addEventListener('DOMContentLoaded', () => {
    const skip = document.querySelector('.skip');
    const main = document.getElementById('main');
    if (skip && main)
      skip.addEventListener('click', (e) => {
        e.preventDefault();
        main.focus();
      });
    if (location.hash && location.hash.length > 1) {
      const id = decodeURIComponent(location.hash.slice(1));
      requestAnimationFrame(() => requestAnimationFrame(() => NI.scrollToId(id)));
    }
  });
})();

/* ---------- Skalierter Rahmen: rendert in echter Breite, zeigt verkleinert (Port von Scaled) ---------- */
(function () {
  'use strict';
  const NI = window.NI;
  class ScaledFrame extends HTMLElement {
    connectedCallback() {
      this.classList.add('scaled');
      this.inner = this.querySelector(':scope > .scaled-inner');
      if (!this.inner) return;
      this.calc = this.calc.bind(this);
      this.ro = new ResizeObserver(this.calc);
      this.ro.observe(this);
      this.ro.observe(this.inner);
      this.calc();
    }
    get width() {
      return Number(this.getAttribute('width')) || 1280;
    }
    calc() {
      const max = Number(this.getAttribute('max-scale')) || 1;
      const w = this.width;
      const s = Math.min(max, this.clientWidth / w) || 0.3;
      this.inner.style.width = w + 'px';
      this.inner.style.transform = `scale(${s})`;
      this.inner.style.opacity = s ? '1' : '0';
      const h = this.inner.offsetHeight * s;
      if (!this.hasAttribute('fixed-height')) this.style.height = h ? h + 'px' : '';
      this.scale = s;
      this.dispatchEvent(new CustomEvent('scaled', { detail: { scale: s } }));
    }
    disconnectedCallback() {
      if (this.ro) this.ro.disconnect();
    }
  }
  NI.define('scaled-frame', ScaledFrame);
})();
