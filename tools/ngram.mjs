// usage: node tools/ngram.mjs <reference-html> — prints word 2-grams shared between reference copy and ours
import fs from 'fs'; import path from 'path';
const ref = fs.readFileSync(process.argv[2], 'utf8');
const strip = (h) => h.replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<style[\s\S]*?<\/style>/g, ' ')
  .replace(/<svg[\s\S]*?<\/svg>/g, ' ')
  .replace(/<[^>]*?(?:content|placeholder|aria-label|alt|title)="([^"]*)"[^>]*>/g, ' $1 ').replace(/<[^>]+>/g, ' ');
const words = (t) => t.toLowerCase().replace(/&[a-z#0-9]+;/g, ' ').replace(/[^a-z0-9$%]+/g, ' ').trim().split(' ').filter(Boolean);
const grams = (w) => new Set(w.slice(0, -1).map((x, i) => x + ' ' + w[i + 1]));
const refG = grams(words(strip(ref)));
// ours: built HTML + every user-visible string literal in src/js
let ours = strip(fs.readFileSync('dist/index.html', 'utf8'));
for (const f of fs.readdirSync('src/js')) { const s = fs.readFileSync('src/js/' + f, 'utf8'); for (const m of s.matchAll(/(['"`])((?:(?!\1)[^\\\n]|\\.){6,})\1/g)) if (/\s/.test(m[2]) && /[a-z]{3}/i.test(m[2]) && !/[{}=<>;]/.test(m[2])) ours += '\n. ' + m[2]; }
const ourG = grams(words(ours));
const shared = [...ourG].filter((g) => refG.has(g));
console.log('ours:', ourG.size, 'reference:', refG.size, 'shared:', shared.length); shared.forEach((g) => console.log('  ', g));
process.exit(shared.length ? 1 : 0);
