// 近似重複內容掃描：node tools/dupes.mjs [門檻=0.8]  （5 字元片段 Jaccard 相似度）
import fs from 'node:fs';
import path from 'node:path';
const TH = +(process.argv[2] || 0.8);
const pages = [];
(function walk(d) { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); if (fs.statSync(p).isDirectory()) { if (!/admin|img/.test(f)) walk(p); } else if (f === 'index.html' && !/admin/.test(p)) pages.push(p); } })('dist');
const info = pages.map(f => { const h = fs.readFileSync(f, 'utf8'); const t = ((h.match(/<main>([\s\S]*?)<\/main>/) || [, ''])[1]).replace(/<[^>]+>/g, '').replace(/[^一-龥A-Za-z0-9]/g, ''); const sh = new Set(); for (let i = 0; i + 5 <= t.length; i += 1) sh.add(t.slice(i, i + 5)); return { u: '/' + path.relative('dist', f).replace(/index\.html$/, ''), n: t.length, sh }; }).filter(x => x.n > 300);
const out = [];
for (let i = 0; i < info.length; i++) for (let j = i + 1; j < info.length; j++) { const a = info[i], b = info[j]; let inter = 0; const [s, l] = a.sh.size < b.sh.size ? [a.sh, b.sh] : [b.sh, a.sh]; for (const x of s) if (l.has(x)) inter++; const jac = inter / (a.sh.size + b.sh.size - inter), cont = inter / s.size; if (jac >= TH || cont >= 0.92) out.push([a.u, b.u, jac.toFixed(2), cont.toFixed(2), a.n, b.n]); }
out.sort((x, y) => y[2] - x[2]);
console.log(`近似重複頁面對（Jaccard≥${TH} 或 包含度≥0.92）：${out.length} 組`);
out.forEach(r => console.log(`${r[2]} / ${r[3]}  ${r[0]}  ↔  ${r[1]}   (${r[4]}/${r[5]} 字)`));
