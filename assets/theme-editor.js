/* Theme-Editor-Sektion der Startseite (Port von ThemeEditor): Auswahl links, Sektionsliste und Vorschau rechts.
   Auswahl in beiden Richtungen: Klick in der Liste springt in der Vorschau, Klick in die Vorschau wählt die Sektion. */
(function () {
  'use strict';
  const NI = window.NI;
  if (!NI) return;

  class ThemeEditor extends HTMLElement {
    connectedCallback() {
      if (this._ready) return;
      this._ready = true;
      this.picks = Array.from(this.querySelectorAll('.theme-pick button'));
      this.editor = this.querySelector('.editor');
      this.frame = this.querySelector('[data-frame]');
      this.viewport = this.querySelector('[data-viewport]');
      this.vpLabel = this.viewport.getAttribute('aria-label') || '';
      this.content = this.querySelector('[data-content]');
      this.box = this.querySelector('.sel-box');
      this.tag = this.querySelector('.sel-tag');
      this.list = this.querySelector('[data-outline-list]');
      this.segs = Array.from(this.querySelectorAll('.seg-btn'));
      this.skelKeys = JSON.parse(this.querySelector('[data-skel-keys]').textContent);
      this.defaultOutline = (this.dataset.outlineDefault || '').split('|').map((s) => s.trim()).filter(Boolean);
      this.index = 0;
      this.device = window.matchMedia('(max-width: 720px)').matches ? 'mobile' : 'desktop';
      this.selected = Number(this.dataset.selected) || 0;

      this.picks.forEach((b) => b.addEventListener('click', () => this.pick(Number(b.dataset.index))));
      this.segs.forEach((b) => b.addEventListener('click', () => this.setDevice(b.dataset.device)));
      this.content.addEventListener('click', (e) => {
        const sec = e.target.closest('[data-section]');
        if (!sec) {
          this.selectAt(e);
          return;
        }
        const i = this.skelKeys.indexOf(sec.getAttribute('data-section'));
        if (i >= 0) this.select(i, false);
      });
      this.ro = new ResizeObserver(() => this.measure());
      this.ro.observe(this.viewport);
      this.onBlock = (e) => {
        const li = e.target.closest ? e.target.closest('li') : null;
        const b = li && li.querySelector('.theme-pick button');
        if (b && this.contains(b)) this.pick(Number(b.dataset.index));
      };
      document.addEventListener('shopify:block:select', this.onBlock);
      this.pick(0);
    }
    disconnectedCallback() {
      this._ready = false;
      if (this.ro) this.ro.disconnect();
      document.removeEventListener('shopify:block:select', this.onBlock);
    }
    anchors() {
      const el = this.querySelector(`[data-anchors="${this.index}"]`);
      try {
        const a = JSON.parse(el ? el.textContent : 'null');
        return Array.isArray(a) && a.length ? a : null;
      } catch (e) {
        return null;
      }
    }
    names() {
      const a = this.anchors();
      if (a) return a.map((x) => x.name || '');
      return this.defaultOutline;
    }
    pick(i) {
      this.index = i;
      const b = this.picks[i];
      if (!b) return;
      this.picks.forEach((x, j) => {
        x.classList.toggle('is-on', j === i);
        x.setAttribute('aria-checked', j === i ? 'true' : 'false');
      });
      const name = b.dataset.name;
      const nameEl = this.querySelector('[data-editor-name]');
      if (nameEl) nameEl.textContent = name;
      const detail = this.querySelector('[data-detail-link]');
      if (detail) {
        detail.href = b.dataset.url || '#';
        detail.querySelector('[data-detail-text]').textContent = (detail.dataset.label || '').replace('[name]', name);
      }
      const prev = this.querySelector('[data-preview-link]');
      if (prev) prev.href = b.dataset.preview || b.dataset.url || '#';
      this.renderOutline();
      this.renderView();
    }
    setDevice(d) {
      this.device = d;
      this.renderView();
    }
    renderOutline() {
      const grip = '<svg class="icon" width="16" height="16" style="width: 16px; height: 16px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="9" cy="6" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="18" r="1"/><circle cx="15" cy="6" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="18" r="1"/></svg>';
      this.list.innerHTML = '';
      this.names().forEach((n, i) => {
        const li = document.createElement('li');
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'outline-row';
        btn.innerHTML = grip;
        const span = document.createElement('span');
        span.textContent = n;
        btn.append(span);
        btn.addEventListener('click', () => this.select(i, true));
        li.append(btn);
        this.list.append(li);
      });
    }
    renderView() {
      const mobile = this.device === 'mobile';
      this.editor.classList.toggle('is-mobile', mobile);
      this.editor.classList.toggle('is-desktop', !mobile);
      this.frame.className = mobile ? 'phone' : 'desk';
      this.segs.forEach((b) => {
        const on = b.dataset.device === this.device;
        b.classList.toggle('is-on', on);
        b.setAttribute('aria-checked', on ? 'true' : 'false');
      });
      const tpl = this.querySelector(`template[data-view="${this.index}-${this.device}"]`);
      this.content.innerHTML = '';
      const wrap = document.createElement('div');
      wrap.className = 'fade-in';
      if (tpl) wrap.append(tpl.content.cloneNode(true));
      this.content.append(wrap);
      this.viewport.scrollTop = 0;
      const img = wrap.querySelector('img');
      if (img && !img.complete) img.addEventListener('load', () => this.measure(), { once: true });
      requestAnimationFrame(() => {
        this.measure();
        this.scrollToSel(false);
      });
    }
    // Position der gewählten Sektion: aus den Sprungmarken (Prozent) oder aus dem Platzhalter-Shop
    rect(i) {
      const a = this.anchors();
      const img = this.content.querySelector('img');
      if (a && img) {
        const m = a[i] && (this.device === 'mobile' ? a[i].mobile : a[i].desktop);
        if (!m) return null;
        const h = img.offsetHeight;
        return { top: Math.round((m[0] / 100) * h), height: Math.round((m[1] / 100) * h) };
      }
      const key = this.skelKeys[i];
      const el = key && this.content.querySelector(`[data-section="${key}"]`);
      const frame = this.content.querySelector('scaled-frame');
      if (!el || !frame) return null;
      const s = frame.scale || 1;
      return { top: Math.round(el.offsetTop * s), height: Math.round(el.offsetHeight * s) };
    }
    measure() {
      const r = this.rect(this.selected);
      const rows = this.list.querySelectorAll('.outline-row');
      rows.forEach((b, j) => {
        b.classList.toggle('is-selected', j === this.selected);
        b.setAttribute('aria-pressed', j === this.selected ? 'true' : 'false');
      });
      const name = this.names()[this.selected] || '';
      const pick = this.picks[this.index];
      this.viewport.setAttribute('aria-label', this.vpLabel.replace('[name]', pick ? pick.dataset.name : '').replace('[sektion]', name));
      if (!r) {
        this.box.hidden = true;
        return;
      }
      this.box.hidden = false;
      this.box.style.top = r.top + 'px';
      this.box.style.height = r.height + 'px';
      this.tag.textContent = name;
    }
    scrollToSel(smooth) {
      const r = this.rect(this.selected);
      if (!r) return;
      this.viewport.scrollTo({ top: Math.max(0, r.top - 20), behavior: smooth && !NI.reduced() ? 'smooth' : 'auto' });
    }
    select(i, scroll) {
      this.selected = i;
      this.measure();
      if (scroll) requestAnimationFrame(() => this.scrollToSel(true));
    }
    // Klick auf einen Screenshot: Sektion anhand der Sprungmarken bestimmen
    selectAt(e) {
      const a = this.anchors();
      const img = this.content.querySelector('img');
      if (!a || !img) return;
      const y = ((e.clientY - img.getBoundingClientRect().top) / img.offsetHeight) * 100;
      const i = a.findIndex((x) => {
        const m = this.device === 'mobile' ? x.mobile : x.desktop;
        return m && y >= m[0] && y <= m[0] + m[1];
      });
      if (i >= 0) this.select(i, false);
    }
  }
  NI.define('theme-editor', ThemeEditor);
})();
