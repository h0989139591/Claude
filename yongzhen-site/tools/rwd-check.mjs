// 響應式檢查：需 playwright。  node tools/rwd-check.mjs  （會自行啟動本機伺服器）
// 對應合約「一、響應式設計」：手機／平板／電腦無橫向捲動、可點擊目標夠大、無主控台錯誤
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
let chromium; try { ({ chromium } = require('playwright')); } catch { console.error('找不到 playwright（npm i -D playwright）'); process.exit(2); }
const DIST = 'dist', MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.txt': 'text/plain', '.xml': 'text/xml' };
const srv = http.createServer((q, r) => {
  let f = path.join(DIST, decodeURIComponent(q.url.split('?')[0])); if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
  if (!fs.existsSync(f)) { r.writeHead(404); return r.end('nf'); }
  r.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r);
}).listen(0);
const base = `http://localhost:${srv.address().port}`;
const pages = []; (function walk(d) { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); fs.statSync(p).isDirectory() ? walk(p) : f === 'index.html' && pages.push('/' + path.relative(DIST, p).replace(/index\.html$/, '')); } })(DIST);
const sizes = [['手機', 360, 740], ['平板', 768, 1024], ['電腦', 1280, 800]];
const exec = process.env.PLAYWRIGHT_BROWSERS_PATH ? process.env.PLAYWRIGHT_BROWSERS_PATH + '/chromium' : undefined;
const b = await chromium.launch(exec && fs.existsSync(exec) ? { executablePath: exec } : {});
const fails = []; let n = 0;
for (const [label, w, h] of sizes) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, hasTouch: w < 1000, isMobile: w < 800 });
  const pg = await ctx.newPage(); const errs = []; pg.on('pageerror', e => errs.push(e.message)); pg.on('console', m => m.type() === 'error' && errs.push(m.text()));
  for (const u of pages) {
    await pg.goto(base + u); await pg.waitForTimeout(150); n++;
    const r = await pg.evaluate(() => {
      const de = document.documentElement, out = { sw: de.scrollWidth, cw: de.clientWidth, small: [] };
      document.querySelectorAll('a,button,input,select,textarea,summary').forEach(e => {
        const b = e.getBoundingClientRect(), cs = getComputedStyle(e);
        if (!b.width || cs.visibility === 'hidden' || cs.display === 'none' || e.closest('[hidden],dialog:not([open])')) return;
        if (e.tagName === 'A' && e.closest('p,li,footer,.crumb,.faq,.box,h2,h3,h4,.prose') && cs.display === 'inline') return; // 內文連結不計
        const af = getComputedStyle(e, '::after'); if (af.content !== 'none' && af.position === 'absolute') return; // 整張卡片可點
        if (e.closest('.dots') ? (b.height < 24 || b.width < 24) : (b.height < 36 || b.width < 24)) out.small.push((e.textContent || e.name || e.tagName).trim().slice(0, 14) + ` ${Math.round(b.width)}x${Math.round(b.height)}`);
      });
      out.fontMin = Math.min(...[...document.querySelectorAll('main p,main li,main td,main a,.nav a,.btn')].map(e => parseFloat(getComputedStyle(e).fontSize)).filter(Boolean));
      return out;
    });
    if (r.sw > r.cw) fails.push(`[${label} ${u}] 橫向溢出 ${r.sw}>${r.cw}`);
    if (r.small.length) fails.push(`[${label} ${u}] 點擊目標過小：${[...new Set(r.small)].slice(0, 4).join('、')}`);
    if (r.fontMin < 13) fails.push(`[${label} ${u}] 字級過小 ${r.fontMin}px`);
  }
  if (errs.length) fails.push(`[${label}] 主控台錯誤：${[...new Set(errs)].slice(0, 3).join(' | ')}`);
  await ctx.close();
}
await b.close(); srv.close();
const per = {}; fails.forEach(f => { const m = f.match(/^\[(\S+) (\S+)\] (.*)$/); if (!m) { (per[f] ||= new Set()).add('-'); return; }
  if (m[3].startsWith('點擊目標過小')) m[3].slice(7).split('、').forEach(t => (per['點擊目標過小：' + t.replace(/ \d+x\d+$/, '')] ||= new Set()).add(m[1] + m[2])); else (per[m[3]] ||= new Set()).add(m[1] + m[2]); });
console.log(`響應式檢查：${pages.length} 頁 × ${sizes.length} 種尺寸 = ${n} 次載入，問題 ${fails.length} 項`);
Object.entries(per).forEach(([k, v]) => console.log(`  ✗ ${k}（${v.size} 頁次，例：${[...v][0]}）`));
process.exit(fails.length ? 1 : 0);
