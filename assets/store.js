/* Theme-Shop: Filter nach Branche und Sortierung ohne Neuladen (Port von ThemeStore). */
(function () {
  'use strict';
  const NI = window.NI;
  if (!NI) return;
  class ThemeStore extends HTMLElement {
    connectedCallback() {
      if (this._ready) return;
      this._ready = true;
      this.grid = this.querySelector('.theme-grid');
      this.cards = Array.from(this.grid.children);
      this.chips = Array.from(this.querySelectorAll('.chip'));
      this.sort = this.querySelector('[data-sort]');
      this.count = this.querySelector('[data-count]');
      this.type = '';
      this.chips.forEach((c) => c.addEventListener('click', () => {
        this.type = c.dataset.type;
        this.chips.forEach((x) => {
          const on = x === c;
          x.classList.toggle('is-on', on);
          x.setAttribute('aria-checked', on ? 'true' : 'false');
        });
        this.update();
      }));
      this.sort.addEventListener('change', () => this.update());
      this.update();
    }
    update() {
      const mode = this.sort.value;
      let list = this.cards.slice();
      if (mode === 'preis-auf') list.sort((a, b) => a.dataset.price - b.dataset.price);
      if (mode === 'preis-ab') list.sort((a, b) => b.dataset.price - a.dataset.price);
      if (mode === 'name') list.sort((a, b) => a.dataset.name.localeCompare(b.dataset.name, 'de'));
      list.forEach((c) => this.grid.append(c));
      let n = 0;
      list.forEach((c) => {
        const show = !this.type || c.dataset.type === this.type;
        c.hidden = !show;
        if (show) n += 1;
      });
      const tpl = n === 1 ? this.dataset.countOne : this.dataset.countOther;
      this.count.textContent = (tpl || '').replace('[n]', n) + (this.type ? (this.dataset.countFor || '').replace('[branche]', this.type) : '');
    }
    disconnectedCallback() {
      this._ready = false;
    }
  }
  NI.define('theme-store', ThemeStore);
})();
