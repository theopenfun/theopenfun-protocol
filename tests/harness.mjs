// Gate harness. Every anchor is state-independent: it reads the CURRENT record out of the built register at runtime
// and derives the expectation from it, so the same assertions hold in the absent AND the stated branch.
import { execFileSync } from 'child_process'; import fs from 'fs'; import path from 'path'; import crypto from 'crypto'; import { pathToFileURL } from 'url';
const ROOT = path.resolve(import.meta.dirname, '..');
const B58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
const fakeCA = Array.from(crypto.randomBytes(44), (b) => B58[b % 58]).join('');

const branches = [
  { name: 'absent', out: '.proof/absent', env: {} },
  { name: 'stated', out: '.proof/stated', env: { THEOPEN_CA: fakeCA, THEOPEN_X: 'https://x.com/example', THEOPEN_GITHUB: 'https://github.com/example/repo' } },
];
let pass = 0, fail = 0; const gates = new Set();
const ok = (gate, cond, msg) => { gates.add(gate); if (cond) pass++; else { fail++; console.log('  FAIL', gate, msg); } };

for (const b of branches) {
  console.log(`\n== branch: ${b.name}`);
  execFileSync('node', ['tools/build.mjs'], { cwd: ROOT, env: { ...process.env, OUT_DIR: b.out, THEOPEN_CA: '', THEOPEN_X: '', THEOPEN_GITHUB: '', ...b.env }, stdio: 'pipe' });
  const dist = path.join(ROOT, b.out);
  const html = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
  const { register: R } = await import(pathToFileURL(path.join(dist, 'js/register.js')).href + '?b=' + b.name);
  const { classify, scanText } = await import(pathToFileURL(path.join(dist, 'js/gate.js')).href + '?b=' + b.name);
  const tag = (key) => (html.match(new RegExp(`<[a-z]+[^>]*data-record="${key}"[^>]*>`)) || [''])[0];

  // G1 CA slot mirrors the register
  const ca = tag('ca');
  ok('G1 ca-slot-state', ca.includes(`data-state="${R.ca.state}"`), 'ca state attr');
  ok('G1 ca-slot-value', R.ca.state === 'stated' ? html.includes(`data-ca-value>${R.ca.value}<`) : !html.includes('data-ca-value>' + fakeCA), 'ca value');
  // G2 copy control inert unless stated
  const btn = (html.match(/<button[^>]*data-ca-copy[^>]*>/) || [''])[0];
  ok('G2 ca-copy-inert', (R.ca.state === 'stated') === !btn.includes('disabled'), 'copy disabled flag');
  // G3/G4 link rule
  for (const [g, k] of [['G3 x-link', 'x'], ['G4 github-link', 'github']]) {
    const t = tag(k); const stated = R[k].state === 'stated';
    ok(g, t !== '' && (stated ? /href="https:\/\//.test(t) : !/href=/.test(t)), `${k} tag ${t.slice(0, 80)}`);
    ok(g + ' handle', stated ? !!R[k].handle : R[k].url === null, 'derived handle / null url');
  }
  // G5 both icons always present, inside the header's right rail, svg inside
  ok('G5 icons-always-present', /icon-rail">[\s\S]*?data-record="x"[\s\S]*?<svg[\s\S]*?data-record="github"[\s\S]*?<svg[\s\S]*?<\/div>/.test(html), 'rail');
  ok('G5 icon-only', !/data-record="(x|github)"[^>]*>\s*[A-Za-z]/.test(html), 'icon has text');
  // G6 address scanner: no address-shaped string anywhere but the stated CA (CA slot exempt)
  const stripped = html.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, '').replace(/<[^>]+>/g, ' ');
  const caSlotText = R.ca.state === 'stated' ? R.ca.value : '';
  const stray = scanText(stripped.split(caSlotText || '\u0000').join(' '), R, []);
  ok('G6 address-scanner', stray.length === 0, 'stray addresses ' + stray.join(','));
  // G7 gate warning semantics
  const evm = '0x' + 'a'.repeat(40);
  const c1 = classify(evm, R, []);
  ok('G7 no-blanket-0x-reject', c1.kind === 'unmatched' && c1.shape === 'evm' && c1.message && !/reject|invalid/i.test(c1.message), 'evm classify');
  ok('G7 text-ungated', classify('pepe', R, []).kind === 'text', 'plain text');
  const live = ['LiveAddr' + 'x'.repeat(30)];
  ok('G7 live-match', classify(live[0], R, live).kind === 'match', 'live registry match');
  ok('G7 ca-registry', R.ca.state === 'stated' ? classify(R.ca.value, R, []).kind === 'match' : classify(fakeCA, R, []).kind === 'unmatched', 'ca registry');
  // G8 own-row + parallel fetch are wired to the register, not hardcoded
  const mk = fs.readFileSync(path.join(dist, 'js/market.js'), 'utf8');
  ok('G8 own-row-branches', /register\.ca\.state === 'stated'/.test(mk) && /data-own|dataset\.own/.test(mk) && mk.includes("'absent'") && mk.includes("'stated'"), 'market own branches');
  ok('G9 pump-parallel', /getJson\(M\.pairs \+ CA\)\.then/.test(mk) && /getJson\(M\.pump \+ CA\)\.then/.test(mk) && !/await getJson\(M\.pairs/.test(mk), 'pump/dex independent');
  ok('G10 market-ignores-ca', /fetchTrending[\s\S]*?M\.boosts/.test(mk) && !/async function fetchTrending[\s\S]{0,600}CA/.test(mk.split('/* ---------- view')[0].split('async function fetchTrending')[1] ? 'async function fetchTrending' + mk.split('async function fetchTrending')[1].split('/* ---------- view')[0] : ''), 'market fetch reads only market record');
  // G11 no dates
  ok('G11 no-dates', !/\b(19|20)\d{2}\b|\b\d{1,2}:\d{2}\b|\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.? \d/i.test(stripped), 'date-like text in page');
  // G12 logo copied + referenced
  const refs = [...html.matchAll(/(?:src|href)="(\.\/[^"]+)"/g)].map((m) => m[1]);
  ok('G12 logo-in-dist', ['./brand/logo-96.png', './brand/logo-192.png', './brand/logo-512.png'].every((r) => refs.includes(r) && fs.existsSync(path.join(dist, r))), 'logo refs');
  const fav = fs.readFileSync(path.join(dist, 'favicon.svg'), 'utf8');
  ok('G12 favicon-32', /width="32" height="32" viewBox="0 0 32 32"/.test(fav) && refs.includes('./favicon.svg'), 'favicon');
}

// G13 colour literals live in tokens.css only (favicon.svg is a pixel trace and generated JS register has none)
const lit = /#[0-9a-fA-F]{3,8}\b/;
const scan = ['src/css/site.css', 'src/css/fonts.css', 'src/index.template.html', ...fs.readdirSync(path.join(ROOT, 'src/js')).map((f) => 'src/js/' + f)];
for (const f of scan) ok('G13 tokens-only', !lit.test(fs.readFileSync(path.join(ROOT, f), 'utf8').replace(/href="#[a-z]+"/g, '')), f);
// G14 repo hygiene
const bad = ['CLAU' + 'DE.md', '.clau' + 'de'].filter((p) => fs.existsSync(path.join(ROOT, p)));
ok('G14 hygiene-files', bad.length === 0, bad.join());
const attrib = new RegExp(['Co-Auth' + 'ored', 'Generated ' + 'with', 'Anthro' + 'pic', 'Clau' + 'de'].join('|'), 'i');
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => e.name === 'node_modules' || e.name === '.proof' || e.name === 'dist' ? [] : e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);
const hits = walk(ROOT).filter((f) => /\.(md|js|mjs|json|html|css|txt)$|LICENSE$/.test(f) && !f.endsWith('package-lock.json') && attrib.test(fs.readFileSync(f, 'utf8')));
ok('G14 no-attribution', hits.length === 0, hits.join());

console.log(`\ngates: ${gates.size} distinct | assertions: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
