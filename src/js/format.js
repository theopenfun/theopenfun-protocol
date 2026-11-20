export const DASH = '—';
export const isNum = (n) => typeof n === 'number' && Number.isFinite(n);

export function usdCompact(n) {
  if (!isNum(n)) return DASH;
  const a = Math.abs(n);
  if (a >= 1e9) return '$' + (n / 1e9).toFixed(2) + 'B';
  if (a >= 1e6) return '$' + (n / 1e6).toFixed(2) + 'M';
  if (a >= 1e3) return '$' + (n / 1e3).toFixed(1) + 'k';
  return '$' + n.toFixed(a >= 100 ? 0 : 2);
}
export function usdPrice(n) {
  if (!isNum(n)) return DASH;
  if (n === 0) return '$0.00';
  const a = Math.abs(n);
  if (a >= 1000) return '$' + n.toLocaleString('en-US', { maximumFractionDigits: 0 });
  if (a >= 1) return '$' + n.toFixed(2);
  if (a >= 0.01) return '$' + n.toFixed(4);
  return '$' + n.toFixed(Math.min(12, 2 - Math.floor(Math.log10(a))));
}
export function pct(n) {
  if (!isNum(n)) return DASH;
  const s = Math.abs(n) >= 1000 ? Math.abs(n).toLocaleString('en-US', { maximumFractionDigits: 0 }) : Math.abs(n).toFixed(Math.abs(n) >= 100 ? 0 : 1);
  return (n > 0 ? '+' : n < 0 ? '−' : '') + s + '%';
}
export const dir = (n) => (!isNum(n) || n === 0 ? 'flat' : n > 0 ? 'up' : 'down');
export const shortAddr = (a) => (a && a.length > 10 ? a.slice(0, 4) + '…' + a.slice(-4) : a || DASH);
