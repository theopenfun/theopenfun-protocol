import { register } from './register.js';
import { initReveal, initProgress, initParallax, initSpot, initNavSpy } from './motion.js';
import { startMarket } from './market.js';
import { initWaves } from './waves.js';

// CA slot: inert until the CA record is stated (Rule 1).
(function ca() {
  const slot = document.querySelector('[data-record="ca"]');
  const btn = document.querySelector('[data-ca-copy]');
  if (!slot || !btn) return;
  if (register.ca.state !== 'stated') { btn.disabled = true; return; }
  const label = btn.querySelector('.lbl');
  const value = register.ca.value; let t = 0;
  const done = (ok) => {
    btn.dataset.copied = String(ok); label.textContent = ok ? 'Copied' : 'Press Ctrl+C';
    clearTimeout(t); t = setTimeout(() => { btn.dataset.copied = 'false'; label.textContent = 'Copy'; }, 1600);
  };
  const copy = async () => {
    try { await navigator.clipboard.writeText(value); done(true); }
    catch {
      const ta = document.createElement('textarea'); ta.value = value; ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.append(ta); ta.select();
      let ok = false; try { ok = document.execCommand('copy'); } catch {} ta.remove(); done(ok);
    }
  };
  btn.addEventListener('click', copy);
  slot.querySelector('[data-ca-value]').addEventListener('click', copy);
})();

initWaves(document.getElementById('waves')); initProgress(); initReveal(); initParallax(); initSpot(); initNavSpy();
startMarket(register, {});
