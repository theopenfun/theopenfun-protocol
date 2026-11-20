// Hero ring-wave field. Port of the dot-lattice maths read from the reference hero canvas
// (pattern "rings", shape "circle", stagger, shrink 1, depth .4, speed .1, turbulence .05, drift .03,
//  desktop: spacing 20 / size 8 / freq .11 / centre .55,.5  — compact: spacing 18 / size 7 / freq .07 / centre .35,1.35).
// Colour is read from --color-accent at runtime (palette lives in tokens.css only).
import { reduced } from './spring.js';

const TAU = Math.PI * 2;
const hash = (x, y) => { // hash(vec2) from the shader
  let a = (x * 0.1031) % 1, b = (y * 0.1031) % 1, c = (x * 0.1031) % 1;
  a = (a + 1) % 1; b = (b + 1) % 1; c = (c + 1) % 1;
  const d = a * (b + 33.33) + b * (c + 33.33) + c * (a + 33.33);
  a += d; b += d; c += d;
  const r = ((a + b) * c) % 1; return (r + 1) % 1;
};
const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);
function noise(px, py) {
  const ix = Math.floor(px), iy = Math.floor(py), fx = px - ix, fy = py - iy, ux = fade(fx), uy = fade(fy);
  const g = (cx, cy, dx, dy) => { const a = hash(cx, cy) * TAU; return Math.cos(a) * dx + Math.sin(a) * dy; };
  const a = g(ix, iy, fx, fy), b = g(ix + 1, iy, fx - 1, fy), c = g(ix, iy + 1, fx, fy - 1), d = g(ix + 1, iy + 1, fx - 1, fy - 1);
  const m1 = a + (b - a) * ux, m2 = c + (d - c) * ux; return m1 + (m2 - m1) * uy;
}

export function initWaves(host) {
  if (!host) return;
  const cv = document.createElement('canvas'); host.append(cv);
  const ctx = cv.getContext('2d'); if (!ctx) return;
  const mq = matchMedia('(min-width: 1024px)');
  let W = 0, H = 0, dpr = 1, phase = 0, drift = 0, last = 0, raf = 0, visible = true, color = '';
  const size = () => {
    const r = host.getBoundingClientRect(); dpr = Math.min(devicePixelRatio || 1, 2);
    W = Math.max(1, r.width); H = Math.max(1, r.height); cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    color = getComputedStyle(document.documentElement).getPropertyValue('--color-accent').trim();
  };
  function draw() {
    const e = mq.matches;
    const spacing = e ? 20 : 18, sz = e ? 8 : 7, freq = e ? 0.11 : 0.07, cx = e ? 0.55 : 0.35, cy = e ? 0.5 : 1.35;
    const ox = W * 0.5 * (1 + cx), oy = H * 0.5 * (1 + cy);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H); ctx.fillStyle = color;
    const jr = Math.ceil(Math.max(oy, H - oy) / spacing) + 2, ic = Math.ceil(Math.max(ox, W - ox) / spacing) + 2;
    for (let j = -jr; j <= jr; j++) {
      const y = oy - j * spacing; if (y < -sz - 2 || y > H + sz + 2) continue;
      const off = 0.5 * (((j % 2) + 2) % 2);
      for (let i = -ic; i <= ic; i++) {
        const qx = i + off, qy = j, x = ox + qx * spacing;
        if (x < -sz - 2 || x > W + sz + 2) continue;
        const base = -Math.hypot(qx, qy) * freq + 0.05 * 0.8 * noise(qx * 0.09 - drift, qy * 0.09);
        const turn = (phase + base) * TAU, front = 0.5 + 0.5 * Math.cos(turn);
        let r = sz * front, a = 0.6 + 0.4 * front;
        if (r < 0.6) { a *= (r / 0.6) * (r / 0.6); r = 0.6; }
        if (a < 0.003) continue;
        ctx.globalAlpha = Math.min(a, 1); ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }
  const loop = (t) => {
    raf = 0; if (!visible || document.hidden || reduced()) return;
    const dt = last ? Math.min(0.05, (t - last) / 1000) : 1 / 60; last = t;
    phase += dt * 0.1; drift += dt * 0.03; draw(); raf = requestAnimationFrame(loop);
  };
  const kick = () => { if (!raf && visible && !document.hidden && !reduced()) { last = 0; raf = requestAnimationFrame(loop); } };
  size(); draw();
  new ResizeObserver(() => { size(); draw(); }).observe(host);
  mq.addEventListener('change', () => { size(); draw(); });
  matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', () => { reduced() ? draw() : kick(); });
  document.addEventListener('visibilitychange', kick);
  new IntersectionObserver((en) => { visible = en[0].isIntersecting; visible ? kick() : cancelAnimationFrame(raf), (raf = visible ? raf : 0); }).observe(host);
  kick();
}
