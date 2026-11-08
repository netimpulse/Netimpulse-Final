/* Inhaltsverzeichnis für Richtlinien-Seiten: aus den Zwischenüberschriften des Texts. */
(function () {
  'use strict';
  const NI = window.NI;
  if (!NI) return;
  const slug = (s, i) => 'p-' + (s.toLowerCase().replace(/[^a-z0-9äöüß]+/g, '-').replace(/^-|-$/g, '') || i);
  class PolicyToc extends HTMLElement {
    connectedCallback() {
      if (this._ready) return;
      this._ready = true;
      const body = document.querySelector('.policy-body');
      if (!body) return;
      const heads = Array.from(body.querySelectorAll('h2, .rte h3'));
      if (heads.length <= 2) return;
      const title = document.createElement('p');
      title.className = 'field-label';
      title.textContent = this.dataset.title || '';
      const ol = document.createElement('ol');
      ol.className = 'toc-list';
      ol.setAttribute('role', 'list');
      heads.forEach((h, i) => {
        if (!h.id) h.id = slug(h.textContent, i);
        const li = document.createElement('li');
        const b = document.createElement('button');
        b.type = 'button';
        b.textContent = h.textContent.trim();
        b.addEventListener('click', () => NI.scrollToId(h.id));
        li.append(b);
        ol.append(li);
      });
      this.append(title, ol);
    }
  }
  NI.define('policy-toc', PolicyToc);
})();
