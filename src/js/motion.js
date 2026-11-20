import { spring, Follow, reduced } from './spring.js';

/** Scroll-reveal with spring physics and stagger. */
export function initReveal() {
  const els = [...document.querySelectorAll('[data-reveal]')];
  const show = (el, idx) => {
    if (el.dataset.done) return; el.dataset.done = '1';
    spring({
      from: 0, to: 1, k: 210, c: 24, delay: idx * 70,
      onUpdate: (p) => {
        el.style.opacity = String(Math.max(0, Math.min(1, p * 1.2)));
        el.style.transform = `translate3d(0,${(1 - p) * 26}px,0) scale(${0.985 + 0.015 * p})`;
      },
      onDone: () => { el.style.opacity = ''; el.style.transform = ''; el.classList.add('shown'); },
    });
  };
  if (reduced() || !('IntersectionObserver' in window)) { els.forEach((e) => e.classList.add('shown')); return; }
  const batch = new Map();
  const io = new IntersectionObserver((ents) => {
    let i = 0;
    ents.filter((e) => e.isIntersecting).forEach((e) => { show(e.target, i++); io.unobserve(e.target); });
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
  els.forEach((e) => io.observe(e));
}

/** Scroll progress bar. */
export function initProgress() {
  const bar = document.getElementById('progress'); if (!bar) return;
  const f = () => { const h = document.documentElement.scrollHeight - innerHeight; bar.style.transform = `scaleX(${h > 0 ? Math.min(1, scrollY / h) : 0})`; };
  addEventListener('scroll', f, { passive: true }); addEventListener('resize', f); f();
}

/** Hero parallax: pointer + scroll, spring smoothed. */
export function initParallax() {
  const hero = document.getElementById('hero'); if (!hero || reduced()) return;
  const layers = [...hero.querySelectorAll('[data-depth]')].map((el) => ({ el, d: parseFloat(el.dataset.depth) }));
  const fx = new Follow(90, 16), fy = new Follow(90, 16), fs = new Follow(140, 20);
  let running = false, last = 0;
  const tick = (t) => {
    const dt = last ? (t - last) / 1000 : 0.016; last = t;
    const x = fx.step(dt), y = fy.step(dt), s = fs.step(dt);
    for (const { el, d } of layers) el.style.transform = `translate3d(${x * d * 22}px,${y * d * 16 + s * d * -40}px,0)`;
    if (fx.settled && fy.settled && fs.settled) { running = false; last = 0; return; }
    requestAnimationFrame(tick);
  };
  const kick = () => { if (!running) { running = true; requestAnimationFrame(tick); } };
  hero.addEventListener('pointermove', (e) => {
    const r = hero.getBoundingClientRect();
    fx.t = ((e.clientX - r.left) / r.width - 0.5) * 2; fy.t = ((e.clientY - r.top) / r.height - 0.5) * 2; kick();
  });
  hero.addEventListener('pointerleave', () => { fx.t = 0; fy.t = 0; kick(); });
  const sc = () => { const r = hero.getBoundingClientRect(); fs.t = Math.max(-1, Math.min(1, -r.top / Math.max(1, r.height))); kick(); };
  addEventListener('scroll', sc, { passive: true }); sc();
}

/** Spotlight hover: sets --mx/--my on any [data-spot] / .row / .card. */
export function initSpot(root = document) {
  root.addEventListener('pointermove', (e) => {
    const el = e.target.closest && e.target.closest('[data-spot], .row, .card');
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', e.clientX - r.left + 'px'); el.style.setProperty('--my', e.clientY - r.top + 'px');
  }, { passive: true });
}

/** Number count-up with flash on change. `el` keeps its last numeric value in el._v. */
export function setNumber(el, value, fmt) {
  const prev = el._v;
  if (value === prev) return;
  el._v = value;
  if (typeof value !== 'number' || !Number.isFinite(value)) { el._spring && el._spring.stop(); el.textContent = fmt(value); return; }
  const from = typeof prev === 'number' && Number.isFinite(prev) ? prev : 0;
  const first = !(typeof prev === 'number' && Number.isFinite(prev));
  el._spring && el._spring.stop();
  el._spring = spring({ from, to: value, k: 120, c: 20, eps: Math.max(Math.abs(value) * 1e-5, 1e-12), onUpdate: (x) => { el.textContent = fmt(x); }, onDone: () => { el.textContent = fmt(value); } });
  if (!first && !reduced()) {
    el.classList.remove('value-flash-up', 'value-flash-down'); void el.offsetWidth;
    el.classList.add(value > prev ? 'value-flash-up' : 'value-flash-down');
    el.addEventListener('animationend', () => el.classList.remove('value-flash-up', 'value-flash-down'), { once: true });
  }
}

/** Active nav link by section in view. */
export function initNavSpy() {
  const links = [...document.querySelectorAll('#nav a, #mnav a')];
  const secs = links.map((a) => document.querySelector(a.getAttribute('href'))).filter(Boolean);
  if (!('IntersectionObserver' in window)) return;
  const io = new IntersectionObserver((ents) => {
    ents.forEach((e) => { if (e.isIntersecting) links.forEach((a) => a.setAttribute('aria-current', String(a.getAttribute('href') === '#' + e.target.id))); });
  }, { rootMargin: '-40% 0px -55% 0px' });
  new Set(secs).forEach((s) => io.observe(s));
}
