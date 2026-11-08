/* Kontaktformular: Vorbelegung aus der URL (thema, nachricht) und Prüfung vor dem Senden. */
(function () {
  'use strict';
  const NI = window.NI;
  if (!NI) return;
  class ContactForm extends HTMLElement {
    connectedCallback() {
      if (this._ready) return;
      this._ready = true;
      this.form = this.closest('form');
      const params = new URLSearchParams(window.location.search);
      const topic = params.get('thema');
      const message = params.get('nachricht');
      const select = this.querySelector('#f-topic');
      const area = this.querySelector('#f-message');
      if (topic && select) {
        const opt = Array.from(select.options).find((o) => o.value === topic || o.text === topic);
        if (opt) select.value = opt.value || opt.text;
      }
      if (message && area && !area.value) area.value = message;
      this.form.addEventListener('submit', (e) => {
        const found = this.validate();
        if (found) {
          e.preventDefault();
          const el = this.querySelector('#f-' + found);
          if (el) el.focus();
        }
      });
      this.querySelectorAll('input, textarea').forEach((el) =>
        el.addEventListener('input', () => {
          const f = el.closest('[data-field]');
          if (f && f.classList.contains('has-error')) this.setError(f.dataset.field, '');
        })
      );
    }
    setError(key, msg) {
      const f = this.querySelector(`[data-field="${key}"]`);
      if (!f) return;
      const input = f.querySelector('input, textarea');
      const err = f.querySelector('.field-error');
      f.classList.toggle('has-error', !!msg);
      input.setAttribute('aria-invalid', msg ? 'true' : 'false');
      err.textContent = msg;
      err.hidden = !msg;
    }
    validate() {
      const v = (id) => (this.querySelector('#f-' + id) || {}).value || '';
      const errs = {};
      if (!v('name').trim()) errs.name = this.dataset.msgName;
      const mail = v('email').trim();
      if (!mail) errs.email = this.dataset.msgEmail;
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) errs.email = this.dataset.msgEmailFormat;
      if (!v('message').trim()) errs.message = this.dataset.msgMessage;
      ['name', 'email', 'message'].forEach((k) => this.setError(k, errs[k] || ''));
      return Object.keys(errs)[0] || null;
    }
  }
  NI.define('contact-form', ContactForm);
})();
