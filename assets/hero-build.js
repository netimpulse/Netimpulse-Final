/* Header der Startseite: Aufbau-Animation (Port von HeroBuild) und Video mit Pause-Knopf. */
(function () {
  'use strict';
  const NI = window.NI;
  if (!NI) return;

  // Phasen der Animation: ab welchem Schritt welche Phase gilt
  const PHASE_FROM = [0, 3, 4, 5];

  class HeroBuild extends HTMLElement {
    connectedCallback() {
      if (this.loop) return;
      this.hb = this.querySelector('.hb');
      this.frame = this.querySelector(':scope > scaled-frame');
      this.live = this.querySelector('[data-phase]');
      this.btn = this.querySelector('.hb-pause');
      try {
        this.phases = JSON.parse(this.querySelector('[data-phases]').textContent);
      } catch (e) {
        this.phases = [];
      }
      this.mq = window.matchMedia('(max-width: 720px)');
      this.onMq = () => this.setCompact(this.mq.matches);
      this.mq.addEventListener('change', this.onMq);
      this.setCompact(this.mq.matches);

      const steps = Number(this.dataset.steps) || 10;
      this.loop = new NI.Loop(this, {
        count: steps,
        ms: Number(this.dataset.ms) || 850,
        hold: Number(this.dataset.hold) || 3400,
        onStep: (step, paused) => this.render(step, paused),
      });
      this.btn.addEventListener('click', () => this.loop.toggle());
    }
    setCompact(on) {
      const w = on ? 400 : 880;
      this.hb.classList.toggle('is-compact', on);
      this.hb.style.width = w + 'px';
      this.frame.setAttribute('width', w);
      if (this.frame.calc) this.frame.calc();
    }
    render(step, paused) {
      const keep = this.hb.classList.contains('is-compact');
      this.hb.className = 'hb' + Array.from({ length: step + 1 }, (_, i) => ' s' + i).join('') + (keep ? ' is-compact' : '');
      const phase = PHASE_FROM.reduce((a, from, i) => (step >= from ? i : a), 0);
      if (this.live && this.phases[phase]) this.live.textContent = this.phases[phase];
      NI.setPauseButton(this.btn, paused);
    }
    disconnectedCallback() {
      if (this.loop) this.loop.destroy();
      this.loop = null;
      if (this.mq) this.mq.removeEventListener('change', this.onMq);
    }
  }
  NI.define('hero-build', HeroBuild);

  class HeroVideo extends HTMLElement {
    connectedCallback() {
      const v = this.querySelector('video');
      const btn = this.querySelector('.hb-pause');
      if (!v || !btn || btn._bound) return;
      btn._bound = true;
      if (NI.reduced()) {
        v.removeAttribute('autoplay');
        v.pause();
        NI.setPauseButton(btn, true);
      }
      btn.addEventListener('click', () => {
        if (v.paused) v.play();
        else v.pause();
        NI.setPauseButton(btn, v.paused);
      });
    }
  }
  NI.define('hero-video', HeroVideo);
})();
