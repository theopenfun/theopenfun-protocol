// Paste/execute in the page at each viewport. Returns layout facts used in the breakpoint report.
(async () => {
  await new Promise((r) => setTimeout(r, 700));
  const q = (s) => document.querySelector(s);
  const box = (e) => { const b = e.getBoundingClientRect(); return [Math.round(b.left), Math.round(b.top), Math.round(b.width), Math.round(b.height)]; };
  const small = [...document.querySelectorAll('a,button,summary,input,.icon-control')]
    .filter((e) => { const b = e.getBoundingClientRect(); return b.width > 0 && b.height > 0 && (b.width < 43.5 || b.height < 43.5) && !e.closest('.sr-only'); })
    .map((e) => e.tagName + '.' + e.className + ' ' + Math.round(e.getBoundingClientRect().width) + 'x' + Math.round(e.getBoundingClientRect().height));
  const ca = q('.ca-value'), cs = getComputedStyle(ca);
  const x = q('[data-record=x]'), gh = q('[data-record=github]');
  const clipped = [...document.querySelectorAll('body *')].filter((e) => { const b = e.getBoundingClientRect(); return b.width > 0 && b.right > innerWidth + 1 && !e.closest('.ticker,.hero,.mesh,.floor,.orb,.backdrop,.progress'); }).slice(0, 5).map((e) => e.className || e.tagName);
  return JSON.stringify({
    vw: innerWidth, overflowX: document.documentElement.scrollWidth > innerWidth,
    caFont: cs.fontSize, caLines: Math.round(ca.getBoundingClientRect().height / parseFloat(cs.lineHeight)),
    caBox: box(ca), x: box(x), gh: box(gh), iconsTopRight: box(gh)[0] + box(gh)[2] >= innerWidth - 32 && box(x)[1] < 130,
    stickyTop: Math.round(q('.top').getBoundingClientRect().height), tapUnder44: small, clipped,
  });
})()
