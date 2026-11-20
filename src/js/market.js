import { setNumber } from './motion.js';
import { usdCompact, usdPrice, pct, dir, shortAddr, DASH, isNum } from './format.js';
import { classify } from './gate.js';

const BRAND_LOGO = './brand/logo-96.png';
const $ = (s) => document.querySelector(s);
const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };

async function getJson(url, ms = 10000) {
  const ac = new AbortController(); const t = setTimeout(() => ac.abort(), ms);
  try { const r = await fetch(url, { signal: ac.signal, headers: { accept: 'application/json' } }); if (!r.ok) throw new Error('http ' + r.status); return await r.json(); }
  finally { clearTimeout(t); }
}

/** Image with ordered fallbacks, ending in a letter tile. */
function logo(urls, symbol, size) {
  const list = urls.filter(Boolean); let i = 0;
  const wrap = el('span', null); wrap.style.display = 'inline-flex'; wrap.style.setProperty('--s', size + 'px');
  const tile = () => { wrap.replaceChildren(Object.assign(el('span', 'tile'), { textContent: (symbol || '?').replace(/[^A-Za-z0-9]/g, '').charAt(0).toUpperCase() || '?' })); };
  const load = () => {
    if (i >= list.length) return tile();
    const img = new Image(); img.className = 'logo'; img.width = size; img.height = size; img.alt = ''; img.decoding = 'async'; img.referrerPolicy = 'no-referrer';
    img.onerror = () => { i++; load(); };
    img.src = list[i]; wrap.replaceChildren(img);
  };
  load(); return wrap;
}

function rowShell(n, { href, own = false, pending = false } = {}) {
  const r = el(href && !pending ? 'a' : 'div', 'row' + (own ? ' own' : '') + (pending ? ' pending' : ''));
  if (href && !pending) { r.href = href; r.target = '_blank'; r.rel = 'noopener noreferrer'; }
  if (pending) r.setAttribute('aria-disabled', 'true');
  r.innerHTML = `<span class="c-n"></span><div class="c-coin"><span class="lg"></span><span class="nm"><span class="sy"></span><span class="fn"></span></span></div>
  <span class="c-price"><span class="num"></span></span>
  <div class="c-stats"><span class="c-ch"><span class="num"></span></span><span class="c-vol" data-l="Turnover"><span class="num"></span></span><span class="c-liq" data-l="Depth"><span class="num"></span></span></div>`;
  r.querySelector('.c-n').textContent = String(n);
  r._ = { n: r.querySelector('.c-n'), lg: r.querySelector('.lg'), sy: r.querySelector('.sy'), fn: r.querySelector('.fn'), price: r.querySelector('.c-price .num'), ch: r.querySelector('.c-ch .num'), vol: r.querySelector('.c-vol .num'), liq: r.querySelector('.c-liq .num') };
  return r;
}

function fillRow(r, d) {
  const x = r._;
  x.sy.firstChild ? (x.sy.firstChild.nodeValue = d.symbol) : x.sy.append(document.createTextNode(d.symbol));
  x.fn.textContent = d.name || DASH;
  setNumber(x.price, d.price, usdPrice);
  setNumber(x.ch, d.chg, pct);
  x.ch.classList.remove('up', 'down', 'flat'); x.ch.classList.add(dir(d.chg));
  setNumber(x.vol, d.vol, usdCompact);
  setNumber(x.liq, d.liq, usdCompact);
}

