/* Warenkorb: Zusatzleistungen an- und abwählen, Themes entfernen. Danach wird die Section neu geladen. */
(function () {
  'use strict';
  const NI = window.NI;
  if (!NI) return;
  class CartPage extends HTMLElement {
    connectedCallback() {
      if (this._bound) return;
      this._bound = true;
      this.addEventListener('change', (e) => {
        const input = e.target.closest('.addon input');
        if (!input) return;
        input.closest('.addon').classList.toggle('is-on', input.checked);
        const card = input.closest('.cart-card');
        this.run(() =>
          NI.cart.setTheme({
            productId: card.dataset.product,
            variantId: card.dataset.variant,
            title: card.dataset.title,
            addons: Array.from(card.querySelectorAll('.addon input:checked')).map((i) => ({ name: i.dataset.name, variant: i.dataset.variant || '' })),
            addonsKey: this.dataset.addonsKey,
            silent: true,
          })
        );
      });
      this.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-remove]');
        if (!btn) return;
        const card = btn.closest('.cart-card');
        this.run(async () => {
          const cart = await NI.cart.get();
          const updates = {};
          cart.items.forEach((i) => {
            if (i.key === card.dataset.key || (i.properties && i.properties._addon_for === card.dataset.product)) updates[i.key] = 0;
          });
          await NI.cart.update(updates);
        });
      });
    }
    async run(task) {
      this.setAttribute('aria-busy', 'true');
      try {
        await task();
        const res = await fetch(`${window.location.pathname}?section_id=${this.dataset.section}`);
        const html = await res.text();
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const fresh = doc.querySelector('cart-page');
        if (fresh) {
          this._bound = false;
          this.replaceWith(fresh);
        }
        NI.updateCartCount();
      } catch (e) {
        window.location.reload();
      }
    }
  }
  NI.define('cart-page', CartPage);
})();
