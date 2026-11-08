/* Theme-Produktseite, Theme-Vorschau und Warenkorb-Logik für Themes mit Zusatzleistungen. */
(function () {
  'use strict';
  const NI = window.NI;
  if (!NI) return;
  const shop = () => window.NI_SHOP || {};

  /* ---------- Warenkorb: Theme mit Zusatzleistungen hinzufügen oder ersetzen ---------- */
  NI.cart = NI.cart || {};
  NI.cart.get = async () => (await fetch((shop().cartUrl || '/cart') + '.js', { headers: { Accept: 'application/json' } })).json();
  NI.cart.update = async (updates) => {
    const res = await fetch((shop().cartUpdateUrl || '/cart/update') + '.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ updates }),
    });
    if (!res.ok) throw new Error('update');
    return res.json();
  };
  NI.cart.add = async (items) => {
    const res = await fetch((shop().cartAddUrl || '/cart/add') + '.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ items }),
    });
    if (!res.ok) throw new Error('add');
    return res.json();
  };
  // Ersetzt ein Theme samt Zusatzleistungen im Warenkorb (ein Theme liegt höchstens einmal drin)
  NI.cart.setTheme = async ({ productId, variantId, title, addons, addonsKey, silent }) => {
    const cart = await NI.cart.get();
    const updates = {};
    cart.items.forEach((i) => {
      const forThis = i.properties && i.properties._addon_for === String(productId);
      if (i.product_id === Number(productId) || forThis) updates[i.key] = 0;
    });
    if (Object.keys(updates).length) await NI.cart.update(updates);
    const props = {};
    if (addons.length) props[addonsKey] = addons.map((a) => a.name).join(', ');
    const items = [{ id: Number(variantId), quantity: 1, properties: props }];
    addons.filter((a) => a.variant).forEach((a) => items.push({ id: Number(a.variant), quantity: 1, properties: { _addon_for: String(productId), [addonsKey]: title } }));
    await NI.cart.add(items);
    if (!silent) NI.toast(title);
    NI.updateCartCount();
  };

  const readAddons = (root) =>
    Array.from(root.querySelectorAll('.addon input:checked')).map((i) => ({ name: i.dataset.name, variant: i.dataset.variant || '' }));

  const bindAddons = (root) =>
    root.querySelectorAll('.addon input').forEach((i) => i.addEventListener('change', () => i.closest('.addon').classList.toggle('is-on', i.checked)));

  const setSeg = (btns, value, key) =>
    btns.forEach((b) => {
      const on = b.dataset[key] === String(value);
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-checked', on ? 'true' : 'false');
    });

  /* ---------- Produktseite ---------- */
  class ProductTheme extends HTMLElement {
    connectedCallback() {
      if (this._ready) return;
      this._ready = true;
      this.device = 'desktop';
      this.input = this.querySelector('[data-variant-input]');
      this.variant = this.input ? this.input.value : '';
      this.devBtns = Array.from(this.querySelectorAll('[data-device]'));
      this.varBtns = Array.from(this.querySelectorAll('.detail-presets [data-variant]'));
      this.viewport = this.querySelector('[data-viewport]');
      this.frame = this.querySelector('[data-frame]');
      this.canvas = this.querySelector('[data-canvas]');
      this.devBtns.forEach((b) => b.addEventListener('click', () => this.setDevice(b.dataset.device)));
      this.varBtns.forEach((b) => b.addEventListener('click', () => this.setVariant(b)));
      bindAddons(this);
      const form = this.querySelector('form');
      if (form)
        form.addEventListener('submit', async (e) => {
          e.preventDefault();
          const btn = this.querySelector('[data-add]');
          btn.disabled = true;
          try {
            await NI.cart.setTheme({
              productId: this.dataset.productId,
              variantId: this.variant,
              title: this.dataset.productTitle,
              addons: readAddons(this),
              addonsKey: this.dataset.addonsKey,
            });
            btn.querySelector('[data-icon="bag"]').hidden = true;
            btn.querySelector('[data-icon="check"]').hidden = false;
            btn.querySelector('[data-add-text]').textContent = this.dataset.labelUpdate;
          } catch (err) {
            form.submit();
          } finally {
            btn.disabled = false;
          }
        });
    }
    setDevice(d) {
      this.device = d;
      setSeg(this.devBtns, d, 'device');
      this.canvas.classList.toggle('is-mobile', d === 'mobile');
      this.canvas.classList.toggle('is-desktop', d !== 'mobile');
      this.frame.className = d === 'mobile' ? 'phone is-static' : 'desk';
      this.render();
    }
    setVariant(b) {
      this.variant = b.dataset.variant;
      if (this.input) this.input.value = this.variant;
      setSeg(this.varBtns, this.variant, 'variant');
      const label = this.querySelector('[data-style-text]');
      if (label) label.textContent = `${this.dataset.styleLabel} ${b.dataset.title}`;
      const price = this.querySelector('[data-price]');
      if (price) price.textContent = b.dataset.price;
      this.querySelectorAll('[data-preview-link]').forEach((a) => (a.href = `${this.dataset.previewUrl}&variant=${this.variant}`));
      const url = new URL(window.location.href);
      url.searchParams.set('variant', this.variant);
      window.history.replaceState({}, '', url.toString());
      this.render();
    }
    render() {
      const tpl = this.querySelector(`template[data-shot="${this.variant}-${this.device}"]`);
      if (!tpl) return;
      this.viewport.innerHTML = '';
      this.viewport.append(tpl.content.cloneNode(true));
      this.viewport.scrollTop = 0;
    }
  }
  NI.define('product-theme', ProductTheme);

  /* ---------- Vorschau ---------- */
  class ThemePreview extends HTMLElement {
    connectedCallback() {
      if (this._ready) return;
      this._ready = true;
      this.variant = this.dataset.variant;
      this.device = window.matchMedia('(max-width: 720px)').matches ? 'mobile' : 'desktop';
      this.wrap = this.querySelector('[data-device-wrap]');
      this.canvas = this.querySelector('[data-canvas]');
      this.devBtns = Array.from(this.querySelectorAll('[data-device]'));
      this.varBtns = Array.from(this.querySelectorAll('.preview-mid [data-variant]'));
      this.jump = this.querySelector('[data-jump]');
      try {
        this.anchors = JSON.parse(this.querySelector('[data-anchors]').textContent);
      } catch (e) {
        this.anchors = null;
      }
      this.skelKeys = JSON.parse(this.querySelector('[data-skel-keys]').textContent);
      const back = this.querySelector('[data-back-link]');
      if (back) back.focus();
      this.devBtns.forEach((b) => b.addEventListener('click', () => this.setDevice(b.dataset.device)));
      this.varBtns.forEach((b) => b.addEventListener('click', () => {
        this.variant = b.dataset.variant;
        setSeg(this.varBtns, this.variant, 'variant');
        const price = this.querySelector('[data-price]');
        if (price) price.textContent = b.dataset.price;
        this.render();
      }));
      if (this.jump) this.jump.addEventListener('change', () => {
        if (this.jump.value !== '') this.goTo(Number(this.jump.value));
      });
      this.onKey = (e) => {
        if (e.key === 'Escape' && !/select/i.test((document.activeElement || {}).tagName || '')) window.location.href = this.dataset.back;
      };
      window.addEventListener('keydown', this.onKey);
      const add = this.querySelector('[data-add]');
      add.addEventListener('click', async () => {
        add.disabled = true;
        try {
          const chosen = (this.dataset.addons || '').split(',').map((x) => x.trim()).filter(Boolean).map((name) => ({ name, variant: '' }));
          await NI.cart.setTheme({ productId: this.dataset.productId, variantId: this.variant, title: this.dataset.productTitle, addons: chosen, addonsKey: this.dataset.addonsKey });
          add.querySelector('[data-add-text]').textContent = add.dataset.labelDone;
        } catch (e) {
          window.location.href = this.dataset.back;
        } finally {
          add.disabled = false;
        }
      });
      if (this.device !== 'desktop') this.setDevice(this.device);
    }
    disconnectedCallback() {
      this._ready = false;
      window.removeEventListener('keydown', this.onKey);
    }
    setDevice(d) {
      this.device = d;
      setSeg(this.devBtns, d, 'device');
      this.wrap.className = 'preview-device is-' + d;
      this.wrap.style.setProperty('--dw', d === 'mobile' ? '390px' : '1280px');
      this.render();
    }
    render() {
      const tpl = this.querySelector(`template[data-shot="${this.variant}-${this.device}"]`);
      if (!tpl) return;
      this.wrap.innerHTML = '';
      this.wrap.append(tpl.content.cloneNode(true));
      this.canvas.scrollTop = 0;
      if (this.jump) this.jump.value = '';
    }
    scroller() {
      return this.device === 'mobile' ? this.wrap.querySelector('.phone-screen') : this.canvas;
    }
    goTo(i) {
      const sc = this.scroller();
      if (!sc) return;
      let top = null;
      const img = this.wrap.querySelector('img');
      if (this.anchors && img && this.anchors[i]) {
        const m = this.device === 'mobile' ? this.anchors[i].mobile : this.anchors[i].desktop;
        if (m) top = (m[0] / 100) * img.offsetHeight + (this.device === 'mobile' ? 0 : img.getBoundingClientRect().top - this.canvas.getBoundingClientRect().top + this.canvas.scrollTop);
      } else {
        const el = this.wrap.querySelector(`[data-section="${this.skelKeys[i]}"]`);
        const frame = this.wrap.querySelector('scaled-frame');
        if (el && frame) {
          top = el.offsetTop * (frame.scale || 1);
          if (this.device !== 'mobile') top += frame.getBoundingClientRect().top - this.canvas.getBoundingClientRect().top + this.canvas.scrollTop;
        }
      }
      if (top !== null) sc.scrollTo({ top: Math.max(0, top - 12), behavior: NI.reduced() ? 'auto' : 'smooth' });
    }
  }
  NI.define('theme-preview', ThemePreview);
})();