export function startMarket(register, ui) {
  const M = register.market;
  const CA = register.ca.state === 'stated' ? register.ca.value : null;
  const rowsEl = $('#rows');
  const S = { trend: [], hasData: false, fail: 0, timer: 0, sort: 'boost', q: '', rowMap: new Map(), own: { dex: null, pump: null }, ownRow: null, skeleton: true, tickSig: '' };

  /* ---------- skeleton ---------- */
  const skRows = [];
  const mkSk = () => { const r = el('div', 'row sk', `<span class="c-n sk-b" style="width:14px;height:12px"></span><div class="c-coin"><span class="sk-b" style="width:40px;height:40px;border-radius:50%"></span><span class="nm" style="gap:6px"><span class="sk-b" style="width:64px;height:12px"></span><span class="sk-b" style="width:110px;height:10px"></span></span></div><span class="c-price"><span class="sk-b" style="width:72px;height:14px;margin-left:auto"></span></span><div class="c-stats"><span class="sk-b" style="width:56px;height:12px"></span><span class="sk-b" style="width:64px;height:12px"></span><span class="sk-b" style="width:64px;height:12px"></span></div>`); r.setAttribute('aria-hidden', 'true'); return r; };
  for (let i = 0; i < M.take - 1; i++) { const r = mkSk(); skRows.push(r); rowsEl.append(r); }
  const tr = $('#ticker-track');
  for (let i = 0; i < 8; i++) tr.append(el('div', 'tick sk', `<span class="sk-b" style="width:20px;height:20px;border-radius:50%"></span><span class="sk-b" style="width:50px;height:12px"></span><span class="sk-b" style="width:60px;height:12px"></span>`));

  /* ---------- own row (#1) ---------- */
  function buildOwn() {
    if (!CA) {
      const r = rowShell(1, { own: true, pending: true });
      r._.lg.replaceWith(Object.assign(el('span', 'lg'), {}));
      const lg = r.querySelector('.lg'); lg.style.setProperty('--s', '40px');
      const img = new Image(); img.className = 'logo'; img.width = 40; img.height = 40; img.alt = ''; img.src = BRAND_LOGO; img.dataset.brand = 'placeholder'; lg.append(img);
      r.querySelector('.sy').innerHTML = 'OPEN<span class="badge">Ours</span>';
      r._.fn.textContent = 'The Open';
      ['price', 'ch', 'vol', 'liq'].forEach((k) => { r._[k].textContent = '· · · · ·'; });
      r.dataset.own = 'absent';
      return r;
    }
    const r = rowShell(1, { own: true, href: 'https://dexscreener.com/solana/' + CA });
    r.dataset.own = 'stated';
    r._.sy.innerHTML = 'OPEN<span class="badge">Ours</span>';
    r._.fn.textContent = 'The Open';
    ['price', 'ch', 'vol', 'liq'].forEach((k) => { r._[k].textContent = DASH; });
    r._.lg.replaceChildren(logo([null, BRAND_LOGO], 'O', 40));
    return r;
  }
  S.ownRow = buildOwn(); S.ownRow.classList.add('in'); S.ownRow.style.setProperty('--i', 0);
  rowsEl.prepend(S.ownRow);

  function pickPair(pairs, addr) {
    const list = (Array.isArray(pairs) ? pairs : (pairs && pairs.pairs) || []).filter(Boolean);
    const base = list.filter((p) => p.baseToken && p.baseToken.address === addr);
    const use = base.length ? base : list;
    return use.slice().sort((a, b) => (b.volume?.h24 || 0) - (a.volume?.h24 || 0))[0] || null;
  }
  const num = (v) => { const n = typeof v === 'string' ? parseFloat(v) : v; return isNum(n) ? n : null; };

  function paintOwn() {
    if (!CA) return;
    const { dex, pump } = S.own; const r = S.ownRow;
    const sym = (dex && dex.baseToken && dex.baseToken.symbol) || (pump && pump.symbol) || 'OPEN';
    const nm = (dex && dex.baseToken && dex.baseToken.name) || (pump && pump.name) || 'The Open';
    r._.sy.firstChild.nodeValue = sym; r._.fn.textContent = nm;
    if (dex && dex.url) r.href = dex.url;
    const sig = [pump && pump.image_uri, dex && dex.info && dex.info.imageUrl].join('|');
    if (r._.sig !== sig) { r._.sig = sig; r._.lg.replaceChildren(logo([pump && pump.image_uri, dex && dex.info && dex.info.imageUrl, BRAND_LOGO], sym, 40)); }
    setNumber(r._.price, dex ? num(dex.priceUsd) : null, usdPrice);
    setNumber(r._.ch, dex ? num(dex.priceChange && dex.priceChange.h24) : null, pct);
    r._.ch.classList.remove('up', 'down', 'flat'); r._.ch.classList.add(dir(dex && dex.priceChange && dex.priceChange.h24));
    setNumber(r._.vol, dex ? num(dex.volume && dex.volume.h24) : null, usdCompact);
    setNumber(r._.liq, dex ? num(dex.liquidity && dex.liquidity.usd) : null, usdCompact);
    tickerSync();
  }

  /** Rule 6: both sources fire together; neither awaits the other. */
  function refreshOwn() {
    if (!CA) return;
    getJson(M.pairs + CA).then((j) => { S.own.dex = pickPair(j.pairs || j, CA); paintOwn(); }).catch(() => {});
    getJson(M.pump + CA).then((j) => { S.own.pump = j; paintOwn(); }).catch(() => {});
  }

  /* ---------- trending ---------- */
  async function fetchTrending() {
    const boosts = await getJson(M.boosts);
    const by = new Map();
    (Array.isArray(boosts) ? boosts : []).filter((b) => b && b.chainId === M.chain && b.tokenAddress).forEach((b) => {
      const p = by.get(b.tokenAddress); if (!p || (b.totalAmount || 0) > (p.totalAmount || 0)) by.set(b.tokenAddress, b);
    });
    const top = [...by.values()].sort((a, b) => (b.totalAmount || 0) - (a.totalAmount || 0)).slice(0, M.take);
    if (!top.length) throw new Error('empty');
    const res = await Promise.allSettled(top.map((b) => getJson(M.tokens + b.tokenAddress)));
    if (res.every((r) => r.status === 'rejected')) throw new Error('tokens unreachable');
    return top.map((b, i) => {
      const pair = res[i].status === 'fulfilled' ? pickPair(res[i].value, b.tokenAddress) : null;
      return {
        address: b.tokenAddress, boost: b.totalAmount || 0,
        symbol: (pair && pair.baseToken && pair.baseToken.symbol) || shortAddr(b.tokenAddress),
        name: pair && pair.baseToken && pair.baseToken.name,
        price: pair ? num(pair.priceUsd) : null, chg: pair ? num(pair.priceChange && pair.priceChange.h24) : null,
        vol: pair ? num(pair.volume && pair.volume.h24) : null, liq: pair ? num(pair.liquidity && pair.liquidity.usd) : null,
        logo: [pair && pair.info && pair.info.imageUrl, b.icon], url: (pair && pair.url) || b.url,
      };
    });
  }

  /* ---------- view ---------- */
  const SORTS = { boost: (a, b) => b.boost - a.boost, gain: (a, b) => (b.chg ?? -1e12) - (a.chg ?? -1e12), turn: (a, b) => (b.vol ?? -1) - (a.vol ?? -1), depth: (a, b) => (b.liq ?? -1) - (a.liq ?? -1) };
  function visible() {
    let list = S.trend.filter((t) => t.address !== CA); // dedup: own token never repeats in 2-10
    const q = S.q.trim().toLowerCase();
    if (q) list = list.filter((t) => (t.symbol || '').toLowerCase().includes(q) || (t.name || '').toLowerCase().includes(q) || t.address.toLowerCase() === q);
    return list.sort(SORTS[S.sort]).slice(0, M.take - 1);
  }
  function ownVisible() {
    const q = S.q.trim().toLowerCase(); if (!q) return true;
    const d = S.own.dex; const t = ['open', 'the open', CA && CA.toLowerCase(), d && d.baseToken && d.baseToken.symbol, d && d.baseToken && d.baseToken.name].filter(Boolean).map((s) => String(s).toLowerCase());
    return t.some((s) => s.includes(q));
  }

  function render() {
    const list = visible();
    const first = S.skeleton && S.hasData;
    if (first) { skRows.forEach((r) => r.classList.add('leaving')); setTimeout(() => skRows.forEach((r) => r.remove()), 170); S.skeleton = false; }
    const keep = new Set();
    list.forEach((d, i) => {
      keep.add(d.address);
      let r = S.rowMap.get(d.address);
      if (!r) { r = rowShell(i + 2, { href: d.url }); r._.lg.replaceChildren(logo(d.logo, d.symbol, 40)); r._.sy.append(document.createTextNode('')); if (S.settled) r.dataset.arrived = 'true'; else r.classList.add('in'); r.style.setProperty('--i', i + 1); S.rowMap.set(d.address, r); }
      r._.n.textContent = String(i + 2);
      fillRow(r, d);
    });
    for (const [a, r] of S.rowMap) if (!keep.has(a)) { r.remove(); S.rowMap.delete(a); }
    S.settled = S.hasData; // rows created after this point arrive with the board-arrive motion
    S.ownRow.style.display = ownVisible() ? '' : 'none';
    // order: own, then list
    let anchor = S.ownRow;
    list.forEach((d) => { const r = S.rowMap.get(d.address); if (r.previousElementSibling !== anchor) anchor.after(r); anchor = r; });
    // empty / error note
    let note = rowsEl.querySelector('.err-note');
    const msg = !S.hasData && S.fail > 0 ? 'The feed is out of reach right now. Retrying quietly.' : S.hasData && !list.length ? 'Nothing on the board matches that.' : '';
    if (msg) { if (!note) { note = el('div', 'err-note'); rowsEl.append(note); } note.textContent = msg; } else if (note) note.remove();
    if (!S.hasData && S.fail > 0 && S.skeleton) { skRows.forEach((r) => { r.querySelectorAll('.sk-b').forEach((b) => { b.className = 'flat'; b.textContent = DASH; b.removeAttribute('style'); }); }); }
    $('#count').textContent = (list.length + 1) + ' shown';
    const t = S.trend; setNumber($('#st-count'), S.hasData ? t.length : null, (v) => (isNum(v) ? String(Math.round(v)) : DASH));
    setNumber($('#st-vol'), S.hasData ? t.reduce((s, x) => s + (x.vol || 0), 0) : null, usdCompact);
    tickerSync();
  }

  /* ---------- ticker (same data) ---------- */
  function tickerSync() {
    const items = [];
    if (CA && S.own.dex) items.push({ address: CA, symbol: S.ownRow._.sy.firstChild.nodeValue, price: num(S.own.dex.priceUsd), chg: num(S.own.dex.priceChange && S.own.dex.priceChange.h24), logo: [S.own.pump && S.own.pump.image_uri, S.own.dex.info && S.own.dex.info.imageUrl, BRAND_LOGO] });
    S.trend.filter((t) => t.address !== CA).forEach((t) => items.push(t));
    if (!items.length) return;
    const sig = items.map((i) => i.address).join(',');
    if (sig !== S.tickSig) {
      S.tickSig = sig; tr.replaceChildren();
      for (let c = 0; c < 2; c++) items.forEach((it) => {
        const t = el('div', 'tick'); t.dataset.addr = it.address; if (c) t.setAttribute('aria-hidden', 'true');
        t.append(logo(it.logo, it.symbol, 20)); t.append(Object.assign(el('span', 'sym'), { textContent: it.symbol }), el('span', 'px'), el('span', 'ch'));
        tr.append(t);
      });
    }
    tr.querySelectorAll('.tick').forEach((t) => {
      const it = items.find((i) => i.address === t.dataset.addr); if (!it) return;
      t.querySelector('.px').textContent = usdPrice(it.price);
      const ch = t.querySelector('.ch'); ch.textContent = pct(it.chg); ch.className = 'ch ' + dir(it.chg);
    });
  }

  /* ---------- status ---------- */
  const LABEL = { loading: 'Syncing', live: 'Live', retry: 'Retrying', error: 'Offline' };
  function status(s) {
    for (const id of ['#status', '#live']) { const n = $(id); if (n) n.dataset.status = s; }
    $('#status-text').textContent = LABEL[s]; $('#live-text').textContent = LABEL[s];
  }

  /* ---------- poll loop: backoff, pause on hidden, immediate on visible ---------- */
  async function cycle() {
    clearTimeout(S.timer);
    if (document.hidden) return;
    $('#bar-load').dataset.busy = 'true';
    refreshOwn();
    let next = M.pollMs;
    try {
      S.trend = await fetchTrending(); S.hasData = true; S.fail = 0; status('live');
    } catch (e) {
      S.fail++; status(S.hasData ? 'retry' : 'error'); // last good data stays on screen
      next = Math.min(M.pollMs, 2000 * 2 ** (S.fail - 1)) + Math.random() * 500;
    }
    $('#bar-load').dataset.busy = 'false';
    render();
    S.timer = setTimeout(cycle, next);
  }
  document.addEventListener('visibilitychange', () => { if (document.hidden) clearTimeout(S.timer); else cycle(); });

  /* ---------- toolbar: search + sort + gate scanner ---------- */
  const note = $('#gate-note');
  $('#q').addEventListener('input', (e) => {
    S.q = e.target.value;
    const c = classify(S.q, register, S.trend.map((t) => t.address));
    if (c.kind === 'unmatched') { note.textContent = c.message; note.dataset.kind = 'warn'; note.dataset.show = 'true'; }
    else if (c.kind === 'match') { note.textContent = 'Address matches a stated entry on the board.'; note.dataset.kind = 'ok'; note.dataset.show = 'true'; }
    else note.dataset.show = 'false';
    render();
  });
  $('#seg').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-sort]'); if (!b) return;
    S.sort = b.dataset.sort; document.querySelectorAll('#seg button').forEach((x) => x.setAttribute('aria-pressed', String(x === b))); render();
  });

  status('loading');
  cycle();
  return S;
}
