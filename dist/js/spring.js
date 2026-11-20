// Damped harmonic oscillator solver (semi-implicit Euler, fixed sub-step) + reduced-motion guard.
export const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

export function spring({ from = 0, to = 1, k = 170, c = 22, m = 1, v = 0, delay = 0, onUpdate, onDone, eps = 0.0008 }) {
  if (reduced()) { onUpdate(to); onDone && onDone(); return { stop() {} }; }
  let x = from, vel = v, raf = 0, t0 = 0, stopped = false, timer = 0;
  const STEP = 1 / 240;
  const frame = (t) => {
    if (stopped) return;
    if (!t0) t0 = t;
    let dt = Math.min((t - t0) / 1000, 1 / 20); t0 = t;
    while (dt > 0) {
      const h = Math.min(STEP, dt); dt -= h;
      const a = (-k * (x - to) - c * vel) / m;
      vel += a * h; x += vel * h;
    }
    if (Math.abs(x - to) < eps && Math.abs(vel) < eps * 10) { onUpdate(to); onDone && onDone(); return; }
    onUpdate(x);
    raf = requestAnimationFrame(frame);
  };
  const go = () => { raf = requestAnimationFrame(frame); };
  delay > 0 ? (timer = setTimeout(go, delay)) : go();
  return { stop() { stopped = true; clearTimeout(timer); cancelAnimationFrame(raf); } };
}

// Continuous follower for pointer / scroll smoothing.
export class Follow {
  constructor(k = 120, c = 18) { this.x = 0; this.v = 0; this.t = 0; this.k = k; this.c = c; }
  step(dt) {
    let r = Math.min(dt, 1 / 20);
    while (r > 0) { const h = Math.min(1 / 240, r); r -= h; this.v += (-this.k * (this.x - this.t) - this.c * this.v) * h; this.x += this.v * h; }
    return this.x;
  }
  get settled() { return Math.abs(this.x - this.t) < 0.01 && Math.abs(this.v) < 0.01; }
}
